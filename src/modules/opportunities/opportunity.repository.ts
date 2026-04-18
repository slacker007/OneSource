import type {
  AgencySummary,
  CompetitorSummary,
  ContractVehicleSummary,
  DashboardDeadlineSummary,
  HomeDashboardSnapshot,
  OpportunityBidDecisionSummary,
  OpportunityMilestoneSummary,
  OpportunityScoreSummary,
  OpportunityStageSummary,
  OpportunitySummary,
  OpportunityTaskSummary,
  SourceConnectorSummary,
} from "./opportunity.types";

export const DEFAULT_ORGANIZATION_SLUG = "default-org";

const UPCOMING_DEADLINE_WINDOW_DAYS = 30;
const UPCOMING_DEADLINE_ITEM_LIMIT = 6;
const TOP_OPPORTUNITY_LIMIT = 3;
const CLOSED_PIPELINE_STAGE_KEYS = [
  "awarded",
  "lost",
  "no_bid",
  "submitted",
];

const ACTIVE_TASK_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "BLOCKED",
] satisfies OpportunityTaskSummary["status"][];

const ACTIVE_MILESTONE_STATUSES = [
  "PLANNED",
  "AT_RISK",
] satisfies OpportunityMilestoneSummary["status"][];

const organizationDashboardArgs = {
  select: {
    id: true,
    name: true,
    slug: true,
    sourceConnectorConfigs: {
      orderBy: {
        sourceDisplayName: "asc",
      },
      select: {
        id: true,
        sourceSystemKey: true,
        sourceDisplayName: true,
        authType: true,
        isEnabled: true,
        supportsSearch: true,
        supportsScheduledSync: true,
        supportsResultPreview: true,
        connectorVersion: true,
      },
    },
    opportunities: {
      orderBy: [{ responseDeadlineAt: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        currentStageKey: true,
        currentStageLabel: true,
        responseDeadlineAt: true,
        originSourceSystem: true,
        naicsCode: true,
        sourceSummaryText: true,
        leadAgency: {
          select: {
            id: true,
            name: true,
            organizationCode: true,
          },
        },
        vehicles: {
          orderBy: [{ isPrimary: "desc" }, { vehicle: { code: "asc" } }],
          select: {
            isPrimary: true,
            vehicle: {
              select: {
                id: true,
                code: true,
                name: true,
                vehicleType: true,
              },
            },
          },
        },
        competitors: {
          orderBy: {
            competitor: {
              name: "asc",
            },
          },
          select: {
            role: true,
            competitor: {
              select: {
                id: true,
                name: true,
                websiteUrl: true,
              },
            },
          },
        },
        tasks: {
          where: {
            status: {
              in: ACTIVE_TASK_STATUSES,
            },
          },
          orderBy: [{ dueAt: "asc" }, { sortOrder: "asc" }],
          take: 5,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueAt: true,
            assigneeUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        milestones: {
          where: {
            status: {
              in: ACTIVE_MILESTONE_STATUSES,
            },
          },
          orderBy: [{ targetDate: "asc" }, { sortOrder: "asc" }],
          take: 5,
          select: {
            id: true,
            title: true,
            status: true,
            targetDate: true,
          },
        },
        scorecards: {
          where: {
            isCurrent: true,
          },
          orderBy: {
            calculatedAt: "desc",
          },
          take: 1,
          select: {
            totalScore: true,
            maximumScore: true,
            recommendationOutcome: true,
            calculatedAt: true,
          },
        },
        bidDecisions: {
          where: {
            isCurrent: true,
          },
          orderBy: {
            decidedAt: "desc",
          },
          take: 1,
          select: {
            decisionTypeKey: true,
            recommendationOutcome: true,
            finalOutcome: true,
            decidedAt: true,
          },
        },
      },
    },
  },
};

export type OpportunityRepositoryClient = {
  organization: {
    findUnique(args: {
      where: {
        slug: string;
      };
    } & typeof organizationDashboardArgs): Promise<OrganizationDashboardRecord | null>;
  };
};

type OrganizationDashboardLeadAgencyRecord = {
  id: string;
  name: string;
  organizationCode: string | null;
} | null;

type OrganizationDashboardConnectorRecord = {
  id: string;
  sourceSystemKey: string;
  sourceDisplayName: string;
  authType: SourceConnectorSummary["authType"];
  isEnabled: boolean;
  supportsSearch: boolean;
  supportsScheduledSync: boolean;
  supportsResultPreview: boolean;
  connectorVersion: string | null;
};

type OrganizationDashboardOpportunityRecord = {
  id: string;
  title: string;
  currentStageKey: string | null;
  currentStageLabel: string | null;
  responseDeadlineAt: Date | null;
  originSourceSystem: string | null;
  naicsCode: string | null;
  sourceSummaryText: string | null;
  leadAgency: OrganizationDashboardLeadAgencyRecord;
  vehicles: Array<{
    isPrimary: boolean;
    vehicle: {
      id: string;
      code: string;
      name: string;
      vehicleType: string | null;
    };
  }>;
  competitors: Array<{
    role: string;
    competitor: {
      id: string;
      name: string;
      websiteUrl: string | null;
    };
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: OpportunityTaskSummary["status"];
    priority: OpportunityTaskSummary["priority"];
    dueAt: Date | null;
    assigneeUser: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    status: OpportunityMilestoneSummary["status"];
    targetDate: Date;
  }>;
  scorecards: Array<{
    totalScore: { toString(): string } | null;
    maximumScore: { toString(): string } | null;
    recommendationOutcome: OpportunityScoreSummary["recommendationOutcome"];
    calculatedAt: Date;
  }>;
  bidDecisions: Array<{
    decisionTypeKey: string | null;
    recommendationOutcome:
      OpportunityBidDecisionSummary["recommendationOutcome"];
    finalOutcome: OpportunityBidDecisionSummary["finalOutcome"];
    decidedAt: Date | null;
  }>;
};

export type OrganizationDashboardRecord = {
  id: string;
  name: string;
  slug: string;
  sourceConnectorConfigs: OrganizationDashboardConnectorRecord[];
  opportunities: OrganizationDashboardOpportunityRecord[];
};

type GetHomeDashboardSnapshotParams = {
  db: OpportunityRepositoryClient;
  organizationSlug?: string;
  now?: Date;
};

type ListOpportunitySummariesParams = {
  db: OpportunityRepositoryClient;
  organizationSlug?: string;
};

export async function listOpportunitySummaries({
  db,
  organizationSlug = DEFAULT_ORGANIZATION_SLUG,
}: ListOpportunitySummariesParams): Promise<OpportunitySummary[]> {
  const record = await loadOrganizationDashboardRecord({
    db,
    organizationSlug,
  });

  if (!record) {
    return [];
  }

  return record.opportunities.map((opportunity) =>
    mapOpportunitySummary(opportunity),
  );
}

export async function getHomeDashboardSnapshot({
  db,
  organizationSlug = DEFAULT_ORGANIZATION_SLUG,
  now = new Date(),
}: GetHomeDashboardSnapshotParams): Promise<HomeDashboardSnapshot | null> {
  const record = await loadOrganizationDashboardRecord({
    db,
    organizationSlug,
  });

  if (!record) {
    return null;
  }

  const opportunities: OpportunitySummary[] = record.opportunities.map(
    (opportunity) => mapOpportunitySummary(opportunity),
  );
  const connectors: SourceConnectorSummary[] = record.sourceConnectorConfigs.map(
    (connector) => mapConnectorSummary(connector),
  );
  const activeOpportunities = opportunities.filter(isActivePipelineOpportunity);
  const opportunitiesForAction =
    activeOpportunities.length > 0 ? activeOpportunities : opportunities;
  const upcomingDeadlines = buildUpcomingDeadlines({
    opportunities: opportunitiesForAction,
    now,
  });

  return {
    organization: {
      id: record.id,
      name: record.name,
      slug: record.slug,
    },
    connectors,
    trackedOpportunityCount: opportunities.length,
    activeOpportunityCount: activeOpportunities.length,
    upcomingDeadlineCount: upcomingDeadlines.length,
    enabledConnectorCount: connectors.filter((connector) => connector.isEnabled)
      .length,
    opportunitiesRequiringAttentionCount: opportunitiesForAction.filter(
      (opportunity) => requiresAttention(opportunity),
    ).length,
    stageSummaries: buildStageSummaries(opportunities),
    upcomingDeadlines,
    topOpportunities: [...opportunitiesForAction]
      .sort(compareTopOpportunities)
      .slice(0, TOP_OPPORTUNITY_LIMIT),
  };
}

async function loadOrganizationDashboardRecord({
  db,
  organizationSlug,
}: {
  db: OpportunityRepositoryClient;
  organizationSlug: string;
}): Promise<OrganizationDashboardRecord | null> {
  return (await db.organization.findUnique({
    where: {
      slug: organizationSlug,
    },
    ...organizationDashboardArgs,
  })) as OrganizationDashboardRecord | null;
}

function mapConnectorSummary(
  connector: OrganizationDashboardRecord["sourceConnectorConfigs"][number],
): SourceConnectorSummary {
  return {
    id: connector.id,
    sourceSystemKey: connector.sourceSystemKey,
    sourceDisplayName: connector.sourceDisplayName,
    authType: connector.authType,
    isEnabled: connector.isEnabled,
    supportsSearch: connector.supportsSearch,
    supportsScheduledSync: connector.supportsScheduledSync,
    supportsResultPreview: connector.supportsResultPreview,
    connectorVersion: connector.connectorVersion,
  };
}

function mapAgencySummary(
  agency: OrganizationDashboardRecord["opportunities"][number]["leadAgency"],
): AgencySummary | null {
  if (!agency) {
    return null;
  }

  return {
    id: agency.id,
    name: agency.name,
    organizationCode: agency.organizationCode,
  };
}

function mapVehicleSummary(
  vehicleLink: OrganizationDashboardRecord["opportunities"][number]["vehicles"][number],
): ContractVehicleSummary {
  return {
    id: vehicleLink.vehicle.id,
    code: vehicleLink.vehicle.code,
    name: vehicleLink.vehicle.name,
    vehicleType: vehicleLink.vehicle.vehicleType,
    isPrimary: vehicleLink.isPrimary,
  };
}

function mapCompetitorSummary(
  competitorLink: OrganizationDashboardRecord["opportunities"][number]["competitors"][number],
): CompetitorSummary {
  return {
    id: competitorLink.competitor.id,
    name: competitorLink.competitor.name,
    role: competitorLink.role,
    websiteUrl: competitorLink.competitor.websiteUrl,
  };
}

function mapTaskSummary(
  task: OrganizationDashboardRecord["opportunities"][number]["tasks"][number],
): OpportunityTaskSummary {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueAt: toIsoString(task.dueAt),
    assigneeName: task.assigneeUser?.name ?? task.assigneeUser?.email ?? null,
  };
}

function mapMilestoneSummary(
  milestone: OrganizationDashboardRecord["opportunities"][number]["milestones"][number],
): OpportunityMilestoneSummary {
  return {
    id: milestone.id,
    title: milestone.title,
    status: milestone.status,
    targetDate: milestone.targetDate.toISOString(),
  };
}

function mapScoreSummary(
  scorecard:
    | OrganizationDashboardRecord["opportunities"][number]["scorecards"][number]
    | undefined,
): OpportunityScoreSummary | null {
  if (!scorecard) {
    return null;
  }

  return {
    totalScore: scorecard.totalScore?.toString() ?? null,
    maximumScore: scorecard.maximumScore?.toString() ?? null,
    recommendationOutcome: scorecard.recommendationOutcome,
    calculatedAt: scorecard.calculatedAt.toISOString(),
  };
}

function mapBidDecisionSummary(
  bidDecision:
    | OrganizationDashboardRecord["opportunities"][number]["bidDecisions"][number]
    | undefined,
): OpportunityBidDecisionSummary | null {
  if (!bidDecision) {
    return null;
  }

  return {
    decisionTypeKey: bidDecision.decisionTypeKey,
    recommendationOutcome: bidDecision.recommendationOutcome,
    finalOutcome: bidDecision.finalOutcome,
    decidedAt: toIsoString(bidDecision.decidedAt),
  };
}

function mapOpportunitySummary(
  opportunity: OrganizationDashboardRecord["opportunities"][number],
): OpportunitySummary {
  return {
    id: opportunity.id,
    title: opportunity.title,
    leadAgency: mapAgencySummary(opportunity.leadAgency),
    currentStageKey: opportunity.currentStageKey,
    currentStageLabel:
      opportunity.currentStageLabel ??
      humanizeStageKey(opportunity.currentStageKey) ??
      "Unstaged",
    responseDeadlineAt: toIsoString(opportunity.responseDeadlineAt),
    originSourceSystem: opportunity.originSourceSystem,
    naicsCode: opportunity.naicsCode,
    sourceSummaryText: opportunity.sourceSummaryText,
    score: mapScoreSummary(opportunity.scorecards[0]),
    bidDecision: mapBidDecisionSummary(opportunity.bidDecisions[0]),
    vehicles: opportunity.vehicles.map(mapVehicleSummary),
    competitors: opportunity.competitors.map(mapCompetitorSummary),
    tasks: opportunity.tasks
      .map(mapTaskSummary)
      .sort(compareTaskSummaries),
    milestones: opportunity.milestones
      .map(mapMilestoneSummary)
      .sort(compareMilestoneSummaries),
  };
}

function buildStageSummaries(
  opportunities: OpportunitySummary[],
): OpportunityStageSummary[] {
  const counts = new Map<string, OpportunityStageSummary>();

  for (const opportunity of opportunities) {
    const stageKey = opportunity.currentStageKey ?? "unstaged";
    const existing = counts.get(stageKey);

    if (existing) {
      existing.opportunityCount += 1;
      continue;
    }

    counts.set(stageKey, {
      stageKey,
      stageLabel: opportunity.currentStageLabel,
      opportunityCount: 1,
    });
  }

  return Array.from(counts.values()).sort((left, right) => {
    if (right.opportunityCount !== left.opportunityCount) {
      return right.opportunityCount - left.opportunityCount;
    }

    return left.stageLabel.localeCompare(right.stageLabel);
  });
}

function requiresAttention(opportunity: OpportunitySummary) {
  return opportunity.tasks.some(
    (task) => task.priority === "CRITICAL" || task.status === "BLOCKED",
  );
}

function isActivePipelineOpportunity(opportunity: OpportunitySummary) {
  if (!opportunity.currentStageKey) {
    return true;
  }

  return !CLOSED_PIPELINE_STAGE_KEYS.includes(opportunity.currentStageKey);
}

function buildUpcomingDeadlines({
  opportunities,
  now,
}: {
  opportunities: OpportunitySummary[];
  now: Date;
}): DashboardDeadlineSummary[] {
  const deadlines: DashboardDeadlineSummary[] = [];

  for (const opportunity of opportunities) {
    if (isWithinUpcomingWindow(opportunity.responseDeadlineAt, now)) {
      deadlines.push({
        id: `${opportunity.id}:response-deadline`,
        title: "Response deadline",
        deadlineAt: opportunity.responseDeadlineAt as string,
        deadlineType: "RESPONSE_DEADLINE",
        opportunityId: opportunity.id,
        opportunityTitle: opportunity.title,
        stageLabel: opportunity.currentStageLabel,
      });
    }

    for (const milestone of opportunity.milestones) {
      if (!isWithinUpcomingWindow(milestone.targetDate, now)) {
        continue;
      }

      deadlines.push({
        id: `${opportunity.id}:milestone:${milestone.id}`,
        title: milestone.title,
        deadlineAt: milestone.targetDate,
        deadlineType: "MILESTONE",
        opportunityId: opportunity.id,
        opportunityTitle: opportunity.title,
        stageLabel: opportunity.currentStageLabel,
      });
    }
  }

  return deadlines
    .sort(compareDashboardDeadlines)
    .slice(0, UPCOMING_DEADLINE_ITEM_LIMIT);
}

function compareDashboardDeadlines(
  left: DashboardDeadlineSummary,
  right: DashboardDeadlineSummary,
) {
  const deadlineComparison = left.deadlineAt.localeCompare(right.deadlineAt);

  if (deadlineComparison !== 0) {
    return deadlineComparison;
  }

  return left.opportunityTitle.localeCompare(right.opportunityTitle);
}

function compareTopOpportunities(
  left: OpportunitySummary,
  right: OpportunitySummary,
) {
  const scoreComparison =
    getScoreValue(right.score?.totalScore) - getScoreValue(left.score?.totalScore);

  if (scoreComparison !== 0) {
    return scoreComparison;
  }

  const decisionComparison =
    getDecisionRank(left.bidDecision?.finalOutcome) -
    getDecisionRank(right.bidDecision?.finalOutcome);

  if (decisionComparison !== 0) {
    return decisionComparison;
  }

  const leftDeadline = left.responseDeadlineAt;
  const rightDeadline = right.responseDeadlineAt;

  if (leftDeadline && rightDeadline) {
    return leftDeadline.localeCompare(rightDeadline);
  }

  if (leftDeadline) {
    return -1;
  }

  if (rightDeadline) {
    return 1;
  }

  return left.title.localeCompare(right.title);
}

function getScoreValue(score: string | null | undefined) {
  if (!score) {
    return -1;
  }

  const parsed = Number.parseFloat(score);
  return Number.isFinite(parsed) ? parsed : -1;
}

function getDecisionRank(
  decision: OpportunityBidDecisionSummary["finalOutcome"] | undefined,
) {
  switch (decision) {
    case "GO":
      return 0;
    case "DEFER":
      return 1;
    case "NO_GO":
      return 2;
    default:
      return 3;
  }
}

function compareTaskSummaries(
  left: OpportunityTaskSummary,
  right: OpportunityTaskSummary,
) {
  if (left.dueAt && right.dueAt) {
    return left.dueAt.localeCompare(right.dueAt);
  }

  if (left.dueAt) {
    return -1;
  }

  if (right.dueAt) {
    return 1;
  }

  return left.title.localeCompare(right.title);
}

function compareMilestoneSummaries(
  left: OpportunityMilestoneSummary,
  right: OpportunityMilestoneSummary,
) {
  return left.targetDate.localeCompare(right.targetDate);
}

function isWithinUpcomingWindow(
  isoDate: string | null,
  now: Date,
  windowDays = UPCOMING_DEADLINE_WINDOW_DAYS,
) {
  if (!isoDate) {
    return false;
  }

  const targetDate = new Date(isoDate);
  const windowEnd = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

  return targetDate >= now && targetDate <= windowEnd;
}

function humanizeStageKey(stageKey: string | null) {
  if (!stageKey) {
    return null;
  }

  return stageKey
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function toIsoString(value: Date | null) {
  return value?.toISOString() ?? null;
}
