import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import type { ReactNode } from "react";

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
import { onesourceTokens } from "@/theme/onesource-theme";

type DashboardLandingProps = {
  snapshot: HomeDashboardSnapshot | null;
};

const SECTION_EYEBROW_SX = {
  color: "text.secondary",
  fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
  fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
  letterSpacing: onesourceTokens.typographyRole.eyebrow.letterSpacing,
  textTransform: "uppercase",
} as const;

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
    <Stack
      component="section"
      spacing={{ xs: 2.5, lg: 3 }}
      sx={{ pb: { xs: 2, lg: 3 } }}
    >
      <Surface
        component="article"
        sx={{ px: { xs: 2.5, sm: 3 }, py: { xs: 2.5, sm: 3 } }}
      >
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2.5}
            sx={{
              alignItems: { lg: "flex-end" },
              justifyContent: "space-between",
            }}
          >
            <Stack spacing={1} sx={{ maxWidth: "46rem" }}>
              <Typography sx={SECTION_EYEBROW_SX}>
                Operational overview
              </Typography>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "2rem", sm: "2.35rem", lg: "2.6rem" },
                  maxWidth: "16ch",
                }}
              >
                Execution overview
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: "44rem" }}>
                Triage active pursuits, deadlines, and workload from one compact
                operational view. The homepage should open with the next actions
                already visible instead of decorative framing.
              </Typography>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
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
            </Stack>
          </Stack>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Badge tone="accent">{snapshot.organization.name}</Badge>
            <Badge tone="muted">
              {snapshot.trackedOpportunityCount} tracked pursuits
            </Badge>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
            }}
          >
            <DashboardKpiCard
              detail="Live opportunity records in the workspace."
              label="Tracked pursuits"
              value={String(snapshot.trackedOpportunityCount)}
            />
            <DashboardKpiCard
              detail="Pursuits still advancing through execution."
              label="Active pipeline"
              value={String(snapshot.activeOpportunityCount)}
            />
            <DashboardKpiCard
              detail="Blocked, overdue, or near-term items."
              label="Needs attention"
              value={String(snapshot.opportunitiesRequiringAttentionCount)}
            />
            <DashboardKpiCard
              detail="Connectors available for search and sync."
              label="Live connectors"
              value={String(snapshot.enabledConnectorCount)}
            />
          </Box>
        </Stack>
      </Surface>

      <Box
        sx={{
          display: "grid",
          gap: { xs: 2.5, lg: 3 },
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1.08fr) minmax(0, 0.92fr)",
          },
        }}
      >
        <Surface
          component="article"
          sx={{
            bgcolor: alpha(onesourceTokens.color.accent.main, 0.06),
            borderColor: alpha(onesourceTokens.color.accent.main, 0.18),
            px: { xs: 2.5, sm: 3 },
            py: { xs: 2.5, sm: 3 },
          }}
        >
          <Stack spacing={2.5}>
            <DashboardSectionHeader
              action={
                <Badge tone="muted" sx={getQueueCountBadgeSx()}>
                  {snapshot.opportunitiesRequiringAttentionCount} active signals
                </Badge>
              }
              description="Blocked, overdue, and near-term pursuits stay at the top so capture teams can act before the rest of the queue."
              eyebrow="Immediate focus"
              title="Attention queue"
            />

            {snapshot.attentionQueue.length > 0 ? (
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg: "repeat(2, minmax(0, 1fr))",
                  },
                }}
              >
                {snapshot.attentionQueue.map((item) => (
                  <AttentionQueueCard key={item.opportunityId} item={item} />
                ))}
              </Box>
            ) : (
              <EmptyState
                message="The active pipeline does not currently surface blocked, overdue, or near-term items."
                title="No immediate attention signals"
              />
            )}
          </Stack>
        </Surface>

        <Surface
          component="article"
          sx={{ px: { xs: 2.5, sm: 3 }, py: { xs: 2.5, sm: 3 } }}
        >
          <Stack spacing={2.5}>
            <DashboardSectionHeader
              action={
                <ActionLink
                  href="/opportunities"
                  label="View pipeline"
                  tone="secondary"
                />
              }
              description="Highest-ranked work stays visible with score, decision, deadline, and execution load in one scan."
              eyebrow="Priority stack"
              title="Top pursuits"
            />

            {snapshot.topOpportunities.length > 0 ? (
              <Stack spacing={1.5}>
                {snapshot.topOpportunities.map((opportunity, index) => (
                  <TopOpportunityCard
                    key={opportunity.id}
                    index={index}
                    opportunity={opportunity}
                  />
                ))}
              </Stack>
            ) : (
              <EmptyState
                message="The current organization snapshot does not have any ranked pursuits yet."
                title="No ranked opportunities"
              />
            )}
          </Stack>
        </Surface>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: { xs: 2.5, lg: 3 },
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1fr) minmax(0, 1fr)",
          },
        }}
      >
        <Surface
          component="article"
          sx={{ px: { xs: 2.5, sm: 3 }, py: { xs: 2.5, sm: 3 } }}
        >
          <Stack spacing={2.5}>
            <DashboardSectionHeader
              action={
                <ActionLink
                  href="/opportunities?due=next_30_days"
                  label="Review deadline queue"
                  tone="secondary"
                />
              }
              description="Response windows and capture checkpoints stay linked to the owning pursuit so schedule pressure is visible at a glance."
              eyebrow="Deadline watch"
              title="Upcoming deadlines"
            />

            {snapshot.upcomingDeadlines.length > 0 ? (
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg: "repeat(2, minmax(0, 1fr))",
                  },
                }}
              >
                {snapshot.upcomingDeadlines.map((deadline) => (
                  <DeadlineCard key={deadline.id} deadline={deadline} />
                ))}
              </Box>
            ) : (
              <EmptyState
                message="No response or milestone dates fall within the current dashboard window."
                title="No near-term deadlines"
              />
            )}
          </Stack>
        </Surface>

        <Surface
          component="article"
          sx={{ px: { xs: 2.5, sm: 3 }, py: { xs: 2.5, sm: 3 } }}
        >
          <Stack spacing={2.5}>
            <DashboardSectionHeader
              action={
                <ActionLink
                  href="/tasks"
                  label="Open task triage"
                  tone="secondary"
                />
              }
              description="Workload is organized around blocked, critical, overdue, and upcoming tasks so leads can rebalance before the queue spreads."
              eyebrow="Execution load"
              title="Task burden"
            />

            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
              }}
            >
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
            </Box>

            {snapshot.taskBurden.busiestOpportunities.length > 0 ? (
              <Stack spacing={1.5}>
                {snapshot.taskBurden.busiestOpportunities.map((item) => (
                  <TaskBurdenOpportunityCard
                    key={item.opportunityId}
                    item={item}
                  />
                ))}
              </Stack>
            ) : (
              <EmptyState
                message="The active portfolio does not currently have open tasks."
                title="No execution load yet"
              />
            )}
          </Stack>
        </Surface>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: { xs: 2.5, lg: 3 },
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1.06fr) minmax(0, 0.94fr)",
          },
        }}
      >
        <Surface
          component="article"
          tone="muted"
          sx={{ px: { xs: 2.5, sm: 3 }, py: { xs: 2.5, sm: 3 } }}
        >
          <Stack spacing={2.5}>
            <DashboardSectionHeader
              action={
                <ActionLink
                  href="/opportunities"
                  label="Review pipeline"
                  tone="secondary"
                />
              }
              description="Stage mix, conversion pressure, and aging show where the current pipeline is piling up or losing momentum."
              eyebrow="Portfolio flow"
              title="Pipeline risk"
            />

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "minmax(0, 0.92fr) minmax(0, 1.08fr)",
                },
              }}
            >
              <Stack spacing={2}>
                <Stack spacing={1.25}>
                  <Typography sx={SECTION_EYEBROW_SX}>
                    Stage distribution
                  </Typography>
                  {snapshot.stageSummaries.length > 0 ? (
                    <Box
                      sx={{
                        display: "grid",
                        gap: 1.5,
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, minmax(0, 1fr))",
                        },
                      }}
                    >
                      {snapshot.stageSummaries.map((stage) => (
                        <Surface
                          key={stage.stageKey}
                          density="compact"
                          sx={{ bgcolor: "background.paper", px: 2, py: 1.75 }}
                        >
                          <Typography sx={SECTION_EYEBROW_SX}>
                            {stage.stageLabel}
                          </Typography>
                          <Typography
                            sx={{
                              mt: 1.25,
                              fontSize: "1.85rem",
                              fontWeight: 600,
                              lineHeight: 1.05,
                            }}
                          >
                            {stage.opportunityCount}
                          </Typography>
                        </Surface>
                      ))}
                    </Box>
                  ) : (
                    <EmptyState
                      message="Run the seed workflow to populate stage summaries for the dashboard landing page."
                      title="No staged opportunities yet"
                    />
                  )}
                </Stack>

                <Stack spacing={1.25}>
                  <Typography sx={SECTION_EYEBROW_SX}>
                    Conversion pressure
                  </Typography>
                  {snapshot.pipelineConversionSummaries.length > 0 ? (
                    <Stack spacing={1.25}>
                      {snapshot.pipelineConversionSummaries.map((summary) => (
                        <ConversionRateRow
                          key={summary.key}
                          summary={summary}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <EmptyState
                      message="The current organization snapshot does not have enough pipeline history to calculate conversions yet."
                      title="No conversion analytics yet"
                    />
                  )}
                </Stack>
              </Stack>

              <Stack spacing={1.25}>
                <Typography sx={SECTION_EYEBROW_SX}>Stage aging</Typography>
                {snapshot.pipelineStageAgingSummaries.length > 0 ? (
                  <Stack spacing={1.25}>
                    {snapshot.pipelineStageAgingSummaries.map((summary) => (
                      <StageAgingCard
                        key={summary.stageKey}
                        summary={summary}
                      />
                    ))}
                  </Stack>
                ) : (
                  <EmptyState
                    message="Stage aging will appear once opportunities start moving through the active pipeline."
                    title="No active stage aging yet"
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </Surface>

        <Surface
          component="article"
          sx={{ px: { xs: 2.5, sm: 3 }, py: { xs: 2.5, sm: 3 } }}
        >
          <Stack spacing={2.5}>
            <DashboardSectionHeader
              action={
                <ActionLink
                  href="/opportunities"
                  label="Review sourced work"
                  tone="secondary"
                />
              }
              description="Source syncs stay visible so discovery momentum and import health can be reviewed beside the active pipeline."
              eyebrow="External discovery"
              title="Recent source activity"
            />

            {snapshot.recentSourceActivity.length > 0 ? (
              <Stack spacing={1.25}>
                {snapshot.recentSourceActivity.map((activity) => (
                  <SourceActivityCard key={activity.id} activity={activity} />
                ))}
              </Stack>
            ) : (
              <EmptyState
                message="Source sync runs will appear here once searches or scheduled sweeps have executed."
                title="No recent source activity"
              />
            )}
          </Stack>
        </Surface>
      </Box>
    </Stack>
  );
}

function DashboardSectionHeader({
  action,
  description,
  eyebrow,
  title,
}: {
  action?: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      sx={{ alignItems: { md: "flex-start" }, justifyContent: "space-between" }}
    >
      <Stack spacing={0.75} sx={{ maxWidth: "38rem" }}>
        <Typography sx={SECTION_EYEBROW_SX}>{eyebrow}</Typography>
        <Typography variant="h2">{title}</Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Stack>
      {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
    </Stack>
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
      density="compact"
      href={href}
      tone={tone === "primary" ? "primary" : "neutral"}
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
    <Surface component="article" density="compact" sx={{ px: 2, py: 1.75 }}>
      <Stack spacing={0.75}>
        <Typography sx={SECTION_EYEBROW_SX}>{label}</Typography>
        <Typography
          sx={{ fontSize: "1.85rem", fontWeight: 600, lineHeight: 1.05 }}
        >
          {value}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {detail}
        </Typography>
      </Stack>
    </Surface>
  );
}

function AttentionQueueCard({ item }: { item: DashboardAttentionItem }) {
  return (
    <Surface
      component="article"
      sx={{ bgcolor: "background.paper", px: 2.25, py: 2 }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            alignItems: { sm: "flex-start" },
            justifyContent: "space-between",
          }}
        >
          <Stack spacing={0.5}>
            <Typography sx={SECTION_EYEBROW_SX}>{item.stageLabel}</Typography>
            <Typography variant="h3">{item.opportunityTitle}</Typography>
          </Stack>
          <Badge sx={getAttentionToneSx(item.tone)} tone="muted">
            {item.reasonLabel}
          </Badge>
        </Stack>

        <Typography color="text.secondary" variant="body2">
          {item.supportingDetail}
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
        >
          <Typography color="text.secondary" variant="body2">
            {item.responseDeadlineAt
              ? `Deadline ${formatShortDate(item.responseDeadlineAt)}`
              : "No response deadline recorded"}
          </Typography>
          <InlineLink
            href={`/opportunities/${item.opportunityId}`}
            label="Open workspace"
          />
        </Stack>
      </Stack>
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
    <Surface component="article" sx={{ px: 2.25, py: 2 }}>
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          sx={{
            alignItems: { sm: "flex-start" },
            justifyContent: "space-between",
          }}
        >
          <Stack spacing={0.5}>
            <Typography sx={SECTION_EYEBROW_SX}>
              Priority {index + 1}
            </Typography>
            <Typography variant="h3">{opportunity.title}</Typography>
            <Typography color="text.secondary" variant="body2">
              {opportunity.currentStageLabel}
              {opportunity.leadAgency
                ? ` · ${opportunity.leadAgency.name}`
                : ""}
            </Typography>
          </Stack>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Badge tone="accent">Score {scoreValue}</Badge>
            <Badge tone={getDecisionTone(decisionLabel)}>{decisionLabel}</Badge>
          </Box>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
          }}
        >
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
        </Box>

        <InlineLink
          href={`/opportunities/${opportunity.id}`}
          label="Open workspace"
        />
      </Stack>
    </Surface>
  );
}

function OpportunitySignal({ label, value }: { label: string; value: string }) {
  return (
    <Surface
      density="compact"
      tone="muted"
      sx={{
        borderRadius: `${onesourceTokens.radius.panel}px`,
        boxShadow: "none",
        px: 1.5,
        py: 1.25,
      }}
    >
      <Typography sx={SECTION_EYEBROW_SX}>{label}</Typography>
      <Typography sx={{ mt: 1, fontSize: "0.92rem", fontWeight: 600 }}>
        {value}
      </Typography>
    </Surface>
  );
}

function DeadlineCard({ deadline }: { deadline: DashboardDeadlineSummary }) {
  return (
    <Link
      href={`/opportunities/${deadline.opportunityId}`}
      style={{ color: "inherit", display: "block", textDecoration: "none" }}
    >
      <Surface
        sx={{
          px: 2.25,
          py: 1.9,
          transition:
            "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
          "&:hover": {
            borderColor: "divider",
            boxShadow: onesourceTokens.elevation.raised,
            transform: "translateY(-1px)",
          },
        }}
      >
        <Stack spacing={1.25}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              alignItems: { sm: "flex-start" },
              justifyContent: "space-between",
            }}
          >
            <Stack spacing={0.5}>
              <Typography sx={SECTION_EYEBROW_SX}>
                {deadline.opportunityTitle}
              </Typography>
              <Typography sx={{ fontSize: "0.96rem", fontWeight: 600 }}>
                {deadline.title}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {deadline.stageLabel} · {formatShortDate(deadline.deadlineAt)}
              </Typography>
            </Stack>
            <Badge
              tone={
                deadline.deadlineType === "MILESTONE" ? "warning" : "accent"
              }
            >
              {deadline.deadlineType === "MILESTONE"
                ? "Milestone"
                : "Response deadline"}
            </Badge>
          </Stack>
        </Stack>
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
      component="article"
      density="compact"
      tone="muted"
      sx={{ px: 2, py: 1.75 }}
    >
      <Stack spacing={0.75}>
        <Typography sx={SECTION_EYEBROW_SX}>{label}</Typography>
        <Typography
          sx={{ fontSize: "1.65rem", fontWeight: 600, lineHeight: 1.05 }}
        >
          {value}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {supportingText}
        </Typography>
      </Stack>
    </Surface>
  );
}

