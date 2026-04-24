"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import type {
  AdminAuditEventSummary,
  AdminUserDetailSnapshot,
} from "@/modules/admin/admin.types";
import {
  INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE,
  type AdminUserManagementActionState,
} from "@/modules/admin/user-management-form.schema";
import { getUserStatusTone } from "@/components/admin/admin-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { PAGE_HEADER_SURFACE_SX } from "@/components/ui/page-header";
import { Surface } from "@/components/ui/surface";
import { onesourceTokens } from "@/theme/onesource-theme";

type AdminUserDetailProps = {
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
  snapshot: AdminUserDetailSnapshot | null;
  updateUserRolesAction: (
    state: AdminUserManagementActionState,
    formData: FormData,
  ) => Promise<AdminUserManagementActionState>;
};

export function AdminUserDetail({
  disableUserAction,
  reactivateUserAction,
  sessionUser,
  snapshot,
  updateUserRolesAction,
}: AdminUserDetailProps) {
  const router = useRouter();
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
  const [selectedRoleKeys, setSelectedRoleKeys] = useState<string[]>(
    snapshot?.user.roleKeys ?? [],
  );

  useEffect(() => {
    if (
      roleState.successMessage ||
      disableState.successMessage ||
      reactivateState.successMessage
    ) {
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

  if (!snapshot) {
    return (
      <Stack component="section" spacing={2}>
        <Button href="/settings/users" tone="neutral" variant="outlined">
          <ArrowBackRoundedIcon fontSize="small" />
          Back to users
        </Button>
        <Surface sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: "2rem", sm: "2.35rem" } }}
          >
            User details unavailable
          </Typography>
          <ErrorState
            className="mt-4"
            message="The selected user could not be loaded for this workspace. Return to the users registry and choose an available account."
            title="Selected user could not be loaded"
          />
        </Surface>
      </Stack>
    );
  }

  const { user } = snapshot;
  const displayName = user.name ?? user.email;
  const profileInitial = displayName.trim().charAt(0).toUpperCase() || "U";
  const latestActionFeedback =
    roleState.successMessage ??
    disableState.successMessage ??
    reactivateState.successMessage;
  const latestActionError =
    roleState.formError ?? disableState.formError ?? reactivateState.formError;

  return (
    <Stack component="section" spacing={4}>
      <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
        <Button href="/settings/users" tone="neutral" variant="outlined">
          <ArrowBackRoundedIcon fontSize="small" />
          Back to users
        </Button>
      </Stack>

      <Surface
        component="header"
        sx={[PAGE_HEADER_SURFACE_SX, { overflow: "hidden" }]}
      >
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1fr) minmax(16rem, 20rem)",
            },
          }}
        >
          <Stack spacing={2.5} sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Badge>Selected user</Badge>
              <Badge tone="muted">{snapshot.organizationName}</Badge>
              <Badge tone={getUserStatusTone(user.status)}>{user.status}</Badge>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ alignItems: { sm: "center" }, minWidth: 0 }}
            >
              <Avatar
                aria-hidden="true"
                sx={{
                  bgcolor: onesourceTokens.color.accent.main,
                  color: onesourceTokens.color.text.inverse,
                  fontSize: "1.35rem",
                  fontWeight: 750,
                  height: 58,
                  width: 58,
                }}
              >
                {profileInitial}
              </Avatar>
              <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: "1.75rem", sm: "2.1rem" },
                    lineHeight: 1.1,
                    wordBreak: "break-word",
                  }}
                >
                  {displayName}
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: "0.95rem", wordBreak: "break-word" }}
                >
                  {user.email}
                </Typography>
              </Stack>
            </Stack>

            <Typography color="text.secondary" sx={{ maxWidth: "46rem" }}>
              Review account posture and make audited role or access changes
              without leaving the workspace admin context.
            </Typography>

            <MetricLedger
              metrics={[
                {
                  label: "Roles",
                  supportingText: "Assigned now",
                  value: String(user.roleKeys.length),
                },
                {
                  label: "Created",
                  supportingText: "User record",
                  value: formatProfileDate(user.createdAt),
                },
                {
                  label: "Updated",
                  supportingText: "Latest mutation",
                  value: formatProfileDate(user.updatedAt),
                },
                {
                  label: "Audit events",
                  supportingText: "As actor",
                  value: String(user.activityCounts.recentAuditEvents),
                },
              ]}
            />
          </Stack>

          <Surface
            density="compact"
            tone="muted"
            sx={{
              alignSelf: "start",
              boxShadow: "none",
              minWidth: 0,
              p: 2,
            }}
          >
            <Stack spacing={1.75}>
              <SectionKicker>Account posture</SectionKicker>
              <DetailRow label="Access status" value={user.status} />
              <DetailRow
                label="Email verification"
                value={user.emailVerifiedAt ? "Verified" : "Not verified"}
              />
              <DetailRow
                label="Password credential"
                value={user.hasPassword ? "Configured" : "Not configured"}
              />
            </Stack>
          </Surface>
        </Box>
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

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            xl: "minmax(0, 1fr) minmax(18rem, 22rem)",
          },
        }}
      >
        <Stack spacing={3}>
          <Surface component="section" sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack spacing={2.5}>
              <SectionHeading
                eyebrow="Identity"
                title="User profile"
                description="Server-backed profile and account posture for the selected workspace user."
              />
              <div className="grid gap-3 md:grid-cols-2">
                <DetailRow
                  label="Display name"
                  value={user.name ?? "Not set"}
                />
                <DetailRow label="Email" value={user.email} />
                <DetailRow label="Status" value={user.status} />
                <DetailRow
                  label="Email verified"
                  value={
                    user.emailVerifiedAt
                      ? formatProfileDateTime(user.emailVerifiedAt)
                      : "Not verified"
                  }
                />
                <DetailRow
                  label="Password credential"
                  value={user.hasPassword ? "Configured" : "Not configured"}
                />
                <DetailRow
                  label="Latest role change"
                  value={
                    user.latestRoleAssignedAt
                      ? formatProfileDateTime(user.latestRoleAssignedAt)
                      : "No role history"
                  }
                />
              </div>
            </Stack>
          </Surface>

          <Surface component="section" sx={{ p: { xs: 2.5, sm: 3 } }}>
            <form action={updateRolesFormAction}>
              <input name="userId" type="hidden" value={user.id} />
              <Stack spacing={2.5}>
                <SectionHeading
                  eyebrow="Access"
                  title="Role assignments"
                  description="Replace the assigned system-role set for this user. Changes are audited and stay organization-scoped."
                />

                {roleState.affectedUserId === user.id &&
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
                            <Typography
                              sx={{ fontSize: "0.94rem", fontWeight: 600 }}
                            >
                              {role.label}
                            </Typography>
                            <Typography
                              color="text.secondary"
                              variant="caption"
                            >
                              {role.description ?? role.key}
                            </Typography>
                          </div>
                        }
                        sx={{
                          alignItems: "flex-start",
                          border: `1px solid ${onesourceTokens.color.border.subtle}`,
                          borderRadius: 1,
                          m: 0,
                          px: 1.25,
                          py: 0.75,
                        }}
                      />
                    );
                  })}
                </Stack>

                <Box
                  sx={{
                    borderTop: `1px solid ${onesourceTokens.color.border.subtle}`,
                    display: "flex",
                    justifyContent: "flex-start",
                    pt: 2,
                  }}
                >
                  <Button
                    data-testid="save-roles-button"
                    density="compact"
                    disabled={updateRolesPending}
                    type="submit"
                  >
                    {updateRolesPending ? "Saving roles..." : "Save roles"}
                  </Button>
                </Box>
              </Stack>
            </form>
          </Surface>
        </Stack>

        <Stack spacing={3}>
          <Surface component="aside" sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack spacing={2.5}>
              <SectionHeading
                eyebrow="Status"
                title="Access control"
                description="Disable or re-enable sign-in access without deleting the user record or role history."
              />

              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Badge tone={getUserStatusTone(user.status)}>
                  {user.status}
                </Badge>
                {user.roleLabels.length > 0 ? (
                  user.roleLabels.map((roleLabel) => (
                    <Badge key={`${user.id}-${roleLabel}`} tone="muted">
                      {roleLabel}
                    </Badge>
                  ))
                ) : (
                  <Badge tone="warning">No roles assigned</Badge>
                )}
              </Stack>

              {user.status !== "DISABLED" ? (
                <form action={disableFormAction}>
                  <input name="userId" type="hidden" value={user.id} />
                  <Button
                    disabled={disablePending || user.id === sessionUser.id}
                    tone="danger"
                    type="submit"
                  >
                    {disablePending ? "Disabling..." : "Disable user"}
                  </Button>
                </form>
              ) : (
                <form action={reactivateFormAction}>
                  <input name="userId" type="hidden" value={user.id} />
                  <Button disabled={reactivatePending} type="submit">
                    {reactivatePending ? "Re-enabling..." : "Re-enable user"}
                  </Button>
                </form>
              )}

              {user.id === sessionUser.id ? (
                <Typography color="text.secondary" variant="caption">
                  Current operators cannot disable their own account.
                </Typography>
              ) : null}
            </Stack>
          </Surface>

          <Surface component="section" sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack spacing={2.5}>
              <SectionHeading
                eyebrow="Footprint"
                title="Workspace activity"
                description="Operational counts linked to this account."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <CompactMetric
                  label="Tasks created"
                  value={user.activityCounts.createdTasks}
                />
                <CompactMetric
                  label="Notes authored"
                  value={user.activityCounts.authoredNotes}
                />
                <CompactMetric
                  label="Documents uploaded"
                  value={user.activityCounts.uploadedDocuments}
                />
                <CompactMetric
                  label="Syncs requested"
                  value={user.activityCounts.requestedSourceSyncRuns}
                />
                <CompactMetric
                  label="Saved searches"
                  value={user.activityCounts.createdSourceSearches}
                />
                <CompactMetric
                  label="Audit events"
                  value={user.activityCounts.recentAuditEvents}
                />
              </div>
            </Stack>
          </Surface>
        </Stack>
      </Box>

      <Surface
        component="section"
        sx={{ overflow: "hidden", p: { xs: 2.5, sm: 3 } }}
      >
        <Stack spacing={2.5}>
          <SectionHeading
            eyebrow="Audit"
            title="Recent user activity"
            description="Recent audit events where this user was the actor or the target of an admin mutation."
          />
          <UserAuditActivityGrid events={snapshot.recentAuditEvents} />
        </Stack>
      </Surface>
    </Stack>
  );
}

