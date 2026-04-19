import type { ReactNode } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import type {
  BidDecisionOutcome,
  DecisionConsoleItem,
  DecisionConsoleSnapshot,
  PipelineConversionSummary,
  PipelineStageAgingSummary,
} from "@/modules/opportunities/opportunity.types";

type DecisionConsoleProps = {
  snapshot: DecisionConsoleSnapshot | null;
};

export function DecisionConsole({ snapshot }: DecisionConsoleProps) {
  if (!snapshot) {
    return (
      <section className="space-y-4">
        <p className="text-muted text-sm tracking-[0.26em] uppercase">
          Analytics
        </p>
        <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
          Decision console
        </h1>
        <ErrorState
          message="The decision-support console could not load an organization-scoped snapshot."
          title="Decision data is unavailable"
        />
      </section>
    );
  }

  const rankingLabel =
    snapshot.rankingOptions.find(
      (option) => option.value === snapshot.query.ranking,
    )?.label ?? "Value lens";
  const scopeLabel =
    snapshot.scopeOptions.find((option) => option.value === snapshot.query.scope)
      ?.label ?? "Active pipeline";
  const recommendationOnlyExamples = snapshot.rankedOpportunities.filter(
    (opportunity) =>
      opportunity.finalDecision === null &&
      opportunity.recommendationOutcome !== null,
  );
  const overrideExamples = snapshot.rankedOpportunities.filter(
    (opportunity) =>
      opportunity.finalDecision !== null &&
      opportunity.recommendationOutcome !== null &&
      opportunity.finalDecision !== opportunity.recommendationOutcome,
  );

  return (
    <section className="space-y-6">
      <header className="border-border bg-surface rounded-[28px] border px-6 py-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Analytics</Badge>
              <Badge tone="muted">{snapshot.organization.name}</Badge>
              <Badge tone="accent">{rankingLabel}</Badge>
              <Badge tone="muted">{scopeLabel}</Badge>
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
                Decision console
              </h1>
              <p className="text-muted max-w-3xl text-sm leading-7">
                Compare ranking, decision posture, score bands, funnel
                conversion, stage aging, and execution effort from one
                comparison-first workspace. The current value lens uses the
                strategic-alignment score factor until a later PRD slice adds a
                dedicated contract-value field.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-border bg-surface-muted px-5 py-4 text-sm">
            <p className="text-muted text-xs tracking-[0.2em] uppercase">
              Current ranking scope
            </p>
            <p className="text-foreground mt-3 text-lg font-semibold">
              {scopeLabel}
            </p>
            <p className="text-muted mt-2">
              {snapshot.comparedOpportunityCount} opportunities in the current
              comparison set
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Compared pursuits"
            supportingText="Current ranking set"
            value={String(snapshot.comparedOpportunityCount)}
          />
          <SummaryCard
            label="Current go calls"
            supportingText="Human final calls or active recommendations"
            value={String(snapshot.goOpportunityCount)}
          />
          <SummaryCard
            label="Urgent deadlines"
            supportingText="Due inside the next 14 days"
            value={String(snapshot.urgentOpportunityCount)}
          />
          <SummaryCard
            label="Reviewed pursuits"
            supportingText="Portfolio records with score or decision coverage"
            value={String(snapshot.decisionAnalytics.reviewedOpportunityCount)}
          />
          <SummaryCard
            label="Recommendation alignment"
            supportingText="Final decisions aligned to the latest recommendation"
            value={formatPercent(snapshot.decisionAnalytics.recommendationAlignmentPercent)}
          />
        </div>

        <div className="mt-6 rounded-[24px] border border-border bg-surface-muted px-5 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <p className="text-muted text-xs tracking-[0.22em] uppercase">
                Ranking controls
              </p>
              <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
                Re-rank the comparison set
              </h2>
              <p className="text-muted max-w-2xl text-sm leading-6">
                Keep the comparison surface dense while switching between value,
                overall score, urgency, and risk pressure.
              </p>
            </div>

            <form
              action="/analytics"
              className="grid gap-4 md:grid-cols-3 xl:min-w-[38rem]"
            >
              <FormField
                hint="Value is currently the strategic-alignment factor from the deterministic scorecard."
                htmlFor="decision-ranking"
                label="Rank by"
              >
                <Select
                  defaultValue={snapshot.query.ranking}
                  id="decision-ranking"
                  name="ranking"
                >
                  {snapshot.rankingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField htmlFor="decision-scope" label="Scope">
                <Select
                  defaultValue={snapshot.query.scope}
                  id="decision-scope"
                  name="scope"
                >
                  {snapshot.scopeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <div className="flex items-end">
                <button
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-pill)] bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[rgb(16,66,57)]"
                  type="submit"
                >
                  Apply ranking
                </button>
              </div>
            </form>
          </div>
        </div>
      </header>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.18fr)_minmax(22rem,0.82fr)]">
        <section className="space-y-4">
          <AnalyticsSection
            description="Scan the current comparison set, then drill into the workspace or the matching stage queue without leaving analytics."
            eyebrow="Ranking queue"
            title="Current pursuit comparison"
          >
            <DataTable
              ariaLabel="Decision console rankings"
              caption="Comparison-first ranking view with decision posture, pressure signals, effort indicators, and drill-through actions."
              columns={[
                {
                  key: "opportunity",
                  header: "Opportunity",
                  className: "min-w-[19rem]",
                  cell: (opportunity) => (
                    <OpportunityCell opportunity={opportunity} />
                  ),
                },
                {
                  key: "decision",
                  header: "Current call",
                  cell: (opportunity) => (
                    <DecisionCell opportunity={opportunity} />
                  ),
                },
                {
                  key: "fit",
                  header: "Fit",
                  cell: (opportunity) => (
                    <MetricValue
                      detail={`Score ${formatPercent(opportunity.scorePercent)}`}
                      value={formatPercent(opportunity.strategicValuePercent)}
                    />
                  ),
                },
                {
                  key: "pressure",
                  header: "Pressure",
                  cell: (opportunity) => (
                    <MetricValue
                      detail={`Risk ${formatPercent(opportunity.riskPressurePercent)}`}
                      value={opportunity.urgencyLabel}
                    />
                  ),
                },
                {
                  key: "effort",
                  header: "Effort",
                  cell: (opportunity) => (
                    <MetricValue
                      detail={`Tasks ${opportunity.effortTaskCount} / Milestones ${opportunity.effortMilestoneCount} / Artifacts ${opportunity.effortArtifactCount}`}
                      value={`${opportunity.effortUnits} units`}
                    />
                  ),
                },
              ]}
              emptyState={
                <EmptyState
                  message="The current ranking lens and scope did not return any opportunities."
                  title="No pursuits to compare"
                />
              }
              getRowKey={(row) => row.id}
              rows={snapshot.rankedOpportunities}
            />
          </AnalyticsSection>

          <div className="grid gap-4 xl:grid-cols-2">
            <AnalyticsSection
              description="Each score band shows current call mix plus the leading pursuits available for direct follow-up."
              eyebrow="Score distribution"
              title="Score bands"
            >
              <ScoreDistributionTable snapshot={snapshot} />
            </AnalyticsSection>

            <AnalyticsSection
              description={snapshot.decisionAnalytics.effortSignalLabel}
              eyebrow="Effort versus outcome"
              title="Effort versus outcome"
            >
              <EffortOutcomeTable snapshot={snapshot} />
            </AnalyticsSection>
          </div>
        </section>

        <aside className="space-y-4">
          <AnalyticsSection
            description="Compare final-call coverage, recommendation-only backlog, and override activity without leaving the ranking surface."
            eyebrow="Decision alignment"
            title="Decision posture"
          >
            <DecisionAlignmentPanel
              analytics={snapshot.decisionAnalytics}
              overrideExamples={overrideExamples}
              recommendationOnlyExamples={recommendationOnlyExamples}
            />
          </AnalyticsSection>

          <AnalyticsSection
            description="Pipeline conversion keeps stage-to-stage math visible and links each stage step back to the underlying queue."
            eyebrow="Funnel"
            title="Stage conversion funnel"
          >
            <FunnelTable summaries={snapshot.pipelineConversionSummaries} />
          </AnalyticsSection>

          <AnalyticsSection
            description="Active-stage dwell time highlights where pursuits are aging and lets operators jump directly to the oldest work."
            eyebrow="Stage aging"
            title="Stage aging"
          >
            <StageAgingTable summaries={snapshot.pipelineStageAgingSummaries} />
          </AnalyticsSection>
        </aside>
      </div>
    </section>
  );
}

