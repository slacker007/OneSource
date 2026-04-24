import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import type {
  AdminAuditSettingsSnapshot,
  AdminConnectorSettingsSnapshot,
  AdminSavedSearchSettingsSnapshot,
  AdminScoringSettingsSnapshot,
  AdminSettingsOverviewSnapshot,
} from "@/modules/admin/admin.types";
import {
  formatEnumLabel,
  formatUtcTimestamp,
  mapFeedbackBannerTone,
  MetricPair,
  ProfileBadgeGroup,
  SummaryCard,
} from "@/components/admin/admin-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import { Textarea } from "@/components/ui/textarea";
import { onesourceTokens } from "@/theme/onesource-theme";

type SessionUserSummary = {
  name?: string | null;
  email?: string | null;
};

type FeedbackNotice = {
  message: string;
  tone: "accent" | "warning" | "danger";
};

type AdminConsoleProps = {
  sessionUser: SessionUserSummary;
  snapshot: AdminSettingsOverviewSnapshot | null;
};

type AdminConnectorSettingsProps = {
  retrySourceSyncAction: (formData: FormData) => Promise<void>;
  snapshot: AdminConnectorSettingsSnapshot | null;
  sourceSyncRetryNotice?: FeedbackNotice | null;
};

type AdminSavedSearchSettingsProps = {
  snapshot: AdminSavedSearchSettingsSnapshot | null;
};

type AdminScoringSettingsProps = {
  recalibrateScoringProfileAction: (formData: FormData) => Promise<void>;
  scoringRecalibrationNotice?: FeedbackNotice | null;
  snapshot: AdminScoringSettingsSnapshot | null;
};

type AdminAuditSettingsProps = {
  snapshot: AdminAuditSettingsSnapshot | null;
};

export function AdminConsole({ sessionUser, snapshot }: AdminConsoleProps) {
  const viewerLabel = sessionUser.name ?? sessionUser.email ?? "Unknown admin";

  if (!snapshot) {
    return (
      <MissingSettingsSnapshot title="Workspace settings are unavailable" />
    );
  }

  const connectorAlerts =
    snapshot.sourceOperationsSummary.rateLimitedConnectorCount +
    snapshot.sourceOperationsSummary.failedImportReviewCount;

  return (
    <section className="space-y-6">
      <SettingsWorkspaceHeader
        badges={["Settings", snapshot.organizationName, "Overview"]}
        description="Review the workspace posture, then move directly into the focused admin area for connector operations, saved searches, scoring, audit activity, or user administration."
        title="Workspace settings"
      />

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
          supportingText={sessionUser.email ?? "Signed-in session"}
          value={viewerLabel}
        />
        <SummaryCard
          label="People"
          supportingText="Users in this workspace"
          value={String(snapshot.totalUserCount)}
        />
        <SummaryCard
          label="Admin seats"
          supportingText="Users carrying the admin role"
          value={String(snapshot.adminUserCount)}
        />
        <SummaryCard
          label="Saved searches"
          supportingText="Discovery definitions under management"
          value={String(snapshot.savedSearchCount)}
        />
        <SummaryCard
          label="Connector alerts"
          supportingText="Rate limits plus import review backlog"
          value={String(connectorAlerts)}
        />
        <SummaryCard
          label="Audit rows"
          supportingText="Organization-scoped events"
          value={String(snapshot.totalAuditLogCount)}
        />
      </Box>

      <Surface
        aria-labelledby="workspace-overview-heading"
        component="section"
        sx={{
          boxShadow: "0 16px 40px rgba(20, 37, 34, 0.08)",
          px: { xs: 2.5, sm: 3 },
          py: 3,
        }}
      >
        <Stack spacing={1}>
          <Typography
            sx={{
              color: onesourceTokens.color.text.muted,
              fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
              fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
            }}
          >
            Workspace overview
          </Typography>
          <Typography id="workspace-overview-heading" variant="h3">
            Operator briefing
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {snapshot.savedSearchCount === 0
              ? "This workspace has no saved discovery searches yet. Operators can still review connector health, profile settings, role coverage, and audit activity from the focused workspaces below."
              : `${snapshot.savedSearchCount} saved searches are currently tracked across ${snapshot.sourceOperationsSummary.totalConnectorCount} configured connectors, with ${snapshot.sourceOperationsSummary.rateLimitedConnectorCount} active connector alerts and ${snapshot.sourceOperationsSummary.failedImportReviewCount} import-review items waiting for attention.`}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { md: "repeat(2, minmax(0, 1fr))" },
            mt: 3,
          }}
        >
          <SummaryCard
            label="Healthy connectors"
            supportingText="Validated and not currently degraded"
            value={String(
              snapshot.sourceOperationsSummary.healthyConnectorCount,
            )}
          />
          <SummaryCard
            label="Last successful sync"
            supportingText={
              snapshot.sourceOperationsSummary.lastSuccessfulSyncAt
                ? formatUtcTimestamp(
                    snapshot.sourceOperationsSummary.lastSuccessfulSyncAt,
                  )
                : "No completed successful sync run is recorded yet"
            }
            value={
              snapshot.sourceOperationsSummary
                .lastSuccessfulSyncSourceDisplayName ?? "No successful sync yet"
            }
          />
          <SummaryCard
            label="Capabilities"
            supportingText="Active capability statements"
            value={String(snapshot.scoringProfileSummary?.capabilityCount ?? 0)}
          />
          <SummaryCard
            label="Criteria"
            supportingText="Weighted scoring factors"
            value={String(
              snapshot.scoringProfileSummary?.scoringCriteriaCount ?? 0,
            )}
          />
        </Box>
      </Surface>

      <Box
        component="nav"
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            md: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(5, minmax(0, 1fr))",
          },
        }}
      >
        <SettingsRouteCard
          badge="Sources"
          description="Connector health, sync runs, import-review backlog, and retry controls."
          href="/settings/connectors"
          metric={`${snapshot.sourceOperationsSummary.activeConnectorCount} active`}
          title="Connectors"
        />
        <SettingsRouteCard
          badge="Discovery"
          description="Reusable saved searches, filter coverage, ownership, and sync recency."
          href="/settings/saved-searches"
          metric={`${snapshot.savedSearchCount} saved`}
          title="Saved searches"
        />
        <SettingsRouteCard
          badge="Scoring"
          description="Organization profile, thresholds, weighted criteria, observed outcomes, and recalibration."
          href="/settings/scoring"
          metric={
            snapshot.scoringProfileSummary?.activeScoringModelVersion ??
            "No profile"
          }
          title="Scoring profile"
        />
        <SettingsRouteCard
          badge="Audit"
          description="Recent organization-scoped mutations and metadata previews."
          href="/settings/audit"
          metric={`${snapshot.totalAuditLogCount} rows`}
          title="Audit activity"
        />
        <SettingsRouteCard
          badge="Access"
          description="Invite users, assign roles, and manage disabled or invited accounts."
          href="/settings/users"
          metric={`${snapshot.adminUserCount} admin`}
          title="Users & Roles"
        />
      </Box>
    </section>
  );
}

