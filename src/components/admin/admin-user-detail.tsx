"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { AdminUserDetailSnapshot } from "@/modules/admin/admin.types";
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
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
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
  const latestActionFeedback =
    roleState.successMessage ??
    disableState.successMessage ??
    reactivateState.successMessage;
  const latestActionError =
    roleState.formError ?? disableState.formError ?? reactivateState.formError;

  return (
    <section className="space-y-6">
      <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
        <Button href="/settings/users" tone="neutral" variant="outlined">
          <ArrowBackRoundedIcon fontSize="small" />
          Back to users
        </Button>
      </Stack>

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
              <Badge>Selected user</Badge>
              <Badge tone="muted">{snapshot.organizationName}</Badge>
              <Badge tone={getUserStatusTone(user.status)}>{user.status}</Badge>
            </Stack>
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: "2rem", sm: "2.35rem" } }}
            >
              {user.name ?? user.email}
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: "54rem" }}>
              Manage identity posture, role assignments, access state, and
              recent audit context for this workspace user.
            </Typography>
          </Stack>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              label="Email"
              supportingText={
                user.emailVerifiedAt ? "Verified" : "Not verified"
              }
              value={user.email}
            />
            <SummaryCard
              label="Assigned roles"
              supportingText="Current system-role coverage"
              value={String(user.roleKeys.length)}
            />
            <SummaryCard
              label="Created"
              supportingText="User record"
              value={formatUtcTimestamp(user.createdAt)}
            />
            <SummaryCard
              label="Last updated"
              supportingText="Profile or access mutation"
              value={formatUtcTimestamp(user.updatedAt)}
            />
            <SummaryCard
              label="Auth"
              supportingText={
                user.hasPassword
                  ? "Password credential exists"
                  : "No password credential"
              }
              value={user.emailVerifiedAt ? "Verified" : "Pending"}
            />
          </div>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_22rem]">
        <Stack spacing={6}>
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
                      ? formatUtcTimestamp(user.emailVerifiedAt)
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
                      ? formatUtcTimestamp(user.latestRoleAssignedAt)
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
          </Surface>
        </Stack>

        <Stack spacing={6}>
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
      </div>

      <Surface component="section" sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2.5}>
          <SectionHeading
            eyebrow="Audit"
            title="Recent user activity"
            description="Recent audit events where this user was the actor or the target of an admin mutation."
          />
          {snapshot.recentAuditEvents.length > 0 ? (
            <Stack spacing={1.25}>
              {snapshot.recentAuditEvents.map((event) => (
                <Stack
                  key={event.id}
                  spacing={0.75}
                  sx={{
                    border: `1px solid ${onesourceTokens.color.border.subtle}`,
                    borderRadius: 2,
                    p: 1.5,
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{ justifyContent: "space-between" }}
                  >
                    <Typography sx={{ fontSize: "0.94rem", fontWeight: 700 }}>
                      {event.actionLabel}
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      {formatUtcTimestamp(event.occurredAt)}
                    </Typography>
                  </Stack>
                  <Typography color="text.secondary" variant="body2">
                    {event.summary ??
                      `${event.actorLabel} affected ${event.targetLabel}.`}
                  </Typography>
                  {event.metadataPreview ? (
                    <Typography
                      color="text.secondary"
                      sx={{ wordBreak: "break-word" }}
                      variant="caption"
                    >
                      {event.metadataPreview}
                    </Typography>
                  ) : null}
                </Stack>
              ))}
            </Stack>
          ) : (
            <EmptyState
              message="No user-specific audit activity has been recorded yet."
              title="No recent audit events"
            />
          )}
        </Stack>
      </Surface>
    </section>
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
      <Typography sx={{ mt: 1.25 }} variant="h3">
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
        {description}
      </Typography>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      spacing={0.5}
      sx={{
        border: `1px solid ${onesourceTokens.color.border.subtle}`,
        borderRadius: 2,
        p: 1.5,
      }}
    >
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.95rem", fontWeight: 650, minWidth: 0 }}>
        {value}
      </Typography>
    </Stack>
  );
}

function CompactMetric({ label, value }: { label: string; value: number }) {
  return (
    <Stack
      spacing={0.25}
      sx={{
        bgcolor: onesourceTokens.color.surface.muted,
        borderRadius: 2,
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
