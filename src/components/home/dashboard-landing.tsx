import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Surface } from "@/components/ui/surface";
import type {
  DashboardAttentionItem,
  DashboardDeadlineSummary,
  DashboardSourceActivitySummary,
  DashboardTaskBurdenOpportunity,
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
          message="The dashboard could not load organization data for this session. Verify the current user still belongs to an active workspace before relying on this view."
          title="Dashboard data unavailable"
        />
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <Surface
          component="article"
          sx={{
            background:
              "linear-gradient(135deg, rgba(16,58,53,1), rgba(21,74,66,0.96), rgba(244,250,247,0.72))",
            color: "#ffffff",
            overflow: "hidden",
            p: 3,
          }}
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className="border-white/15 bg-white/10 text-white"
                    tone="muted"
                  >
                    Dashboard
                  </Badge>
                  <Badge
                    className="border-white/15 bg-white/10 text-white"
                    tone="muted"
                  >
                    Attention-led
                  </Badge>
                  <Badge
                    className="border-white/15 bg-white/10 text-white"
                    tone="muted"
                  >
                    {snapshot.organization.name}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <p className="text-xs tracking-[0.24em] text-white/70 uppercase">
                    Capture command center
                  </p>
                  <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                    Attention queue
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                    Start with the pursuits that can slip, block, or close soon,
                    then branch into the pipeline, tasks, and sourced work
                    directly from the same command center.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <ActionLink
                    href="/opportunities?due=next_30_days"
                    label="Review deadline queue"
                    tone="primary"
                  />
                  <ActionLink
                    href="/tasks"
                    label="Open task triage"
                    tone="secondary"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DashboardKpiCard
                  detail="Records visible in the current workspace."
                  label="Tracked pursuits"
                  value={String(snapshot.trackedOpportunityCount)}
                />
                <DashboardKpiCard
                  detail="Open pursuits still moving through active execution."
                  label="Active pipeline"
                  value={String(snapshot.activeOpportunityCount)}
                />
                <DashboardKpiCard
                  detail="Items currently surfacing a blocked, overdue, or near-term signal."
                  label="Needs attention"
                  value={String(snapshot.opportunitiesRequiringAttentionCount)}
                />
                <DashboardKpiCard
                  detail="Source connectors currently enabled for discovery and sync."
                  label="Live connectors"
                  value={String(snapshot.enabledConnectorCount)}
                />
              </div>
            </div>

            {snapshot.attentionQueue.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {snapshot.attentionQueue.map((item) => (
                  <AttentionQueueCard key={item.opportunityId} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState
                className="border-white/12 bg-white/6 text-white"
                message="The active pipeline does not currently surface blocked, overdue, or near-term items."
                title="No immediate attention signals"
              />
            )}
          </div>
        </Surface>

        <Surface
          component="article"
          sx={{
            background:
              "linear-gradient(180deg, rgba(255,250,241,0.98), rgba(245,238,224,0.94))",
            p: 3,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs tracking-[0.22em] text-[#8b6e56] uppercase">
                Priority stack
              </p>
              <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
                Top pursuits
              </h2>
              <p className="text-muted max-w-xl text-sm leading-6">
                Highest-ranked work remains visible with score, decision,
                deadline, and execution load in one scan.
              </p>
            </div>
            <ActionLink
              href="/opportunities"
              label="View pipeline"
              tone="secondary"
            />
          </div>

          {snapshot.topOpportunities.length > 0 ? (
            <div className="mt-6 space-y-3">
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
              className="mt-6 bg-white/70"
              message="The current organization snapshot does not have any ranked pursuits yet."
              title="No ranked opportunities"
            />
          )}
        </Surface>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <Surface component="article" sx={{ backgroundColor: "#f6efe4", p: 3 }}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs tracking-[0.22em] text-[#8b6e56] uppercase">
                Deadline watch
              </p>
              <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
                Upcoming deadlines
              </h2>
              <p className="text-muted max-w-xl text-sm leading-6">
                Response windows and capture checkpoints stay linked back to the
                owning pursuit so schedule pressure does not get buried.
              </p>
            </div>
            <ActionLink
              href="/opportunities?due=next_30_days"
              label="Review deadline queue"
              tone="secondary"
            />
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
        </Surface>

        <Surface component="article" sx={{ p: 3 }}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-muted text-xs tracking-[0.22em] uppercase">
                Execution load
              </p>
              <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
                Task burden
              </h2>
              <p className="text-muted max-w-xl text-sm leading-6">
                Workload is organized around blocked, critical, overdue, and
                upcoming tasks so capture leads can rebalance before the queue
                spreads too wide.
              </p>
            </div>
            <ActionLink
              href="/tasks"
              label="Open task triage"
              tone="secondary"
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <TaskBurdenStat
              label="Open tasks"
              supportingText={`${snapshot.taskBurden.opportunitiesWithOpenTasksCount} pursuits carrying live work`}
              value={String(snapshot.taskBurden.openTaskCount)}
            />
            <TaskBurdenStat
              label="Blocked"
              supportingText="Tasks currently stalled"
              value={String(snapshot.taskBurden.blockedTaskCount)}
            />
            <TaskBurdenStat
              label="Critical"
              supportingText="Top-priority execution items"
              value={String(snapshot.taskBurden.criticalTaskCount)}
            />
            <TaskBurdenStat
              label="Overdue"
              supportingText={`${snapshot.taskBurden.upcomingTaskCount} more flagged as upcoming`}
              value={String(snapshot.taskBurden.overdueTaskCount)}
            />
          </div>

          {snapshot.taskBurden.busiestOpportunities.length > 0 ? (
            <div className="mt-6 space-y-3">
              {snapshot.taskBurden.busiestOpportunities.map((item) => (
                <TaskBurdenOpportunityCard
                  key={item.opportunityId}
                  item={item}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-6"
              message="The active portfolio does not currently have open tasks."
              title="No execution load yet"
            />
          )}
        </Surface>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface
          component="article"
          sx={{
            background:
              "linear-gradient(180deg, rgba(244,250,247,1), rgba(232,244,239,0.96))",
            p: 3,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-muted text-xs tracking-[0.22em] uppercase">
                Portfolio flow
              </p>
              <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
                Pipeline risk
              </h2>
              <p className="text-muted max-w-2xl text-sm leading-6">
                Stage mix, conversion pressure, and aging show where the current
                pipeline is piling up or losing momentum.
              </p>
            </div>
            <ActionLink
              href="/opportunities"
              label="Review pipeline"
              tone="secondary"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-6">
              <div>
                <p className="text-muted text-xs tracking-[0.18em] uppercase">
                  Stage distribution
                </p>
                {snapshot.stageSummaries.length > 0 ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {snapshot.stageSummaries.map((stage) => (
                      <div
                        key={stage.stageKey}
                        className="rounded-[22px] border border-[rgba(15,28,31,0.08)] bg-white/80 px-4 py-4"
                      >
                        <p className="text-muted text-xs tracking-[0.18em] uppercase">
                          {stage.stageLabel}
                        </p>
                        <p className="font-heading text-foreground mt-3 text-3xl font-semibold tracking-[-0.04em]">
                          {stage.opportunityCount}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    className="mt-3 bg-white/70"
                    message="Run the seed workflow to populate stage summaries for the dashboard landing page."
                    title="No staged opportunities yet"
                  />
                )}
              </div>

              <div>
                <p className="text-muted text-xs tracking-[0.18em] uppercase">
                  Conversion pressure
                </p>
                {snapshot.pipelineConversionSummaries.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {snapshot.pipelineConversionSummaries.map((summary) => (
                      <ConversionRateRow key={summary.key} summary={summary} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    className="mt-3 bg-white/70"
                    message="The current organization snapshot does not have enough pipeline history to calculate conversions yet."
                    title="No conversion analytics yet"
                  />
                )}
              </div>
            </div>

            <div>
              <p className="text-muted text-xs tracking-[0.18em] uppercase">
                Stage aging
              </p>
              {snapshot.pipelineStageAgingSummaries.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {snapshot.pipelineStageAgingSummaries.map((summary) => (
                    <StageAgingCard key={summary.stageKey} summary={summary} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="mt-3 bg-white/70"
                  message="Stage aging will appear once opportunities start moving through the active pipeline."
                  title="No active stage aging yet"
                />
              )}
            </div>
          </div>
        </Surface>

        <Surface
          component="article"
          sx={{
            background:
              "linear-gradient(180deg, rgba(251,252,255,1), rgba(239,244,255,0.92))",
            p: 3,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[0.7rem] tracking-[0.22em] text-[#5d7395] uppercase">
                External discovery
              </p>
              <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
                Recent source activity
              </h2>
              <p className="text-muted max-w-xl text-sm leading-6">
                Source syncs stay visible on the landing page so discovery
                momentum and import health can be reviewed alongside the
                pipeline.
              </p>
            </div>
            <ActionLink
              href="/opportunities"
              label="Review sourced work"
              tone="secondary"
            />
          </div>

          {snapshot.recentSourceActivity.length > 0 ? (
            <div className="mt-6 space-y-3">
              {snapshot.recentSourceActivity.map((activity) => (
                <SourceActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-6 bg-white/70"
              message="Source sync runs will appear here once searches or scheduled sweeps have executed."
              title="No recent source activity"
            />
          )}
        </Surface>
      </div>
    </section>
  );
}

function ActionLink({
  href,
  label,
  tone,
}: {
  href: string;
  label: string;
  tone: "primary" | "secondary";
}) {
  return (
    <Button
      href={href}
      tone="neutral"
      variant={tone === "primary" ? "solid" : "outlined"}
    >
      {label}
    </Button>
  );
}

function DashboardKpiCard({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <Surface
      component="article"
      sx={{
        backgroundColor: "rgba(255,255,255,0.08)",
        borderColor: "rgba(255,255,255,0.12)",
        boxShadow: "0 12px 32px rgba(7, 22, 20, 0.12)",
        px: 2,
        py: 2,
      }}
    >
      <p className="text-xs tracking-[0.2em] text-white/68 uppercase">
        {label}
      </p>
      <p className="font-heading mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/72">{detail}</p>
    </Surface>
  );
}

function AttentionQueueCard({ item }: { item: DashboardAttentionItem }) {
  return (
    <Surface
      sx={{
        backgroundColor: "rgba(255,255,255,0.07)",
        borderColor: "rgba(255,255,255,0.12)",
        boxShadow: "0 12px 28px rgba(7, 22, 20, 0.1)",
        p: 2.5,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs tracking-[0.18em] text-white/66 uppercase">
            {item.stageLabel}
          </p>
          <h3 className="font-heading text-xl font-semibold tracking-[-0.03em] text-white">
            {item.opportunityTitle}
          </h3>
        </div>
        <Badge className={getInvertedBadgeClassName(item.tone)} tone="muted">
          {item.reasonLabel}
        </Badge>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/76">
        {item.supportingDetail}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/72">
          {item.responseDeadlineAt
            ? `Deadline ${formatShortDate(item.responseDeadlineAt)}`
            : "No response deadline recorded"}
        </p>
        <Link
          className="text-sm font-semibold text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
          href={`/opportunities/${item.opportunityId}`}
        >
          Open workspace for {item.opportunityTitle}
        </Link>
      </div>
    </Surface>
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
    <Surface
      sx={{
        backgroundColor: "rgba(255,255,255,0.82)",
        borderColor: "rgba(67,49,33,0.08)",
        p: 2.5,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs tracking-[0.18em] text-[#8b6e56] uppercase">
            Priority {index + 1}
          </p>
          <h3 className="font-heading text-foreground text-xl font-semibold tracking-[-0.03em]">
            {opportunity.title}
          </h3>
          <p className="text-muted text-sm">
            {opportunity.currentStageLabel}
            {opportunity.leadAgency ? ` · ${opportunity.leadAgency.name}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="accent">Score {scoreValue}</Badge>
          <Badge tone={decisionLabel === "GO" ? "success" : "warning"}>
            {decisionLabel}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <OpportunitySignal
          label="Deadline"
          value={
            opportunity.responseDeadlineAt
              ? formatShortDate(opportunity.responseDeadlineAt)
              : "Not set"
          }
        />
        <OpportunitySignal
          label="Tasks"
          value={String(opportunity.tasks.length)}
        />
        <OpportunitySignal
          label="Milestones"
          value={String(opportunity.milestones.length)}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          className="text-foreground text-sm font-semibold underline decoration-[rgba(15,28,31,0.2)] underline-offset-4 transition hover:decoration-[rgba(15,28,31,0.6)]"
          href={`/opportunities/${opportunity.id}`}
        >
          Open workspace for {opportunity.title}
        </Link>
      </div>
    </Surface>
  );
}

function OpportunitySignal({ label, value }: { label: string; value: string }) {
  return (
    <Surface
      sx={{
        backgroundColor: "rgba(255,255,255,0.72)",
        borderColor: "rgba(67,49,33,0.08)",
        borderRadius: 2.25,
        px: 2,
        py: 1.5,
      }}
    >
      <p className="text-muted text-[0.68rem] tracking-[0.18em] uppercase">
        {label}
      </p>
      <p className="text-foreground mt-2 text-sm font-semibold">{value}</p>
    </Surface>
  );
}

function DeadlineCard({ deadline }: { deadline: DashboardDeadlineSummary }) {
  return (
    <Link href={`/opportunities/${deadline.opportunityId}`}>
      <Surface
        sx={{
          backgroundColor: "rgba(255,255,255,0.78)",
          borderColor: "rgba(67,49,33,0.08)",
          display: "block",
          px: 2.5,
          py: 2,
          transition: "background-color 160ms ease",
          "&:hover": {
            backgroundColor: "#ffffff",
          },
        }}
      >
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
        <Badge
          tone={deadline.deadlineType === "MILESTONE" ? "warning" : "accent"}
        >
          {deadline.deadlineType === "MILESTONE"
            ? "Milestone"
            : "Response deadline"}
        </Badge>
      </div>
      </Surface>
    </Link>
  );
}

function TaskBurdenStat({
  label,
  supportingText,
  value,
}: {
  label: string;
  supportingText: string;
  value: string;
}) {
  return (
    <Surface
      sx={{
        backgroundColor: "rgba(244,250,247,0.72)",
        borderColor: "rgba(15,28,31,0.08)",
        px: 2,
        py: 2,
      }}
    >
      <p className="text-muted text-[0.68rem] tracking-[0.18em] uppercase">
        {label}
      </p>
      <p className="font-heading text-foreground mt-3 text-3xl font-semibold tracking-[-0.04em]">
        {value}
      </p>
      <p className="text-muted mt-2 text-sm leading-6">{supportingText}</p>
    </Surface>
  );
}

function TaskBurdenOpportunityCard({
  item,
}: {
  item: DashboardTaskBurdenOpportunity;
}) {
  return (
    <Surface
      sx={{
        backgroundColor: "rgba(248,250,252,0.96)",
        borderColor: "rgba(15,28,31,0.08)",
        px: 2.5,
        py: 2,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-muted text-xs tracking-[0.18em] uppercase">
            Busiest pursuit
          </p>
          <h3 className="text-foreground text-base font-semibold">
            {item.opportunityTitle}
          </h3>
        </div>
        <Badge tone={item.blockedTaskCount > 0 ? "danger" : "muted"}>
          {item.openTaskCount} open
        </Badge>
      </div>

      <div className="text-muted mt-3 flex flex-wrap gap-2 text-sm">
        <span>{item.blockedTaskCount} blocked</span>
        <span>{item.criticalTaskCount} critical</span>
        <span>{item.overdueTaskCount} overdue</span>
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          className="text-foreground text-sm font-semibold underline decoration-[rgba(15,28,31,0.2)] underline-offset-4 transition hover:decoration-[rgba(15,28,31,0.6)]"
          href={`/opportunities/${item.opportunityId}`}
        >
          Open workspace for {item.opportunityTitle}
        </Link>
      </div>
    </Surface>
  );
}

function ConversionRateRow({
  summary,
}: {
  summary: PipelineConversionSummary;
}) {
  return (
    <Surface
      sx={{
        backgroundColor: "rgba(255,255,255,0.8)",
        borderColor: "rgba(15,28,31,0.08)",
        px: 2,
        py: 2,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted text-xs tracking-[0.18em] uppercase">
            {summary.label}
          </p>
          <p className="font-heading text-foreground mt-2 text-3xl font-semibold tracking-[-0.04em]">
            {formatPercent(summary.ratePercent)}
          </p>
        </div>
        <Badge tone="accent">
          {summary.numerator}/{summary.denominator}
        </Badge>
      </div>
    </Surface>
  );
}

function StageAgingCard({ summary }: { summary: PipelineStageAgingSummary }) {
  return (
    <Surface
      sx={{
        backgroundColor: "rgba(255,255,255,0.82)",
        borderColor: "rgba(15,28,31,0.08)",
        px: 2.5,
        py: 2,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted text-xs tracking-[0.18em] uppercase">
            {summary.stageLabel}
          </p>
          <p className="text-foreground mt-2 text-lg font-semibold">
            Avg age {formatDayCount(summary.averageAgeDays)}
          </p>
        </div>
        <Badge tone={summary.averageAgeDays >= 14 ? "warning" : "muted"}>
          {summary.opportunityCount}{" "}
          {summary.opportunityCount === 1 ? "pursuit" : "pursuits"}
        </Badge>
      </div>

      <p className="text-muted mt-3 text-sm leading-6">
        Oldest current stage: {formatDayCount(summary.oldestAgeDays)} on{" "}
        {summary.oldestOpportunityTitle}
      </p>
    </Surface>
  );
}

function SourceActivityCard({
  activity,
}: {
  activity: DashboardSourceActivitySummary;
}) {
  return (
    <Link href={`/opportunities?source=${encodeURIComponent(activity.sourceSystem)}`}>
      <Surface
        sx={{
          backgroundColor: "rgba(255,255,255,0.82)",
          borderColor: "rgba(18,52,88,0.08)",
          display: "block",
          px: 2.5,
          py: 2,
          transition: "background-color 160ms ease",
          "&:hover": {
            backgroundColor: "#ffffff",
          },
        }}
      >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[0.68rem] tracking-[0.18em] text-[#5d7395] uppercase">
            {activity.savedSearchName ??
              formatSourceTrigger(activity.triggerType)}
          </p>
          <h3 className="text-foreground text-base font-semibold">
            {activity.sourceDisplayName}
          </h3>
          <p className="text-muted text-sm">
            Requested {formatTimestamp(activity.requestedAt)}
          </p>
        </div>
        <Badge tone={getSourceStatusTone(activity.status)}>
          {formatSourceStatus(activity.status)}
        </Badge>
      </div>

      <div className="text-muted mt-3 flex flex-wrap gap-2 text-sm">
        <span>{activity.recordsFetched} fetched</span>
        <span>{activity.recordsImported} imported</span>
        <span>{activity.recordsFailed} failed</span>
      </div>
      </Surface>
    </Link>
  );
}

function getInvertedBadgeClassName(
  tone: DashboardAttentionItem["tone"],
): string {
  switch (tone) {
    case "danger":
      return "border-[rgba(255,255,255,0.16)] bg-[rgba(196,71,52,0.22)] text-white";
    case "warning":
      return "border-[rgba(255,255,255,0.16)] bg-[rgba(203,143,62,0.2)] text-white";
    case "accent":
    default:
      return "border-[rgba(255,255,255,0.16)] bg-[rgba(96,158,144,0.22)] text-white";
  }
}

function getSourceStatusTone(
  activityStatus: DashboardSourceActivitySummary["status"],
) {
  switch (activityStatus) {
    case "SUCCEEDED":
      return "success";
    case "PARTIAL":
      return "warning";
    case "FAILED":
    case "CANCELLED":
      return "danger";
    case "RUNNING":
      return "accent";
    case "QUEUED":
    default:
      return "muted";
  }
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

function formatSourceStatus(status: DashboardSourceActivitySummary["status"]) {
  return status.toLowerCase().replaceAll("_", " ");
}

function formatSourceTrigger(
  triggerType: DashboardSourceActivitySummary["triggerType"],
) {
  return triggerType.toLowerCase().replaceAll("_", " ");
}