export function AdminConnectorSettings({
  retrySourceSyncAction,
  snapshot,
  sourceSyncRetryNotice = null,
}: AdminConnectorSettingsProps) {
  if (!snapshot) {
    return (
      <MissingSettingsSnapshot title="Connector settings are unavailable" />
    );
  }

  return (
    <section className="space-y-6">
      <SettingsWorkspaceHeader
        badges={["Settings", snapshot.organizationName, "Connectors"]}
        description="Scan connector readiness, latest sync results, rate-limit posture, and import backlog from one focused operational workspace."
        title="Connector operations"
      >
        {sourceSyncRetryNotice ? (
          <FeedbackBanner
            message={sourceSyncRetryNotice.message}
            title="Source sync retry"
            tone={mapFeedbackBannerTone(sourceSyncRetryNotice.tone)}
          />
        ) : null}
      </SettingsWorkspaceHeader>

      <ConnectorOperationsSection
        retrySourceSyncAction={retrySourceSyncAction}
        sourceOperations={snapshot.sourceOperations}
      />
    </section>
  );
}

export function AdminSavedSearchSettings({
  snapshot,
}: AdminSavedSearchSettingsProps) {
  if (!snapshot) {
    return (
      <MissingSettingsSnapshot title="Saved-search settings are unavailable" />
    );
  }

  return (
    <section className="space-y-6">
      <SettingsWorkspaceHeader
        badges={["Settings", snapshot.organizationName, "Saved searches"]}
        description="Keep reusable discovery definitions visible with connector ownership, filter coverage, and latest execution timestamps."
        title="Saved searches"
      />
      <SavedSearchRegistryTable savedSearches={snapshot.savedSearches} />
    </section>
  );
}

export function AdminScoringSettings({
  recalibrateScoringProfileAction,
  scoringRecalibrationNotice = null,
  snapshot,
}: AdminScoringSettingsProps) {
  if (!snapshot) {
    return <MissingSettingsSnapshot title="Scoring settings are unavailable" />;
  }

  return (
    <section className="space-y-6">
      <SettingsWorkspaceHeader
        badges={["Settings", snapshot.organizationName, "Scoring"]}
        description="Review the weighted scoring model, qualification thresholds, capability coverage, and recalibration evidence that shape pipeline recommendations."
        title="Scoring profile"
      >
        {scoringRecalibrationNotice ? (
          <FeedbackBanner
            message={scoringRecalibrationNotice.message}
            title="Scoring recalibration"
            tone={mapFeedbackBannerTone(scoringRecalibrationNotice.tone)}
          />
        ) : null}
      </SettingsWorkspaceHeader>

      <ScoringProfileSection
        recalibrateScoringProfileAction={recalibrateScoringProfileAction}
        scoringProfile={snapshot.scoringProfile}
      />
    </section>
  );
}

export function AdminAuditSettings({ snapshot }: AdminAuditSettingsProps) {
  if (!snapshot) {
    return <MissingSettingsSnapshot title="Audit settings are unavailable" />;
  }

  return (
    <section className="space-y-6">
      <SettingsWorkspaceHeader
        badges={["Settings", snapshot.organizationName, "Audit"]}
        description="Inspect recent organization-scoped mutations without mixing audit review into connector, scoring, or user-management work."
        title="Audit activity"
      />
      <SummaryCard
        label="Audit rows"
        supportingText="Total organization-scoped events"
        value={String(snapshot.totalAuditLogCount)}
      />
      <AuditActivityTable recentAuditEvents={snapshot.recentAuditEvents} />
    </section>
  );
}