function UserAuditActivityGrid({
  events,
}: {
  events: AdminAuditEventSummary[];
}) {
  const [expandedAuditEventId, setExpandedAuditEventId] = useState<
    string | null
  >(null);
  const expandedAuditEvent =
    events.find((event) => event.id === expandedAuditEventId) ?? null;
  const auditGridColumns = useMemo<GridColDef<AdminAuditEventSummary>[]>(
    () => [
      {
        field: "occurredAt",
        flex: 0.8,
        headerName: "Time",
        minWidth: 180,
        renderCell: ({ row }) => (
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 650 }}>
            {formatProfileDateTime(row.occurredAt)}
          </Typography>
        ),
        sortable: false,
      },
      {
        field: "actionLabel",
        flex: 1,
        headerName: "Action",
        minWidth: 220,
        renderCell: ({ row }) => (
          <Stack spacing={0.2} sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.88rem",
                fontWeight: 700,
                overflowWrap: "anywhere",
              }}
            >
              {row.actionLabel}
            </Typography>
            <Typography color="text.secondary" variant="caption">
              {row.action}
            </Typography>
          </Stack>
        ),
        sortable: false,
      },
      {
        field: "actorLabel",
        flex: 0.75,
        headerName: "Actor",
        minWidth: 150,
        renderCell: ({ row }) => (
          <Typography sx={{ fontSize: "0.86rem", overflowWrap: "anywhere" }}>
            {row.actorLabel}
          </Typography>
        ),
        sortable: false,
      },
      {
        field: "targetLabel",
        flex: 0.9,
        headerName: "Target",
        minWidth: 180,
        renderCell: ({ row }) => (
          <Stack spacing={0.2} sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.86rem",
                fontWeight: 650,
                overflowWrap: "anywhere",
              }}
            >
              {row.targetLabel}
            </Typography>
            <Typography color="text.secondary" variant="caption">
              {row.targetType}
            </Typography>
          </Stack>
        ),
        sortable: false,
      },
      {
        field: "summary",
        flex: 1.35,
        headerName: "Summary",
        minWidth: 260,
        renderCell: ({ row }) => (
          <Typography sx={{ fontSize: "0.86rem", overflowWrap: "anywhere" }}>
            {row.summary ?? `${row.actorLabel} affected ${row.targetLabel}.`}
          </Typography>
        ),
        sortable: false,
      },
      {
        field: "metadataPreview",
        headerName: "Metadata",
        minWidth: 130,
        renderCell: ({ row }) =>
          row.metadataPreview ? (
            <Button
              aria-controls={`audit-metadata-${row.id}`}
              aria-expanded={expandedAuditEventId === row.id}
              aria-label={`${
                expandedAuditEventId === row.id ? "Hide" : "View"
              } metadata for ${row.actionLabel}`}
              density="compact"
              onClick={(event) => {
                event.stopPropagation();
                setExpandedAuditEventId((currentEventId) =>
                  currentEventId === row.id ? null : row.id,
                );
              }}
              tone="neutral"
              variant="outlined"
            >
              {expandedAuditEventId === row.id ? "Hide" : "View"}
            </Button>
          ) : (
            <Typography color="text.secondary" variant="caption">
              None
            </Typography>
          ),
        sortable: false,
        width: 130,
      },
    ],
    [expandedAuditEventId],
  );

  if (events.length === 0) {
    return (
      <EmptyState
        message="No user-specific audit activity has been recorded yet."
        title="No recent audit events"
      />
    );
  }

  return (
    <>
      <DataGrid
        aria-label="User audit activity"
        autoHeight
        columns={auditGridColumns}
        density="compact"
        disableColumnFilter
        disableColumnMenu
        disableDensitySelector
        disableRowSelectionOnClick
        getRowId={(row) => row.id}
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
        rowHeight={68}
        rows={events}
        sx={{
          border: `1px solid ${onesourceTokens.color.border.subtle}`,
          borderRadius: `${onesourceTokens.radius.button}px`,
          minHeight: 320,
          "& .MuiDataGrid-cell": {
            alignItems: "center",
            display: "flex",
            py: 1,
          },
          "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
            outline: "none",
          },
          "& .MuiDataGrid-columnHeader": {
            backgroundColor: onesourceTokens.color.surface.muted,
          },
          "& .MuiDataGrid-row": {
            cursor: "default",
          },
        }}
      />

      {expandedAuditEvent ? (
        <Box
          id={`audit-metadata-${expandedAuditEvent.id}`}
          data-testid="audit-metadata-panel"
          sx={{
            bgcolor: onesourceTokens.color.surface.muted,
            border: `1px solid ${onesourceTokens.color.border.subtle}`,
            borderRadius: 1,
            mt: 2,
            p: 2,
          }}
        >
          <Stack spacing={1}>
            <SectionKicker>Audit metadata</SectionKicker>
            <Typography sx={{ fontSize: "0.95rem", fontWeight: 700 }}>
              {expandedAuditEvent.actionLabel}
            </Typography>
            <Typography
              component="pre"
              sx={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.78rem",
                lineHeight: 1.6,
                m: 0,
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {expandedAuditEvent.metadataPreview}
            </Typography>
          </Stack>
        </Box>
      ) : null}
    </>
  );
}

