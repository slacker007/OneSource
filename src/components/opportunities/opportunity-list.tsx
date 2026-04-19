import type { ReactNode } from "react";
import Link from "next/link";

import {
  ActiveFilterChipBar,
  type ActiveFilterChip,
} from "@/components/ui/active-filter-chip-bar";
import { Badge } from "@/components/ui/badge";
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
import type {
  OpportunityListDueWindow,
  OpportunityListItemSummary,
  OpportunityListQuery,
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
  const activeFilterChips = buildActiveFilterChips(snapshot.query, viewState);
  const savedViewItems = buildSavedViewItems(snapshot.query, viewState);
  const densityOptions = buildDensityOptions(snapshot.query, viewState);

  return (
    <section className="space-y-6">
      <header className="border-border bg-surface rounded-[28px] border px-6 py-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Opportunities</Badge>
              <Badge tone="muted">Pipeline triage</Badge>
              <Badge tone="accent">Preview-ready</Badge>
            </div>
            <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
              Opportunity pipeline
            </h1>
            <p className="text-muted max-w-3xl text-sm leading-7">
              Scan active pursuits, pivot between standard views, and open a
              quick brief without leaving the working list. Filters stay in the
              URL so the current queue can still be shared and revisited.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)]"
              href="/opportunities/new"
            >
              Create tracked opportunity
            </Link>

            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryCard
                label="Results"
                value={String(snapshot.totalCount)}
                supportingText={`${showingFrom}-${showingTo} on this page`}
              />
              <SummaryCard
                label="Active filters"
                value={String(snapshot.availableFilterCount)}
                supportingText={
                  snapshot.availableFilterCount > 0
                    ? "Focused on a narrowed queue"
                    : "Showing the standard workspace view"
                }
              />
              <SummaryCard
                label="Workspace"
                value={snapshot.organization.name}
                supportingText={`Page ${snapshot.query.page} of ${snapshot.pageCount}`}
              />
            </div>
          </div>
        </div>
      </header>

      <section className="border-border bg-surface rounded-[32px] border px-6 py-6 shadow-[0_20px_60px_rgba(20,37,34,0.08)] sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-10">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-muted text-xs tracking-[0.24em] uppercase">
                Queue controls
              </p>
              <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
                Move between focused pursuit views
              </h2>
              <p className="text-muted max-w-2xl text-sm leading-6">
                Start from standard pipeline views, then narrow by agency,
                stage, deadline, or NAICS without losing your place in the
                current scan.
              </p>
            </div>

            <SavedViewControls items={savedViewItems} label="Standard views" />
          </div>

          <DensityToggle options={densityOptions} />
        </div>

        <form action="/opportunities" className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <input name="density" type="hidden" value={viewState.density} />

          <FormField
            hint="Matches title, solicitation number, agency name, and summary text."
            htmlFor="opportunity-query"
            label="Search"
          >
            <Input
              defaultValue={snapshot.query.query ?? ""}
              id="opportunity-query"
              name="q"
              placeholder="Search pursuits"
              type="search"
            />
          </FormField>

          <FormField
            hint="Use NAICS codes now; capability tags are planned later in the PRD."
            htmlFor="opportunity-naics"
            label="NAICS"
          >
            <Input
              defaultValue={snapshot.query.naicsCode ?? ""}
              id="opportunity-naics"
              name="naics"
              placeholder="541512"
            />
          </FormField>

          <FormField htmlFor="opportunity-agency" label="Agency">
            <Select
              defaultValue={snapshot.query.agencyId ?? ""}
              id="opportunity-agency"
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

          <FormField htmlFor="opportunity-stage" label="Stage">
            <Select
              defaultValue={snapshot.query.stageKey ?? ""}
              id="opportunity-stage"
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

          <FormField htmlFor="opportunity-source" label="Source">
            <Select
              defaultValue={snapshot.query.sourceSystem ?? ""}
              id="opportunity-source"
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

          <FormField htmlFor="opportunity-due" label="Due date">
            <Select
              defaultValue={snapshot.query.dueWindow}
              id="opportunity-due"
              name="due"
            >
              {snapshot.filterOptions.dueWindows.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField htmlFor="opportunity-sort" label="Sort">
            <Select
              defaultValue={snapshot.query.sort}
              id="opportunity-sort"
              name="sort"
            >
              {snapshot.filterOptions.sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="flex items-end">
            <button
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)]"
              type="submit"
            >
              Apply filters
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <ActiveFilterChipBar
            chips={activeFilterChips}
            clearHref={buildOpportunityListHref(snapshot.query, viewState, {
              agencyId: null,
              dueWindow: "all",
              naicsCode: null,
              page: 1,
              previewOpportunityId: null,
              query: null,
              sort: "updated_desc",
              sourceSystem: null,
              stageKey: null,
            })}
            emptyLabel="No filters applied. Showing the standard pipeline queue."
          />

          <Link
            className="text-sm font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
            href={buildOpportunityListHref(snapshot.query, viewState, {
              agencyId: null,
              dueWindow: "all",
              naicsCode: null,
              page: 1,
              previewOpportunityId: null,
              query: null,
              sort: "updated_desc",
              sourceSystem: null,
              stageKey: null,
            })}
          >
            Reset filters
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Results
            </p>
            <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Showing {showingFrom}-{showingTo} of {snapshot.totalCount} pursuits
            </h2>
          </div>

          <p className="text-sm text-muted">
            {viewState.density === "compact"
              ? "Compact density for faster scan speed"
              : "Comfortable density for longer briefs"}
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-4">
            <DataTable
              ariaLabel="Opportunity pipeline results"
              caption="Opportunity results with stage, deadline, source, and score details."
              columns={[
                {
                  key: "opportunity",
                  header: "Opportunity",
                  className: "min-w-[22rem]",
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
                  key: "stage",
                  header: "Stage",
                  className: "min-w-[10rem]",
                  sortDirection:
                    snapshot.query.sort === "stage_asc" ? "asc" : null,
                  cell: (opportunity) => (
                    <div className="space-y-2">
                      <Badge tone="muted">{opportunity.currentStageLabel}</Badge>
                      <p className="text-muted text-xs">
                        Updated {formatShortDate(opportunity.updatedAt)}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "deadline",
                  header: "Deadline",
                  className: "min-w-[10rem]",
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
                  key: "source",
                  header: "Source",
                  className: "min-w-[10rem]",
                  cell: (opportunity) => (
                    <div className="space-y-2">
                      <Badge tone="warning">{opportunity.sourceDisplayLabel}</Badge>
                      <p className="text-muted text-xs">
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
                    <Link
                      className="inline-flex rounded-full bg-[rgb(19,78,68)] px-4 py-2 text-sm font-medium text-white"
                      href={buildOpportunityListHref(snapshot.query, viewState, {
                        agencyId: null,
                        dueWindow: "all",
                        naicsCode: null,
                        page: 1,
                        previewOpportunityId: null,
                        query: null,
                        sort: "updated_desc",
                        sourceSystem: null,
                        stageKey: null,
                      })}
                    >
                      Reset to all opportunities
                    </Link>
                  }
                  message="Adjust the current filters or clear the query string to restore the full seeded pipeline."
                  title="No opportunities match this filter set"
                />
              }
              getRowKey={(opportunity) => opportunity.id}
              rows={snapshot.results}
              selectedRowId={selectedOpportunity?.id ?? null}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted text-sm">
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
          </div>

          {selectedOpportunity ? (
            <PreviewPanel
              actions={
                <>
                  <Link
                    className="inline-flex min-h-10 items-center justify-center rounded-full bg-[rgb(19,78,68)] px-4 py-2 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.2)] transition hover:bg-[rgb(16,66,57)]"
                    href={`/opportunities/${selectedOpportunity.id}`}
                  >
                    Open workspace
                  </Link>
                  <Link
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-border-strong hover:bg-surface-muted"
                    href={`/opportunities/${selectedOpportunity.id}/edit`}
                  >
                    Edit record
                  </Link>
                </>
              }
              description={
                selectedOpportunity.sourceSummaryText ??
                "Open the workspace for scoring, stage movement, tasks, and documents."
              }
              eyebrow="Preview"
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
    </section>
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
      </div>

      {opportunity.sourceSummaryText ? (
        <p className="text-sm leading-6 text-muted">{opportunity.sourceSummaryText}</p>
      ) : null}

      <div className="flex flex-wrap gap-4">
        <Link
          className="inline-flex text-sm font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
          href={previewHref}
        >
          Preview brief
        </Link>
        <Link
          className="inline-flex text-sm font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
          href={`/opportunities/${opportunity.id}`}
        >
          Open workspace
        </Link>
        <Link
          className="inline-flex text-sm font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
          href={`/opportunities/${opportunity.id}/edit`}
        >
          Edit opportunity
        </Link>
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
  const className = active
    ? "border-transparent bg-[rgb(19,78,68)] text-white"
    : "border-border bg-white text-foreground";

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
    <Link
      className={`inline-flex min-w-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${className}`}
      href={href}
    >
      {children}
    </Link>
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
    <article className="border-border rounded-[24px] border bg-white px-4 py-4 text-sm shadow-[0_12px_30px_rgba(20,37,34,0.06)]">
      <p className="text-muted text-xs tracking-[0.2em] uppercase">{label}</p>
      <p className="mt-2 font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-muted">{supportingText}</p>
    </article>
  );
}

function buildActiveFilterChips(
  query: OpportunityListQuery,
  viewState: OpportunityListViewState,
) {
  const chips: ActiveFilterChip[] = [];
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
  query: OpportunityListQuery,
  viewState: OpportunityListViewState,
) {
  const items: SavedViewControlItem[] = [
    {
      active: queryMatchesPreset(query, "all"),
      href: buildOpportunityListHref(query, viewState, {
        ...buildPresetQuery(query, "all"),
        previewOpportunityId: null,
      }),
      label: "All pursuits",
      supportingText: "Default",
    },
    {
      active: queryMatchesPreset(query, "due_soon"),
      href: buildOpportunityListHref(query, viewState, {
        ...buildPresetQuery(query, "due_soon"),
        previewOpportunityId: null,
      }),
      label: "Due soon",
      supportingText: "30 days",
    },
    {
      active: queryMatchesPreset(query, "qualified"),
      href: buildOpportunityListHref(query, viewState, {
        ...buildPresetQuery(query, "qualified"),
        previewOpportunityId: null,
      }),
      label: "Qualified",
      supportingText: "Review",
    },
  ];

  return items;
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
  preset: "all" | "due_soon" | "qualified",
): OpportunityListQuery {
  const baseQuery: OpportunityListQuery = {
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

  switch (preset) {
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
    case "all":
    default:
      return baseQuery;
  }
}

function queryMatchesPreset(
  query: OpportunityListQuery,
  preset: "all" | "due_soon" | "qualified",
) {
  const presetQuery = buildPresetQuery(query, preset);

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
