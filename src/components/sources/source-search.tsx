import { CsvImportWorkspace } from "./csv-import-workspace";
import {
  ActiveFilterChipBar,
  type ActiveFilterChip,
} from "@/components/ui/active-filter-chip-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  PreviewPanel,
  type PreviewPanelMetadataItem,
} from "@/components/ui/preview-panel";
import {
  SavedViewControls,
  type SavedViewControlItem,
} from "@/components/ui/saved-view-controls";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import type { CsvImportWorkspaceSnapshot } from "@/modules/source-integrations/csv-import.service";
import type {
  SourceImportDuplicateCandidate,
  SourceImportPreviewSnapshot,
} from "@/modules/source-integrations/source-import.service";
import type {
  CanonicalSourceSearchQuery,
  SourceSearchSnapshot,
} from "@/modules/source-integrations/source-search.service";
import Checkbox from "@mui/material/Checkbox";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";

type SourceSearchProps = {
  csvImportAction: (formData: FormData) => Promise<void>;
  csvImportFeedback: {
    error: string | null;
    importedCount: number | null;
    skippedCount: number | null;
    status: string | null;
  };
  csvImportSnapshot: CsvImportWorkspaceSnapshot | null;
  importAction: (formData: FormData) => Promise<void>;
  importFeedback: {
    error: string | null;
    opportunityId: string | null;
    status: string | null;
  };
  previewSnapshot: SourceImportPreviewSnapshot | null;
  returnPath: string;
  snapshot: SourceSearchSnapshot | null;
};

