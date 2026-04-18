import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import type {
  BidDecisionOutcome,
  DecisionConsoleSnapshot,
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

  return (
    <section className="space-y-6">
      <header className="rounded-[28px] border border-border bg-white px-6 py-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Analytics</Badge>
              <Badge tone="muted">{snapshot.organization.name}</Badge>
              <Badge tone="warning">{rankingLabel}</Badge>
            </div>
            <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
              Decision console
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted">
              Compare active pursuits through one deterministic leadership view.
              The current value lens uses the strategic-alignment score factor
              until a later PRD slice adds a true contract-value field.
            </p>
          </div>

          <div className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-[rgba(255,249,239,0.72)] px-5 py-5 text-sm">
            <p className="text-xs tracking-[0.2em] text-muted uppercase">
              Current scope
            </p>
            <p className="mt-3 text-lg font-semibold text-foreground">
              {scopeLabel}
            </p>
            <p className="mt-2 text-sm text-muted">
              {snapshot.comparedOpportunityCount} opportunities ranked
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Compared pursuits"
            value={String(snapshot.comparedOpportunityCount)}
          />
          <SummaryCard
            label="Current go calls"
            value={String(snapshot.goOpportunityCount)}
          />
          <SummaryCard
            label="Urgent deadlines"
            value={String(snapshot.urgentOpportunityCount)}
          />
        </div>
      </header>

      <section className="rounded-[32px] border border-border bg-[linear-gradient(180deg,rgba(255,250,244,1),rgba(246,239,228,0.92))] px-6 py-6 shadow-[0_20px_60px_rgba(67,49,33,0.08)] sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-xs tracking-[0.24em] text-[#8b6e56] uppercase">
              Ranking lens
            </p>
            <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
              Re-rank the pipeline
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Switch between strategic value, overall score, deadline urgency,
              and risk pressure without leaving the protected analytics route.
            </p>
          </div>
        </div>

        <form action="/analytics" className="mt-6 grid gap-4 md:grid-cols-2 xl:max-w-3xl">
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
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)]"
              type="submit"
            >
              Apply ranking
            </button>
          </div>
        </form>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <article className="rounded-[28px] border border-border bg-white px-6 py-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-8">
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Decision quality
            </p>
            <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
              Bid volume and alignment
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              These portfolio-wide metrics use the latest final decision when it
              exists, otherwise the current deterministic recommendation.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SummaryCard
              label="Reviewed pursuits"
              value={String(snapshot.decisionAnalytics.reviewedOpportunityCount)}
            />
            <SummaryCard
              label="Finalized calls"
              value={String(snapshot.decisionAnalytics.finalDecisionCount)}
            />
            <SummaryCard
              label="Recent decision volume"
              value={`${snapshot.decisionAnalytics.recentDecisionVolume} in 30 days`}
            />
            <SummaryCard
              label="Recommendation alignment"
              value={formatPercent(
                snapshot.decisionAnalytics.recommendationAlignmentPercent,
              )}
            />
          </div>

          <p className="mt-5 text-sm leading-6 text-muted">
            {snapshot.decisionAnalytics.recommendationOnlyCount} pursuits still
            have recommendation-only posture and need a human call recorded.
          </p>
        </article>

        <article className="rounded-[28px] border border-border bg-[linear-gradient(135deg,rgba(32,95,85,0.97),rgba(16,58,53,1))] px-6 py-6 text-white shadow-[0_22px_60px_rgba(16,58,53,0.28)] sm:px-8">
          <div className="space-y-2">
            <p className="text-xs tracking-[0.24em] text-white/70 uppercase">
              Decision mix
            </p>
            <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em]">
              Go or no-go posture
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-white/75">
              Use this mix to see whether the pipeline is concentrating effort
              into strong pursuits or spreading work across too many marginal
              opportunities.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {snapshot.decisionAnalytics.outcomeSummaries.map((summary) => (
              <OutcomeMixCard key={summary.outcome} summary={summary} />
            ))}
          </div>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.98fr_1.02fr]">
        <article className="rounded-[28px] border border-border bg-[linear-gradient(180deg,rgba(244,250,247,1),rgba(232,244,239,0.96))] px-6 py-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-8">
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Score distribution
            </p>
            <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
              Score bands
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              The current score spread shows whether decisions are clustering
              around strong, marginal, or weak pursuits.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {snapshot.decisionAnalytics.scoreDistributionBuckets.map((bucket) => (
              <ScoreDistributionCard key={bucket.key} bucket={bucket} />
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-border bg-[#f6efe4] px-6 py-6 shadow-[0_16px_40px_rgba(67,49,33,0.08)] sm:px-8">
          <div className="space-y-2">
            <p className="text-xs tracking-[0.24em] text-[#8b6e56] uppercase">
              Effort versus current call
            </p>
            <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
              Effort versus outcome
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              {snapshot.decisionAnalytics.effortSignalLabel}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {snapshot.decisionAnalytics.effortOutcomeSummaries.map((summary) => (
              <EffortOutcomeCard key={summary.outcome} summary={summary} />
            ))}
          </div>
        </article>
      </div>

      <DataTable
        ariaLabel="Decision console rankings"
        columns={[
          {
            key: "opportunity",
            header: "Opportunity",
            className: "min-w-[18rem]",
            cell: (opportunity) => (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="warning">{opportunity.currentStageLabel}</Badge>
                  <Badge tone="muted">{opportunity.sourceDisplayLabel}</Badge>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {opportunity.title}
                  </h2>
                  <p className="text-sm text-muted">
                    {opportunity.leadAgency?.name ?? "Agency not assigned"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                  <span>
                    Deadline:{" "}
                    {opportunity.responseDeadlineAt
                      ? formatDate(opportunity.responseDeadlineAt)
                      : "Not set"}
                  </span>
                  <Link
                    className="font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
                    href={`/opportunities/${opportunity.id}`}
                  >
                    Open workspace
                  </Link>
                </div>
              </div>
            ),
          },
          {
            key: "value",
            header: "Value lens",
            cell: (opportunity) => (
              <MetricValue
                detail="Strategic alignment"
                value={formatPercent(opportunity.strategicValuePercent)}
              />
            ),
          },
          {
            key: "score",
            header: "Score",
            cell: (opportunity) => (
              <MetricValue
                detail="Overall fit"
                value={formatPercent(opportunity.scorePercent)}
              />
            ),
          },
          {
            key: "urgency",
            header: "Urgency",
            cell: (opportunity) => (
              <MetricValue
                detail={opportunity.urgencyDays === null ? "No due date" : "Response window"}
                value={opportunity.urgencyLabel}
              />
            ),
          },
          {
            key: "risk",
            header: "Risk pressure",
            cell: (opportunity) => (
              <MetricValue
                detail="Higher is riskier"
                value={formatPercent(opportunity.riskPressurePercent)}
              />
            ),
          },
          {
            key: "decision",
            header: "Decision",
            cell: (opportunity) => (
              <div className="space-y-2">
                <Badge tone={decisionTone(opportunity.finalDecision ?? opportunity.recommendationOutcome)}>
                  {humanizeDecision(
                    opportunity.finalDecision ?? opportunity.recommendationOutcome,
                  )}
                </Badge>
                <p className="text-sm text-muted">
                  {opportunity.finalDecision
                    ? "Human decision recorded"
                    : "Recommendation only"}
                </p>
              </div>
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
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[rgba(15,28,31,0.08)] bg-[rgba(255,249,239,0.72)] px-5 py-5">
      <p className="text-xs tracking-[0.24em] text-muted uppercase">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function OutcomeMixCard({
  summary,
}: {
  summary: DecisionConsoleSnapshot["decisionAnalytics"]["outcomeSummaries"][number];
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/8 px-5 py-5">
      <Badge className="border-white/15 bg-white/10 text-white" tone="muted">
        {summary.label}
      </Badge>
      <p className="mt-4 text-3xl font-semibold">{summary.opportunityCount}</p>
      <p className="mt-2 text-sm text-white/80">{summary.percentage}% of current calls</p>
    </div>
  );
}

function ScoreDistributionCard({
  bucket,
}: {
  bucket: DecisionConsoleSnapshot["decisionAnalytics"]["scoreDistributionBuckets"][number];
}) {
  return (
    <div className="rounded-[22px] border border-[rgba(15,28,31,0.08)] bg-white/75 px-5 py-5">
      <p className="text-xs tracking-[0.22em] text-muted uppercase">{bucket.label}</p>
      <p className="mt-3 text-3xl font-semibold text-foreground">
        {bucket.opportunityCount}
      </p>
      <p className="mt-3 text-sm text-muted">
        Go {bucket.currentCallCounts.GO} / Defer {bucket.currentCallCounts.DEFER} /
        No-go {bucket.currentCallCounts.NO_GO}
      </p>
    </div>
  );
}

function EffortOutcomeCard({
  summary,
}: {
  summary: DecisionConsoleSnapshot["decisionAnalytics"]["effortOutcomeSummaries"][number];
}) {
  return (
    <div className="rounded-[22px] border border-[rgba(67,49,33,0.08)] bg-white/70 px-5 py-5">
      <Badge tone={decisionTone(summary.outcome)}>{summary.label}</Badge>
      <p className="mt-4 text-3xl font-semibold text-foreground">
        {summary.averageEffortUnits}
      </p>
      <p className="mt-2 text-sm text-muted">
        Avg effort units across {summary.opportunityCount} pursuits
      </p>
      <p className="mt-4 text-sm text-muted">
        Tasks {summary.averageTaskCount} / Milestones {summary.averageMilestoneCount} /
        Artifacts {summary.averageArtifactCount}
      </p>
    </div>
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

function formatPercent(value: string | null) {
  return value ? `${value}%` : "Unavailable";
}

function humanizeDecision(value: BidDecisionOutcome | null) {
  if (!value) {
    return "Pending";
  }

  return value === "NO_GO" ? "No Go" : value.replace("_", " ");
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