function TaskBurdenOpportunityCard({
  item,
}: {
  item: DashboardTaskBurdenOpportunity;
}) {
  return (
    <Surface component="article" sx={{ px: 2.25, py: 1.9 }}>
      <Stack spacing={1.25}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            alignItems: { sm: "flex-start" },
            justifyContent: "space-between",
          }}
        >
          <Stack spacing={0.5}>
            <Typography sx={SECTION_EYEBROW_SX}>Busiest pursuit</Typography>
            <Typography sx={{ fontSize: "0.96rem", fontWeight: 600 }}>
              {item.opportunityTitle}
            </Typography>
          </Stack>
          <Badge tone={item.blockedTaskCount > 0 ? "danger" : "muted"}>
            {item.openTaskCount} open
          </Badge>
        </Stack>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Badge tone={item.blockedTaskCount > 0 ? "danger" : "muted"}>
            {item.blockedTaskCount} blocked
          </Badge>
          <Badge tone={item.criticalTaskCount > 0 ? "warning" : "muted"}>
            {item.criticalTaskCount} critical
          </Badge>
          <Badge tone={item.overdueTaskCount > 0 ? "danger" : "muted"}>
            {item.overdueTaskCount} overdue
          </Badge>
        </Box>

        <InlineLink
          href={`/opportunities/${item.opportunityId}`}
          label="Open workspace"
        />
      </Stack>
    </Surface>
  );
}

