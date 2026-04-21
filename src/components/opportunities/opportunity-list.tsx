import type { ReactNode } from "react";
import Link from "next/link";

import {
  ActiveFilterChipBar,
  type ActiveFilterChip,
} from "@/components/ui/active-filter-chip-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableDensity,
} from "@/components/ui/data-table";
import { DensityToggle } from "@/components/ui/density-toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
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
import type {
  OpportunityListDueWindow,
  OpportunityListItemSummary,
  OpportunityListQuery,
  OpportunityListSavedViewKey,
  OpportunityListSnapshot,
} from "@/modules/opportunities/opportunity.types";

export type OpportunityListViewState = {
  density: DataTableDensity;
  previewOpportunityId: string | null;
};

type OpportunityListProps = {
  snapshot: OpportunityListSnapshot | null;
  viewState: OpportunityListViewState;
};

export function OpportunityList({ snapshot, viewState }: OpportunityListProps) {
  if (!snapshot) {
    return (
      <section className="space-y-4">
        <p className="text-muted text-sm tracking-[0.26em] uppercase">
          Opportunities
        </p>
        <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
          Opportunity pipeline
        </h1>
        <ErrorState
          message="The opportunities list could not load an organization-scoped snapshot. Re-seed the local database or verify the authenticated user still belongs to the default workspace."
          title="Opportunity data is unavailable"
        />
      </section>
    );
  }

  const showingFrom =
    snapshot.totalCount === 0
      ? 0
      : (snapshot.query.page - 1) * snapshot.query.pageSize + 1;
  const showingTo =
    snapshot.totalCount === 0
      ? 0
      : showingFrom + snapshot.pageResultCount - 1;
  const selectedOpportunity =
    snapshot.results.find(
      (opportunity) => opportunity.id === viewState.previewOpportunityId,
    ) ??
    snapshot.results[0] ??
    null;
  const activeSavedView = resolveActiveSavedView(snapshot);
  const activeFilterChips = buildActiveFilterChips(snapshot.query, viewState);
  const savedViewItems = buildSavedViewItems(snapshot, viewState);
  const densityOptions = buildDensityOptions(snapshot.query, viewState);
  const sortOptions = buildSortOptions(snapshot.query, viewState);
  const resetHref = buildOpportunityListHref(snapshot.query, viewState, {
    agencyId: null,
    dueWindow: "all",
    naicsCode: null,
    page: 1,
    previewOpportunityId: null,
    query: null,
    savedViewKey: null,
    sort: "updated_desc",
    sourceSystem: null,
    stageKey: null,
  });

  return (
    <section className="space-y-6">
      <Surface
        component="header"
        sx={{ bgcolor: "background.paper", px: { xs: 3, sm: 4 }, py: 3 }}
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Opportunities</Badge>
              <Badge tone="muted">List-detail workspace</Badge>
              <Badge tone="accent">Preview-first</Badge>
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
                Opportunity pipeline
              </h1>
              <p className="text-muted max-w-3xl text-sm leading-7">
                Work the pursuit queue from one operational surface: move
                between named views, refine the list with a filter rail, and
                keep the current pursuit brief visible while deciding whether to
                open the full workspace.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 xl:items-end">
            <Button href="/opportunities/new">
              Create tracked opportunity
            </Button>
            <p className="text-right text-sm text-muted">
              Organization workspace:{" "}
              <span className="font-medium text-foreground">
                {snapshot.organization.name}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Saved view"
            value={activeSavedView?.label ?? "Custom queue"}
            supportingText={
              activeSavedView
                ? `${activeSavedView.count} pursuits in this named view`
                : `${snapshot.totalCount} pursuits in the current scan`
            }
          />
          <SummaryCard
            label="Results"
            value={`${showingFrom}-${showingTo}`}
            supportingText={`Showing ${snapshot.totalCount} total matches`}
          />
          <SummaryCard
            label="Active filters"
            value={String(snapshot.availableFilterCount)}
            supportingText={
              snapshot.availableFilterCount > 0
                ? "Manual filters layered on the queue"
                : "No extra narrowing beyond the selected view"
            }
          />
          <SummaryCard
            label="Preview"
            value={selectedOpportunity ? "Ready" : "Table first"}
            supportingText={
              selectedOpportunity
                ? "One pursuit brief stays visible beside the list"
                : "Select a row to restore the side brief"
            }
          />
        </div>

        <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <SavedViewControls
            items={savedViewItems}
            label="Saved views"
          />
          <DensityToggle label="Row density" options={densityOptions} />
        </div>
      </Surface>

      <Surface
        component="details"
        sx={{ display: { xl: "none" }, px: 2.5, py: 2 }}
      >
        <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
          Open filters and sort
        </summary>
        <div className="mt-4">
          <OpportunityFilterRail
            idPrefix="mobile"
            query={snapshot.query}
            resetHref={resetHref}
            snapshot={snapshot}
            viewState={viewState}
          />
        </div>
      </Surface>

      <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_24rem]">
        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <OpportunityFilterRail
              idPrefix="desktop"
              query={snapshot.query}
              resetHref={resetHref}
              snapshot={snapshot}
              viewState={viewState}
            />
          </div>
        </aside>

        <section className="space-y-4">
          <Surface component="section" sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-muted text-xs tracking-[0.24em] uppercase">
                    Result queue
                  </p>
                  <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
                    Showing {showingFrom}-{showingTo} of {snapshot.totalCount} pursuits
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    Sticky headers keep scan context intact while the side brief
                    stays locked on the currently selected pursuit.
                  </p>
                </div>

                <div className="space-y-2 lg:text-right">
                  <p className="text-muted text-xs tracking-[0.2em] uppercase">
                    Server-backed sort
                  </p>
                  <div
                    aria-label="Server-backed sort options"
                    className="flex flex-wrap gap-2 lg:justify-end"
                  >
                    {sortOptions.map((option) => (
                      <Button
                        aria-current={option.active ? "page" : undefined}
                        href={option.href}
                        key={option.label}
                        density="compact"
                        tone={option.active ? "primary" : "neutral"}
                        variant={option.active ? "soft" : "outlined"}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <ActiveFilterChipBar
                chips={activeFilterChips}
                clearHref={resetHref}
                emptyLabel="No active chips beyond the selected saved view."
              />
            </div>
          </Surface>

          <DataTable
            ariaLabel="Opportunity pipeline results"
            caption="Opportunity results with deadline, source, stage, and score details."
            columns={[
              {
                key: "opportunity",
                header: buildSortHeader({
                  label: "Opportunity",
                  query: snapshot.query,
                  sort: "title_asc",
                  viewState,
                }),
                className: "min-w-[20rem]",
                sortDirection:
                  snapshot.query.sort === "title_asc" ? "asc" : null,
                cell: (opportunity) => (
                  <OpportunityCell
                    opportunity={opportunity}
                    previewHref={buildOpportunityListHref(
                      snapshot.query,
                      viewState,
                      {
                        page: snapshot.query.page,
                        previewOpportunityId: opportunity.id,
                      },
                    )}
                  />
                ),
              },
              {
                key: "deadline",
                header: buildSortHeader({
                  label: "Deadline",
                  query: snapshot.query,
                  sort: "deadline_asc",
                  viewState,
                }),
                className: "min-w-[9rem]",
                sortDirection:
                  snapshot.query.sort === "deadline_asc"
                    ? "asc"
                    : snapshot.query.sort === "deadline_desc"
                      ? "desc"
                      : null,
                cell: (opportunity) => (
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">
                      {opportunity.responseDeadlineAt
                        ? formatShortDate(opportunity.responseDeadlineAt)
                        : "Not set"}
                    </p>
                    <Badge tone={getDueBadgeTone(opportunity.responseDeadlineAt)}>
                      {getDueLabel(opportunity.responseDeadlineAt)}
                    </Badge>
                  </div>
                ),
              },
              {
                key: "stage",
                header: buildSortHeader({
                  label: "Stage",
                  query: snapshot.query,
                  sort: "stage_asc",
                  viewState,
                }),
                className: "min-w-[10rem]",
                sortDirection:
                  snapshot.query.sort === "stage_asc" ? "asc" : null,
                cell: (opportunity) => (
                  <div className="space-y-2">
                    <Badge tone="muted">{opportunity.currentStageLabel}</Badge>
                    <p className="text-xs text-muted">
                      Updated {formatShortDate(opportunity.updatedAt)}
                    </p>
                  </div>
                ),
              },
              {
                key: "source",
                header: "Source",
                className: "min-w-[10rem]",
                cell: (opportunity) => (
                  <div className="space-y-2">
                    <Badge tone="warning">{opportunity.sourceDisplayLabel}</Badge>
                    <p className="text-xs text-muted">
                      {opportunity.leadAgency?.organizationCode ?? "No agency code"}
                    </p>
                  </div>
                ),
              },
              {
                key: "score",
                header: "Score",
                className: "min-w-[10rem]",
                cell: (opportunity) => (
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">
                      {opportunity.score?.totalScore
                        ? `${opportunity.score.totalScore}/100`
                        : "Unscored"}
                    </p>
                    <Badge tone="accent">
                      {opportunity.bidDecision?.finalOutcome ??
                        opportunity.score?.recommendationOutcome ??
                        "Pending"}
                    </Badge>
                  </div>
                ),
              },
            ]}
            density={viewState.density}
            emptyState={
              <EmptyState
                action={
                  <Button density="compact" href={resetHref}>
                    Reset to all opportunities
                  </Button>
                }
                message="Adjust the current filters or return to the default saved view to restore the tracked pipeline."
                title="No opportunities match this filter set"
              />
            }
            getRowKey={(opportunity) => opportunity.id}
            rows={snapshot.results}
            selectedRowId={selectedOpportunity?.id ?? null}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Page {snapshot.query.page} of {snapshot.pageCount}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <PaginationLink
                disabled={snapshot.query.page <= 1}
                href={buildOpportunityListHref(snapshot.query, viewState, {
                  page: snapshot.query.page - 1,
                  previewOpportunityId: null,
                })}
              >
                Previous
              </PaginationLink>

              {Array.from(
                { length: snapshot.pageCount },
                (_, index) => index + 1,
              ).map((pageNumber) => (
                <PaginationLink
                  active={pageNumber === snapshot.query.page}
                  href={buildOpportunityListHref(snapshot.query, viewState, {
                    page: pageNumber,
                    previewOpportunityId: null,
                  })}
                  key={pageNumber}
                >
                  {String(pageNumber)}
                </PaginationLink>
              ))}

              <PaginationLink
                disabled={snapshot.query.page >= snapshot.pageCount}
                href={buildOpportunityListHref(snapshot.query, viewState, {
                  page: snapshot.query.page + 1,
                  previewOpportunityId: null,
                })}
              >
                Next
              </PaginationLink>
            </div>
          </div>
        </section>

        {selectedOpportunity ? (
          <PreviewPanel
            actions={
              <>
                <Button
                  density="compact"
                  href={`/opportunities/${selectedOpportunity.id}`}
                >
                  Open workspace
                </Button>
                <Button
                  density="compact"
                  href={`/opportunities/${selectedOpportunity.id}/edit`}
                  tone="neutral"
                  variant="outlined"
                >
                  Edit record
                </Button>
              </>
            }
            className="xl:sticky xl:top-24"
            description={
              selectedOpportunity.sourceSummaryText ??
              "Open the workspace for scoring, stage movement, tasks, and documents."
            }
            eyebrow="Selected pursuit"
            metadata={buildPreviewMetadata(selectedOpportunity)}
            title={selectedOpportunity.title}
          >
            <section className="space-y-3">
              <h3 className="text-sm font-semibold tracking-[0.02em] text-foreground">
                Capture brief
              </h3>
              <ul className="space-y-2 text-sm text-muted">
                <li>
                  Recommendation:{" "}
                  <span className="font-medium text-foreground">
                    {selectedOpportunity.bidDecision?.finalOutcome ??
                      selectedOpportunity.score?.recommendationOutcome ??
                      "Pending review"}
                  </span>
                </li>
                <li>
                  Vehicles:{" "}
                  <span className="font-medium text-foreground">
                    {selectedOpportunity.vehicles.length > 0
                      ? selectedOpportunity.vehicles
                          .map((vehicle) => vehicle.code)
                          .join(", ")
                      : "No vehicle recorded"}
                  </span>
                </li>
                <li>
                  Open work:{" "}
                  <span className="font-medium text-foreground">
                    {selectedOpportunity.tasks.length} tasks and{" "}
                    {selectedOpportunity.milestones.length} milestones
                  </span>
                </li>
              </ul>
            </section>
          </PreviewPanel>
        ) : null}
      </div>
    </section>
  );
}

function OpportunityFilterRail({
  idPrefix,
  query,
  resetHref,
  snapshot,
  viewState,
}: {
  idPrefix: string;
  query: OpportunityListQuery;
  resetHref: string;
  snapshot: OpportunityListSnapshot;
  viewState: OpportunityListViewState;
}) {
  return (
    <Surface component="section" sx={{ px: 2.5, py: 2.5 }}>
      <div className="space-y-2">
        <p className="text-muted text-xs tracking-[0.22em] uppercase">
          Filter rail
        </p>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.03em] text-foreground">
          Refine the queue
        </h2>
        <p className="text-sm leading-6 text-muted">
          Narrow the current saved view by agency, stage, source, due window,
          and query terms. The resulting queue stays fully shareable in the URL.
        </p>
      </div>

      <form action="/opportunities" className="mt-5 space-y-4">
        <input name="density" type="hidden" value={viewState.density} />
        {query.savedViewKey && query.savedViewKey !== "all" ? (
          <input name="view" type="hidden" value={query.savedViewKey} />
        ) : null}

        <FormField
          hint="Matches title, solicitation number, agency name, and summary text."
          htmlFor={`${idPrefix}-opportunity-query`}
          label="Search"
        >
          <Input
            defaultValue={query.query ?? ""}
            id={`${idPrefix}-opportunity-query`}
            name="q"
            placeholder="Search pursuits"
            type="search"
          />
        </FormField>

        <FormField
          hint="Use NAICS codes now; capability tags are planned later in the PRD."
          htmlFor={`${idPrefix}-opportunity-naics`}
          label="NAICS"
        >
          <Input
            defaultValue={query.naicsCode ?? ""}
            id={`${idPrefix}-opportunity-naics`}
            name="naics"
            placeholder="541512"
          />
        </FormField>

        <FormField htmlFor={`${idPrefix}-opportunity-agency`} label="Agency">
          <Select
            defaultValue={query.agencyId ?? ""}
            id={`${idPrefix}-opportunity-agency`}
            name="agency"
          >
            <option value="">All agencies</option>
            {snapshot.filterOptions.agencies.map((agency) => (
              <option key={agency.value} value={agency.value}>
                {agency.label} ({agency.count})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField htmlFor={`${idPrefix}-opportunity-stage`} label="Stage">
          <Select
            defaultValue={query.stageKey ?? ""}
            id={`${idPrefix}-opportunity-stage`}
            name="stage"
          >
            <option value="">All stages</option>
            {snapshot.filterOptions.stages.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.label} ({stage.count})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField htmlFor={`${idPrefix}-opportunity-source`} label="Source">
          <Select
            defaultValue={query.sourceSystem ?? ""}
            id={`${idPrefix}-opportunity-source`}
            name="source"
          >
            <option value="">All sources</option>
            {snapshot.filterOptions.sources.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label} ({source.count})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField htmlFor={`${idPrefix}-opportunity-due`} label="Due date">
          <Select
            defaultValue={query.dueWindow}
            id={`${idPrefix}-opportunity-due`}
            name="due"
          >
            {snapshot.filterOptions.dueWindows.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField htmlFor={`${idPrefix}-opportunity-sort`} label="Sort">
          <Select
            defaultValue={query.sort}
            id={`${idPrefix}-opportunity-sort`}
            name="sort"
          >
            {snapshot.filterOptions.sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="flex flex-col gap-3">
          <Button type="submit">
            Apply filters
          </Button>
          <Button
            density="compact"
            href={resetHref}
            tone="neutral"
            variant="outlined"
          >
            Reset to all opportunities
          </Button>
        </div>
      </form>
    </Surface>
  );
}

function OpportunityCell({
  opportunity,
  previewHref,
}: {
  opportunity: OpportunityListItemSummary;
  previewHref: string;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {opportunity.title}
        </h3>
        <p className="text-sm text-muted">
          {opportunity.leadAgency?.name ?? "No lead agency assigned"}
          {opportunity.solicitationNumber
            ? ` · Solicitation ${opportunity.solicitationNumber}`
            : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {opportunity.naicsCode ? (
          <Badge tone="muted">NAICS {opportunity.naicsCode}</Badge>
        ) : null}
        {opportunity.vehicles.slice(0, 1).map((vehicle) => (
          <Badge key={vehicle.id} tone="muted">
            {vehicle.code}
          </Badge>
        ))}
        {opportunity.tasks.length > 0 ? (
          <Badge tone="muted">{opportunity.tasks.length} active tasks</Badge>
        ) : null}
      </div>

      {opportunity.sourceSummaryText ? (
        <p className="text-sm leading-6 text-muted">{opportunity.sourceSummaryText}</p>
      ) : null}

      <div className="flex flex-wrap gap-4">
        <Button density="compact" href={previewHref} variant="text">
          Open brief
        </Button>
        <Button
          density="compact"
          href={`/opportunities/${opportunity.id}`}
          variant="text"
        >
          Open workspace
        </Button>
        <Button
          density="compact"
          href={`/opportunities/${opportunity.id}/edit`}
          variant="text"
        >
          Edit opportunity
        </Button>
      </div>
    </div>
  );
}

function PaginationLink({
  active = false,
  children,
  disabled = false,
  href,
}: {
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  href: string;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex min-w-11 items-center justify-center rounded-full border border-border bg-[rgba(15,28,31,0.04)] px-4 py-2 text-sm text-muted"
      >
        {children}
      </span>
    );
  }

  return (
    <Button
      href={href}
      sx={{ minWidth: 44 }}
      tone={active ? "primary" : "neutral"}
      variant={active ? "solid" : "outlined"}
    >
      {children}
    </Button>
  );
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
    <Surface component="article" sx={{ px: 2, py: 2 }} className="text-sm">
      <p className="text-muted text-xs tracking-[0.2em] uppercase">{label}</p>
      <p className="mt-2 font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-muted">{supportingText}</p>
    </Surface>
  );
}

function buildActiveFilterChips(
  query: OpportunityListQuery,
  viewState: OpportunityListViewState,
) {
  const chips: ActiveFilterChip[] = [];

  if (query.savedViewKey && query.savedViewKey !== "all") {
    chips.push({
      href: buildOpportunityListHref(query, viewState, {
        agencyId: null,
        dueWindow: "all",
        naicsCode: null,
        page: 1,
        previewOpportunityId: null,
        query: null,
        savedViewKey: null,
        sort: "updated_desc",
        sourceSystem: null,
        stageKey: null,
      }),
      label: `View · ${getSavedViewLabel(query.savedViewKey)}`,
    });
  }

  if (query.query) {
    chips.push({
      href: buildOpportunityListHref(query, viewState, {
        page: 1,
        previewOpportunityId: null,
        query: null,
      }),
      label: `Search · ${query.query}`,
    });
  }

  if (query.naicsCode) {
    chips.push({
      href: buildOpportunityListHref(query, viewState, {
        naicsCode: null,
        page: 1,
        previewOpportunityId: null,
      }),
      label: `NAICS · ${query.naicsCode}`,
    });
  }

  if (query.agencyId) {
    chips.push({
      href: buildOpportunityListHref(query, viewState, {
        agencyId: null,
        page: 1,
        previewOpportunityId: null,
      }),
      label: "Agency filter",
    });
  }

  if (query.stageKey) {
    chips.push({
      href: buildOpportunityListHref(query, viewState, {
        page: 1,
        previewOpportunityId: null,
        stageKey: null,
      }),
      label: `Stage · ${humanizeQueryValue(query.stageKey)}`,
    });
  }

  if (query.sourceSystem) {
    chips.push({
      href: buildOpportunityListHref(query, viewState, {
        page: 1,
        previewOpportunityId: null,
        sourceSystem: null,
      }),
      label: `Source · ${humanizeQueryValue(query.sourceSystem)}`,
    });
  }

  if (query.dueWindow !== "all") {
    chips.push({
      href: buildOpportunityListHref(query, viewState, {
        dueWindow: "all",
        page: 1,
        previewOpportunityId: null,
      }),
      label: `Due · ${humanizeDueWindow(query.dueWindow)}`,
    });
  }

  if (query.sort !== "updated_desc") {
    chips.push({
      href: buildOpportunityListHref(query, viewState, {
        page: 1,
        previewOpportunityId: null,
        sort: "updated_desc",
      }),
      label: `Sort · ${humanizeQueryValue(query.sort)}`,
    });
  }

  return chips;
}

function buildOpportunityListHref(
  query: OpportunityListQuery,
  viewState: OpportunityListViewState,
  overrides: Partial<OpportunityListQuery> & {
    density?: DataTableDensity;
    previewOpportunityId?: string | null;
  },
) {
  const nextQuery = {
    ...query,
    ...overrides,
  };
  const nextDensity = overrides.density ?? viewState.density;
  const nextPreviewOpportunityId =
    "previewOpportunityId" in overrides
      ? (overrides.previewOpportunityId ?? null)
      : viewState.previewOpportunityId;
  const params = new URLSearchParams();

  if (nextQuery.savedViewKey && nextQuery.savedViewKey !== "all") {
    params.set("view", nextQuery.savedViewKey);
  }

  if (nextQuery.query) {
    params.set("q", nextQuery.query);
  }

  if (nextQuery.naicsCode) {
    params.set("naics", nextQuery.naicsCode);
  }

  if (nextQuery.agencyId) {
    params.set("agency", nextQuery.agencyId);
  }

  if (nextQuery.stageKey) {
    params.set("stage", nextQuery.stageKey);
  }

  if (nextQuery.sourceSystem) {
    params.set("source", nextQuery.sourceSystem);
  }

  if (nextQuery.dueWindow !== "all") {
    params.set("due", nextQuery.dueWindow);
  }

  if (nextQuery.sort !== "updated_desc") {
    params.set("sort", nextQuery.sort);
  }

  if (nextQuery.page > 1) {
    params.set("page", String(nextQuery.page));
  }

  if (nextDensity !== "comfortable") {
    params.set("density", nextDensity);
  }

  if (nextPreviewOpportunityId) {
    params.set("preview", nextPreviewOpportunityId);
  }

  const queryString = params.toString();
  return queryString.length > 0
    ? `/opportunities?${queryString}`
    : "/opportunities";
}

function buildSavedViewItems(
  snapshot: OpportunityListSnapshot,
  viewState: OpportunityListViewState,
) {
  const activeSavedViewKey = resolveActiveSavedViewKey(snapshot.query);

  return snapshot.savedViews.map(
    (savedView): SavedViewControlItem => ({
      active: savedView.key === activeSavedViewKey,
      href: buildOpportunityListHref(snapshot.query, viewState, {
        ...buildPresetQuery(snapshot.query, savedView.key),
        previewOpportunityId: null,
      }),
      label: savedView.label,
      supportingText: `${savedView.count} · ${savedView.supportingText}`,
    }),
  );
}

function buildDensityOptions(
  query: OpportunityListQuery,
  viewState: OpportunityListViewState,
) {
  return [
    {
      active: viewState.density === "compact",
      href: buildOpportunityListHref(query, viewState, {
        density: "compact",
      }),
      label: "Compact",
    },
    {
      active: viewState.density === "comfortable",
      href: buildOpportunityListHref(query, viewState, {
        density: "comfortable",
      }),
      label: "Comfortable",
    },
  ];
}

function buildSortOptions(
  query: OpportunityListQuery,
  viewState: OpportunityListViewState,
) {
  return [
    {
      active: query.sort === "updated_desc",
      href: buildOpportunityListHref(query, viewState, {
        page: 1,
        previewOpportunityId: null,
        sort: "updated_desc",
      }),
      label: "Recently updated",
    },
    {
      active: query.sort === "deadline_asc",
      href: buildOpportunityListHref(query, viewState, {
        page: 1,
        previewOpportunityId: null,
        sort: "deadline_asc",
      }),
      label: "Soonest deadline",
    },
    {
      active: query.sort === "stage_asc",
      href: buildOpportunityListHref(query, viewState, {
        page: 1,
        previewOpportunityId: null,
        sort: "stage_asc",
      }),
      label: "Stage",
    },
  ];
}

function buildSortHeader({
  label,
  query,
  sort,
  viewState,
}: {
  label: string;
  query: OpportunityListQuery;
  sort: OpportunityListQuery["sort"];
  viewState: OpportunityListViewState;
}) {
  return (
    <Link
      className="underline-offset-4 hover:underline"
      href={buildOpportunityListHref(query, viewState, {
        page: 1,
        previewOpportunityId: null,
        sort,
      })}
    >
      {label}
    </Link>
  );
}

function buildPreviewMetadata(
  opportunity: OpportunityListItemSummary,
): PreviewPanelMetadataItem[] {
  return [
    {
      label: "Stage",
      value: opportunity.currentStageLabel,
    },
    {
      label: "Deadline",
      value: opportunity.responseDeadlineAt
        ? formatShortDate(opportunity.responseDeadlineAt)
        : "Not set",
    },
    {
      label: "Source",
      value: opportunity.sourceDisplayLabel,
    },
    {
      label: "Lead agency",
      value: opportunity.leadAgency?.name ?? "No agency assigned",
    },
  ];
}

function buildPresetQuery(
  query: OpportunityListQuery,
  savedViewKey: OpportunityListSavedViewKey,
): OpportunityListQuery {
  const baseQuery: OpportunityListQuery = {
    savedViewKey,
    agencyId: null,
    dueWindow: "all",
    naicsCode: null,
    page: 1,
    pageSize: query.pageSize,
    query: null,
    sort: "updated_desc",
    sourceSystem: null,
    stageKey: null,
  };

  switch (savedViewKey) {
    case "due_soon":
      return {
        ...baseQuery,
        dueWindow: "next_30_days",
        sort: "deadline_asc",
      };
    case "qualified":
      return {
        ...baseQuery,
        stageKey: "qualified",
      };
    case "proposal_sprint":
      return {
        ...baseQuery,
        stageKey: "proposal_in_development",
        sort: "deadline_asc",
      };
    case "all":
    default:
      return baseQuery;
  }
}

function resolveActiveSavedView(snapshot: OpportunityListSnapshot) {
  const activeSavedViewKey = resolveActiveSavedViewKey(snapshot.query);

  return (
    snapshot.savedViews.find((savedView) => savedView.key === activeSavedViewKey) ??
    null
  );
}

function resolveActiveSavedViewKey(query: OpportunityListQuery) {
  if (query.savedViewKey) {
    return query.savedViewKey;
  }

  const candidateKeys: OpportunityListSavedViewKey[] = [
    "all",
    "due_soon",
    "qualified",
    "proposal_sprint",
  ];

  return (
    candidateKeys.find((savedViewKey) =>
      queryMatchesPreset(query, savedViewKey),
    ) ?? null
  );
}

function queryMatchesPreset(
  query: OpportunityListQuery,
  savedViewKey: OpportunityListSavedViewKey,
) {
  const presetQuery = buildPresetQuery(query, savedViewKey);

  return (
    query.query === presetQuery.query &&
    query.agencyId === presetQuery.agencyId &&
    query.naicsCode === presetQuery.naicsCode &&
    query.stageKey === presetQuery.stageKey &&
    query.sourceSystem === presetQuery.sourceSystem &&
    query.dueWindow === presetQuery.dueWindow &&
    query.sort === presetQuery.sort
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getDueBadgeTone(responseDeadlineAt: string | null) {
  if (!responseDeadlineAt) {
    return "muted" as const;
  }

  return new Date(responseDeadlineAt) < new Date() ? "danger" : "accent";
}

function getDueLabel(responseDeadlineAt: string | null) {
  if (!responseDeadlineAt) {
    return "No deadline";
  }

  return new Date(responseDeadlineAt) < new Date() ? "Overdue" : "Scheduled";
}

function getSavedViewLabel(savedViewKey: OpportunityListSavedViewKey) {
  switch (savedViewKey) {
    case "due_soon":
      return "Due soon";
    case "qualified":
      return "Qualified review";
    case "proposal_sprint":
      return "Proposal sprint";
    case "all":
    default:
      return "All pursuits";
  }
}

function humanizeDueWindow(dueWindow: OpportunityListDueWindow) {
  switch (dueWindow) {
    case "next_30_days":
      return "Next 30 days";
    case "next_60_days":
      return "Next 60 days";
    case "no_deadline":
      return "No deadline";
    case "overdue":
      return "Overdue";
    case "all":
    default:
      return "All deadlines";
  }
}

function humanizeQueryValue(value: string) {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}
