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
import { PAGE_HEADER_SURFACE_SX } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { onesourceTokens } from "@/theme/onesource-theme";

type AdminUserManagementProps = {
  createUserAction: (
    state: AdminUserManagementActionState,
    formData: FormData,
  ) => Promise<AdminUserManagementActionState>;
  sessionUser: {
    email?: string | null;
    id: string;
    name?: string | null;
  };
  snapshot: AdminUserManagementSnapshot | null;
};

export function AdminUserManagement({
  createUserAction,
  sessionUser,
  snapshot,
}: AdminUserManagementProps) {
  const router = useRouter();
  const [inviteState, inviteFormAction, invitePending] = useActionState(
    createUserAction,
    INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE,
  );
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const deferredSearchQuery = useDeferredValue(searchQuery);
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

  useEffect(() => {
    if (inviteState.successMessage) {
      startTransition(() => {
        router.refresh();
      });
    }
  }, [inviteState.successMessage, router]);

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
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: "2rem", sm: "2.35rem" } }}
          >
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
    {
      field: "actions",
      headerName: "Manage",
      minWidth: 132,
      renderCell: ({ row }) => (
        <Button
          density="compact"
          href={`/settings/users/${row.id}`}
          onClick={(event) => event.stopPropagation()}
          variant="outlined"
        >
          Manage
        </Button>
      ),
      sortable: false,
    },
  ];
  const latestActionFeedback = inviteState.successMessage;
  const latestActionError = inviteState.formError;

  return (
    <section className="space-y-6">
      <Surface
        component="header"
        sx={{
          boxShadow: onesourceTokens.elevation.hero,
          ...PAGE_HEADER_SURFACE_SX,
        }}
      >
        <Stack spacing={2}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Badge>Users & roles</Badge>
              <Badge tone="muted">{snapshot.organizationName}</Badge>
              <Badge tone="accent">Admin workspace</Badge>
            </Stack>
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: "2rem", sm: "2.35rem" } }}
            >
              User administration
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: "54rem" }}>
              Scan invited, active, and disabled users from one compact
              registry. Open a user workspace for full details, role assignment,
              and access-state management.
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

      <Surface component="section" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2}
            sx={{
              alignItems: { lg: "flex-end" },
              justifyContent: "space-between",
            }}
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
                Filter by status and role coverage, then open a user workspace
                to inspect details or manage assignments.
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
            <FormField htmlFor="users-filter-search" label="Search users">
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
                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus":
                  {
                    outline: "none",
                  },
                "& .MuiDataGrid-row": {
                  cursor: "pointer",
                },
              }}
              getRowId={(row) => row.id}
              onRowClick={(params) =>
                router.push(`/settings/users/${String(params.id)}`)
              }
            />
          )}
        </Stack>
      </Surface>

      <Dialog
        description="Create an invited user record, assign the initial role set, and keep the rest of the workspace untouched."
        onClose={() => setIsInviteDialogOpen(false)}
        open={isInviteDialogOpen && !inviteState.successMessage}
        title="Invite workspace user"
        footer={
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ justifyContent: "flex-end" }}
          >
            <Button
              onClick={() => setIsInviteDialogOpen(false)}
              tone="neutral"
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              disabled={invitePending}
              form="invite-workspace-user-form"
              type="submit"
            >
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
              <Input
                id="invite-user-name"
                name="name"
                placeholder="Alex Morgan"
              />
            </FormField>

            <div>
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 600 }}>
                Initial roles
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mt: 0.75 }}
                variant="body2"
              >
                Assign at least one role so the invited user lands in the
                correct workspace posture.
              </Typography>
              {inviteState.fieldErrors.roleKeys ? (
                <Typography
                  color="error.main"
                  sx={{ mt: 1.25 }}
                  variant="body2"
                >
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
                          <Typography
                            sx={{ fontSize: "0.94rem", fontWeight: 600 }}
                          >
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