function ConversionRateRow({
  summary,
}: {
  summary: PipelineConversionSummary;
}) {
  return (
    <Surface component="article" density="compact" sx={{ px: 1.75, py: 1.5 }}>
      <Stack
        direction="row"
        spacing={1.25}
        sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <Stack spacing={0.5}>
          <Typography sx={SECTION_EYEBROW_SX}>{summary.label}</Typography>
          <Typography
            sx={{ fontSize: "1.65rem", fontWeight: 600, lineHeight: 1.05 }}
          >
            {formatPercent(summary.ratePercent)}
          </Typography>
        </Stack>
        <Badge tone="accent">
          {summary.numerator}/{summary.denominator}
        </Badge>
      </Stack>
    </Surface>
  );
}

function StageAgingCard({ summary }: { summary: PipelineStageAgingSummary }) {
  return (
    <Surface component="article" density="compact" sx={{ px: 2, py: 1.75 }}>
      <Stack spacing={1}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            alignItems: { sm: "flex-start" },
            justifyContent: "space-between",
          }}
        >
          <Stack spacing={0.5}>
            <Typography sx={SECTION_EYEBROW_SX}>
              {summary.stageLabel}
            </Typography>
            <Typography sx={{ fontSize: "1rem", fontWeight: 600 }}>
              Avg age {formatDayCount(summary.averageAgeDays)}
            </Typography>
          </Stack>
          <Badge tone={summary.averageAgeDays >= 14 ? "warning" : "muted"}>
            {summary.opportunityCount}{" "}
            {summary.opportunityCount === 1 ? "pursuit" : "pursuits"}
          </Badge>
        </Stack>

        <Typography color="text.secondary" variant="body2">
          Oldest current stage: {formatDayCount(summary.oldestAgeDays)} on{" "}
          {summary.oldestOpportunityTitle}
        </Typography>
      </Stack>
    </Surface>
  );
}

