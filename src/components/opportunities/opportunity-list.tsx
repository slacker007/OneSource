import type { ReactNode } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  OpportunityListDueWindow,
  OpportunityListItemSummary,
  OpportunityListQuery,
  OpportunityListSnapshot,
} from "@/modules/opportunities/opportunity.types";

type OpportunityListProps = {
  snapshot: OpportunityListSnapshot | null;
};

export function OpportunityList({ snapshot }: OpportunityListProps) {
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

  return (
    <section className="space-y-6">
      <header className="border-border bg-surface rounded-[28px] border px-6 py-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Opportunities</Badge>
              <Badge tone="muted">URL-synced filters</Badge>
              <Badge tone="warning">Server-rendered</Badge>
            </div>
            <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
              Opportunity pipeline
            </h1>
            <p className="text-muted max-w-3xl text-sm leading-7">
              Search the canonical pursuit workspace by agency, stage, source,
              due-date window, and NAICS. Filters live in the URL so the page
              can be shared or refreshed without drifting from the current query.
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
                    ? "Applied from the URL query string"
                    : "Showing the default workspace view"
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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Filters
            </p>
            <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
              Refine the opportunity list
            </h2>
            <p className="text-muted max-w-2xl text-sm leading-6">
              Use keyword search for title, solicitation, or agency matches. The
              NAICS field is the current structured stand-in until capability
              tagging arrives in a later slice.
            </p>
          </div>

          <Link
            className="text-sm font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
            href="/opportunities"
          >
            Clear filters
          </Link>
        </div>

        <form action="/opportunities" className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
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

          {snapshot.availableFilterCount > 0 ? (
            <div className="flex flex-wrap gap-2">
              {buildActiveFilterBadges(snapshot.query).map((badge) => (
                <Badge key={badge}>{badge}</Badge>
              ))}
            </div>
          ) : null}
        </div>

        <DataTable
          ariaLabel="Opportunity pipeline results"
          columns={[
            {
              key: "opportunity",
              header: "Opportunity",
              className: "min-w-[22rem]",
              cell: (opportunity) => <OpportunityCell opportunity={opportunity} />,
            },
            {
              key: "stage",
              header: "Stage",
              className: "min-w-[10rem]",
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
          emptyState={
            <EmptyState
              action={
                <Link
                  className="inline-flex rounded-full bg-[rgb(19,78,68)] px-4 py-2 text-sm font-medium text-white"
                  href="/opportunities"
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
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted text-sm">
            Page {snapshot.query.page} of {snapshot.pageCount}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <PaginationLink
              disabled={snapshot.query.page <= 1}
              href={buildOpportunityListHref(snapshot.query, {
                page: snapshot.query.page - 1,
              })}
            >
              Previous
            </PaginationLink>

            {Array.from({ length: snapshot.pageCount }, (_, index) => index + 1).map(
              (pageNumber) => (
                <PaginationLink
                  active={pageNumber === snapshot.query.page}
                  href={buildOpportunityListHref(snapshot.query, {
                    page: pageNumber,
                  })}
                  key={pageNumber}
                >
                  {String(pageNumber)}
                </PaginationLink>
              ),
            )}

            <PaginationLink
              disabled={snapshot.query.page >= snapshot.pageCount}
              href={buildOpportunityListHref(snapshot.query, {
                page: snapshot.query.page + 1,
              })}
            >
              Next
            </PaginationLink>
          </div>
        </div>
      </section>
    </section>
  );
}

function OpportunityCell({
  opportunity,
}: {
  opportunity: OpportunityListItemSummary;
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

function buildActiveFilterBadges(query: OpportunityListQuery) {
  const badges: string[] = [];

  if (query.query) {
    badges.push(`Search: ${query.query}`);
  }

  if (query.naicsCode) {
    badges.push(`NAICS: ${query.naicsCode}`);
  }

  if (query.agencyId) {
    badges.push("Agency filter");
  }

  if (query.stageKey) {
    badges.push(`Stage: ${humanizeQueryValue(query.stageKey)}`);
  }

  if (query.sourceSystem) {
    badges.push(`Source: ${humanizeQueryValue(query.sourceSystem)}`);
  }

  if (query.dueWindow !== "all") {
    badges.push(`Due: ${humanizeDueWindow(query.dueWindow)}`);
  }

  if (query.sort !== "updated_desc") {
    badges.push(`Sort: ${humanizeQueryValue(query.sort)}`);
  }

  return badges;
}

function buildOpportunityListHref(
  query: OpportunityListQuery,
  overrides: Partial<OpportunityListQuery>,
) {
  const nextQuery = {
    ...query,
    ...overrides,
  };
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

  const queryString = params.toString();
  return queryString.length > 0
    ? `/opportunities?${queryString}`
    : "/opportunities";
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
