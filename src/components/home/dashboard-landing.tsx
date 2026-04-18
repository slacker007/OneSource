import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import type {
  DashboardDeadlineSummary,
  HomeDashboardSnapshot,
  OpportunitySummary,
  PipelineConversionSummary,
  PipelineStageAgingSummary,
} from "@/modules/opportunities/opportunity.types";

type DashboardLandingProps = {
  snapshot: HomeDashboardSnapshot | null;
};

export function DashboardLanding({ snapshot }: DashboardLandingProps) {
  if (!snapshot) {
    return (
      <ErrorState
        message="The dashboard query did not return an organization snapshot. Verify the seeded default organization before relying on the landing page."
        title="Dashboard data unavailable"
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Canonical opportunity records currently visible in the seeded workspace."
          label="Tracked opportunities"
          value={String(snapshot.trackedOpportunityCount)}
        />
        <MetricCard
          detail="Open pursuits still moving through qualification, capture, or proposal work."
          label="Active pursuits"
          value={String(snapshot.activeOpportunityCount)}
        />
        <MetricCard
          detail="Upcoming response and milestone dates within the current dashboard window."
          label="Upcoming deadlines"
          value={String(snapshot.upcomingDeadlineCount)}
        />
        <MetricCard
          detail="Opportunities with blocked or critical work still needing capture-team action."
          label="Attention needed"
          value={String(snapshot.opportunitiesRequiringAttentionCount)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="border-border rounded-[28px] border bg-white p-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-muted text-xs tracking-[0.24em] uppercase">
                Pipeline
              </p>
              <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Counts by stage
              </h2>
            </div>
            <Badge tone="muted">{snapshot.organization.name}</Badge>
          </div>

          {snapshot.stageSummaries.length > 0 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {snapshot.stageSummaries.map((stage) => (
                <div
                  key={stage.stageKey}
                  className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-[rgba(255,249,239,0.78)] px-5 py-5"
                >
                  <p className="text-muted text-xs tracking-[0.18em] uppercase">
                    {stage.stageLabel}
                  </p>
                  <p className="font-heading text-foreground mt-3 text-4xl font-semibold tracking-[-0.04em]">
                    {stage.opportunityCount}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-6"
              message="Run the seed workflow to populate stage summaries for the dashboard landing page."
              title="No staged opportunities yet"
            />
          )}
        </article>

        <article className="border-border rounded-[28px] border bg-[linear-gradient(135deg,rgba(32,95,85,0.97),rgba(16,58,53,1))] p-6 text-white shadow-[0_22px_60px_rgba(16,58,53,0.28)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.24em] text-white/70 uppercase">
                Priorities
              </p>
              <h2 className="font-heading mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Top opportunities
              </h2>
            </div>
            <Badge className="border-white/20 bg-white/10 text-white" tone="muted">
              {snapshot.enabledConnectorCount} connectors enabled
            </Badge>
          </div>

          {snapshot.topOpportunities.length > 0 ? (
            <div className="mt-6 space-y-4">
              {snapshot.topOpportunities.map((opportunity, index) => (
                <TopOpportunityCard
                  key={opportunity.id}
                  index={index}
                  opportunity={opportunity}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-6 border-white/15 bg-white/5 text-white"
              message="The current organization snapshot does not have any ranked pursuits yet."
              title="No ranked opportunities"
            />
          )}
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="border-border rounded-[28px] border bg-[linear-gradient(180deg,rgba(244,250,247,1),rgba(232,244,239,0.96))] p-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-muted text-xs tracking-[0.24em] uppercase">
                Pipeline health
              </p>
              <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Conversion rates
              </h2>
            </div>
            <Badge tone="accent">{snapshot.activeOpportunityCount} active</Badge>
          </div>

          {snapshot.pipelineConversionSummaries.length > 0 ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {snapshot.pipelineConversionSummaries.map((summary) => (
                <ConversionRateCard key={summary.key} summary={summary} />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-6 bg-white/70"
              message="The current organization snapshot does not have enough pipeline history to calculate conversions yet."
              title="No conversion analytics yet"
            />
          )}
        </article>

        <article className="border-border rounded-[28px] border bg-white p-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-muted text-xs tracking-[0.24em] uppercase">
                Pipeline health
              </p>
              <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
                Pipeline aging
              </h2>
            </div>
            <Badge tone="warning">Active stages</Badge>
          </div>

          {snapshot.pipelineStageAgingSummaries.length > 0 ? (
            <div className="mt-6 space-y-3">
              {snapshot.pipelineStageAgingSummaries.map((summary) => (
                <StageAgingCard key={summary.stageKey} summary={summary} />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-6"
              message="Stage aging will appear once opportunities start moving through the active pipeline."
              title="No active stage aging yet"
            />
          )}
        </article>
      </div>

      <article className="border-border rounded-[28px] border bg-[#f6efe4] p-6 shadow-[0_16px_40px_rgba(67,49,33,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.24em] text-[#8b6e56] uppercase">
              Schedule
            </p>
            <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Upcoming deadlines
            </h2>
          </div>
          <Badge tone="warning">Next 30 days</Badge>
        </div>

        {snapshot.upcomingDeadlines.length > 0 ? (
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {snapshot.upcomingDeadlines.map((deadline) => (
              <DeadlineCard key={deadline.id} deadline={deadline} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-6 bg-white/70"
            message="No response or milestone dates fall within the current dashboard window."
            title="No near-term deadlines"
          />
        )}
      </article>
    </section>
  );
}

function MetricCard({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <article className="border-border rounded-[24px] border bg-white p-5 shadow-[0_14px_34px_rgba(20,37,34,0.06)]">
      <p className="text-muted text-xs tracking-[0.22em] uppercase">{label}</p>
      <p className="font-heading text-foreground mt-4 text-4xl font-semibold tracking-[-0.04em]">
        {value}
      </p>
      <p className="text-muted mt-3 text-sm leading-6">{detail}</p>
    </article>
  );
}

function TopOpportunityCard({
  index,
  opportunity,
}: {
  index: number;
  opportunity: OpportunitySummary;
}) {
  const scoreValue = opportunity.score?.totalScore
    ? `${opportunity.score.totalScore}/100`
    : "Unscored";
  const decisionLabel =
    opportunity.bidDecision?.finalOutcome ??
    opportunity.score?.recommendationOutcome ??
    "Pending";

  return (
    <div className="rounded-[24px] border border-white/12 bg-white/7 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs tracking-[0.22em] text-white/65 uppercase">
            Priority {index + 1}
          </p>
          <h3 className="font-heading text-2xl font-semibold tracking-[-0.03em]">
            {opportunity.title}
          </h3>
          <p className="text-sm text-white/75">
            {opportunity.currentStageLabel}
            {opportunity.leadAgency ? ` · ${opportunity.leadAgency.name}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="border-white/15 bg-white/12 text-white" tone="muted">
            Score {scoreValue}
          </Badge>
          <Badge className="border-white/15 bg-white/12 text-white" tone="muted">
            {decisionLabel}
          </Badge>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/75">
        <span>
          Deadline:{" "}
          {opportunity.responseDeadlineAt
            ? formatShortDate(opportunity.responseDeadlineAt)
            : "Not set"}
        </span>
        <span>Tasks: {opportunity.tasks.length}</span>
        <span>Milestones: {opportunity.milestones.length}</span>
      </div>
    </div>
  );
}

function DeadlineCard({
  deadline,
}: {
  deadline: DashboardDeadlineSummary;
}) {
  return (
    <div className="rounded-[24px] border border-[rgba(67,49,33,0.08)] bg-white/78 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-muted text-xs tracking-[0.18em] uppercase">
            {deadline.opportunityTitle}
          </p>
          <h3 className="text-foreground text-base font-semibold">
            {deadline.title}
          </h3>
          <p className="text-muted text-sm">
            {deadline.stageLabel} · {formatShortDate(deadline.deadlineAt)}
          </p>
        </div>
        <Badge tone={deadline.deadlineType === "MILESTONE" ? "warning" : "accent"}>
          {deadline.deadlineType === "MILESTONE"
            ? "Milestone"
            : "Response deadline"}
        </Badge>
      </div>
    </div>
  );
}

function ConversionRateCard({
  summary,
}: {
  summary: PipelineConversionSummary;
}) {
  return (
    <div className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-white/78 px-5 py-5">
      <p className="text-muted text-xs tracking-[0.18em] uppercase">
        {summary.label}
      </p>
      <p className="font-heading text-foreground mt-3 text-4xl font-semibold tracking-[-0.04em]">
        {formatPercent(summary.ratePercent)}
      </p>
      <p className="text-muted mt-3 text-sm leading-6">
        {summary.numerator} of {summary.denominator}{" "}
        {summary.denominator === 1 ? "opportunity" : "opportunities"} reached
        this step.
      </p>
    </div>
  );
}

function StageAgingCard({
  summary,
}: {
  summary: PipelineStageAgingSummary;
}) {
  return (
    <div className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-[rgba(255,249,239,0.62)] px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted text-xs tracking-[0.18em] uppercase">
            {summary.stageLabel}
          </p>
          <p className="text-foreground mt-2 text-lg font-semibold">
            Avg age {formatDayCount(summary.averageAgeDays)}
          </p>
        </div>
        <Badge tone="muted">
          {summary.opportunityCount}{" "}
          {summary.opportunityCount === 1 ? "opportunity" : "opportunities"}
        </Badge>
      </div>

      <p className="text-muted mt-3 text-sm leading-6">
        Oldest current stage: {formatDayCount(summary.oldestAgeDays)} on{" "}
        {summary.oldestOpportunityTitle}
      </p>
    </div>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
  }).format(value)}%`;
}

function formatDayCount(value: number) {
  return `${value} ${value === 1 ? "day" : "days"}`;
}