function SourceActivityCard({
  activity,
}: {
  activity: DashboardSourceActivitySummary;
}) {
  return (
    <Link
      href={`/opportunities?source=${encodeURIComponent(activity.sourceSystem)}`}
      style={{ color: "inherit", display: "block", textDecoration: "none" }}
    >
      <Surface
        sx={{
          px: 2.25,
          py: 1.9,
          transition:
            "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
          "&:hover": {
            borderColor: "divider",
            boxShadow: onesourceTokens.elevation.raised,
            transform: "translateY(-1px)",
          },
        }}
      >
        <Stack spacing={1.25}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              alignItems: { sm: "flex-start" },
              justifyContent: "space-between",
            }}
          >
            <Stack spacing={0.5}>
              <Typography sx={SECTION_EYEBROW_SX}>
                {activity.savedSearchName ??
                  formatSourceTrigger(activity.triggerType)}
              </Typography>
              <Typography sx={{ fontSize: "0.96rem", fontWeight: 600 }}>
                {activity.sourceDisplayName}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Requested {formatTimestamp(activity.requestedAt)}
              </Typography>
            </Stack>
            <Badge tone={getSourceStatusTone(activity.status)}>
              {formatSourceStatus(activity.status)}
            </Badge>
          </Stack>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Badge tone="muted">{activity.recordsFetched} fetched</Badge>
            <Badge tone="muted">{activity.recordsImported} imported</Badge>
            <Badge tone={activity.recordsFailed > 0 ? "danger" : "muted"}>
              {activity.recordsFailed} failed
            </Badge>
          </Box>
        </Stack>
      </Surface>
    </Link>
  );
}

