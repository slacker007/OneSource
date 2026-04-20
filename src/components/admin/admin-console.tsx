import type { AdminWorkspaceSnapshot } from "@/modules/admin/admin.types";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type AdminConsoleProps = {
  recalibrateScoringProfileAction: (formData: FormData) => Promise<void>;
  sessionUser: {
    name?: string | null;
    email?: string | null;
  };
  retrySourceSyncAction: (formData: FormData) => Promise<void>;
  snapshot: AdminWorkspaceSnapshot | null;
  scoringRecalibrationNotice?: {
    message: string;
    tone: "accent" | "warning" | "danger";
  } | null;
  sourceSyncRetryNotice?: {
    message: string;
    tone: "accent" | "warning" | "danger";
  } | null;
};

export function AdminConsole({
  recalibrateScoringProfileAction,
  sessionUser,
  retrySourceSyncAction,
  snapshot,
  scoringRecalibrationNotice = null,
  sourceSyncRetryNotice = null,
}: AdminConsoleProps) {
  const viewerLabel = sessionUser.name ?? sessionUser.email ?? "Unknown admin";

  if (!snapshot) {
    return (
      <section className="space-y-4">
        <p className="text-muted text-sm tracking-[0.26em] uppercase">
          Settings
        </p>
        <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
          Workspace settings
        </h1>
        <ErrorState
          message="Organization-scoped admin data could not be loaded for this session. Re-seed the local database or verify the authenticated user still belongs to an active organization."
          title="Workspace settings are unavailable"
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="border-border bg-surface rounded-[32px] border px-6 py-8 shadow-[0_24px_80px_rgba(20,37,34,0.12)] sm:px-8">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge>Settings</Badge>
            <Badge tone="muted">{snapshot.organizationName}</Badge>
            <Badge tone="accent">Operator workspace</Badge>
          </div>
          <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
            Workspace settings
          </h1>
          <p className="text-muted max-w-3xl text-sm leading-7">
            Run the organization from one settings workspace: review connector
            health, saved-search coverage, scoring inputs, role assignments,
            and recent audit activity without leaving the protected admin
            route.
          </p>
          {sourceSyncRetryNotice ? (
            <div className="rounded-[24px] border border-border bg-white p-4">
              <Badge tone={sourceSyncRetryNotice.tone}>Source sync retry</Badge>
              <p className="text-muted mt-3 text-sm leading-6">
                {sourceSyncRetryNotice.message}
              </p>
            </div>
          ) : null}
          {scoringRecalibrationNotice ? (
            <div className="rounded-[24px] border border-border bg-white p-4">
              <Badge tone={scoringRecalibrationNotice.tone}>
                Scoring recalibration
              </Badge>
              <p className="text-muted mt-3 text-sm leading-6">
                {scoringRecalibrationNotice.message}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <SummaryCard
            label="Current operator"
            value={viewerLabel}
            supportingText={sessionUser.email ?? "Signed-in session"}
          />
          <SummaryCard
            label="People"
            value={String(snapshot.totalUserCount)}
            supportingText="Users in this workspace"
          />
          <SummaryCard
            label="Admin seats"
            value={String(snapshot.adminUserCount)}
            supportingText="Users carrying the admin role"
          />
          <SummaryCard
            label="Saved searches"
            value={String(snapshot.savedSearches.length)}
            supportingText="Discovery definitions under management"
          />
          <SummaryCard
            label="Connector alerts"
            value={String(
              snapshot.sourceOperations.rateLimitedConnectorCount +
                snapshot.sourceOperations.failedImportReviewCount,
            )}
            supportingText="Rate limits plus import review backlog"
          />
          <SummaryCard
            label="Audit rows"
            value={String(snapshot.totalAuditLogCount)}
            supportingText="Recent organization-scoped events"
          />
        </div>

        <nav
          aria-label="Workspace settings sections"
          className="mt-6 flex flex-wrap gap-2"
        >
          <SectionJumpLink href="#workspace-overview">Workspace</SectionJumpLink>
          <SectionJumpLink href="#source-operations-heading">
            Connectors
          </SectionJumpLink>
          <SectionJumpLink href="#saved-searches-heading">
            Saved searches
          </SectionJumpLink>
          <SectionJumpLink href="#scoring-profile-heading">
            Scoring profile
          </SectionJumpLink>
          <SectionJumpLink href="#assigned-roles-heading">
            Users &amp; roles
          </SectionJumpLink>
          <SectionJumpLink href="#recent-audit-heading">Audit</SectionJumpLink>
        </nav>
      </header>

      <div className="grid gap-6">
        <section
          aria-labelledby="workspace-overview-heading"
          className="border-border bg-surface space-y-4 rounded-[28px] border px-5 py-5 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-6"
          id="workspace-overview"
        >
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Workspace overview
            </p>
            <h2
              className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]"
              id="workspace-overview-heading"
            >
              Operator briefing
            </h2>
            <p className="text-muted text-sm leading-6">
              Keep the current workspace posture visible before you move into
              connector, search, scoring, or access-control detail.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <article className="border-border bg-surface-muted rounded-[24px] border px-5 py-5">
              <p className="text-muted text-xs tracking-[0.2em] uppercase">
                Organization
              </p>
              <h3 className="text-foreground mt-3 text-xl font-semibold">
                {snapshot.organizationName}
              </h3>
              <p className="text-muted mt-3 text-sm leading-6">
                {snapshot.savedSearches.length === 0
                  ? "This workspace has no saved discovery searches yet. Operators can still review connector health, profile settings, role coverage, and audit activity here."
                  : `${snapshot.savedSearches.length} saved searches are currently tracked across ${snapshot.sourceOperations.totalConnectorCount} configured connectors, with ${snapshot.sourceOperations.rateLimitedConnectorCount} active connector alerts and ${snapshot.sourceOperations.failedImportReviewCount} import-review items waiting for attention.`}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="muted">
                  {snapshot.scoringProfile?.activeScoringModelKey ??
                    "No active scoring model"}
                </Badge>
                <Badge tone="muted">
                  {snapshot.scoringProfile?.activeScoringModelVersion ??
                    "No profile version"}
                </Badge>
                <Badge tone="accent">
                  {snapshot.sourceOperations.activeConnectorCount} active
                  connectors
                </Badge>
              </div>
            </article>

            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryCard
                label="Healthy connectors"
                value={String(snapshot.sourceOperations.healthyConnectorCount)}
                supportingText="Validated and not currently degraded"
              />
              <SummaryCard
                label="Last successful sync"
                value={
                  snapshot.sourceOperations.lastSuccessfulSyncSourceDisplayName ??
                  "No successful sync yet"
                }
                supportingText={
                  snapshot.sourceOperations.lastSuccessfulSyncAt
                    ? formatUtcTimestamp(snapshot.sourceOperations.lastSuccessfulSyncAt)
                    : "No completed successful sync run is recorded yet"
                }
              />
              <SummaryCard
                label="Capabilities"
                value={String(snapshot.scoringProfile?.capabilities.length ?? 0)}
                supportingText="Active capability statements"
              />
              <SummaryCard
                label="Criteria"
                value={String(
                  snapshot.scoringProfile?.scoringCriteria.length ?? 0,
                )}
                supportingText="Weighted scoring factors"
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="source-operations-heading" className="space-y-4">
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Connectors
            </p>
            <h2
              className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]"
              id="source-operations-heading"
            >
              Connector operations
            </h2>
            <p className="text-muted text-sm leading-6">
              Scan connector readiness, latest sync results, rate-limit posture,
              and import backlog from one operational section.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              label="Connectors"
              value={String(snapshot.sourceOperations.totalConnectorCount)}
              supportingText="Configured connector boundaries"
            />
            <SummaryCard
              label="Active connectors"
              value={String(snapshot.sourceOperations.activeConnectorCount)}
              supportingText="Enabled for search or sync work"
            />
            <SummaryCard
              label="Healthy connectors"
              value={String(snapshot.sourceOperations.healthyConnectorCount)}
              supportingText="Validated and not currently degraded"
            />
            <SummaryCard
              label="Rate-limited"
              value={String(snapshot.sourceOperations.rateLimitedConnectorCount)}
              supportingText="Connectors waiting on upstream throttling"
            />
            <SummaryCard
              label="Last successful sync"
              value={
                snapshot.sourceOperations.lastSuccessfulSyncSourceDisplayName ??
                "No successful sync yet"
              }
              supportingText={
                snapshot.sourceOperations.lastSuccessfulSyncAt
                  ? formatUtcTimestamp(snapshot.sourceOperations.lastSuccessfulSyncAt)
                  : "No completed successful sync run is recorded yet"
              }
            />
          </div>

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
                      <p className="font-medium text-foreground">
                        {connector.sourceDisplayName}
                      </p>
                      <p className="text-muted text-xs">
                        {connector.connectorVersion ?? "No connector version recorded"}
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
                    <p className="font-medium text-foreground">
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
                        <button
                          className="rounded-full bg-[rgb(19,78,68)] px-4 py-2 text-xs font-medium tracking-[0.16em] text-white uppercase"
                          type="submit"
                        >
                          Retry sync
                        </button>
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
                    <Badge tone={connector.latestRateLimitAt ? "warning" : "accent"}>
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
                            connector.latestRateLimitMessage ?? "Upstream rate limit recorded."
                          }`
                        : connector.rateLimitNotes ??
                          "No recent rate-limit event is recorded for this connector."}
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
            rows={snapshot.sourceOperations.connectorHealth}
          />

          <div className="grid gap-6 xl:grid-cols-2">
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
                        <p className="font-medium text-foreground">
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
                    <div className="space-y-1 text-xs text-muted">
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
                      <p className="text-xs text-muted">
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
                          <button
                            className="rounded-full bg-[rgb(19,78,68)] px-4 py-2 text-xs font-medium tracking-[0.16em] text-white uppercase"
                            type="submit"
                          >
                            Retry sync
                          </button>
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
              rows={snapshot.sourceOperations.recentSyncRuns}
            />

            <DataTable
              ariaLabel="Failed import review"
              columns={[
                {
                  key: "source",
                  header: "Source",
                  cell: (review) => (
                    <div>
                      <p className="font-medium text-foreground">{review.sourceTitle}</p>
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
                    review.rationale ?? "No rationale was recorded for this review item.",
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
              rows={snapshot.sourceOperations.failedImportReviews}
            />
          </div>
        </section>

        <section
          aria-labelledby="saved-searches-heading"
          className="space-y-4"
        >
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Saved searches
            </p>
            <h2
              className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]"
              id="saved-searches-heading"
            >
              Search registry
            </h2>
            <p className="text-muted text-sm leading-6">
              Keep reusable discovery definitions visible with connector
              ownership, filter coverage, and latest execution timestamps.
            </p>
          </div>

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
                      <p className="font-medium text-foreground">
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
                    <p className="text-sm text-muted">
                      No parsed filter summary is available for this search.
                    </p>
                  ),
              },
              {
                key: "activity",
                header: "Activity",
                cell: (savedSearch) => (
                  <div className="space-y-2 text-xs text-muted">
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
                  <div className="space-y-2 text-xs text-muted">
                    <p>Owner: {savedSearch.createdByLabel}</p>
                    <p>
                      Created {formatUtcTimestamp(savedSearch.createdAt)}
                    </p>
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
            rows={snapshot.savedSearches}
          />
        </section>

        <section
          aria-labelledby="scoring-profile-heading"
          className="space-y-4"
        >
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Scoring inputs
            </p>
            <h2
              className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]"
              id="scoring-profile-heading"
            >
              Scoring profile
            </h2>
            <p className="text-muted text-sm leading-6">
              Review the weighted scoring model, qualification thresholds,
              capability coverage, and recalibration evidence that shape
              pipeline recommendations.
            </p>
          </div>

          {snapshot.scoringProfile ? (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <article className="border-border rounded-[24px] border bg-white p-5">
                  <p className="text-muted text-xs tracking-[0.22em] uppercase">
                    Overview
                  </p>
                  <p className="text-muted mt-3 text-sm leading-7">
                    {snapshot.scoringProfile.overview ??
                      "No organization overview has been recorded yet."}
                  </p>
                </article>

                <article className="border-border rounded-[24px] border bg-white p-5">
                  <p className="text-muted text-xs tracking-[0.22em] uppercase">
                    Strategic focus
                  </p>
                  <p className="text-muted mt-3 text-sm leading-7">
                    {snapshot.scoringProfile.strategicFocus ??
                      "No strategic focus statement has been recorded yet."}
                  </p>
                </article>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <ProfileBadgeGroup
                  badges={snapshot.scoringProfile.targetNaicsCodes}
                  emptyLabel="No target NAICS codes configured"
                  title={`Model ${snapshot.scoringProfile.activeScoringModelKey} / ${snapshot.scoringProfile.activeScoringModelVersion}`}
                />
                <ProfileBadgeGroup
                  badges={[
                    `GO >= ${snapshot.scoringProfile.goRecommendationThreshold}`,
                    `DEFER >= ${snapshot.scoringProfile.deferRecommendationThreshold}`,
                    `Risk floor >= ${snapshot.scoringProfile.minimumRiskScorePercent}%`,
                  ]}
                  emptyLabel="No recommendation thresholds configured"
                  title="Decision thresholds"
                />
                <ProfileBadgeGroup
                  badges={snapshot.scoringProfile.priorityAgencies.map(
                    (agency) => agency.label,
                  )}
                  emptyLabel="No priority agencies configured"
                  title="Priority agencies"
                />
                <ProfileBadgeGroup
                  badges={snapshot.scoringProfile.relationshipAgencies.map(
                    (agency) => agency.label,
                  )}
                  emptyLabel="No relationship agencies configured"
                  title="Relationship coverage"
                />
                <ProfileBadgeGroup
                  badges={snapshot.scoringProfile.selectedVehicles
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
                        <p className="font-medium text-foreground">
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
                rows={snapshot.scoringProfile.capabilities}
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
                          <p className="font-medium text-foreground">
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
                  rows={snapshot.scoringProfile.certifications}
                />

                <DataTable
                  ariaLabel="Organization scoring vehicles"
                  columns={[
                    {
                      key: "vehicle",
                      header: "Vehicle",
                      cell: (vehicle) => (
                        <div>
                          <p className="font-medium text-foreground">
                            {vehicle.name}
                          </p>
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
                  rows={snapshot.scoringProfile.selectedVehicles}
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
                        <p className="font-medium text-foreground">
                          {criterion.label}
                        </p>
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
                rows={snapshot.scoringProfile.scoringCriteria}
              />

              <section
                aria-labelledby="scoring-recalibration-heading"
                className="space-y-4"
              >
                <div className="space-y-2">
                  <p className="text-muted text-xs tracking-[0.24em] uppercase">
                    Feedback loop
                  </p>
                  <h3
                    className="font-heading text-foreground text-xl font-semibold tracking-[-0.03em]"
                    id="scoring-recalibration-heading"
                  >
                    Scoring recalibration
                  </h3>
                  <p className="text-muted max-w-3xl text-sm leading-6">
                    Use closed opportunity outcomes and recommendation
                    alignment to tune factor weights and thresholds without
                    editing code. Saving this form bumps the scoring model
                    version and recalculates current scorecards immediately.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard
                    label="Closed outcomes"
                    value={String(
                      snapshot.scoringProfile.recalibration.closedOpportunityCount,
                    )}
                    supportingText="Awarded, lost, and no-bid records with outcome evidence"
                  />
                  <SummaryCard
                    label="Scored samples"
                    value={String(
                      snapshot.scoringProfile.recalibration.sampledOpportunityCount,
                    )}
                    supportingText="Closed records carrying a current scorecard"
                  />
                  <SummaryCard
                    label="Alignment"
                    value={
                      snapshot.scoringProfile.recalibration
                        .recommendationAlignmentPercent
                        ? `${snapshot.scoringProfile.recalibration.recommendationAlignmentPercent}%`
                        : "N/A"
                    }
                    supportingText="Final call matched the latest recommendation"
                  />
                  <SummaryCard
                    label="Model version"
                    value={snapshot.scoringProfile.activeScoringModelVersion}
                    supportingText="Bumped automatically on recalibration"
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
                      rows={snapshot.scoringProfile.recalibration.outcomeSummaries}
                    />

                    <article className="border-border rounded-[24px] border bg-white p-5">
                      <p className="text-muted text-xs tracking-[0.22em] uppercase">
                        Recalibration summary
                      </p>
                      <p className="text-muted mt-3 text-sm leading-7">
                        {snapshot.scoringProfile.recalibration.suggestionSummary}
                      </p>
                    </article>
                  </div>

                  <form
                    action={recalibrateScoringProfileAction}
                    className="rounded-[28px] border border-border bg-[linear-gradient(180deg,rgba(248,252,250,1),rgba(239,247,243,0.94))] px-5 py-5 shadow-[0_16px_40px_rgba(20,37,34,0.06)]"
                  >
                    <div className="grid gap-4 xl:grid-cols-3">
                      <FormField
                        htmlFor="scoring-go-threshold"
                        hint="Score percent required before the engine recommends GO."
                        label="GO threshold"
                      >
                        <Input
                          defaultValue={
                            snapshot.scoringProfile.goRecommendationThreshold
                          }
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
                          defaultValue={
                            snapshot.scoringProfile.deferRecommendationThreshold
                          }
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
                          defaultValue={
                            snapshot.scoringProfile.minimumRiskScorePercent
                          }
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
                      {snapshot.scoringProfile.recalibration.factorInsights.map(
                        (factor) => (
                          <article
                            className="rounded-[22px] border border-border bg-white px-4 py-4"
                            key={factor.key}
                          >
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
                                <h4 className="mt-3 text-base font-semibold text-foreground">
                                  {factor.label}
                                </h4>
                                <p className="text-muted mt-2 text-sm leading-6">
                                  {factor.rationale}
                                </p>
                              </div>

                              <div className="grid min-w-60 gap-2 text-sm text-muted sm:grid-cols-2">
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
                          </article>
                        ),
                      )}
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
                      <button
                        className="inline-flex min-h-12 items-center justify-center rounded-full border border-[rgba(19,78,68,0.2)] bg-white px-5 py-3 text-sm font-medium text-[rgb(19,78,68)] shadow-[0_10px_24px_rgba(20,37,34,0.05)] transition hover:bg-[rgba(255,255,255,0.92)]"
                        name="recalibrationMode"
                        type="submit"
                        value="suggested"
                      >
                        Apply observed-outcome suggestions
                      </button>
                      <button
                        className="inline-flex min-h-12 items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)]"
                        name="recalibrationMode"
                        type="submit"
                        value="manual"
                      >
                        Save manual recalibration
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            </div>
          ) : (
            <EmptyState
              message="Seed or configure a scoring profile before relying on deterministic recommendation output."
              title="No scoring profile is available yet"
            />
          )}
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section aria-labelledby="assigned-roles-heading" className="space-y-4">
            <div className="space-y-2">
              <p className="text-muted text-xs tracking-[0.24em] uppercase">
                User visibility
              </p>
              <h2
                className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]"
                id="assigned-roles-heading"
              >
                Users & roles
              </h2>
              <p className="text-muted text-sm leading-6">
                Confirm status, assigned roles, and invitation coverage before
                making policy or workflow changes elsewhere in the workspace.
              </p>
            </div>

            <DataTable
              ariaLabel="Users and roles"
              columns={[
                {
                  key: "user",
                  header: "User",
                  cell: (user) => (
                    <div>
                      <p className="font-medium text-foreground">
                        {user.name ?? user.email}
                      </p>
                      <p className="text-muted text-xs">{user.email}</p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  cell: (user) => (
                    <Badge tone={user.status === "ACTIVE" ? "accent" : "warning"}>
                      {formatEnumLabel(user.status)}
                    </Badge>
                  ),
                },
                {
                  key: "roles",
                  header: "Assigned roles",
                  cell: (user) =>
                    user.roles.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map((role) => (
                          <Badge
                            key={`${user.id}-${role.key}`}
                            title={`Assigned ${formatUtcTimestamp(role.assignedAt)}`}
                            tone="muted"
                          >
                            {role.label}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <Badge tone="warning">No roles assigned</Badge>
                    ),
                },
              ]}
              emptyState={
                <EmptyState
                  message="User assignments will appear here once the organization has seeded or created users."
                  title="No organization users are available yet"
                />
              }
              getRowKey={(user) => user.id}
              rows={snapshot.users}
            />
          </section>

          <section aria-labelledby="recent-audit-heading" className="space-y-4">
            <div className="space-y-2">
              <p className="text-muted text-xs tracking-[0.24em] uppercase">
                Audit visibility
              </p>
              <h2
                className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]"
                id="recent-audit-heading"
              >
                Audit activity
              </h2>
              <p className="text-muted text-sm leading-6">
                Newest events render first so operators can inspect recent
                mutations without leaving the settings workspace.
              </p>
            </div>

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
                        <p className="text-sm leading-6 text-muted">
                          {event.summary}
                        </p>
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: "actor",
                  header: "Actor",
                  cell: (event) => (
                    <div>
                      <p className="font-medium text-foreground">
                        {event.actorLabel}
                      </p>
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
                      <p className="font-medium text-foreground">
                        {event.targetLabel}
                      </p>
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
              rows={snapshot.recentAuditEvents}
            />
          </section>
        </div>
      </div>
    </section>
  );
}

function SectionJumpLink({
  children,
  href,
}: {
  children: string;
  href: string;
}) {
  return (
    <a
      className="inline-flex min-h-9 items-center rounded-[var(--radius-pill)] border border-border bg-surface-muted px-3 py-2 text-sm text-muted transition hover:border-border-strong hover:text-foreground"
      href={href}
    >
      {children}
    </a>
  );
}

function SummaryCard({
  label,
  value,
  supportingText,
}: {
  label: string;
  value: string;
  supportingText: string;
}) {
  return (
    <article className="border-border rounded-[24px] border bg-white p-5">
      <p className="text-muted text-xs tracking-[0.22em] uppercase">{label}</p>
      <p className="text-foreground mt-3 text-lg font-semibold">{value}</p>
      <p className="text-muted mt-2 text-sm leading-6">{supportingText}</p>
    </article>
  );
}

function MetricPair({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] bg-[rgba(15,28,31,0.04)] px-3 py-3">
      <p className="text-[11px] tracking-[0.16em] uppercase">{label}</p>
      <p className="mt-2 font-medium text-foreground">{value}</p>
    </div>
  );
}

function ProfileBadgeGroup({
  badges,
  emptyLabel,
  title,
}: {
  badges: string[];
  emptyLabel: string;
  title: string;
}) {
  return (
    <article className="border-border rounded-[24px] border bg-white p-5">
      <p className="text-muted text-xs tracking-[0.22em] uppercase">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {badges.length > 0 ? (
          badges.map((badge) => (
            <Badge key={`${title}-${badge}`} tone="muted">
              {badge}
            </Badge>
          ))
        ) : (
          <Badge tone="warning">{emptyLabel}</Badge>
        )}
      </div>
    </article>
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

function formatEnumLabel(value: string) {
  return value
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map(
      (segment) =>
        segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase(),
    )
    .join(" ");
}

function formatUtcTimestamp(value: string) {
  return value.replace("T", " ").replace(".000Z", " UTC");
}