function SectionHeading({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
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
        {eyebrow}
      </Typography>
      <Typography
        sx={{ fontSize: "1.1rem", mt: 1, fontWeight: 750 }}
        variant="h3"
      >
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
        {description}
      </Typography>
    </div>
  );
}

function SectionKicker({ children }: { children: string }) {
  return (
    <Typography
      sx={{
        color: onesourceTokens.color.text.muted,
        fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
        fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </Typography>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      spacing={0.5}
      sx={{
        border: `1px solid ${onesourceTokens.color.border.subtle}`,
        borderRadius: `${onesourceTokens.radius.panel}px`,
        minWidth: 0,
        p: 1.5,
      }}
    >
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.95rem",
          fontWeight: 650,
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

type ProfileMetric = {
  label: string;
  supportingText: string;
  value: string;
};

function MetricLedger({ metrics }: { metrics: ProfileMetric[] }) {
  return (
    <Box
      sx={{
        bgcolor: onesourceTokens.color.surface.raised,
        border: `1px solid ${onesourceTokens.color.border.subtle}`,
        borderRadius: 1,
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
        minWidth: 0,
        overflow: "hidden",
        "& > *": {
          borderColor: onesourceTokens.color.border.subtle,
          borderStyle: "solid",
          borderWidth: 0,
        },
        "& > * + *": {
          borderTopWidth: { xs: 1, sm: 0 },
        },
        "& > *:nth-of-type(even)": {
          borderLeftWidth: { sm: 1, lg: 0 },
        },
        "& > *:not(:nth-of-type(4n + 1))": {
          borderLeftWidth: { lg: 1 },
        },
        "& > *:nth-of-type(n + 3)": {
          borderTopWidth: { sm: 1, lg: 0 },
        },
      }}
    >
      {metrics.map((metric) => (
        <Stack key={metric.label} spacing={0.4} sx={{ minWidth: 0, p: 1.5 }}>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: "0.72rem",
              fontWeight: 750,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {metric.label}
          </Typography>
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: 750,
              lineHeight: 1.25,
              overflowWrap: "anywhere",
            }}
          >
            {metric.value}
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {metric.supportingText}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}

function CompactMetric({ label, value }: { label: string; value: number }) {
  return (
    <Stack
      spacing={0.25}
      sx={{
        bgcolor: onesourceTokens.color.surface.muted,
        borderRadius: `${onesourceTokens.radius.panel}px`,
        p: 1.25,
      }}
    >
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography sx={{ fontSize: "1.35rem", fontWeight: 750 }}>
        {value}
      </Typography>
    </Stack>
  );
}

function formatProfileDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));
}

function formatProfileDateTime(value: string) {
  return `${formatProfileDate(value)} ${new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value))}`;
}