function SettingsWorkspaceHeader({
  badges,
  children,
  description,
  title,
}: {
  badges: string[];
  children?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <Surface
      component="header"
      sx={{
        boxShadow: onesourceTokens.elevation.hero,
        px: { xs: 3, sm: 4 },
        py: 4,
      }}
    >
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {badges.map((badge, index) => (
            <Badge
              key={`${title}-${badge}`}
              tone={index === 2 ? "accent" : index === 0 ? "accent" : "muted"}
            >
              {badge}
            </Badge>
          ))}
        </Stack>
        <Typography
          variant="h1"
          sx={{ fontSize: { xs: "2rem", sm: "2.35rem" } }}
        >
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: "54rem" }}>
          {description}
        </Typography>
        {children}
      </Stack>
    </Surface>
  );
}

function SettingsRouteCard({
  badge,
  description,
  href,
  metric,
  title,
}: {
  badge: string;
  description: string;
  href: string;
  metric: string;
  title: string;
}) {
  return (
    <Surface component="article" sx={{ p: 2.5 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Badge tone="muted">{badge}</Badge>
          <Badge tone="accent">{metric}</Badge>
        </Stack>
        <Typography variant="h3">{title}</Typography>
        <Typography color="text.secondary" variant="body2">
          {description}
        </Typography>
        <Button density="compact" href={href} sx={{ alignSelf: "flex-start" }}>
          Open {title}
        </Button>
      </Stack>
    </Surface>
  );
}

function MissingSettingsSnapshot({ title }: { title: string }) {
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
        Settings
      </Typography>
      <Surface sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography
          variant="h1"
          sx={{ fontSize: { xs: "2rem", sm: "2.35rem" } }}
        >
          {title}
        </Typography>
        <ErrorState
          className="mt-4"
          message="Organization-scoped admin data could not be loaded for this session. Re-seed the local database or verify the authenticated user still belongs to an active organization."
          title={title}
        />
      </Surface>
    </Stack>
  );
}

function ConnectorOperationsSection({
  retrySourceSyncAction,
  sourceOperations,
}: {
  retrySourceSyncAction: (formData: FormData) => Promise<void>;
  sourceOperations: AdminConnectorSettingsSnapshot["sourceOperations"];
}) {
  return (
    <section aria-labelledby="source-operations-heading" className="space-y-4">
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            md: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(5, minmax(0, 1fr))",
          },
        }}
      >
        <SummaryCard
          label="Connectors"
          supportingText="Configured connector boundaries"
          value={String(sourceOperations.totalConnectorCount)}
        />
        <SummaryCard
          label="Active connectors"
          supportingText="Enabled for search or sync work"
          value={String(sourceOperations.activeConnectorCount)}
        />
        <SummaryCard
          label="Healthy connectors"
          supportingText="Validated and not currently degraded"
          value={String(sourceOperations.healthyConnectorCount)}
        />
        <SummaryCard
          label="Rate-limited"
          supportingText="Connectors waiting on upstream throttling"
          value={String(sourceOperations.rateLimitedConnectorCount)}
        />
        <SummaryCard
          label="Last successful sync"
          supportingText={
            sourceOperations.lastSuccessfulSyncAt
              ? formatUtcTimestamp(sourceOperations.lastSuccessfulSyncAt)
              : "No completed successful sync run is recorded yet"
          }
          value={
            sourceOperations.lastSuccessfulSyncSourceDisplayName ??
            "No successful sync yet"
          }
        />
      </Box>

      <DataTable
        ariaLabel="Source connector health"
        columns={[
          {
            key: "connector",
            header: "Connector",
            cell: (connector) => (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={getConnectorHealthTone(connector.healthStatus)}>
                    {formatEnumLabel(connector.healthStatus)}
                  </Badge>
                  <Badge tone="muted">{connector.sourceSystemKey}</Badge>
                </div>
                <div>
                  <p className="text-foreground font-medium">
                    {connector.sourceDisplayName}
                  </p>
                  <p className="text-muted text-xs">
                    {connector.connectorVersion ??
                      "No connector version recorded"}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "validation",
            header: "Validation",
            cell: (connector) => (
              <div className="space-y-2">
                <Badge tone={getValidationTone(connector.validationStatus)}>
                  {formatEnumLabel(connector.validationStatus)}
                </Badge>
                <p className="text-muted text-xs leading-5">
                  {connector.lastValidationMessage ??
                    "No validation message is recorded yet."}
                </p>
              </div>
            ),
          },
          {
            key: "syncState",
            header: "Sync state",
            cell: (connector) => (
              <div className="space-y-2">
                <p className="text-foreground font-medium">
                  {connector.lastSuccessfulSyncAt
                    ? formatUtcTimestamp(connector.lastSuccessfulSyncAt)
                    : "No successful sync recorded"}
                </p>
                <p className="text-muted text-xs">
                  {connector.lastSyncStatus
                    ? `Latest run: ${formatEnumLabel(connector.lastSyncStatus)}`
                    : "No sync attempt has been recorded"}
                </p>
                <p className="text-muted text-xs">
                  {connector.savedSearchCount === 1
                    ? "1 saved search bound to this connector"
                    : `${connector.savedSearchCount} saved searches bound to this connector`}
                </p>
                {connector.latestRetryableSavedSearchId ? (
                  <form action={retrySourceSyncAction}>
                    <input
                      name="savedSearchId"
                      type="hidden"
                      value={connector.latestRetryableSavedSearchId}
                    />
                    <Button density="compact" type="submit">
                      Retry sync
                    </Button>
                  </form>
                ) : null}
              </div>
            ),
          },
          {
            key: "rateLimit",
            header: "Rate limits",
            cell: (connector) => (
              <div className="space-y-2">
                <Badge
                  tone={connector.latestRateLimitAt ? "warning" : "accent"}
                >
                  {connector.latestRateLimitAt ? "Rate limited" : "Clear"}
                </Badge>
                <p className="text-muted text-xs leading-5">
                  {connector.rateLimitStrategy
                    ? `Strategy: ${connector.rateLimitStrategy}`
                    : "No rate-limit strategy metadata recorded."}
                </p>
                <p className="text-muted text-xs leading-5">
                  {connector.latestRateLimitAt
                    ? `${formatUtcTimestamp(connector.latestRateLimitAt)} · ${
                        connector.latestRateLimitMessage ??
                        "Upstream rate limit recorded."
                      }`
                    : (connector.rateLimitNotes ??
                      "No recent rate-limit event is recorded for this connector.")}
                </p>
              </div>
            ),
          },
        ]}
        emptyState={
          <EmptyState
            message="Connector health rows will appear here once source connectors are configured for the organization."
            title="No source connectors are configured yet"
          />
        }
        getRowKey={(connector) => connector.id}
        rows={sourceOperations.connectorHealth}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <RecentSourceSyncRunsTable
          recentSyncRuns={sourceOperations.recentSyncRuns}
          retrySourceSyncAction={retrySourceSyncAction}
        />
        <FailedImportReviewTable
          failedImportReviews={sourceOperations.failedImportReviews}
        />
      </div>
    </section>
  );
}

