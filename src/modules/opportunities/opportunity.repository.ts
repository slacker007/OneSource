import { z } from "zod";

import type {
  AgencySummary,
  CompetitorSummary,
  ContractVehicleSummary,
  DashboardDeadlineSummary,
  HomeDashboardSnapshot,
  OpportunityListDueWindow,
  OpportunityListQuery,
  OpportunityListSnapshot,
  OpportunityListSort,
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
export const OPPORTUNITY_LIST_PAGE_SIZE = 4;
const CLOSED_PIPELINE_STAGE_KEYS = [
  "awarded",
  "lost",
  "no_bid",
  "submitted",
];
const OPPORTUNITY_LIST_DUE_WINDOWS = [
  "all",
  "overdue",
  "next_30_days",
  "next_60_days",
  "no_deadline",
] as const satisfies OpportunityListDueWindow[];
const OPPORTUNITY_LIST_SORTS = [
  "updated_desc",
  "deadline_asc",
  "deadline_desc",
  "title_asc",
  "stage_asc",
] as const satisfies OpportunityListSort[];

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
        solicitationNumber: true,
        currentStageKey: true,
        currentStageLabel: true,
        responseDeadlineAt: true,
        originSourceSystem: true,
        naicsCode: true,
        sourceSummaryText: true,
        updatedAt: true,
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
  solicitationNumber: string | null;
  currentStageKey: string | null;
  currentStageLabel: string | null;
  responseDeadlineAt: Date | null;
  originSourceSystem: string | null;
  naicsCode: string | null;
  sourceSummaryText: string | null;
  updatedAt: Date;
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

const opportunityListSearchParamsSchema = z.object({
  agency: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform(normalizeOptionalString),
  due: z.enum(OPPORTUNITY_LIST_DUE_WINDOWS).optional().default("all"),
  naics: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform(normalizeOptionalString),
  page: z.coerce.number().int().min(1).max(999).optional().default(1),
  q: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform(normalizeOptionalString),
  sort: z.enum(OPPORTUNITY_LIST_SORTS).optional().default("updated_desc"),
  source: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform(normalizeOptionalString),
  stage: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform(normalizeOptionalString),
});

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

export function parseOpportunityListSearchParams(
  searchParams:
    | Record<string, string | string[] | undefined>
    | undefined,
): OpportunityListQuery {
  const parsed = opportunityListSearchParamsSchema.parse({
    agency: getFirstSearchParamValue(searchParams?.agency),
    due: getFirstSearchParamValue(searchParams?.due),
    naics: getFirstSearchParamValue(searchParams?.naics),
    page: getFirstSearchParamValue(searchParams?.page),
    q: getFirstSearchParamValue(searchParams?.q),
    sort: getFirstSearchParamValue(searchParams?.sort),
    source: getFirstSearchParamValue(searchParams?.source),
    stage: getFirstSearchParamValue(searchParams?.stage),
  });

  return {
    query: parsed.q,
    agencyId: parsed.agency,
    naicsCode: parsed.naics,
    stageKey: parsed.stage,
    sourceSystem: parsed.source,
    dueWindow: parsed.due,
    sort: parsed.sort,
    page: parsed.page,
    pageSize: OPPORTUNITY_LIST_PAGE_SIZE,
  };
}

export async function getOpportunityListSnapshot({
  db,
  organizationSlug = DEFAULT_ORGANIZATION_SLUG,
  query,
  now = new Date(),
}: {
  db: OpportunityRepositoryClient;
  organizationSlug?: string;
  query: OpportunityListQuery;
  now?: Date;
}): Promise<OpportunityListSnapshot | null> {
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
  const filteredOpportunities = filterOpportunitySummaries({
    opportunities,
    query,
    now,
  });
  const sortedOpportunities = sortOpportunitySummaries({
    opportunities: filteredOpportunities,
    query,
  });
  const pageCount = Math.max(
    1,
    Math.ceil(sortedOpportunities.length / query.pageSize),
  );
  const page = Math.min(query.page, pageCount);
  const startIndex = (page - 1) * query.pageSize;
  const sourceDisplayLabelBySystem = buildSourceDisplayLabelMap(record);

  return {
    organization: {
      id: record.id,
      name: record.name,
      slug: record.slug,
    },
    query: {
      ...query,
      page,
    },
    totalCount: sortedOpportunities.length,
    pageCount,
    pageResultCount: Math.max(
      0,
      Math.min(sortedOpportunities.length - startIndex, query.pageSize),
    ),
    availableFilterCount: countActiveOpportunityListFilters(query),
    results: sortedOpportunities
      .slice(startIndex, startIndex + query.pageSize)
      .map((opportunity) => ({
        ...opportunity,
        sourceDisplayLabel: resolveSourceDisplayLabel({
          originSourceSystem: opportunity.originSourceSystem,
          sourceDisplayLabelBySystem,
        }),
      })),
    filterOptions: {
      agencies: buildAgencyFilterOptions(opportunities),
      stages: buildStageFilterOptions(opportunities),
      sources: buildSourceFilterOptions({
        opportunities,
        sourceDisplayLabelBySystem,
      }),
      dueWindows: [
        { value: "all", label: "All deadlines" },
        { value: "overdue", label: "Overdue" },
        { value: "next_30_days", label: "Next 30 days" },
        { value: "next_60_days", label: "Next 60 days" },
        { value: "no_deadline", label: "No deadline" },
      ],
      sortOptions: [
        { value: "updated_desc", label: "Recently updated" },
        { value: "deadline_asc", label: "Deadline: soonest first" },
        { value: "deadline_desc", label: "Deadline: latest first" },
        { value: "title_asc", label: "Title: A to Z" },
        { value: "stage_asc", label: "Stage: A to Z" },
      ],
    },
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
    solicitationNumber: opportunity.solicitationNumber,
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
    updatedAt: opportunity.updatedAt.toISOString(),
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

function buildAgencyFilterOptions(opportunities: OpportunitySummary[]) {
  const counts = new Map<string, { count: number; label: string }>();

  for (const opportunity of opportunities) {
    if (!opportunity.leadAgency) {
      continue;
    }

    const existing = counts.get(opportunity.leadAgency.id);

    if (existing) {
      existing.count += 1;
      continue;
    }

    counts.set(opportunity.leadAgency.id, {
      label:
        opportunity.leadAgency.organizationCode != null
          ? `${opportunity.leadAgency.name} (${opportunity.leadAgency.organizationCode})`
          : opportunity.leadAgency.name,
      count: 1,
    });
  }

  return Array.from(counts.entries())
    .map(([value, option]) => ({
      value,
      label: option.label,
      count: option.count,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function buildSourceDisplayLabelMap(record: OrganizationDashboardRecord) {
  const labels = new Map<string, string>();

  for (const connector of record.sourceConnectorConfigs) {
    labels.set(connector.sourceSystemKey, connector.sourceDisplayName);
  }

  return labels;
}

function buildSourceFilterOptions({
  opportunities,
  sourceDisplayLabelBySystem,
}: {
  opportunities: OpportunitySummary[];
  sourceDisplayLabelBySystem: Map<string, string>;
}) {
  const counts = new Map<string, { count: number; label: string }>();

  for (const opportunity of opportunities) {
    const sourceSystem = opportunity.originSourceSystem ?? "manual_entry";
    const existing = counts.get(sourceSystem);

    if (existing) {
      existing.count += 1;
      continue;
    }

    counts.set(sourceSystem, {
      label: resolveSourceDisplayLabel({
        originSourceSystem: sourceSystem,
        sourceDisplayLabelBySystem,
      }),
      count: 1,
    });
  }

  return Array.from(counts.entries())
    .map(([value, option]) => ({
      value,
      label: option.label,
      count: option.count,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function buildStageFilterOptions(opportunities: OpportunitySummary[]) {
  const counts = new Map<string, { count: number; label: string }>();

  for (const opportunity of opportunities) {
    const stageKey = opportunity.currentStageKey ?? "unstaged";
    const existing = counts.get(stageKey);

    if (existing) {
      existing.count += 1;
      continue;
    }

    counts.set(stageKey, {
      label: opportunity.currentStageLabel,
      count: 1,
    });
  }

  return Array.from(counts.entries())
    .map(([value, option]) => ({
      value,
      label: option.label,
      count: option.count,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function countActiveOpportunityListFilters(query: OpportunityListQuery) {
  let count = 0;

  if (query.query) {
    count += 1;
  }

  if (query.agencyId) {
    count += 1;
  }

  if (query.naicsCode) {
    count += 1;
  }

  if (query.stageKey) {
    count += 1;
  }

  if (query.sourceSystem) {
    count += 1;
  }

  if (query.dueWindow !== "all") {
    count += 1;
  }

  if (query.sort !== "updated_desc") {
    count += 1;
  }

  return count;
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

function filterOpportunitySummaries({
  opportunities,
  query,
  now,
}: {
  opportunities: OpportunitySummary[];
  query: OpportunityListQuery;
  now: Date;
}) {
  return opportunities.filter((opportunity) => {
    if (query.query && !matchesOpportunityQuery(opportunity, query.query)) {
      return false;
    }

    if (query.agencyId && opportunity.leadAgency?.id !== query.agencyId) {
      return false;
    }

    if (
      query.naicsCode &&
      !opportunity.naicsCode
        ?.toLowerCase()
        .includes(query.naicsCode.toLowerCase())
    ) {
      return false;
    }

    if (query.stageKey) {
      const opportunityStageKey = opportunity.currentStageKey ?? "unstaged";

      if (opportunityStageKey !== query.stageKey) {
        return false;
      }
    }

    if (query.sourceSystem) {
      const opportunitySourceSystem =
        opportunity.originSourceSystem ?? "manual_entry";

      if (opportunitySourceSystem !== query.sourceSystem) {
        return false;
      }
    }

    if (!matchesDueWindow(opportunity.responseDeadlineAt, query.dueWindow, now)) {
      return false;
    }

    return true;
  });
}

function getFirstSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function matchesDueWindow(
  isoDate: string | null,
  dueWindow: OpportunityListDueWindow,
  now: Date,
) {
  if (dueWindow === "all") {
    return true;
  }

  if (dueWindow === "no_deadline") {
    return isoDate == null;
  }

  if (!isoDate) {
    return false;
  }

  const deadline = new Date(isoDate);

  if (dueWindow === "overdue") {
    return deadline < now;
  }

  const windowDays = dueWindow === "next_30_days" ? 30 : 60;
  const windowEnd = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

  return deadline >= now && deadline <= windowEnd;
}

function matchesOpportunityQuery(opportunity: OpportunitySummary, query: string) {
  const normalizedQuery = query.toLowerCase();

  return [
    opportunity.title,
    opportunity.solicitationNumber,
    opportunity.leadAgency?.name ?? null,
    opportunity.leadAgency?.organizationCode ?? null,
    opportunity.sourceSummaryText,
    opportunity.naicsCode,
  ].some((value) => value?.toLowerCase().includes(normalizedQuery));
}

function normalizeOptionalString(value: string | undefined) {
  if (!value) {
    return null;
  }

  return value.length > 0 ? value : null;
}

function resolveSourceDisplayLabel({
  originSourceSystem,
  sourceDisplayLabelBySystem,
}: {
  originSourceSystem: string | null;
  sourceDisplayLabelBySystem: Map<string, string>;
}) {
  if (!originSourceSystem || originSourceSystem === "manual_entry") {
    return "Manual entry";
  }

  return (
    sourceDisplayLabelBySystem.get(originSourceSystem) ??
    humanizeSourceSystem(originSourceSystem)
  );
}

function sortOpportunitySummaries({
  opportunities,
  query,
}: {
  opportunities: OpportunitySummary[];
  query: OpportunityListQuery;
}) {
  return [...opportunities].sort((left, right) => {
    switch (query.sort) {
      case "deadline_asc":
        return compareNullableIsoDates(
          left.responseDeadlineAt,
          right.responseDeadlineAt,
        );
      case "deadline_desc":
        return compareNullableIsoDates(
          right.responseDeadlineAt,
          left.responseDeadlineAt,
        );
      case "title_asc":
        return left.title.localeCompare(right.title);
      case "stage_asc":
        return left.currentStageLabel.localeCompare(right.currentStageLabel);
      case "updated_desc":
      default:
        return right.updatedAt.localeCompare(left.updatedAt);
    }
  });
}

function compareNullableIsoDates(left: string | null, right: string | null) {
  if (left && right) {
    return left.localeCompare(right);
  }

  if (left) {
    return -1;
  }

  if (right) {
    return 1;
  }

  return 0;
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

function humanizeSourceSystem(sourceSystem: string) {
  return sourceSystem
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function toIsoString(value: Date | null) {
  return value?.toISOString() ?? null;
}