function InlineLink({ href, label }: { href: string; label: string }) {
  return (
    <Button
      density="compact"
      href={href}
      tone="neutral"
      variant="text"
      sx={{ alignSelf: "flex-start", minHeight: "auto", px: 0, py: 0.25 }}
    >
      {label}
    </Button>
  );
}

function getAttentionToneSx(tone: DashboardAttentionItem["tone"]) {
  if (tone === "danger") {
    return {
      bgcolor: alpha(onesourceTokens.color.status.danger.main, 0.12),
      borderColor: alpha(onesourceTokens.color.status.danger.main, 0.18),
      color: onesourceTokens.color.status.danger.main,
    };
  }

  if (tone === "warning") {
    return {
      bgcolor: alpha(onesourceTokens.color.status.warning.main, 0.12),
      borderColor: alpha(onesourceTokens.color.status.warning.main, 0.18),
      color: onesourceTokens.color.status.warning.main,
    };
  }

  return {
    bgcolor: alpha(onesourceTokens.color.accent.main, 0.12),
    borderColor: alpha(onesourceTokens.color.accent.main, 0.18),
    color: onesourceTokens.color.accent.dark,
  };
}

function getQueueCountBadgeSx() {
  return {
    bgcolor: alpha(onesourceTokens.color.accent.main, 0.08),
    borderColor: alpha(onesourceTokens.color.accent.main, 0.14),
    color: onesourceTokens.color.accent.dark,
  };
}

function getDecisionTone(
  decisionLabel: "DEFER" | "GO" | "NO_GO" | "Pending",
): "danger" | "muted" | "success" | "warning" {
  if (decisionLabel === "GO") {
    return "success";
  }

  if (decisionLabel === "NO_GO") {
    return "danger";
  }

  if (decisionLabel === "DEFER") {
    return "warning";
  }

  return "muted";
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