function RecentSourceSyncRunsTable({
  recentSyncRuns,
  retrySourceSyncAction,
}: {
  recentSyncRuns: AdminConnectorSettingsSnapshot["sourceOperations"]["recentSyncRuns"];
  retrySourceSyncAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <DataTable
      ariaLabel="Recent source sync runs"
      columns={[
        {
          key: "run",
          header: "Run",
          cell: (run) => (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge tone={getRunStatusTone(run.status)}>
                  {formatEnumLabel(run.status)}
                </Badge>
                {run.isRateLimited ? (
                  <Badge tone="warning">Rate limited</Badge>
                ) : null}
              </div>
              <div>
                <p className="text-foreground font-medium">
                  {run.sourceDisplayName}
                </p>
                <p className="text-muted text-xs">
                  {run.savedSearchName ?? "Manual or connector-wide sync"}
                </p>
              </div>
            </div>
          ),
        },
        {
          key: "counts",
          header: "Counts",
          cell: (run) => (
            <div className="text-muted space-y-1 text-xs">
              <p>Fetched: {run.recordsFetched}</p>
              <p>Imported: {run.recordsImported}</p>
              <p>Failed: {run.recordsFailed}</p>
            </div>
          ),
        },
        {
          key: "details",
          header: "Details",
          cell: (run) => (
            <div className="space-y-2">
              <p className="text-muted text-xs">
                {formatEnumLabel(run.triggerType)}
                {run.httpStatus ? ` · HTTP ${run.httpStatus}` : ""}
                {run.errorCode ? ` · ${run.errorCode}` : ""}
              </p>
              <p className="text-muted text-xs leading-5">
                {run.errorMessage ?? "No sync error was recorded for this run."}
              </p>
              {run.canRetry ? (
                <form action={retrySourceSyncAction}>
                  <input
                    name="savedSearchId"
                    type="hidden"
                    value={run.savedSearchId ?? ""}
                  />
                  <Button density="compact" type="submit">
                    Retry sync
                  </Button>
                </form>
              ) : null}
            </div>
          ),
        },
        {
          key: "timing",
          header: "Requested",
          cell: (run) => (
            <div className="space-y-2">
              <p>{formatUtcTimestamp(run.requestedAt)}</p>
              <p className="text-muted text-xs">
                {run.completedAt
                  ? `Completed ${formatUtcTimestamp(run.completedAt)}`
                  : "No completion timestamp recorded yet"}
              </p>
            </div>
          ),
        },
      ]}
      emptyState={
        <EmptyState
          message="Sync runs will appear here after scheduled or manual connector execution."
          title="No source sync runs are recorded yet"
        />
      }
      getRowKey={(run) => run.id}
      rows={recentSyncRuns}
    />
  );
}