function AnalyticsSection({
  children,
  description,
  eyebrow,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="border-border bg-surface rounded-[28px] border px-5 py-5 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-6">
      <div className="space-y-2">
        <p className="text-muted text-xs tracking-[0.22em] uppercase">
          {eyebrow}
        </p>
        <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
          {title}
        </h2>
        <p className="text-muted text-sm leading-6">{description}</p>
      </div>

      <div className="mt-5">{children}</div>
    </section>
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
    <div className="border-border bg-surface-muted rounded-[22px] border px-5 py-4">
      <p className="text-muted text-xs tracking-[0.2em] uppercase">{label}</p>
      <p className="text-foreground mt-3 text-3xl font-semibold">{value}</p>
      <p className="text-muted mt-2 text-sm leading-6">{supportingText}</p>
    </div>
  );
}

function OpportunityCell({
  opportunity,
}: {
  opportunity: DecisionConsoleItem;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Badge tone="muted">{opportunity.currentStageLabel}</Badge>
        <Badge tone="muted">{opportunity.sourceDisplayLabel}</Badge>
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {opportunity.title}
        </h3>
        <p className="text-sm text-muted">
          {opportunity.leadAgency?.name ?? "Agency not assigned"}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-muted">
        <span>
          Deadline:{" "}
          {opportunity.responseDeadlineAt
            ? formatDate(opportunity.responseDeadlineAt)
            : "Not set"}
        </span>
        <span>Updated {formatDate(opportunity.updatedAt)}</span>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          className="font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
          href={buildOpportunityHref(opportunity.id)}
        >
          Open workspace
        </Link>
        {opportunity.currentStageKey ? (
          <Link
            className="font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
            href={buildStageQueueHref(opportunity.currentStageKey)}
          >
            View stage queue
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function DecisionCell({
  opportunity,
}: {
  opportunity: DecisionConsoleItem;
}) {
  return (
    <div className="space-y-2">
      <Badge tone={decisionTone(opportunity.currentOutcome)}>
        {humanizeDecision(opportunity.currentOutcome)}
      </Badge>
      <p className="text-sm text-muted">
        {opportunity.finalDecision
          ? "Final decision recorded"
          : opportunity.recommendationOutcome
            ? "Recommendation awaiting final call"
            : "Awaiting recommendation"}
      </p>
    </div>
  );
}

function ScoreDistributionTable({
  snapshot,
}: {
  snapshot: DecisionConsoleSnapshot;
}) {
  return (
    <ComparisonTable
      ariaLabel="Score band comparison"
      headers={["Band", "Current calls", "Top pursuits"]}
      rows={snapshot.decisionAnalytics.scoreDistributionBuckets.map((bucket) => {
        const examples = snapshot.rankedOpportunities.filter((opportunity) =>
          isOpportunityInScoreBucket(opportunity, bucket.key),
        );

        return [
          <div className="space-y-1" key={`${bucket.key}-label`}>
            <p className="font-semibold text-foreground">{bucket.label}</p>
            <p className="text-sm text-muted">
              {bucket.opportunityCount}{" "}
              {bucket.opportunityCount === 1 ? "pursuit" : "pursuits"}
            </p>
          </div>,
          <p className="text-sm text-muted" key={`${bucket.key}-mix`}>
            Go {bucket.currentCallCounts.GO} / Defer{" "}
            {bucket.currentCallCounts.DEFER} / No-go{" "}
            {bucket.currentCallCounts.NO_GO}
          </p>,
          <OpportunityLinkList
            emptyLabel="No ranked pursuits in this score band."
            items={examples.slice(0, 2)}
            key={`${bucket.key}-examples`}
          />,
        ];
      })}
    />
  );
}

function EffortOutcomeTable({
  snapshot,
}: {
  snapshot: DecisionConsoleSnapshot;
}) {
  return (
    <ComparisonTable
      ariaLabel="Effort versus outcome comparison"
      headers={["Call", "Average effort", "Sample pursuits"]}
      rows={snapshot.decisionAnalytics.effortOutcomeSummaries.map((summary) => {
        const examples = snapshot.rankedOpportunities
          .filter((opportunity) => opportunity.currentOutcome === summary.outcome)
          .sort((left, right) => {
            if (right.effortUnits !== left.effortUnits) {
              return right.effortUnits - left.effortUnits;
            }

            return left.title.localeCompare(right.title);
          });

        return [
          <div className="space-y-2" key={`${summary.outcome}-label`}>
            <Badge tone={decisionTone(summary.outcome)}>{summary.label}</Badge>
            <p className="text-sm text-muted">
              {summary.opportunityCount}{" "}
              {summary.opportunityCount === 1 ? "pursuit" : "pursuits"}
            </p>
          </div>,
          <div className="space-y-1" key={`${summary.outcome}-effort`}>
            <p className="font-semibold text-foreground">
              {summary.averageEffortUnits} units
            </p>
            <p className="text-sm text-muted">
              Tasks {summary.averageTaskCount} / Milestones{" "}
              {summary.averageMilestoneCount} / Artifacts{" "}
              {summary.averageArtifactCount}
            </p>
          </div>,
          <OpportunityLinkList
            emptyLabel="No ranked pursuits currently match this call."
            items={examples.slice(0, 2)}
            key={`${summary.outcome}-examples`}
          />,
        ];
      })}
    />
  );
}

function DecisionAlignmentPanel({
  analytics,
  overrideExamples,
  recommendationOnlyExamples,
}: {
  analytics: DecisionConsoleSnapshot["decisionAnalytics"];
  overrideExamples: DecisionConsoleItem[];
  recommendationOnlyExamples: DecisionConsoleItem[];
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <DecisionMetric
          label="Finalized calls"
          supportingText="Human-recorded decisions"
          value={String(analytics.finalDecisionCount)}
        />
        <DecisionMetric
          label="Recommendation-only"
          supportingText="Needs human review"
          value={String(analytics.recommendationOnlyCount)}
        />
        <DecisionMetric
          label="Recent decision volume"
          supportingText="Final calls in the last 30 days"
          value={String(analytics.recentDecisionVolume)}
        />
        <DecisionMetric
          label="Recommendation alignment"
          supportingText="Final decision matched the recommendation"
          value={formatPercent(analytics.recommendationAlignmentPercent)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <OpportunityWatchlist
          emptyLabel="No recommendation-only pursuits are visible in the current ranking set."
          items={recommendationOnlyExamples.slice(0, 3)}
          title="Needs human call"
        />
        <OpportunityWatchlist
          emptyLabel="No recommendation overrides are visible in the current ranking set."
          items={overrideExamples.slice(0, 3)}
          title="Recorded overrides"
        />
      </div>
    </div>
  );
}

function DecisionMetric({
  label,
  supportingText,
  value,
}: {
  label: string;
  supportingText: string;
  value: string;
}) {
  return (
    <div className="border-border bg-surface-muted rounded-[20px] border px-4 py-4">
      <p className="text-muted text-[0.68rem] tracking-[0.18em] uppercase">
        {label}
      </p>
      <p className="text-foreground mt-3 text-2xl font-semibold">{value}</p>
      <p className="text-muted mt-2 text-sm leading-6">{supportingText}</p>
    </div>
  );
}

function OpportunityWatchlist({
  emptyLabel,
  items,
  title,
}: {
  emptyLabel: string;
  items: DecisionConsoleItem[];
  title: string;
}) {
  return (
    <div className="space-y-3 rounded-[22px] border border-border bg-surface-muted px-4 py-4">
      <div className="space-y-1">
        <p className="text-muted text-[0.68rem] tracking-[0.18em] uppercase">
          {title}
        </p>
        <p className="text-sm text-muted">
          Direct links keep the underlying opportunities one click away.
        </p>
      </div>

      <OpportunityLinkList emptyLabel={emptyLabel} items={items} />
    </div>
  );
}

function FunnelTable({
  summaries,
}: {
  summaries: PipelineConversionSummary[];
}) {
  return (
    <ComparisonTable
      ariaLabel="Pipeline conversion funnel"
      headers={["Stage step", "Conversion", "Drill-through"]}
      rows={summaries.map((summary) => [
        <div className="space-y-1" key={`${summary.key}-label`}>
          <p className="font-semibold text-foreground">{summary.label}</p>
          <p className="text-sm text-muted">
            {summary.numerator}/{summary.denominator}
          </p>
        </div>,
        <p className="font-semibold text-foreground" key={`${summary.key}-rate`}>
          {formatNumericPercent(summary.ratePercent)}
        </p>,
        <Link
          className="font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
          href={buildStageQueueHref(summary.numeratorStageKey)}
          key={`${summary.key}-href`}
        >
          View {humanizeStageKey(summary.numeratorStageKey)} queue
        </Link>,
      ])}
    />
  );
}

function StageAgingTable({
  summaries,
}: {
  summaries: PipelineStageAgingSummary[];
}) {
  return (
    <ComparisonTable
      ariaLabel="Stage aging comparison"
      headers={["Stage", "Current dwell", "Drill-through"]}
      rows={summaries.map((summary) => [
        <div className="space-y-1" key={`${summary.stageKey}-label`}>
          <p className="font-semibold text-foreground">{summary.stageLabel}</p>
          <p className="text-sm text-muted">
            {summary.opportunityCount}{" "}
            {summary.opportunityCount === 1 ? "pursuit" : "pursuits"}
          </p>
        </div>,
        <div className="space-y-1" key={`${summary.stageKey}-age`}>
          <p className="font-semibold text-foreground">
            Avg {formatDayCount(summary.averageAgeDays)}
          </p>
          <p className="text-sm text-muted">
            Oldest {formatDayCount(summary.oldestAgeDays)}
          </p>
        </div>,
        <div className="flex flex-col gap-2 text-sm" key={`${summary.stageKey}-links`}>
          <Link
            className="font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
            href={buildOpportunityHref(summary.oldestOpportunityId)}
          >
            Open oldest pursuit
          </Link>
          <Link
            className="font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
            href={buildStageQueueHref(summary.stageKey)}
          >
            View {summary.stageLabel} queue
          </Link>
        </div>,
      ])}
    />
  );
}

function ComparisonTable({
  ariaLabel,
  headers,
  rows,
}: {
  ariaLabel: string;
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table
        aria-label={ariaLabel}
        className="min-w-full border-collapse text-left text-sm"
      >
        <thead>
          <tr className="border-b border-border">
            {headers.map((header) => (
              <th
                className="px-0 py-3 pr-4 text-[0.72rem] font-medium tracking-[0.18em] text-muted uppercase"
                key={header}
                scope="col"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              className={rowIndex === rows.length - 1 ? "" : "border-b border-border"}
              key={rowIndex}
            >
              {row.map((cell, cellIndex) => (
                <td className="px-0 py-4 pr-4 align-top" key={cellIndex}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OpportunityLinkList({
  emptyLabel,
  items,
}: {
  emptyLabel: string;
  items: DecisionConsoleItem[];
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            className="font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
            href={buildOpportunityHref(item.id)}
          >
            {item.title}
          </Link>
          <p className="text-sm text-muted">
            {item.currentStageLabel} · {humanizeDecision(item.currentOutcome)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function MetricValue({ detail, value }: { detail: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-base font-semibold text-foreground">{value}</p>
      <p className="text-sm text-muted">{detail}</p>
    </div>
  );
}

function buildOpportunityHref(opportunityId: string) {
  return `/opportunities/${opportunityId}`;
}

function buildStageQueueHref(stageKey: string) {
  return `/opportunities?stage=${encodeURIComponent(stageKey)}`;
}

function isOpportunityInScoreBucket(
  opportunity: DecisionConsoleItem,
  bucketKey: string,
) {
  const scorePercent = parseNumericString(opportunity.scorePercent);

  if (scorePercent === null) {
    return false;
  }

  switch (bucketKey) {
    case "under_50":
      return scorePercent < 50;
    case "50_to_69":
      return scorePercent >= 50 && scorePercent < 70;
    case "70_to_84":
      return scorePercent >= 70 && scorePercent < 85;
    case "85_plus":
      return scorePercent >= 85;
    default:
      return false;
  }
}

function parseNumericString(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPercent(value: string | null) {
  return value ? `${value}%` : "Unavailable";
}

function formatNumericPercent(value: number) {
  return `${value.toFixed(Number.isInteger(value) ? 0 : 2)}%`;
}

function formatDayCount(value: number) {
  return `${value} ${value === 1 ? "day" : "days"}`;
}

function humanizeDecision(value: BidDecisionOutcome | null) {
  if (!value) {
    return "Pending";
  }

  return value === "NO_GO" ? "No Go" : value.replace("_", " ");
}

function humanizeStageKey(value: string) {
  return value
    .split("_")
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(" ");
}

function decisionTone(value: BidDecisionOutcome | null) {
  switch (value) {
    case "GO":
      return "accent" as const;
    case "NO_GO":
      return "warning" as const;
    case "DEFER":
      return "muted" as const;
    default:
      return "muted" as const;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
