"use client";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
  startTransition,
  useActionState,
  useDeferredValue,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import type { AdminUserManagementSnapshot } from "@/modules/admin/admin.types";
import {
  INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE,
  type AdminUserManagementActionState,
} from "@/modules/admin/user-management-form.schema";
import {
  formatUtcTimestamp,
  getUserStatusTone,
  SummaryCard,
} from "@/components/admin/admin-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { onesourceTokens } from "@/theme/onesource-theme";

type AdminUserManagementProps = {
  createUserAction: (
    state: AdminUserManagementActionState,
    formData: FormData,
  ) => Promise<AdminUserManagementActionState>;
  disableUserAction: (
    state: AdminUserManagementActionState,
    formData: FormData,
  ) => Promise<AdminUserManagementActionState>;
  reactivateUserAction: (
    state: AdminUserManagementActionState,
    formData: FormData,
  ) => Promise<AdminUserManagementActionState>;
  sessionUser: {
    email?: string | null;
    id: string;
    name?: string | null;
  };
  snapshot: AdminUserManagementSnapshot | null;
  updateUserRolesAction: (
    state: AdminUserManagementActionState,
    formData: FormData,
  ) => Promise<AdminUserManagementActionState>;
};

export function AdminUserManagement({
  createUserAction,
  disableUserAction,
  reactivateUserAction,
  sessionUser,
  snapshot,
  updateUserRolesAction,
}: AdminUserManagementProps) {
  const router = useRouter();
  const [inviteState, inviteFormAction, invitePending] = useActionState(
    createUserAction,
    INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE,
  );
  const [roleState, updateRolesFormAction, updateRolesPending] = useActionState(
    updateUserRolesAction,
    INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE,
  );
  const [disableState, disableFormAction, disablePending] = useActionState(
    disableUserAction,
    INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE,
  );
  const [reactivateState, reactivateFormAction, reactivatePending] =
    useActionState(
      reactivateUserAction,
      INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE,
    );
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    snapshot?.users[0]?.id ?? null,
  );
  const [selectedRoleKeys, setSelectedRoleKeys] = useState<string[]>(
    snapshot?.users[0]?.roleKeys ?? [],
  );
  const [inviteRoleKeys, setInviteRoleKeys] = useState<string[]>([]);

  const visibleUsers =
    snapshot?.users.filter((user) => {
      const normalizedSearch = deferredSearchQuery.trim().toLowerCase();
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : [user.name ?? "", user.email, ...user.roleLabels]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "ALL" ? true : user.status === statusFilter;
      const matchesRole =
        roleFilter === "ALL" ? true : user.roleKeys.includes(roleFilter);

      return matchesSearch && matchesStatus && matchesRole;
    }) ?? [];
  const selectedUser =
    snapshot?.users.find((user) => user.id === selectedUserId) ??
    snapshot?.users[0] ??
    null;

  useEffect(() => {
    if (inviteState.successMessage) {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [inviteState.successMessage, router]);

  useEffect(() => {
    if (roleState.successMessage || disableState.successMessage || reactivateState.successMessage) {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [
    disableState.successMessage,
    reactivateState.successMessage,
    roleState.successMessage,
    router,
  ]);

  function handleSelectUser(userId: string) {
    const nextSelectedUser =
      snapshot?.users.find((user) => user.id === userId) ?? null;

    setSelectedUserId(userId);
    setSelectedRoleKeys(nextSelectedUser?.roleKeys ?? []);
  }

  if (!snapshot) {
    return (
      <Stack component="section" spacing={2}>
        <Typography
          sx={{
            color: onesourceTokens.color.text.muted,
            fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
            fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
          }}
        >
          Users & roles
        </Typography>
        <Surface sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h1" sx={{ fontSize: { xs: "2rem", sm: "2.35rem" } }}>
            User administration
          </Typography>
          <ErrorState
            className="mt-4"
            message="Organization-scoped user management data could not be loaded for this session. Re-seed the local database or verify the authenticated user still belongs to an active organization."
            title="User management is unavailable"
          />
        </Surface>
      </Stack>
    );
  }

  const gridColumns: GridColDef<(typeof visibleUsers)[number]>[] = [
    {
      field: "name",
      flex: 1.2,
      headerName: "User",
      minWidth: 240,
      renderCell: ({ row }) => (
        <Box sx={{ py: 1 }}>
          <Typography sx={{ fontSize: "0.94rem", fontWeight: 600 }}>
            {row.name ?? row.email}
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {row.email}
          </Typography>
        </Box>
      ),
      sortable: false,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 140,
      renderCell: ({ row }) => (
        <Badge tone={getUserStatusTone(row.status)}>{row.status}</Badge>
      ),
      sortable: false,
    },
    {
      field: "roles",
      flex: 1,
      headerName: "Assigned roles",
      minWidth: 220,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", py: 1 }}>
          {row.roleLabels.length > 0 ? (
            row.roleLabels.map((roleLabel) => (
              <Badge key={`${row.id}-${roleLabel}`} tone="muted">
                {roleLabel}
              </Badge>
            ))
          ) : (
            <Badge tone="warning">No roles assigned</Badge>
          )}
        </Stack>
      ),
      sortable: false,
    },
    {
      field: "latestRoleAssignedAt",
      headerName: "Last role change",
      minWidth: 180,
      renderCell: ({ row }) => (
        <Typography color="text.secondary" variant="caption">
          {row.latestRoleAssignedAt
            ? formatUtcTimestamp(row.latestRoleAssignedAt)
            : "No role history"}
        </Typography>
      ),
      sortable: false,
    },
  ];
  const latestActionFeedback =
    inviteState.successMessage ??
    roleState.successMessage ??
    disableState.successMessage ??
    reactivateState.successMessage;
  const latestActionError =
    inviteState.formError ??
    roleState.formError ??
    disableState.formError ??
    reactivateState.formError;

  return (
    <section className="space-y-6">
      <Surface
        component="header"
        sx={{
          boxShadow: onesourceTokens.elevation.hero,
          px: { xs: 3, sm: 4 },
          py: 4,
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Badge>Users & roles</Badge>
              <Badge tone="muted">{snapshot.organizationName}</Badge>
              <Badge tone="accent">Admin workspace</Badge>
            </Stack>
            <Typography variant="h1" sx={{ fontSize: { xs: "2rem", sm: "2.35rem" } }}>
              User administration
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: "54rem" }}>
              Manage invited, active, and disabled users from one compact
              workspace with explicit role assignment, status control, and a
              dense grid that stays readable as the team grows.
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                md: "repeat(3, minmax(0, 1fr))",
                xl: "repeat(6, minmax(0, 1fr))",
              },
            }}
          >
            <SummaryCard
              label="Current operator"
              value={sessionUser.name ?? sessionUser.email ?? "Unknown admin"}
              supportingText={sessionUser.email ?? "Signed-in session"}
            />
            <SummaryCard
              label="Workspace users"
              value={String(snapshot.totalUserCount)}
              supportingText="All invited, active, and disabled users"
            />
            <SummaryCard
              label="Active"
              value={String(snapshot.activeUserCount)}
              supportingText="Users who can sign in now"
            />
            <SummaryCard
              label="Invited"
              value={String(snapshot.invitedUserCount)}
              supportingText="Created users still awaiting activation"
            />
            <SummaryCard
              label="Disabled"
              value={String(snapshot.disabledUserCount)}
              supportingText="Users blocked from the workspace"
            />
            <SummaryCard
              label="Admin seats"
              value={String(snapshot.adminUserCount)}
              supportingText="Users carrying the admin role"
            />
          </Box>
        </Stack>
      </Surface>

      {latestActionFeedback ? (
        <FeedbackBanner
          message={latestActionFeedback}
          role="status"
          title="User workspace updated"
          tone="success"
        />
      ) : null}

      {latestActionError ? (
        <FeedbackBanner
          ariaLive="assertive"
          message={latestActionError}
          role="alert"
          title="User workspace needs attention"
          tone="danger"
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_22rem]">
        <Surface component="section" sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={2}
              sx={{ alignItems: { lg: "flex-end" }, justifyContent: "space-between" }}
            >
              <div>
                <Typography
                  sx={{
                    color: onesourceTokens.color.text.muted,
                    fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
                    fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                  }}
                >
                  User registry
                </Typography>
                <Typography sx={{ mt: 1.5 }} variant="h3">
                  Workspace users
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                  Filter by status and role coverage, then use the detail panel
                  to update assignments or access state.
                </Typography>
              </div>

              <Button onClick={() => setIsInviteDialogOpen(true)}>
                Invite user
              </Button>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(0,1.3fr) repeat(2, minmax(0, 0.7fr))",
                },
              }}
            >
              <FormField
                htmlFor="users-filter-search"
                label="Search users"
              >
                <Input
                  id="users-filter-search"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name, email, or role"
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  }
                  value={searchQuery}
                />
              </FormField>

              <FormField htmlFor="users-filter-status" label="Status filter">
                <Select
                  id="users-filter-status"
                  onChange={(event) => setStatusFilter(event.target.value)}
                  value={statusFilter}
                >
                  <option value="ALL">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INVITED">Invited</option>
                  <option value="DISABLED">Disabled</option>
                </Select>
              </FormField>

              <FormField htmlFor="users-filter-role" label="Role filter">
                <Select
                  id="users-filter-role"
                  onChange={(event) => setRoleFilter(event.target.value)}
                  value={roleFilter}
                >
                  <option value="ALL">All roles</option>
                  {snapshot.roleOptions.map((role) => (
                    <option key={role.key} value={role.key}>
                      {role.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </Box>

            {snapshot.users.length === 0 ? (
              <EmptyState
                message="Invite users from this page to start assigning roles and access."
                title="No workspace users are available yet"
              />
            ) : (
              <DataGrid
                aria-label="Workspace users"
                autoHeight
                columns={gridColumns}
                density="compact"
                disableColumnFilter
                disableColumnMenu
                disableDensitySelector
                disableRowSelectionOnClick
                hideFooterSelectedRowCount
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 10,
                      page: 0,
                    },
                  },
                }}
                pageSizeOptions={[10, 25, 50]}
                pagination
                rowHeight={72}
                rows={visibleUsers}
                sx={{
                  border: `1px solid ${onesourceTokens.color.border.subtle}`,
                  borderRadius: `${onesourceTokens.radius.control}px`,
                  minHeight: 480,
                  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                    outline: "none",
                  },
                  "& .MuiDataGrid-row": {
                    cursor: "pointer",
                  },
                }}
                getRowId={(row) => row.id}
                onRowClick={(params) => handleSelectUser(String(params.id))}
              />
            )}
          </Stack>
        </Surface>

        <Surface component="aside" sx={{ p: { xs: 2.5, sm: 3 } }}>
          {selectedUser ? (
            <Stack spacing={3}>
              <div>
                <Typography
                  sx={{
                    color: onesourceTokens.color.text.muted,
                    fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
                    fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                  }}
                >
                  Selected user
                </Typography>
                <Typography sx={{ mt: 1.5 }} variant="h4">
                  {selectedUser.name ?? selectedUser.email}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
                  {selectedUser.email}
                </Typography>
              </div>

              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Badge tone={getUserStatusTone(selectedUser.status)}>
                  {selectedUser.status}
                </Badge>
                {selectedUser.roleLabels.length > 0 ? (
                  selectedUser.roleLabels.map((roleLabel) => (
                    <Badge key={`${selectedUser.id}-${roleLabel}`} tone="muted">
                      {roleLabel}
                    </Badge>
                  ))
                ) : (
                  <Badge tone="warning">No roles assigned</Badge>
                )}
              </Stack>

              {roleState.affectedUserId === selectedUser.id && roleState.formError ? (
                <FeedbackBanner
                  message={roleState.formError}
                  role="alert"
                  title="Role update needs attention"
                  tone="danger"
                />
              ) : null}

              <form action={updateRolesFormAction}>
                <input name="userId" type="hidden" value={selectedUser.id} />
                <Stack spacing={2}>
                  <div>
                    <Typography variant="h6">Role assignments</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
                      Replace the assigned system-role set for this user.
                    </Typography>
                  </div>

                  {roleState.affectedUserId === selectedUser.id &&
                  roleState.fieldErrors.roleKeys ? (
                    <Typography color="error.main" variant="body2">
                      {roleState.fieldErrors.roleKeys}
                    </Typography>
                  ) : null}

                  <Stack spacing={1}>
                    {snapshot.roleOptions.map((role) => {
                      const checked = selectedRoleKeys.includes(role.key);

                      return (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={checked}
                              name="roleKeys"
                              onChange={(event) => {
                                setSelectedRoleKeys((currentRoleKeys) =>
                                  event.target.checked
                                    ? [...currentRoleKeys, role.key]
                                    : currentRoleKeys.filter(
                                        (roleKey) => roleKey !== role.key,
                                      ),
                                );
                              }}
                              value={role.key}
                            />
                          }
                          key={role.key}
                          label={
                            <div>
                              <Typography sx={{ fontSize: "0.94rem", fontWeight: 600 }}>
                                {role.label}
                              </Typography>
                              <Typography color="text.secondary" variant="caption">
                                {role.description ?? role.key}
                              </Typography>
                            </div>
                          }
                          sx={{
                            alignItems: "flex-start",
                            border: `1px solid ${onesourceTokens.color.border.subtle}`,
                            borderRadius: 3,
                            m: 0,
                            px: 1.25,
                            py: 0.75,
                          }}
                        />
                      );
                    })}
                  </Stack>

                  <Button disabled={updateRolesPending} type="submit">
                    {updateRolesPending ? "Saving roles..." : "Save roles"}
                  </Button>
                </Stack>
              </form>

              <Stack spacing={1.5}>
                <div>
                  <Typography variant="h6">Access status</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
                    Disable or re-enable sign-in access without deleting the
                    user record or role history.
                  </Typography>
                </div>

                {disableState.affectedUserId === selectedUser.id &&
                disableState.formError ? (
                  <FeedbackBanner
                    message={disableState.formError}
                    role="alert"
                    title="Disable action needs attention"
                    tone="danger"
                  />
                ) : null}
                {reactivateState.affectedUserId === selectedUser.id &&
                reactivateState.formError ? (
                  <FeedbackBanner
                    message={reactivateState.formError}
                    role="alert"
                    title="Re-enable action needs attention"
                    tone="danger"
                  />
                ) : null}

                {selectedUser.status !== "DISABLED" ? (
                  <form action={disableFormAction}>
                    <input name="userId" type="hidden" value={selectedUser.id} />
                    <Button
                      disabled={disablePending || selectedUser.id === sessionUser.id}
                      tone="danger"
                      type="submit"
                    >
                      {disablePending ? "Disabling..." : "Disable user"}
                    </Button>
                  </form>
                ) : (
                  <form action={reactivateFormAction}>
                    <input name="userId" type="hidden" value={selectedUser.id} />
                    <Button disabled={reactivatePending} type="submit">
                      {reactivatePending ? "Re-enabling..." : "Re-enable user"}
                    </Button>
                  </form>
                )}
              </Stack>
            </Stack>
          ) : (
            <EmptyState
              message="Select a user from the grid to inspect assigned roles or change access state."
              title="No user is selected"
            />
          )}
        </Surface>
      </div>

      <Dialog
        description="Create an invited user record, assign the initial role set, and keep the rest of the workspace untouched."
        onClose={() => setIsInviteDialogOpen(false)}
        open={isInviteDialogOpen && !inviteState.successMessage}
        title="Invite workspace user"
        footer={
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end" }}>
            <Button
              onClick={() => setIsInviteDialogOpen(false)}
              tone="neutral"
              variant="outlined"
            >
              Cancel
            </Button>
            <Button disabled={invitePending} form="invite-workspace-user-form" type="submit">
              {invitePending ? "Inviting..." : "Invite user"}
            </Button>
          </Stack>
        }
      >
        <form action={inviteFormAction} id="invite-workspace-user-form">
          <Stack spacing={2.5}>
            {inviteState.formError ? (
              <FeedbackBanner
                message={inviteState.formError}
                role="alert"
                title="Invite needs attention"
                tone="danger"
              />
            ) : null}

            <FormField
              error={inviteState.fieldErrors.email}
              htmlFor="invite-user-email"
              label="Email"
            >
              <Input
                id="invite-user-email"
                name="email"
                placeholder="new.user@onesource.local"
              />
            </FormField>

            <FormField
              error={inviteState.fieldErrors.name}
              hint="Optional display name used throughout the workspace."
              htmlFor="invite-user-name"
              label="Display name"
            >
              <Input id="invite-user-name" name="name" placeholder="Alex Morgan" />
            </FormField>

            <div>
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 600 }}>
                Initial roles
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
                Assign at least one role so the invited user lands in the correct
                workspace posture.
              </Typography>
              {inviteState.fieldErrors.roleKeys ? (
                <Typography color="error.main" sx={{ mt: 1.25 }} variant="body2">
                  {inviteState.fieldErrors.roleKeys}
                </Typography>
              ) : null}

              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {snapshot.roleOptions.map((role) => {
                  const checked = inviteRoleKeys.includes(role.key);

                  return (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checked}
                          name="roleKeys"
                          onChange={(event) => {
                            setInviteRoleKeys((currentRoleKeys) =>
                              event.target.checked
                                ? [...currentRoleKeys, role.key]
                                : currentRoleKeys.filter(
                                    (roleKey) => roleKey !== role.key,
                                  ),
                            );
                          }}
                          value={role.key}
                        />
                      }
                      key={role.key}
                      label={
                        <div>
                          <Typography sx={{ fontSize: "0.94rem", fontWeight: 600 }}>
                            {role.label}
                          </Typography>
                          <Typography color="text.secondary" variant="caption">
                            {role.description ?? role.key}
                          </Typography>
                        </div>
                      }
                      sx={{
                        alignItems: "flex-start",
                        border: `1px solid ${onesourceTokens.color.border.subtle}`,
                        borderRadius: 3,
                        m: 0,
                        px: 1.25,
                        py: 0.75,
                      }}
                    />
                  );
                })}
              </Stack>
            </div>
          </Stack>
        </form>
      </Dialog>
    </section>
  );
}