function FailedImportReviewTable({
  failedImportReviews,
}: {
  failedImportReviews: AdminConnectorSettingsSnapshot["sourceOperations"]["failedImportReviews"];
}) {
  return (
    <DataTable
      ariaLabel="Failed import review"
      columns={[
        {
          key: "source",
          header: "Source",
          cell: (review) => (
            <div>
              <p className="text-foreground font-medium">
                {review.sourceTitle}
              </p>
              <p className="text-muted text-xs">
                {review.sourceDisplayName} · {review.sourceRecordId}
              </p>
            </div>
          ),
        },
        {
          key: "decision",
          header: "Decision",
          cell: (review) => (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge tone={getImportReviewTone(review.status)}>
                  {formatEnumLabel(review.status)}
                </Badge>
                <Badge tone="muted">{formatEnumLabel(review.mode)}</Badge>
              </div>
              {review.targetOpportunityTitle ? (
                <p className="text-muted text-xs">
                  Target: {review.targetOpportunityTitle}
                </p>
              ) : null}
            </div>
          ),
        },
        {
          key: "rationale",
          header: "Rationale",
          cell: (review) =>
            review.rationale ??
            "No rationale was recorded for this review item.",
        },
        {
          key: "requested",
          header: "Requested",
          cell: (review) => (
            <div className="space-y-2">
              <p>{formatUtcTimestamp(review.requestedAt)}</p>
              <p className="text-muted text-xs">
                {review.decidedAt
                  ? `Decided ${formatUtcTimestamp(review.decidedAt)}`
                  : "Still awaiting operator resolution"}
              </p>
            </div>
          ),
        },
      ]}
      emptyState={
        <EmptyState
          message="Rejected and pending import decisions will appear here for operator review."
          title="No failed import review items are queued"
        />
      }
      getRowKey={(review) => review.id}
      rows={failedImportReviews}
    />
  );
}