export function SourceSearch({
  csvImportAction,
  csvImportFeedback,
  csvImportSnapshot,
  importAction,
  importFeedback,
  previewSnapshot,
  returnPath,
  snapshot,
}: SourceSearchProps) {
  if (!snapshot) {
    return (
      <section className="space-y-4">
        <p className="text-muted text-sm tracking-[0.26em] uppercase">
          Sources
        </p>
        <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
          External source search
        </h1>
        <ErrorState
          message="The source-search page could not load connector metadata for the authenticated workspace. Re-seed the database or verify the default organization still exists."
          title="Source connector data is unavailable"
        />
      </section>
    );
  }

  const searchableConnectors = snapshot.connectors.filter(
    (connector) => connector.supportsSearch,
  );
  const emptyState = buildResultEmptyState(snapshot);
  const sanitizedReturnPath = stripTransientImportParams(returnPath);
  const importFeedbackBanner = buildImportFeedbackBanner(importFeedback);
  const connectorItems = buildConnectorItems(snapshot, sanitizedReturnPath);
  const savedSearchItems = buildSavedSearchItems(
    snapshot.savedSearches,
    snapshot.query,
  );
  const activeFilterChips = snapshot.query
    ? buildActiveFilterChips(snapshot.query, sanitizedReturnPath)
    : [];
  const advancedFiltersOpen =
    snapshot.validationErrors.length > 0 ||
    hasAdvancedFilterSelections(snapshot.formValues);

  return (
    <section className="space-y-6">
      <Surface
        component="header"
        sx={{ bgcolor: "background.paper", px: { xs: 3, sm: 4 }, py: 3 }}
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Source discovery</Badge>
              <Badge tone="muted">Connector-led workspace</Badge>
              <Badge tone="accent">Preview and import</Badge>
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
                External source search
              </h1>
              <p className="text-muted max-w-3xl text-sm leading-7">
                Scan connector-backed discovery queues, reapply saved searches,
                inspect the translated outbound request, and keep
                duplicate-aware import preview beside the result set instead of
                jumping between disconnected search and intake steps.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Connector"
              value={snapshot.activeConnector?.sourceDisplayName ?? "Unknown"}
              supportingText={
                snapshot.activeConnector?.connectorVersion ??
                "Version not available"
              }
            />
            <SummaryCard
              label="Saved searches"
              value={String(snapshot.savedSearches.length)}
              supportingText={
                snapshot.savedSearches.length > 0
                  ? "Saved search overlays available for this connector"
                  : "No saved searches are configured for this connector yet"
              }
            />
            <SummaryCard
              label="Execution"
              value={formatExecutionMode(snapshot.executionMode)}
              supportingText={snapshot.resultCountLabel}
            />
            <SummaryCard
              label="Preview rail"
              value={previewSnapshot ? "Open" : "Standby"}
              supportingText={
                previewSnapshot
                  ? "Duplicate and import decisions are loaded"
                  : "Select a result to inspect import state"
              }
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <SavedViewControls items={connectorItems} label="Connectors" />
          {savedSearchItems.length > 0 ? (
            <SavedViewControls
              items={savedSearchItems}
              label="Saved searches"
            />
          ) : (
            <p className="text-muted text-sm">
              No saved searches are configured for{" "}
              <span className="text-foreground font-medium">
                {snapshot.activeConnector?.sourceDisplayName ??
                  "this connector"}
              </span>
              .
            </p>
          )}
        </div>
      </Surface>

      {importFeedbackBanner}

      {(snapshot.validationErrors.length > 0 ||
        snapshot.executionMode === "unsupported_connector" ||
        snapshot.executionMode === "connector_unavailable" ||
        snapshot.executionMode === "connector_error") && (
        <ErrorState
          action={
            snapshot.validationErrors.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-[rgb(133,69,49)]">
                {snapshot.validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : undefined
          }
          message={snapshot.executionMessage}
          title={
            snapshot.executionMode === "unsupported_connector"
              ? "Selected connector is not executable yet"
              : snapshot.executionMode === "connector_unavailable"
                ? "Connector configuration is incomplete"
                : snapshot.executionMode === "connector_error"
                  ? "Connector execution failed"
                  : "Search query needs correction"
          }
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_22rem]">
        <section className="space-y-4">
          <Surface component="section" sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-muted text-xs tracking-[0.24em] uppercase">
                  Discovery filters
                </p>
                <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  Connector-led search and filter queue
                </h2>
                <p className="text-muted mt-2 text-sm">
                  Keep the high-frequency inputs visible, then open advanced
                  filters only when you need pagination, procurement-type, or
                  source-specific narrowing.
                </p>
              </div>

              <Button
                density="compact"
                href="/sources"
                tone="neutral"
                variant="text"
              >
                Reset workspace
              </Button>
            </div>

            <form action="/sources" className="mt-6 space-y-5">
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                <FormField
                  hint="Switching connectors keeps the route stable while changing the discovery context."
                  htmlFor="source-connector"
                  label="Active connector"
                >
                  <Select
                    defaultValue={snapshot.formValues.source}
                    id="source-connector"
                    name="source"
                  >
                    {searchableConnectors.map((connector) => (
                      <option
                        disabled={!connector.isEnabled}
                        key={connector.id}
                        value={connector.sourceSystemKey}
                      >
                        {connector.sourceDisplayName}
                        {connector.sourceSystemKey === "sam_gov"
                          ? " (search enabled)"
                          : " (coming later)"}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField
                  hint="Maps to the outbound `title` parameter for the current SAM.gov implementation."
                  htmlFor="source-keywords"
                  label="Keywords"
                >
                  <Input
                    defaultValue={snapshot.formValues.keywords}
                    id="source-keywords"
                    name="keywords"
                    placeholder="cloud operations"
                    type="search"
                  />
                </FormField>

                <FormField
                  hint="Required by the current connector contract."
                  htmlFor="source-posted-from"
                  label="Posted from"
                >
                  <Input
                    defaultValue={snapshot.formValues.postedFrom}
                    id="source-posted-from"
                    name="postedFrom"
                    type="date"
                  />
                </FormField>

                <FormField
                  hint="Required by the current connector contract."
                  htmlFor="source-posted-to"
                  label="Posted to"
                >
                  <Input
                    defaultValue={snapshot.formValues.postedTo}
                    id="source-posted-to"
                    name="postedTo"
                    type="date"
                  />
                </FormField>
              </div>

              <details className="rounded-[24px]" open={advancedFiltersOpen}>
                <summary className="text-foreground cursor-pointer list-none text-sm font-semibold">
                  Advanced filters, procurement types, and pagination
                </summary>
                <Surface sx={{ mt: 1.5, px: 2, py: 2 }}>
                  <div className="mt-4 space-y-5">
                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                      <FormField htmlFor="source-notice-id" label="Notice ID">
                        <Input
                          defaultValue={snapshot.formValues.noticeid}
                          id="source-notice-id"
                          name="noticeid"
                          placeholder="FA4861-26-R-0001"
                        />
                      </FormField>

                      <FormField
                        htmlFor="source-solicitation"
                        label="Solicitation number"
                      >
                        <Input
                          defaultValue={snapshot.formValues.solnum}
                          id="source-solicitation"
                          name="solnum"
                          placeholder="36C10B26Q0142"
                        />
                      </FormField>

                      <FormField
                        htmlFor="source-org-name"
                        label="Organization name"
                      >
                        <Input
                          defaultValue={snapshot.formValues.organizationName}
                          id="source-org-name"
                          name="organizationName"
                          placeholder="Department of Veterans Affairs"
                        />
                      </FormField>

                      <FormField
                        htmlFor="source-org-code"
                        label="Organization code"
                      >
                        <Input
                          defaultValue={snapshot.formValues.organizationCode}
                          id="source-org-code"
                          name="organizationCode"
                          placeholder="36C10B"
                        />
                      </FormField>

                      <FormField
                        htmlFor="source-state"
                        label="Place of performance state"
                      >
                        <Input
                          defaultValue={snapshot.formValues.state}
                          id="source-state"
                          maxLength={2}
                          name="state"
                          placeholder="VA"
                        />
                      </FormField>

                      <FormField
                        htmlFor="source-zip"
                        label="Place of performance ZIP"
                      >
                        <Input
                          defaultValue={snapshot.formValues.zip}
                          id="source-zip"
                          name="zip"
                          placeholder="22350"
                        />
                      </FormField>

                      <FormField htmlFor="source-naics" label="NAICS code">
                        <Input
                          defaultValue={snapshot.formValues.ncode}
                          id="source-naics"
                          name="ncode"
                          placeholder="541512"
                        />
                      </FormField>

                      <FormField
                        htmlFor="source-ccode"
                        label="Classification code"
                      >
                        <Input
                          defaultValue={snapshot.formValues.ccode}
                          id="source-ccode"
                          name="ccode"
                          placeholder="D302"
                        />
                      </FormField>

                      <FormField
                        htmlFor="source-set-aside"
                        label="Set-aside code"
                      >
                        <Input
                          defaultValue={snapshot.formValues.typeOfSetAside}
                          id="source-set-aside"
                          name="typeOfSetAside"
                          placeholder="SDVOSB"
                        />
                      </FormField>

                      <FormField
                        htmlFor="source-set-aside-description"
                        label="Set-aside description"
                      >
                        <Input
                          defaultValue={
                            snapshot.formValues.typeOfSetAsideDescription
                          }
                          id="source-set-aside-description"
                          name="typeOfSetAsideDescription"
                          placeholder="Small business"
                        />
                      </FormField>

                      <FormField
                        htmlFor="source-rdlfrom"
                        label="Response deadline from"
                      >
                        <Input
                          defaultValue={snapshot.formValues.rdlfrom}
                          id="source-rdlfrom"
                          name="rdlfrom"
                          type="date"
                        />
                      </FormField>

                      <FormField
                        htmlFor="source-rdlto"
                        label="Response deadline to"
                      >
                        <Input
                          defaultValue={snapshot.formValues.rdlto}
                          id="source-rdlto"
                          name="rdlto"
                          type="date"
                        />
                      </FormField>

                      <FormField htmlFor="source-status" label="Status">
                        <Select
                          defaultValue={snapshot.formValues.status}
                          id="source-status"
                          name="status"
                        >
                          {snapshot.activeCapability.statusOptions.map(
                            (option) => (
                              <option key={option.label} value={option.value}>
                                {option.label}
                              </option>
                            ),
                          )}
                        </Select>
                      </FormField>

                      <FormField htmlFor="source-limit" label="Page size">
                        <Select
                          defaultValue={snapshot.formValues.limit}
                          id="source-limit"
                          name="limit"
                        >
                          {snapshot.activeCapability.pageSizeOptions.map(
                            (pageSize) => (
                              <option key={pageSize} value={pageSize}>
                                {pageSize}
                              </option>
                            ),
                          )}
                          <option value="250">250</option>
                          <option value="500">500</option>
                          <option value="1000">1000</option>
                        </Select>
                      </FormField>

                      <FormField
                        hint="Maps directly to the `offset` parameter."
                        htmlFor="source-offset"
                        label="Offset"
                      >
                        <Input
                          defaultValue={snapshot.formValues.offset}
                          id="source-offset"
                          min={0}
                          name="offset"
                          step={1}
                          type="number"
                        />
                      </FormField>
                    </div>

                    <fieldset className="space-y-3">
                      <legend className="text-foreground text-sm font-medium">
                        Procurement types
                      </legend>
                      <p className="text-muted text-xs leading-5">
                        The checkbox grid preserves the real `ptype[]` request
                        model so one saved search can express multiple notice
                        categories without connector-specific rewrites.
                      </p>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {snapshot.activeCapability.procurementTypes.map(
                          (option) => (
                            <Surface
                              key={option.value}
                              tone="muted"
                              sx={{ px: 2, py: 1.5 }}
                            >
                              <label
                                className="flex w-full cursor-pointer items-start gap-3"
                                htmlFor={`ptype-${option.value}`}
                              >
                                <Checkbox
                                  defaultChecked={snapshot.formValues.ptype.includes(
                                    option.value,
                                  )}
                                  id={`ptype-${option.value}`}
                                  name="ptype"
                                  size="small"
                                  value={option.value}
                                />
                                <span className="flex-1 space-y-1">
                                  <span className="block font-medium">
                                    {option.label}
                                  </span>
                                  <span className="text-muted block text-xs leading-5">
                                    {option.description}
                                  </span>
                                </span>
                              </label>
                            </Surface>
                          ),
                        )}
                      </div>
                    </fieldset>
                  </div>
                </Surface>
              </details>

              <div className="flex flex-wrap gap-3">
                <Button type="submit">Search external opportunities</Button>
                <Button href="/sources" tone="neutral" variant="outlined">
                  Clear all filters
                </Button>
              </div>
            </form>
          </Surface>

          <Surface component="section" sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-muted text-xs tracking-[0.24em] uppercase">
                    Result queue
                  </p>
                  <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
                    {snapshot.resultCountLabel}
                  </h2>
                  <p className="text-muted mt-2 text-sm">
                    Compact scanning keeps opportunity, agency, import state,
                    and preview access in one table instead of splitting
                    discovery from the intake decision.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="muted">
                    {snapshot.activeConnector?.sourceDisplayName ??
                      "Connector unknown"}
                  </Badge>
                  <Badge tone="warning">
                    {snapshot.executedAt
                      ? `Ran ${formatDateTime(snapshot.executedAt)}`
                      : "Not executed"}
                  </Badge>
                </div>
              </div>

              <ActiveFilterChipBar
                chips={activeFilterChips}
                clearHref="/sources"
                emptyLabel="No active chips beyond the selected connector or saved search."
              />
            </div>
          </Surface>

          <DataTable
            ariaLabel="External source search results"
            caption="External source results with agency context, deadlines, duplicate state, and import-preview actions."
            columns={[
              {
                key: "opportunity",
                header: "Opportunity",
                className: "min-w-[20rem]",
                cell: (result) => (
                  <div className="space-y-2">
                    <a
                      className="font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
                      href={result.uiLink}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {result.title}
                    </a>
                    <p className="text-muted text-xs">
                      Notice {result.noticeId}
                      {result.solicitationNumber
                        ? ` · Solicitation ${result.solicitationNumber}`
                        : ""}
                    </p>
                    <p className="text-foreground text-sm leading-6">
                      {result.summary}
                    </p>
                  </div>
                ),
              },
              {
                key: "agency",
                header: "Agency",
                className: "min-w-[12rem]",
                cell: (result) => (
                  <div className="space-y-2">
                    <p className="text-foreground font-medium">
                      {result.organizationName}
                    </p>
                    <p className="text-muted text-xs">
                      {result.organizationCode ?? "No organization code"}
                    </p>
                    <p className="text-muted text-xs">
                      {result.placeOfPerformanceState ?? "No state"}
                      {result.placeOfPerformanceZip
                        ? ` · ${result.placeOfPerformanceZip}`
                        : ""}
                    </p>
                  </div>
                ),
              },
              {
                key: "timing",
                header: "Dates",
                className: "min-w-[10rem]",
                cell: (result) => (
                  <div className="space-y-2">
                    <p className="text-foreground font-medium">
                      Posted {formatShortDate(result.postedDate)}
                    </p>
                    <p className="text-muted text-xs">
                      {result.responseDeadline
                        ? `Due ${formatShortDate(result.responseDeadline)}`
                        : "No deadline returned"}
                    </p>
                    <Badge tone="muted">{result.procurementTypeLabel}</Badge>
                  </div>
                ),
              },
              {
                key: "import-state",
                header: "Import state",
                className: "min-w-[12rem]",
                cell: (result) => (
                  <InlineImportState
                    previewSnapshot={
                      previewSnapshot?.result.id === result.id
                        ? previewSnapshot
                        : null
                    }
                    resultId={result.id}
                  />
                ),
              },
              {
                key: "actions",
                header: "Action",
                className: "min-w-[10rem]",
                cell: (result) => (
                  <Button
                    density="compact"
                    href={buildPreviewHref(sanitizedReturnPath, result.id)}
                    tone={
                      previewSnapshot?.result.id === result.id
                        ? "primary"
                        : "neutral"
                    }
                    variant={
                      previewSnapshot?.result.id === result.id
                        ? "soft"
                        : "outlined"
                    }
                  >
                    {previewSnapshot?.result.id === result.id
                      ? "Preview open"
                      : "Inspect import"}
                  </Button>
                ),
              },
            ]}
            density="compact"
            emptyState={emptyState}
            getRowKey={(result) => result.id}
            rows={snapshot.results}
            selectedRowId={previewSnapshot?.result.id ?? null}
          />
        </section>

        <aside className="space-y-4">
          <div className="xl:sticky xl:top-24 xl:space-y-4">
            {previewSnapshot ? (
              <SourceImportPreviewPanel
                importAction={importAction}
                previewSnapshot={previewSnapshot}
                returnPath={buildPreviewHref(
                  sanitizedReturnPath,
                  previewSnapshot.result.id,
                )}
              />
            ) : (
              <EmptyState
                message="Open any result row to inspect duplicate signals, the raw and normalized payloads, and the guarded create-or-link import actions."
                title="Result preview and import actions"
              />
            )}

            <SourceExecutionCard snapshot={snapshot} />
            <TranslatedQueryCard snapshot={snapshot} />
          </div>
        </aside>
      </div>

      <CsvImportWorkspace
        action={csvImportAction}
        feedback={csvImportFeedback}
        workspaceSnapshot={csvImportSnapshot}
      />
    </section>
  );
}

function SourceImportPreviewPanel({
  importAction,
  previewSnapshot,
  returnPath,
}: {
  importAction: (formData: FormData) => Promise<void>;
  previewSnapshot: SourceImportPreviewSnapshot;
  returnPath: string;
}) {
  const {
    alreadyTrackedOpportunity,
    duplicateCandidates,
    importPreview,
    result,
    shouldAutoCanonicalize,
    suggestedTargetOpportunityId,
  } = previewSnapshot;
  const linkableCandidates = duplicateCandidates.filter(
    (candidate) => candidate.matchKind !== "exact_source",
  );
  const recommendedCandidate =
    linkableCandidates.find(
      (candidate) => candidate.opportunityId === suggestedTargetOpportunityId,
    ) ??
    linkableCandidates[0] ??
    null;
  const metadata = buildPreviewMetadata(result);

  return (
    <div className="space-y-4">
      <PreviewPanel
        actions={
          <>
            <Button
              density="compact"
              href={clearPreviewHref(returnPath)}
              tone="neutral"
              variant="outlined"
            >
              Close preview
            </Button>
            <Button
              density="compact"
              href={result.uiLink}
              rel="noreferrer"
              target="_blank"
            >
              Open source notice
            </Button>
          </>
        }
        className="shadow-[0_16px_40px_rgba(20,37,34,0.08)]"
        description="Review the duplicate assessment, inspect the persisted source payload, and then either create a new tracked opportunity or attach the source notice to the canonical record already in the workspace."
        eyebrow="Import preview"
        label="Import preview"
        metadata={metadata}
        title={result.title}
      >
        {alreadyTrackedOpportunity ? (
          <FeedbackBanner
            message={
              <>
                This source notice is already linked to the tracked opportunity{" "}
                <span className="font-semibold">
                  {alreadyTrackedOpportunity.title}
                </span>
                . Stage:{" "}
                {alreadyTrackedOpportunity.currentStageLabel ?? "Unstaged"}.
              </>
            }
            title="Already linked"
            tone="success"
          />
        ) : null}

        {!alreadyTrackedOpportunity &&
        shouldAutoCanonicalize &&
        recommendedCandidate ? (
          <FeedbackBanner
            message={
              <>
                The duplicate signals are strong enough to merge this result
                into{" "}
                <span className="font-semibold">
                  {recommendedCandidate.title}
                </span>{" "}
                instead of creating a second canonical opportunity.
              </>
            }
            title="Canonical merge recommended"
            tone="info"
          />
        ) : null}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-muted text-sm font-semibold tracking-[0.18em] uppercase">
              Duplicate candidates
            </h3>
            <Badge tone="muted">
              {duplicateCandidates.length} candidate
              {duplicateCandidates.length === 1 ? "" : "s"}
            </Badge>
          </div>
          {duplicateCandidates.length > 0 ? (
            <div className="space-y-3">
              {duplicateCandidates.map((candidate) => (
                <DuplicateCandidateCard
                  candidate={candidate}
                  key={candidate.opportunityId}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted text-sm leading-6">
              No likely duplicate opportunity crossed the current match
              threshold. Creating a new tracked opportunity is the clean path.
            </p>
          )}
        </section>

        {!alreadyTrackedOpportunity ? (
          <section className="space-y-4">
            {!shouldAutoCanonicalize ? (
              <form action={importAction} className="space-y-3">
                <input name="mode" type="hidden" value="CREATE_OPPORTUNITY" />
                <input name="sourceRecordId" type="hidden" value={result.id} />
                <input name="returnPath" type="hidden" value={returnPath} />
                <Surface tone="muted" sx={{ px: 2.5, py: 2.5 }}>
                  <p className="text-foreground text-sm font-semibold">
                    Create a new tracked opportunity
                  </p>
                  <p className="text-muted mt-2 text-sm leading-6">
                    Use this when the result is net new or the candidate list
                    does not represent the same pursuit.
                  </p>
                  <Button sx={{ mt: 2 }} type="submit">
                    Create tracked opportunity
                  </Button>
                </Surface>
              </form>
            ) : null}

            {linkableCandidates.length > 0 ? (
              <form action={importAction} className="space-y-4">
                <input name="mode" type="hidden" value="LINK_TO_EXISTING" />
                <input name="sourceRecordId" type="hidden" value={result.id} />
                <input name="returnPath" type="hidden" value={returnPath} />
                <Surface tone="muted" sx={{ px: 2.5, py: 2.5 }}>
                  <div>
                    <p className="text-foreground text-sm font-semibold">
                      {shouldAutoCanonicalize
                        ? "Merge into the canonical opportunity"
                        : "Link to an existing tracked opportunity"}
                    </p>
                    <p className="text-muted mt-1 text-sm leading-6">
                      {shouldAutoCanonicalize
                        ? "The strongest duplicate candidate is treated as the canonical pursuit."
                        : "Use the duplicate analysis to attach this source result to an already-tracked pursuit."}
                    </p>
                  </div>

                  <RadioGroup
                    defaultValue={
                      suggestedTargetOpportunityId ??
                      linkableCandidates[0]?.opportunityId
                    }
                    name="targetOpportunityId"
                    sx={{ gap: 1.5, mt: 2 }}
                  >
                    {linkableCandidates.map((candidate) => (
                      <Surface
                        key={candidate.opportunityId}
                        sx={{ bgcolor: "background.paper", px: 2, py: 1.5 }}
                      >
                        <label
                          className="flex w-full cursor-pointer items-start gap-3"
                          htmlFor={`target-${candidate.opportunityId}`}
                        >
                          <Radio
                            id={`target-${candidate.opportunityId}`}
                            size="small"
                            value={candidate.opportunityId}
                          />
                          <span className="flex-1 space-y-2">
                            <span className="text-foreground block font-medium">
                              {candidate.title}
                            </span>
                            <span className="flex flex-wrap gap-2">
                              <Badge tone="muted">
                                {formatMatchLabel(candidate.matchKind)}
                              </Badge>
                              <Badge>{candidate.matchScore} / 100</Badge>
                              <Badge tone="warning">
                                {candidate.currentStageLabel ?? "Unstaged"}
                              </Badge>
                            </span>
                            <span className="text-muted block text-xs leading-5">
                              {candidate.matchReasons.join(" ")}
                            </span>
                          </span>
                        </label>
                      </Surface>
                    ))}
                  </RadioGroup>

                  <Button sx={{ mt: 2 }} type="submit" variant="soft">
                    {shouldAutoCanonicalize
                      ? "Merge into selected opportunity"
                      : "Link to selected opportunity"}
                  </Button>
                </Surface>
              </form>
            ) : null}
          </section>
        ) : null}

        <details className="rounded-[20px]">
          <summary className="text-foreground cursor-pointer list-none text-sm font-semibold">
            Open raw and normalized payloads
          </summary>
          <Surface tone="muted" sx={{ mt: 1.5, px: 2.5, py: 2.5 }}>
            <div className="mt-4 grid gap-4">
              <JsonPreviewCard
                payload={importPreview.rawPayload}
                title="Raw payload"
              />
              <JsonPreviewCard
                payload={importPreview.normalizedPayload}
                title="Normalized payload"
              />
            </div>
          </Surface>
        </details>

        <Surface
          sx={{
            bgcolor: "warning.light",
            borderColor: "warning.main",
            px: 2.5,
            py: 2.5,
          }}
        >
          <p className="text-warning text-sm font-semibold">Preview warnings</p>
          <ul className="text-warning mt-3 space-y-2 text-sm leading-6">
            {importPreview.warnings.map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </Surface>
      </PreviewPanel>
    </div>
  );
}

function SourceExecutionCard({ snapshot }: { snapshot: SourceSearchSnapshot }) {
  return (
    <Surface sx={{ bgcolor: "background.paper", px: 2.5, py: 2.5 }}>
      <p className="text-muted text-xs tracking-[0.22em] uppercase">
        Execution summary
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>{formatExecutionMode(snapshot.executionMode)}</Badge>
        <Badge tone="muted">
          {snapshot.activeConnector?.sourceDisplayName ?? "Connector unknown"}
        </Badge>
        <Badge tone="warning">
          {snapshot.executedAt
            ? `Ran ${formatDateTime(snapshot.executedAt)}`
            : "Not executed"}
        </Badge>
      </div>
      <p className="text-muted mt-4 text-sm leading-6">
        {snapshot.executionMessage}
      </p>
      <div className="text-foreground mt-4 space-y-2 text-sm">
        <p>
          <span className="font-medium">Workspace:</span>{" "}
          {snapshot.organization.name}
        </p>
        <p>
          <span className="font-medium">Search execution:</span>{" "}
          {snapshot.searchExecutionId ?? "Unavailable"}
        </p>
      </div>
    </Surface>
  );
}

function TranslatedQueryCard({ snapshot }: { snapshot: SourceSearchSnapshot }) {
  return (
    <details
      className="rounded-[24px]"
      open={Boolean(snapshot.outboundRequest)}
    >
      <summary className="text-foreground cursor-pointer list-none text-sm font-semibold">
        Translated query and connector capability
      </summary>

      <Surface sx={{ mt: 1.5, bgcolor: "background.paper", px: 2.5, py: 2.5 }}>
        <div className="space-y-4">
          <section>
            <p className="text-muted text-xs tracking-[0.22em] uppercase">
              Supported filter contract
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {snapshot.activeCapability.supportedFilterLabels.map((label) => (
                <Badge key={label} tone="muted">
                  {label}
                </Badge>
              ))}
            </div>
          </section>

          <section>
            <p className="text-muted text-xs tracking-[0.22em] uppercase">
              Outbound request
            </p>
            {snapshot.outboundRequest ? (
              <div className="text-foreground mt-3 space-y-3 text-sm">
                <div>
                  <p className="text-muted text-xs font-semibold tracking-[0.18em] uppercase">
                    Endpoint
                  </p>
                  <p className="mt-1 break-all">
                    {snapshot.outboundRequest.endpoint}
                  </p>
                </div>
                <div>
                  <p className="text-muted text-xs font-semibold tracking-[0.18em] uppercase">
                    Query params
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(snapshot.outboundRequest.queryParams).map(
                      ([key, value]) => (
                        <Badge key={key} tone="muted">
                          {Array.isArray(value)
                            ? `${key}: ${value.join(", ")}`
                            : `${key}: ${value}`}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                className="mt-3"
                message="A translated outbound request appears here once the query validates and an executable connector is selected."
                title="No request generated"
              />
            )}
          </section>
        </div>
      </Surface>
    </details>
  );
}

function InlineImportState({
  previewSnapshot,
  resultId,
}: {
  previewSnapshot: SourceImportPreviewSnapshot | null;
  resultId: string;
}) {
  if (!previewSnapshot) {
    return (
      <div className="space-y-2">
        <Badge tone="muted">Preview pending</Badge>
        <p className="text-muted text-xs leading-5">
          Open this result to inspect duplicate signals and import state.
        </p>
      </div>
    );
  }

  if (previewSnapshot.alreadyTrackedOpportunity) {
    return (
      <div className="space-y-2">
        <Badge tone="success">Already linked</Badge>
        <p className="text-muted text-xs leading-5">
          {previewSnapshot.alreadyTrackedOpportunity.title}
        </p>
      </div>
    );
  }

  if (previewSnapshot.shouldAutoCanonicalize) {
    return (
      <div className="space-y-2">
        <Badge tone="info">Merge recommended</Badge>
        <p className="text-muted text-xs leading-5">
          {previewSnapshot.duplicateCandidates.length} duplicate candidate
          {previewSnapshot.duplicateCandidates.length === 1 ? "" : "s"} reviewed
          for {resultId}.
        </p>
      </div>
    );
  }

  if (previewSnapshot.duplicateCandidates.length > 0) {
    return (
      <div className="space-y-2">
        <Badge tone="warning">Manual review</Badge>
        <p className="text-muted text-xs leading-5">
          Duplicate candidates need a human import choice.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Badge tone="success">Ready to create</Badge>
      <p className="text-muted text-xs leading-5">
        No duplicate candidate crossed the current threshold.
      </p>
    </div>
  );
}

function DuplicateCandidateCard({
  candidate,
}: {
  candidate: SourceImportDuplicateCandidate;
}) {
  return (
    <Surface sx={{ bgcolor: "background.paper", px: 2, py: 1.75 }}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-foreground font-medium">{candidate.title}</p>
        <Badge tone="muted">{formatMatchLabel(candidate.matchKind)}</Badge>
        <Badge>{candidate.matchScore} / 100</Badge>
      </div>
      <p className="text-muted mt-2 text-sm">
        Stage: {candidate.currentStageLabel ?? "Unstaged"} · Origin:{" "}
        {candidate.originSourceSystem ?? "unknown"}
      </p>
      <ul className="text-foreground mt-3 space-y-1 text-sm leading-6">
        {candidate.matchReasons.map((reason) => (
          <li key={reason}>• {reason}</li>
        ))}
      </ul>
    </Surface>
  );
}

function JsonPreviewCard({
  payload,
  title,
}: {
  payload: Record<string, unknown>;
  title: string;
}) {
  return (
    <Surface tone="muted" sx={{ px: 2, py: 2 }}>
      <p className="text-foreground text-sm font-semibold">{title}</p>
      <pre className="mt-3 overflow-x-auto rounded-[18px] bg-[rgb(15,28,31)] p-4 text-xs leading-6 text-[rgb(233,244,241)]">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </Surface>
  );
}

function buildImportFeedbackBanner(
  importFeedback: SourceSearchProps["importFeedback"],
) {
  if (importFeedback.error) {
    return (
      <ErrorState
        message={importFeedback.error}
        title="Source import could not be applied"
      />
    );
  }

  if (!importFeedback.status) {
    return null;
  }

  const statusMessage = formatImportStatus(importFeedback.status);

  return (
    <FeedbackBanner
      message={
        <>
          Opportunity reference: {importFeedback.opportunityId ?? "Unavailable"}
          .
        </>
      }
      title={statusMessage}
      tone="success"
    />
  );
}

function buildResultEmptyState(snapshot: SourceSearchSnapshot) {
  if (snapshot.executionMode === "invalid_query") {
    return (
      <EmptyState
        message="Correct the highlighted query issues above, then rerun the search."
        title="Search did not execute"
      />
    );
  }

  if (snapshot.executionMode === "unsupported_connector") {
    return (
      <EmptyState
        message="Only the SAM.gov connector is executable in the current slice. Other configured connectors stay visible so the shared source framework can expand without reworking the route."
        title="Connector execution is pending"
      />
    );
  }

  if (snapshot.executionMode === "connector_unavailable") {
    return (
      <EmptyState
        message="Set SAM_GOV_API_KEY for live execution, or run with SAM_GOV_USE_FIXTURES=true for deterministic fixture-backed verification."
        title="Connector credentials are missing"
      />
    );
  }

  if (snapshot.executionMode === "connector_error") {
    return (
      <EmptyState
        message="The connector returned an upstream error for this query. Review the execution summary and translated request, then retry with adjusted filters or restored credentials."
        title="Connector request failed"
      />
    );
  }

  return (
    <EmptyState
      action={
        <Button density="compact" href="/sources" variant="text">
          Reset to the default query
        </Button>
      }
      message="No external source records matched this filter set. Adjust the date range, remove a structured filter, or reapply a broader saved search."
      title="No external opportunities matched"
    />
  );
}

function buildConnectorItems(
  snapshot: SourceSearchSnapshot,
  returnPath: string,
): SavedViewControlItem[] {
  return snapshot.connectors
    .filter((connector) => connector.supportsSearch)
    .map((connector) => ({
      active: connector.sourceSystemKey === snapshot.formValues.source,
      href: buildSourceSearchHref(returnPath, {
        source: connector.sourceSystemKey,
      }),
      label: connector.sourceDisplayName,
      supportingText:
        connector.sourceSystemKey === "sam_gov"
          ? "Search enabled"
          : connector.isEnabled
            ? "Queued next"
            : "Not configured",
    }));
}

function buildSavedSearchItems(
  savedSearches: SourceSearchSnapshot["savedSearches"],
  currentQuery: CanonicalSourceSearchQuery | null,
): SavedViewControlItem[] {
  return savedSearches.map((savedSearch) => ({
    active:
      currentQuery !== null &&
      buildSavedSearchHref(savedSearch.query) ===
        buildSavedSearchHref(currentQuery),
    href: buildSavedSearchHref(savedSearch.query),
    label: savedSearch.name,
    supportingText: savedSearch.lastExecutedAt
      ? `Ran ${formatRelativeDate(savedSearch.lastExecutedAt)}`
      : "Not executed",
  }));
}

function buildActiveFilterChips(
  query: CanonicalSourceSearchQuery,
  returnPath: string,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [
    {
      href: buildSourceSearchHref(returnPath, {
        postedFrom: null,
        postedTo: null,
      }),
      label: `Posted ${query.postedDateFrom} to ${query.postedDateTo}`,
    },
  ];

  if (query.keywords) {
    chips.push({
      href: buildSourceSearchHref(returnPath, {
        keywords: null,
      }),
      label: `Keywords: ${query.keywords}`,
    });
  }

  if (query.procurementTypes.length > 0) {
    chips.push({
      href: buildSourceSearchHref(returnPath, {
        ptype: [],
      }),
      label: `Type: ${query.procurementTypes.join(", ")}`,
    });
  }

  if (query.organizationName) {
    chips.push({
      href: buildSourceSearchHref(returnPath, {
        organizationName: null,
      }),
      label: `Agency: ${query.organizationName}`,
    });
  }

  if (query.placeOfPerformanceState) {
    chips.push({
      href: buildSourceSearchHref(returnPath, {
        state: null,
      }),
      label: `State: ${query.placeOfPerformanceState}`,
    });
  }

  if (query.status && query.status !== "active") {
    chips.push({
      href: buildSourceSearchHref(returnPath, {
        status: null,
      }),
      label: `Status: ${query.status}`,
    });
  }

  if (query.noticeId) {
    chips.push({
      href: buildSourceSearchHref(returnPath, {
        noticeid: null,
      }),
      label: `Notice: ${query.noticeId}`,
    });
  }

  if (query.naicsCode) {
    chips.push({
      href: buildSourceSearchHref(returnPath, {
        ncode: null,
      }),
      label: `NAICS: ${query.naicsCode}`,
    });
  }

  return chips;
}

function buildPreviewMetadata(
  result: SourceImportPreviewSnapshot["result"],
): PreviewPanelMetadataItem[] {
  return [
    {
      label: "Notice",
      value: result.noticeId,
    },
    {
      label: "Connector",
      value: result.sourceSystem,
    },
    {
      label: "Posted",
      value: formatShortDate(result.postedDate),
    },
    {
      label: "Deadline",
      value: result.responseDeadline
        ? formatShortDate(result.responseDeadline)
        : "No deadline returned",
    },
    {
      label: "Status",
      value: result.status,
    },
    {
      label: "Agency",
      value: result.organizationName,
    },
  ];
}

function buildSavedSearchHref(query: CanonicalSourceSearchQuery) {
  const params = new URLSearchParams();

  params.set("source", query.sourceSystem);
  params.set("postedFrom", query.postedDateFrom);
  params.set("postedTo", query.postedDateTo);
  params.set("limit", String(query.pageSize));
  params.set("offset", String(query.pageOffset));

  if (query.keywords) {
    params.set("keywords", query.keywords);
  }

  if (query.responseDeadlineFrom) {
    params.set("rdlfrom", query.responseDeadlineFrom);
  }

  if (query.responseDeadlineTo) {
    params.set("rdlto", query.responseDeadlineTo);
  }

  for (const procurementType of query.procurementTypes) {
    params.append("ptype", procurementType);
  }

  if (query.noticeId) {
    params.set("noticeid", query.noticeId);
  }

  if (query.solicitationNumber) {
    params.set("solnum", query.solicitationNumber);
  }

  if (query.organizationName) {
    params.set("organizationName", query.organizationName);
  }

  if (query.organizationCode) {
    params.set("organizationCode", query.organizationCode);
  }

  if (query.naicsCode) {
    params.set("ncode", query.naicsCode);
  }

  if (query.classificationCode) {
    params.set("ccode", query.classificationCode);
  }

  if (query.setAsideCode) {
    params.set("typeOfSetAside", query.setAsideCode);
  }

  if (query.setAsideDescription) {
    params.set("typeOfSetAsideDescription", query.setAsideDescription);
  }

  if (query.placeOfPerformanceState) {
    params.set("state", query.placeOfPerformanceState);
  }

  if (query.placeOfPerformanceZip) {
    params.set("zip", query.placeOfPerformanceZip);
  }

  if (query.status) {
    params.set("status", query.status);
  }

  return `/sources?${params.toString()}`;
}

function buildSourceSearchHref(
  returnPath: string,
  updates: Record<string, string | null | number | string[]>,
) {
  const [pathname, existingQuery = ""] = returnPath.split("?");
  const params = new URLSearchParams(existingQuery);

  for (const [key, value] of Object.entries(updates)) {
    params.delete(key);

    if (value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item.length > 0) {
          params.append(key, item);
        }
      }
      continue;
    }

    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function buildPreviewHref(returnPath: string, resultId: string) {
  return buildSourceSearchHref(returnPath, {
    importError: null,
    importStatus: null,
    opportunityId: null,
    preview: resultId,
  });
}

function clearPreviewHref(returnPath: string) {
  return buildSourceSearchHref(returnPath, {
    importError: null,
    importStatus: null,
    opportunityId: null,
    preview: null,
  });
}

function stripTransientImportParams(returnPath: string) {
  return clearPreviewHref(returnPath);
}

function hasAdvancedFilterSelections(
  formValues: SourceSearchSnapshot["formValues"],
) {
  return (
    formValues.noticeid.length > 0 ||
    formValues.solnum.length > 0 ||
    formValues.organizationName.length > 0 ||
    formValues.organizationCode.length > 0 ||
    formValues.ncode.length > 0 ||
    formValues.ccode.length > 0 ||
    formValues.typeOfSetAside.length > 0 ||
    formValues.typeOfSetAsideDescription.length > 0 ||
    formValues.state.length > 0 ||
    formValues.zip.length > 0 ||
    formValues.rdlfrom.length > 0 ||
    formValues.rdlto.length > 0 ||
    formValues.status !== "active" ||
    formValues.limit !== "25" ||
    formValues.offset !== "0" ||
    formValues.ptype.length > 0
  );
}

function formatExecutionMode(mode: SourceSearchSnapshot["executionMode"]) {
  switch (mode) {
    case "live_connector":
      return "Live connector";
    case "fixture_connector":
      return "Fixture connector";
    case "unsupported_connector":
      return "Connector pending";
    case "invalid_query":
      return "Validation blocked";
    case "connector_unavailable":
      return "Connector unavailable";
    case "connector_error":
      return "Connector error";
    default:
      return "Unknown";
  }
}

function formatImportStatus(status: string) {
  switch (status) {
    case "created":
      return "Created a tracked opportunity from the selected external result.";
    case "merged":
      return "Merged the selected external result into the existing canonical opportunity.";
    case "linked":
      return "Linked the selected external result to an existing tracked opportunity.";
    case "already_tracked":
      return "This external result was already linked to a tracked opportunity.";
    default:
      return "Source import updated.";
  }
}

function formatMatchLabel(
  matchKind: SourceImportDuplicateCandidate["matchKind"],
) {
  switch (matchKind) {
    case "exact_source":
      return "Exact source match";
    case "exact_notice":
      return "Exact notice match";
    case "strong_candidate":
      return "Strong duplicate";
    case "possible_candidate":
      return "Possible duplicate";
    default:
      return "Candidate";
  }
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));
}

function formatRelativeDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function SummaryCard({
  label,
  supportingText,
  value,
}: {
  label: string;
  supportingText: string;
  value: string;
}) {
  return (
    <Surface sx={{ bgcolor: "background.paper", px: 2, py: 2 }}>
      <p className="text-muted text-xs tracking-[0.2em] uppercase">{label}</p>
      <p className="text-foreground mt-2 font-semibold">{value}</p>
      <p className="text-muted mt-1 leading-6">{supportingText}</p>
    </Surface>
  );
}