function SavedSearchRegistryTable({
  savedSearches,
}: {
  savedSearches: AdminSavedSearchSettingsSnapshot["savedSearches"];
}) {
  return (
    <DataTable
      ariaLabel="Saved searches"
      columns={[
        {
          key: "search",
          header: "Saved search",
          className: "min-w-[16rem]",
          cell: (savedSearch) => (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge tone="muted">{savedSearch.sourceDisplayName}</Badge>
                <Badge
                  tone={
                    savedSearch.sourceSystem === "sam_gov"
                      ? "accent"
                      : "warning"
                  }
                >
                  {savedSearch.sourceSystem === "sam_gov"
                    ? "Sync ready"
                    : "Connector pending"}
                </Badge>
              </div>
              <div>
                <p className="text-foreground font-medium">
                  {savedSearch.name}
                </p>
                <p className="text-muted text-xs leading-5">
                  {savedSearch.description ??
                    "No operator description has been recorded yet."}
                </p>
              </div>
            </div>
          ),
        },
        {
          key: "filters",
          header: "Filters",
          cell: (savedSearch) =>
            savedSearch.filterSummary.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {savedSearch.filterSummary.map((summary) => (
                  <Badge key={`${savedSearch.id}-${summary}`} tone="muted">
                    {summary}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">
                No parsed filter summary is available for this search.
              </p>
            ),
        },
        {
          key: "activity",
          header: "Activity",
          cell: (savedSearch) => (
            <div className="text-muted space-y-2 text-xs">
              <p>
                Last executed:{" "}
                {savedSearch.lastExecutedAt
                  ? formatUtcTimestamp(savedSearch.lastExecutedAt)
                  : "Not run yet"}
              </p>
              <p>
                Last synced:{" "}
                {savedSearch.lastSyncedAt
                  ? formatUtcTimestamp(savedSearch.lastSyncedAt)
                  : "No sync recorded"}
              </p>
              <p>Updated {formatUtcTimestamp(savedSearch.updatedAt)}</p>
            </div>
          ),
        },
        {
          key: "ownership",
          header: "Ownership",
          cell: (savedSearch) => (
            <div className="text-muted space-y-2 text-xs">
              <p>Owner: {savedSearch.createdByLabel}</p>
              <p>Created {formatUtcTimestamp(savedSearch.createdAt)}</p>
              <p>
                {savedSearch.connectorVersion
                  ? `Connector ${savedSearch.connectorVersion}`
                  : "Connector version not recorded"}
              </p>
            </div>
          ),
        },
      ]}
      emptyState={
        <EmptyState
          message="Saved search visibility will appear here once the workspace records reusable discovery definitions."
          title="No saved searches are configured yet"
        />
      }
      getRowKey={(savedSearch) => savedSearch.id}
      rows={savedSearches}
    />
  );
}

function ScoringProfileSection({
  recalibrateScoringProfileAction,
  scoringProfile,
}: {
  recalibrateScoringProfileAction: (formData: FormData) => Promise<void>;
  scoringProfile: AdminScoringSettingsSnapshot["scoringProfile"];
}) {
  if (!scoringProfile) {
    return (
      <EmptyState
        message="Seed or configure a scoring profile before relying on deterministic recommendation output."
        title="No scoring profile is available yet"
      />
    );
  }

  return (
    <section aria-labelledby="scoring-profile-heading" className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Surface className="p-5">
          <p className="text-muted text-xs tracking-[0.22em] uppercase">
            Overview
          </p>
          <p className="text-muted mt-3 text-sm leading-7">
            {scoringProfile.overview ??
              "No organization overview has been recorded yet."}
          </p>
        </Surface>

        <Surface className="p-5">
          <p className="text-muted text-xs tracking-[0.22em] uppercase">
            Strategic focus
          </p>
          <p className="text-muted mt-3 text-sm leading-7">
            {scoringProfile.strategicFocus ??
              "No strategic focus statement has been recorded yet."}
          </p>
        </Surface>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileBadgeGroup
          badges={scoringProfile.targetNaicsCodes}
          emptyLabel="No target NAICS codes configured"
          title={`Model ${scoringProfile.activeScoringModelKey} / ${scoringProfile.activeScoringModelVersion}`}
        />
        <ProfileBadgeGroup
          badges={[
            `GO >= ${scoringProfile.goRecommendationThreshold}`,
            `DEFER >= ${scoringProfile.deferRecommendationThreshold}`,
            `Risk floor >= ${scoringProfile.minimumRiskScorePercent}%`,
          ]}
          emptyLabel="No recommendation thresholds configured"
          title="Decision thresholds"
        />
        <ProfileBadgeGroup
          badges={scoringProfile.priorityAgencies.map((agency) => agency.label)}
          emptyLabel="No priority agencies configured"
          title="Priority agencies"
        />
        <ProfileBadgeGroup
          badges={scoringProfile.relationshipAgencies.map(
            (agency) => agency.label,
          )}
          emptyLabel="No relationship agencies configured"
          title="Relationship coverage"
        />
        <ProfileBadgeGroup
          badges={scoringProfile.selectedVehicles
            .filter((vehicle) => vehicle.isPreferred)
            .map((vehicle) => vehicle.code)}
          emptyLabel="No preferred vehicles configured"
          title="Preferred vehicles"
        />
      </div>

      <DataTable
        ariaLabel="Organization capabilities"
        columns={[
          {
            key: "capability",
            header: "Capability",
            cell: (capability) => (
              <div>
                <p className="text-foreground font-medium">
                  {capability.label}
                </p>
                <p className="text-muted text-xs">{capability.key}</p>
              </div>
            ),
          },
          {
            key: "category",
            header: "Category",
            cell: (capability) => (
              <Badge tone="muted">
                {capability.category
                  ? formatEnumLabel(capability.category)
                  : "Uncategorized"}
              </Badge>
            ),
          },
          {
            key: "keywords",
            header: "Keywords",
            cell: (capability) => (
              <div className="flex flex-wrap gap-2">
                {capability.keywords.map((keyword) => (
                  <Badge key={`${capability.id}-${keyword}`} tone="muted">
                    {keyword}
                  </Badge>
                ))}
              </div>
            ),
          },
        ]}
        emptyState={
          <EmptyState
            message="Seed or configure organization capabilities before deterministic scoring is enabled."
            title="No capabilities are configured yet"
          />
        }
        getRowKey={(capability) => capability.id}
        rows={scoringProfile.capabilities}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <DataTable
          ariaLabel="Organization certifications"
          columns={[
            {
              key: "certification",
              header: "Certification",
              cell: (certification) => (
                <div>
                  <p className="text-foreground font-medium">
                    {certification.label}
                  </p>
                  <p className="text-muted text-xs">
                    {certification.code ?? certification.key}
                  </p>
                </div>
              ),
            },
            {
              key: "issuer",
              header: "Issuer",
              cell: (certification) =>
                certification.issuingBody ?? "Not specified",
            },
          ]}
          emptyState={
            <EmptyState
              message="Certifications will appear here once the scoring profile records them."
              title="No certifications are configured yet"
            />
          }
          getRowKey={(certification) => certification.id}
          rows={scoringProfile.certifications}
        />

        <DataTable
          ariaLabel="Organization scoring vehicles"
          columns={[
            {
              key: "vehicle",
              header: "Vehicle",
              cell: (vehicle) => (
                <div>
                  <p className="text-foreground font-medium">{vehicle.name}</p>
                  <p className="text-muted text-xs">{vehicle.code}</p>
                </div>
              ),
            },
            {
              key: "access",
              header: "Access",
              cell: (vehicle) => (
                <div className="flex flex-wrap gap-2">
                  <Badge tone={vehicle.isPreferred ? "accent" : "muted"}>
                    {vehicle.isPreferred ? "Preferred" : "Active"}
                  </Badge>
                  {vehicle.vehicleType ? (
                    <Badge tone="muted">
                      {formatEnumLabel(vehicle.vehicleType)}
                    </Badge>
                  ) : null}
                </div>
              ),
            },
          ]}
          emptyState={
            <EmptyState
              message="Vehicle access records will appear here once the organization profile selects them."
              title="No profile vehicles are configured yet"
            />
          }
          getRowKey={(vehicle) => vehicle.id}
          rows={scoringProfile.selectedVehicles}
        />
      </div>

      <DataTable
        ariaLabel="Weighted scoring criteria"
        columns={[
          {
            key: "criterion",
            header: "Criterion",
            cell: (criterion) => (
              <div>
                <p className="text-foreground font-medium">{criterion.label}</p>
                <p className="text-muted text-xs">{criterion.key}</p>
              </div>
            ),
          },
          {
            key: "weight",
            header: "Weight",
            cell: (criterion) => (
              <Badge tone="accent">{criterion.weight}</Badge>
            ),
          },
          {
            key: "description",
            header: "Purpose",
            cell: (criterion) =>
              criterion.description ?? "No description provided.",
          },
        ]}
        emptyState={
          <EmptyState
            message="Weighted criteria will appear here once the scoring profile is seeded or configured."
            title="No scoring criteria are configured yet"
          />
        }
        getRowKey={(criterion) => criterion.id}
        rows={scoringProfile.scoringCriteria}
      />

      <ScoringRecalibrationSection
        recalibrateScoringProfileAction={recalibrateScoringProfileAction}
        scoringProfile={scoringProfile}
      />
    </section>
  );
}

function ScoringRecalibrationSection({
  recalibrateScoringProfileAction,
  scoringProfile,
}: {
  recalibrateScoringProfileAction: (formData: FormData) => Promise<void>;
  scoringProfile: NonNullable<AdminScoringSettingsSnapshot["scoringProfile"]>;
}) {
  return (
    <section
      aria-labelledby="scoring-recalibration-heading"
      className="space-y-4"
    >
      <div className="space-y-2">
        <p className="text-muted text-xs tracking-[0.24em] uppercase">
          Feedback loop
        </p>
        <h2
          className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]"
          id="scoring-recalibration-heading"
        >
          Scoring recalibration
        </h2>
        <p className="text-muted max-w-3xl text-sm leading-6">
          Use closed opportunity outcomes and recommendation alignment to tune
          factor weights and thresholds without editing code. Saving this form
          bumps the scoring model version and recalculates current scorecards
          immediately.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Closed outcomes"
          supportingText="Awarded, lost, and no-bid records with outcome evidence"
          value={String(scoringProfile.recalibration.closedOpportunityCount)}
        />
        <SummaryCard
          label="Scored samples"
          supportingText="Closed records carrying a current scorecard"
          value={String(scoringProfile.recalibration.sampledOpportunityCount)}
        />
        <SummaryCard
          label="Alignment"
          supportingText="Final call matched the latest recommendation"
          value={
            scoringProfile.recalibration.recommendationAlignmentPercent
              ? `${scoringProfile.recalibration.recommendationAlignmentPercent}%`
              : "N/A"
          }
        />
        <SummaryCard
          label="Model version"
          supportingText="Bumped automatically on recalibration"
          value={scoringProfile.activeScoringModelVersion}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="space-y-4">
          <DataTable
            ariaLabel="Observed outcome summaries"
            columns={[
              {
                key: "outcome",
                header: "Outcome",
                cell: (summary) => (
                  <div className="space-y-2">
                    <Badge tone={getOutcomeTone(summary.key)}>
                      {summary.label}
                    </Badge>
                    <p className="text-muted text-xs">
                      {summary.opportunityCount} opportunities
                    </p>
                  </div>
                ),
              },
              {
                key: "averageScore",
                header: "Average score",
                cell: (summary) =>
                  summary.averageScorePercent
                    ? `${summary.averageScorePercent}%`
                    : "No scorecard sample",
              },
            ]}
            emptyState={
              <EmptyState
                message="Closed opportunity outcomes will appear here once award, loss, or no-bid records carry current scorecards."
                title="No observed outcomes are available yet"
              />
            }
            getRowKey={(summary) => summary.key}
            rows={scoringProfile.recalibration.outcomeSummaries}
          />

          <Surface className="p-5">
            <p className="text-muted text-xs tracking-[0.22em] uppercase">
              Recalibration summary
            </p>
            <p className="text-muted mt-3 text-sm leading-7">
              {scoringProfile.recalibration.suggestionSummary}
            </p>
          </Surface>
        </div>

        <form action={recalibrateScoringProfileAction}>
          <Surface
            sx={{
              backgroundImage:
                "linear-gradient(180deg, rgba(248, 252, 250, 1), rgba(239, 247, 243, 0.94))",
              boxShadow: "0 16px 40px rgba(20, 37, 34, 0.06)",
              px: 2.5,
              py: 2.5,
            }}
          >
            <div className="grid gap-4 xl:grid-cols-3">
              <FormField
                htmlFor="scoring-go-threshold"
                hint="Score percent required before the engine recommends GO."
                label="GO threshold"
              >
                <Input
                  defaultValue={scoringProfile.goRecommendationThreshold}
                  id="scoring-go-threshold"
                  max={100}
                  min={0}
                  name="goRecommendationThreshold"
                  step="0.01"
                  type="number"
                />
              </FormField>

              <FormField
                htmlFor="scoring-defer-threshold"
                hint="Score percent required before the engine recommends DEFER instead of NO_GO."
                label="DEFER threshold"
              >
                <Input
                  defaultValue={scoringProfile.deferRecommendationThreshold}
                  id="scoring-defer-threshold"
                  max={100}
                  min={0}
                  name="deferRecommendationThreshold"
                  step="0.01"
                  type="number"
                />
              </FormField>

              <FormField
                htmlFor="scoring-risk-floor"
                hint="Minimum risk factor percent required before a GO recommendation is allowed."
                label="Risk floor"
              >
                <Input
                  defaultValue={scoringProfile.minimumRiskScorePercent}
                  id="scoring-risk-floor"
                  max={100}
                  min={0}
                  name="minimumRiskScorePercent"
                  step="0.01"
                  type="number"
                />
              </FormField>
            </div>

            <div className="mt-5 space-y-4">
              {scoringProfile.recalibration.factorInsights.map((factor) => (
                <Surface className="px-4 py-4" key={factor.key}>
                  <input
                    name={`suggestedWeight_${factor.key}`}
                    type="hidden"
                    value={factor.suggestedWeight}
                  />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="muted">{factor.key}</Badge>
                        <Badge
                          tone={
                            factor.recommendation === "increase"
                              ? "accent"
                              : factor.recommendation === "decrease"
                                ? "warning"
                                : "muted"
                          }
                        >
                          {factor.recommendation === "hold"
                            ? "Hold"
                            : factor.recommendation === "increase"
                              ? "Increase"
                              : "Decrease"}
                        </Badge>
                      </div>
                      <h3 className="text-foreground mt-3 text-base font-semibold">
                        {factor.label}
                      </h3>
                      <p className="text-muted mt-2 text-sm leading-6">
                        {factor.rationale}
                      </p>
                    </div>

                    <div className="text-muted grid min-w-60 gap-2 text-sm sm:grid-cols-2">
                      <MetricPair
                        label="Current"
                        value={factor.currentWeight}
                      />
                      <MetricPair
                        label="Suggested"
                        value={factor.suggestedWeight}
                      />
                      <MetricPair
                        label="Awarded avg"
                        value={
                          factor.awardedAveragePercent
                            ? `${factor.awardedAveragePercent}%`
                            : "N/A"
                        }
                      />
                      <MetricPair
                        label="Non-award avg"
                        value={
                          factor.nonAwardAveragePercent
                            ? `${factor.nonAwardAveragePercent}%`
                            : "N/A"
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
                    <FormField
                      htmlFor={`weight-${factor.key}`}
                      hint={`Evidence rows: ${factor.evidenceCount}${
                        factor.outcomeLiftPercent
                          ? ` · Outcome lift ${factor.outcomeLiftPercent}%`
                          : ""
                      }`}
                      label="Manual weight"
                    >
                      <Input
                        defaultValue={factor.currentWeight}
                        id={`weight-${factor.key}`}
                        min={0}
                        name={`weight_${factor.key}`}
                        step="0.01"
                        type="number"
                      />
                    </FormField>
                  </div>
                </Surface>
              ))}
            </div>

            <FormField
              className="mt-5"
              htmlFor="scoring-recalibration-note"
              hint="Optional operator note captured in audit metadata."
              label="Recalibration note"
            >
              <Textarea
                defaultValue=""
                id="scoring-recalibration-note"
                name="recalibrationNote"
                placeholder="Summarize why the scoring profile is changing and what outcome evidence drove the update."
                rows={3}
              />
            </FormField>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <Button
                name="recalibrationMode"
                tone="neutral"
                type="submit"
                value="suggested"
                variant="outlined"
              >
                Apply observed-outcome suggestions
              </Button>
              <Button name="recalibrationMode" type="submit" value="manual">
                Save manual recalibration
              </Button>
            </div>
          </Surface>
        </form>
      </div>
    </section>
  );
}

function AuditActivityTable({
  recentAuditEvents,
}: {
  recentAuditEvents: AdminAuditSettingsSnapshot["recentAuditEvents"];
}) {
  return (
    <DataTable
      ariaLabel="Audit activity"
      columns={[
        {
          key: "action",
          header: "Action",
          cell: (event) => (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge>{event.actionLabel}</Badge>
                <Badge tone="muted">{event.action}</Badge>
              </div>
              {event.summary ? (
                <p className="text-muted text-sm leading-6">{event.summary}</p>
              ) : null}
            </div>
          ),
        },
        {
          key: "actor",
          header: "Actor",
          cell: (event) => (
            <div>
              <p className="text-foreground font-medium">{event.actorLabel}</p>
              <p className="text-muted text-xs">
                {formatEnumLabel(event.actorType)}
              </p>
            </div>
          ),
        },
        {
          key: "target",
          header: "Target",
          cell: (event) => (
            <div>
              <p className="text-foreground font-medium">{event.targetLabel}</p>
              <p className="text-muted text-xs">
                {formatEnumLabel(event.targetType)}
              </p>
            </div>
          ),
        },
        {
          key: "occurredAt",
          header: "Occurred",
          cell: (event) => (
            <div className="space-y-2">
              <p>{formatUtcTimestamp(event.occurredAt)}</p>
              {event.metadataPreview ? (
                <pre className="overflow-x-auto rounded-[18px] bg-[rgba(15,28,31,0.05)] px-3 py-3 text-xs leading-5 break-all whitespace-pre-wrap">
                  {event.metadataPreview}
                </pre>
              ) : null}
            </div>
          ),
        },
      ]}
      emptyState={
        <EmptyState
          message="Audit rows will appear here once write flows emit organization-scoped events."
          title="No audit events are available yet"
        />
      }
      getRowKey={(event) => event.id}
      rows={recentAuditEvents}
    />
  );
}

function getConnectorHealthTone(status: string) {
  switch (status) {
    case "healthy":
      return "accent";
    case "rate_limited":
      return "warning";
    case "degraded":
      return "danger";
    case "inactive":
      return "muted";
    default:
      return "muted";
  }
}

function getValidationTone(status: string) {
  switch (status) {
    case "VALID":
      return "accent";
    case "INVALID":
      return "danger";
    default:
      return "warning";
  }
}

function getRunStatusTone(status: string) {
  switch (status) {
    case "SUCCEEDED":
      return "accent";
    case "PARTIAL":
      return "warning";
    case "FAILED":
    case "CANCELLED":
      return "danger";
    default:
      return "muted";
  }
}

function getImportReviewTone(status: string) {
  switch (status) {
    case "REJECTED":
      return "danger";
    case "PENDING":
      return "warning";
    default:
      return "muted";
  }
}

function getOutcomeTone(status: string) {
  switch (status) {
    case "awarded":
      return "accent";
    case "lost":
      return "danger";
    case "no_bid":
      return "warning";
    default:
      return "muted";
  }
}
