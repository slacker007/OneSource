import { z } from "zod";

import {
  calculateOpportunityScore,
  type CalculatedOpportunityScorecard,
  type OrganizationScoringProfileInput,
  SCORING_FACTOR_KEYS,
} from "./opportunity-scoring";
import type {
  AgencySummary,
  CompetitorSummary,
  ContractVehicleSummary,
  DashboardDeadlineSummary,
  HomeDashboardSnapshot,
  OpportunityTaskAssigneeOption,
  OpportunityWorkspaceActivity,
  OpportunityWorkspaceBidDecision,
  OpportunityWorkspaceDocument,
  OpportunityListDueWindow,
  OpportunityListQuery,
  OpportunityListSnapshot,
  OpportunityListSort,
  OpportunityWorkspaceMilestone,
  OpportunityWorkspaceNote,
  OpportunityWorkspaceScoreFactor,
  OpportunityWorkspaceScorecard,
  OpportunityWorkspaceSnapshot,
  OpportunityWorkspaceStageTransition,
  OpportunityWorkspaceTask,
  OpportunityBidDecisionSummary,
  OpportunityMilestoneSummary,
  PersonalTaskBoardItem,
  PersonalTaskBoardSnapshot,
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

const organizationScoringProfileSelect = {
  select: {
    activeScoringModelKey: true,
    activeScoringModelVersion: true,
    strategicFocus: true,
    targetNaicsCodes: true,
    priorityAgencyIds: true,
    relationshipAgencyIds: true,
    capabilities: {
      where: {
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { capabilityLabel: "asc" }],
      select: {
        capabilityKey: true,
        capabilityLabel: true,
        capabilityCategory: true,
        capabilityKeywords: true,
      },
    },
    certifications: {
      where: {
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { certificationLabel: "asc" }],
      select: {
        certificationKey: true,
        certificationLabel: true,
        certificationCode: true,
      },
    },
    selectedVehicles: {
      orderBy: [{ isPreferred: "desc" }, { sortOrder: "asc" }],
      select: {
        isPreferred: true,
        vehicle: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    },
    scoringCriteria: {
      where: {
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { factorLabel: "asc" }],
      select: {
        factorKey: true,
        factorLabel: true,
        weight: true,
      },
    },
  },
} as const;

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
    organizationProfile: organizationScoringProfileSelect,
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
        isActiveSourceRecord: true,
        isArchivedSourceRecord: true,
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
            deadlineReminderState: true,
            deadlineReminderUpdatedAt: true,
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
            deadlineReminderState: true,
            deadlineReminderUpdatedAt: true,
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

const opportunityWorkspaceArgs = {
  select: {
    id: true,
    title: true,
    description: true,
    externalNoticeId: true,
    solicitationNumber: true,
    sourceSummaryText: true,
    sourceSummaryUrl: true,
    postedAt: true,
    responseDeadlineAt: true,
    originSourceSystem: true,
    naicsCode: true,
    isActiveSourceRecord: true,
    isArchivedSourceRecord: true,
    classificationCode: true,
    setAsideDescription: true,
    currentStageKey: true,
    currentStageLabel: true,
    currentStageChangedAt: true,
    updatedAt: true,
    uiLink: true,
    officeCity: true,
    officeState: true,
    officePostalCode: true,
    placeOfPerformanceCityName: true,
    placeOfPerformanceStateName: true,
    placeOfPerformancePostalCode: true,
    organization: {
      select: {
        id: true,
        name: true,
        slug: true,
        organizationProfile: organizationScoringProfileSelect,
        users: {
          where: {
            status: {
              not: "DISABLED",
            },
          },
          orderBy: [{ name: "asc" }, { email: "asc" }],
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    },
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
      orderBy: [{ sortOrder: "asc" }, { dueAt: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueAt: true,
        startedAt: true,
        completedAt: true,
        deadlineReminderState: true,
        deadlineReminderUpdatedAt: true,
        createdByUser: {
          select: {
            name: true,
            email: true,
          },
        },
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
      orderBy: [{ sortOrder: "asc" }, { targetDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        milestoneTypeKey: true,
        status: true,
        targetDate: true,
        completedAt: true,
        deadlineReminderState: true,
        deadlineReminderUpdatedAt: true,
      },
    },
    notes: {
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        body: true,
        contentFormat: true,
        isPinned: true,
        createdAt: true,
        updatedAt: true,
        authorUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    },
    documents: {
      orderBy: [{ createdAt: "desc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        documentType: true,
        sourceType: true,
        sourceUrl: true,
        originalFileName: true,
        mimeType: true,
        fileSizeBytes: true,
        extractionStatus: true,
        extractedAt: true,
        extractedText: true,
        createdAt: true,
        uploadedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    },
    activityEvents: {
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      take: 12,
      select: {
        id: true,
        eventType: true,
        title: true,
        description: true,
        actorIdentifier: true,
        relatedEntityType: true,
        occurredAt: true,
        actorUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    },
    stageTransitions: {
      orderBy: [{ transitionedAt: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        triggerType: true,
        fromStageLabel: true,
        toStageLabel: true,
        rationale: true,
        transitionedAt: true,
        actorUser: {
          select: {
            name: true,
            email: true,
          },
        },
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
        scoringModelKey: true,
        scoringModelVersion: true,
        totalScore: true,
        maximumScore: true,
        scorePercent: true,
        recommendationOutcome: true,
        recommendationSummary: true,
        summary: true,
        calculatedAt: true,
        factorScores: {
          orderBy: [{ sortOrder: "asc" }, { factorLabel: "asc" }],
          select: {
            id: true,
            factorKey: true,
            factorLabel: true,
            weight: true,
            score: true,
            maximumScore: true,
            explanation: true,
          },
        },
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
        recommendationSummary: true,
        finalRationale: true,
        recommendedAt: true,
        recommendedByIdentifier: true,
        decidedAt: true,
        decidedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    },
  },
};

const personalTaskBoardArgs = {
  select: {
    id: true,
    name: true,
    email: true,
    organization: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
    assignedOpportunityTasks: {
      orderBy: [{ dueAt: "asc" }, { priority: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueAt: true,
        startedAt: true,
        completedAt: true,
        deadlineReminderState: true,
        deadlineReminderUpdatedAt: true,
        assigneeUserId: true,
        createdByUser: {
          select: {
            name: true,
            email: true,
          },
        },
        assigneeUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            currentStageLabel: true,
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

export type OpportunityWorkspaceRepositoryClient = {
  opportunity: {
    findFirst(args: {
      where: {
        id: string;
        organization: {
          slug: string;
        };
      };
    } & typeof opportunityWorkspaceArgs): Promise<OpportunityWorkspaceRecord | null>;
  };
};

export type PersonalTaskBoardRepositoryClient = {
  user: {
    findFirst(args: {
      where: {
        id: string;
        organization: {
          slug: string;
        };
      };
    } & typeof personalTaskBoardArgs): Promise<PersonalTaskBoardRecord | null>;
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

type OrganizationScoringProfileRecord = {
  activeScoringModelKey: string;
  activeScoringModelVersion: string;
  strategicFocus: string | null;
  targetNaicsCodes: string[];
  priorityAgencyIds: string[];
  relationshipAgencyIds: string[];
  capabilities: Array<{
    capabilityKey: string;
    capabilityLabel: string;
    capabilityCategory: string | null;
    capabilityKeywords: string[];
  }>;
  certifications: Array<{
    certificationKey: string;
    certificationLabel: string;
    certificationCode: string | null;
  }>;
  selectedVehicles: Array<{
    isPreferred: boolean;
    vehicle: {
      id: string;
      code: string;
      name: string;
    };
  }>;
  scoringCriteria: Array<{
    factorKey: string;
    factorLabel: string;
    weight: { toString(): string };
  }>;
} | null;

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
  isActiveSourceRecord: boolean;
  isArchivedSourceRecord: boolean;
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
    deadlineReminderState: OpportunityTaskSummary["deadlineReminderState"];
    deadlineReminderUpdatedAt: Date | null;
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
    deadlineReminderState: OpportunityMilestoneSummary["deadlineReminderState"];
    deadlineReminderUpdatedAt: Date | null;
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
  organizationProfile: OrganizationScoringProfileRecord;
  sourceConnectorConfigs: OrganizationDashboardConnectorRecord[];
  opportunities: OrganizationDashboardOpportunityRecord[];
};

export type OpportunityWorkspaceRecord = {
  id: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    organizationProfile: OrganizationScoringProfileRecord;
    users: Array<{
      id: string;
      name: string | null;
      email: string;
    }>;
  };
  title: string;
  description: string | null;
  externalNoticeId: string | null;
  solicitationNumber: string | null;
  sourceSummaryText: string | null;
  sourceSummaryUrl: string | null;
  postedAt: Date | null;
  responseDeadlineAt: Date | null;
  originSourceSystem: string | null;
  naicsCode: string | null;
  isActiveSourceRecord: boolean;
  isArchivedSourceRecord: boolean;
  classificationCode: string | null;
  setAsideDescription: string | null;
  currentStageKey: string | null;
  currentStageLabel: string | null;
  currentStageChangedAt: Date | null;
  updatedAt: Date;
  uiLink: string | null;
  officeCity: string | null;
  officeState: string | null;
  officePostalCode: string | null;
  placeOfPerformanceCityName: string | null;
  placeOfPerformanceStateName: string | null;
  placeOfPerformancePostalCode: string | null;
  leadAgency: OrganizationDashboardLeadAgencyRecord;
  vehicles: OrganizationDashboardOpportunityRecord["vehicles"];
  competitors: OrganizationDashboardOpportunityRecord["competitors"];
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    status: OpportunityTaskSummary["status"];
    priority: OpportunityTaskSummary["priority"];
    dueAt: Date | null;
    startedAt: Date | null;
    completedAt: Date | null;
    deadlineReminderState: OpportunityTaskSummary["deadlineReminderState"];
    deadlineReminderUpdatedAt: Date | null;
    createdByUser: {
      name: string | null;
      email: string;
    } | null;
    assigneeUser: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    description: string | null;
    milestoneTypeKey: string | null;
    status: OpportunityMilestoneSummary["status"];
    targetDate: Date;
    completedAt: Date | null;
    deadlineReminderState: OpportunityMilestoneSummary["deadlineReminderState"];
    deadlineReminderUpdatedAt: Date | null;
  }>;
  notes: Array<{
    id: string;
    title: string | null;
    body: string;
    contentFormat: string;
    isPinned: boolean;
    createdAt: Date;
    updatedAt: Date;
    authorUser: {
      name: string | null;
      email: string;
    } | null;
  }>;
  documents: Array<{
    id: string;
    title: string;
    documentType: string | null;
    sourceType: string;
    sourceUrl: string | null;
    originalFileName: string | null;
    mimeType: string | null;
    fileSizeBytes: number | null;
    extractionStatus: string;
    extractedAt: Date | null;
    extractedText: string | null;
    createdAt: Date;
    uploadedByUser: {
      name: string | null;
      email: string;
    } | null;
  }>;
  activityEvents: Array<{
    id: string;
    eventType: string;
    title: string;
    description: string | null;
    actorIdentifier: string | null;
    relatedEntityType: string | null;
    occurredAt: Date;
    actorUser: {
      name: string | null;
      email: string;
    } | null;
  }>;
  stageTransitions: Array<{
    id: string;
    triggerType: string;
    fromStageLabel: string | null;
    toStageLabel: string | null;
    rationale: string | null;
    transitionedAt: Date;
    actorUser: {
      name: string | null;
      email: string;
    } | null;
  }>;
  scorecards: Array<{
    scoringModelKey: string | null;
    scoringModelVersion: string | null;
    totalScore: { toString(): string } | null;
    maximumScore: { toString(): string } | null;
    scorePercent: { toString(): string } | null;
    recommendationOutcome: OpportunityScoreSummary["recommendationOutcome"];
    recommendationSummary: string | null;
    summary: string | null;
    calculatedAt: Date;
    factorScores: Array<{
      id: string;
      factorKey: string;
      factorLabel: string;
      weight: { toString(): string } | null;
      score: { toString(): string } | null;
      maximumScore: { toString(): string } | null;
      explanation: string | null;
    }>;
  }>;
  bidDecisions: Array<{
    decisionTypeKey: string | null;
    recommendationOutcome:
      OpportunityBidDecisionSummary["recommendationOutcome"];
    finalOutcome: OpportunityBidDecisionSummary["finalOutcome"];
    recommendationSummary: string | null;
    finalRationale: string | null;
    recommendedAt: Date | null;
    recommendedByIdentifier: string | null;
    decidedAt: Date | null;
    decidedByUser: {
      name: string | null;
      email: string;
    } | null;
  }>;
};

export type PersonalTaskBoardRecord = {
  id: string;
  name: string | null;
  email: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  assignedOpportunityTasks: Array<OpportunityWorkspaceRecord["tasks"][number] & {
    opportunity: {
      id: string;
      title: string;
      currentStageLabel: string | null;
    };
  }>;
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

  const referenceDate = new Date();

  return record.opportunities.map((opportunity) =>
    mapOpportunitySummary({
      opportunity,
      organizationProfile: record.organizationProfile,
      referenceDate,
    }),
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
    (opportunity) =>
      mapOpportunitySummary({
        opportunity,
        organizationProfile: record.organizationProfile,
        referenceDate: now,
      }),
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
    (opportunity) =>
      mapOpportunitySummary({
        opportunity,
        organizationProfile: record.organizationProfile,
        referenceDate: now,
      }),
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

export async function getOpportunityWorkspaceSnapshot({
  db,
  opportunityId,
  organizationSlug = DEFAULT_ORGANIZATION_SLUG,
}: {
  db: OpportunityWorkspaceRepositoryClient;
  opportunityId: string;
  organizationSlug?: string;
}): Promise<OpportunityWorkspaceSnapshot | null> {
  const record = await loadOpportunityWorkspaceRecord({
    db,
    opportunityId,
    organizationSlug,
  });

  if (!record) {
    return null;
  }

  const referenceDate = new Date();
  const resolvedScorecard = resolveWorkspaceScorecard({
    opportunity: record,
    organizationProfile: record.organization.organizationProfile,
    referenceDate,
  });

  return {
    organization: {
      id: record.organization.id,
      name: record.organization.name,
      slug: record.organization.slug,
    },
    opportunity: mapOpportunityWorkspaceSummary({
      opportunity: record,
      scoreSummary: mapScoreSummary(record.scorecards[0], resolvedScorecard),
    }),
    scorecard: mapWorkspaceScorecard(record.scorecards[0], resolvedScorecard),
    bidDecision: mapWorkspaceBidDecision(record.bidDecisions[0]),
    taskAssigneeOptions: record.organization.users.map(mapTaskAssigneeOption),
    tasks: record.tasks.map(mapWorkspaceTask),
    milestones: record.milestones.map(mapWorkspaceMilestone),
    documents: record.documents.map(mapWorkspaceDocument),
    notes: record.notes.map(mapWorkspaceNote),
    activity: record.activityEvents.map(mapWorkspaceActivity),
    stageTransitions: record.stageTransitions.map(mapWorkspaceStageTransition),
  };
}

export async function getPersonalTaskBoardSnapshot({
  db,
  userId,
  organizationSlug = DEFAULT_ORGANIZATION_SLUG,
}: {
  db: PersonalTaskBoardRepositoryClient;
  userId: string;
  organizationSlug?: string;
}): Promise<PersonalTaskBoardSnapshot | null> {
  const record = await loadPersonalTaskBoardRecord({
    db,
    organizationSlug,
    userId,
  });

  if (!record) {
    return null;
  }

  const tasks = record.assignedOpportunityTasks
    .map((task) => mapPersonalTaskBoardItem(task))
    .sort(comparePersonalTaskBoardItems);

  return {
    organization: {
      id: record.organization.id,
      name: record.organization.name,
      slug: record.organization.slug,
    },
    userDisplayName:
      formatPersonLabel({
        name: record.name,
        email: record.email,
      }) ?? record.email,
    assignedTaskCount: tasks.length,
    completedTaskCount: tasks.filter((task) => task.status === "COMPLETED")
      .length,
    overdueTaskCount: tasks.filter(
      (task) => task.deadlineReminderState === "OVERDUE",
    ).length,
    tasks,
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

async function loadOpportunityWorkspaceRecord({
  db,
  opportunityId,
  organizationSlug,
}: {
  db: OpportunityWorkspaceRepositoryClient;
  opportunityId: string;
  organizationSlug: string;
}): Promise<OpportunityWorkspaceRecord | null> {
  return (await db.opportunity.findFirst({
    where: {
      id: opportunityId,
      organization: {
        slug: organizationSlug,
      },
    },
    ...opportunityWorkspaceArgs,
  })) as OpportunityWorkspaceRecord | null;
}

async function loadPersonalTaskBoardRecord({
  db,
  userId,
  organizationSlug,
}: {
  db: PersonalTaskBoardRepositoryClient;
  userId: string;
  organizationSlug: string;
}): Promise<PersonalTaskBoardRecord | null> {
  return (await db.user.findFirst({
    where: {
      id: userId,
      organization: {
        slug: organizationSlug,
      },
    },
    ...personalTaskBoardArgs,
  })) as PersonalTaskBoardRecord | null;
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
    deadlineReminderState: task.deadlineReminderState,
    deadlineReminderUpdatedAt: toIsoString(task.deadlineReminderUpdatedAt),
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
    deadlineReminderState: milestone.deadlineReminderState,
    deadlineReminderUpdatedAt: toIsoString(milestone.deadlineReminderUpdatedAt),
  };
}

function mapOrganizationScoringProfile(
  profile: OrganizationScoringProfileRecord,
): OrganizationScoringProfileInput | null {
  if (!profile) {
    return null;
  }

  return {
    activeScoringModelKey: profile.activeScoringModelKey,
    activeScoringModelVersion: profile.activeScoringModelVersion,
    strategicFocus: profile.strategicFocus,
    targetNaicsCodes: profile.targetNaicsCodes,
    priorityAgencyIds: profile.priorityAgencyIds,
    relationshipAgencyIds: profile.relationshipAgencyIds,
    capabilities: profile.capabilities.map((capability) => ({
      key: capability.capabilityKey,
      label: capability.capabilityLabel,
      category: capability.capabilityCategory,
      keywords: capability.capabilityKeywords,
    })),
    certifications: profile.certifications.map((certification) => ({
      key: certification.certificationKey,
      label: certification.certificationLabel,
      code: certification.certificationCode,
    })),
    selectedVehicles: profile.selectedVehicles.map((selection) => ({
      id: selection.vehicle.id,
      code: selection.vehicle.code,
      name: selection.vehicle.name,
      isPreferred: selection.isPreferred,
    })),
    scoringCriteria: profile.scoringCriteria
      .map((criterion) => {
        if (!SCORING_FACTOR_KEYS.includes(criterion.factorKey as never)) {
          return null;
        }

        return {
          key: criterion.factorKey as (typeof SCORING_FACTOR_KEYS)[number],
          label: criterion.factorLabel,
          weight: Number.parseFloat(criterion.weight.toString()),
        };
      })
      .filter((criterion) => criterion !== null),
  };
}

function calculateOpportunityScorecard(
  opportunity:
    | OrganizationDashboardRecord["opportunities"][number]
    | OpportunityWorkspaceRecord,
  organizationProfile: OrganizationScoringProfileRecord,
  referenceDate: Date,
) {
  return calculateOpportunityScore({
    opportunity: {
      id: opportunity.id,
      title: opportunity.title,
      description: "description" in opportunity ? opportunity.description : null,
      sourceSummaryText: opportunity.sourceSummaryText,
      responseDeadlineAt: toIsoString(opportunity.responseDeadlineAt),
      currentStageKey: opportunity.currentStageKey,
      naicsCode: opportunity.naicsCode,
      leadAgency: opportunity.leadAgency
        ? {
            id: opportunity.leadAgency.id,
            name: opportunity.leadAgency.name,
            organizationCode: opportunity.leadAgency.organizationCode,
          }
        : null,
      isActiveSourceRecord: opportunity.isActiveSourceRecord,
      isArchivedSourceRecord: opportunity.isArchivedSourceRecord,
      vehicles: opportunity.vehicles.map((vehicleLink) => ({
        id: vehicleLink.vehicle.id,
        code: vehicleLink.vehicle.code,
        name: vehicleLink.vehicle.name,
        isPrimary: vehicleLink.isPrimary,
      })),
      competitors: opportunity.competitors.map((competitorLink) => ({
        name: competitorLink.competitor.name,
        role: competitorLink.role,
      })),
    },
    profile: mapOrganizationScoringProfile(organizationProfile),
    referenceDate,
  });
}

function mapScoreSummary(
  scorecard:
    | OrganizationDashboardRecord["opportunities"][number]["scorecards"][number]
    | undefined,
  calculatedScorecard?: CalculatedOpportunityScorecard | null,
): OpportunityScoreSummary | null {
  if (scorecard) {
    return {
      totalScore: scorecard.totalScore?.toString() ?? null,
      maximumScore: scorecard.maximumScore?.toString() ?? null,
      recommendationOutcome: scorecard.recommendationOutcome,
      calculatedAt: scorecard.calculatedAt.toISOString(),
    };
  }

  if (!calculatedScorecard) {
    return null;
  }

  return {
    totalScore: formatNumericScore(calculatedScorecard.totalScore),
    maximumScore: formatNumericScore(calculatedScorecard.maximumScore),
    recommendationOutcome: calculatedScorecard.recommendationOutcome,
    calculatedAt: calculatedScorecard.calculatedAt,
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

function mapOpportunitySummary({
  opportunity,
  organizationProfile,
  referenceDate,
}: {
  opportunity: OrganizationDashboardRecord["opportunities"][number];
  organizationProfile: OrganizationScoringProfileRecord;
  referenceDate: Date;
}): OpportunitySummary {
  const calculatedScorecard = opportunity.scorecards[0]
    ? null
    : calculateOpportunityScorecard(opportunity, organizationProfile, referenceDate);

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
    score: mapScoreSummary(
      opportunity.scorecards[0],
      opportunity.scorecards[0] ? null : calculatedScorecard,
    ),
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

function mapOpportunityWorkspaceSummary({
  opportunity,
  scoreSummary,
}: {
  opportunity: OpportunityWorkspaceRecord;
  scoreSummary: OpportunityScoreSummary | null;
}): OpportunityWorkspaceSnapshot["opportunity"] {
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
    score: scoreSummary,
    bidDecision: mapBidDecisionSummary(opportunity.bidDecisions[0]),
    vehicles: opportunity.vehicles.map(mapVehicleSummary),
    competitors: opportunity.competitors.map(mapCompetitorSummary),
    tasks: opportunity.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueAt: toIsoString(task.dueAt),
      deadlineReminderState: task.deadlineReminderState,
      deadlineReminderUpdatedAt: toIsoString(task.deadlineReminderUpdatedAt),
      assigneeName: formatPersonLabel(task.assigneeUser),
    })),
    milestones: opportunity.milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      status: milestone.status,
      targetDate: milestone.targetDate.toISOString(),
      deadlineReminderState: milestone.deadlineReminderState,
      deadlineReminderUpdatedAt: toIsoString(milestone.deadlineReminderUpdatedAt),
    })),
    description: opportunity.description,
    externalNoticeId: opportunity.externalNoticeId,
    sourceSummaryUrl: opportunity.sourceSummaryUrl,
    postedAt: toIsoString(opportunity.postedAt),
    classificationCode: opportunity.classificationCode,
    setAsideDescription: opportunity.setAsideDescription,
    currentStageChangedAt: toIsoString(opportunity.currentStageChangedAt),
    uiLink: opportunity.uiLink,
    officeLocation: joinLocationParts([
      opportunity.officeCity,
      opportunity.officeState,
      opportunity.officePostalCode,
    ]),
    placeOfPerformanceLocation: joinLocationParts([
      opportunity.placeOfPerformanceCityName,
      opportunity.placeOfPerformanceStateName,
      opportunity.placeOfPerformancePostalCode,
    ]),
  };
}

function mapWorkspaceTask(
  task: OpportunityWorkspaceRecord["tasks"][number],
): OpportunityWorkspaceTask {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueAt: toIsoString(task.dueAt),
    startedAt: toIsoString(task.startedAt),
    completedAt: toIsoString(task.completedAt),
    deadlineReminderState: task.deadlineReminderState,
    deadlineReminderUpdatedAt: toIsoString(task.deadlineReminderUpdatedAt),
    assigneeUserId: task.assigneeUser?.id ?? null,
    assigneeName: formatPersonLabel(task.assigneeUser),
    createdByName: formatPersonLabel(task.createdByUser),
  };
}

function mapTaskAssigneeOption(
  user: OpportunityWorkspaceRecord["organization"]["users"][number],
): OpportunityTaskAssigneeOption {
  return {
    value: user.id,
    label: formatPersonLabel(user) ?? user.email,
  };
}

function mapPersonalTaskBoardItem(
  task: PersonalTaskBoardRecord["assignedOpportunityTasks"][number],
): PersonalTaskBoardItem {
  return {
    ...mapWorkspaceTask(task),
    opportunityId: task.opportunity.id,
    opportunityTitle: task.opportunity.title,
    opportunityStageLabel: task.opportunity.currentStageLabel ?? "Identified",
  };
}

function mapWorkspaceMilestone(
  milestone: OpportunityWorkspaceRecord["milestones"][number],
): OpportunityWorkspaceMilestone {
  return {
    id: milestone.id,
    title: milestone.title,
    description: milestone.description,
    milestoneTypeKey: milestone.milestoneTypeKey,
    status: milestone.status,
    targetDate: milestone.targetDate.toISOString(),
    completedAt: toIsoString(milestone.completedAt),
    deadlineReminderState: milestone.deadlineReminderState,
    deadlineReminderUpdatedAt: toIsoString(milestone.deadlineReminderUpdatedAt),
  };
}

function mapWorkspaceScoreFactor(
  factor: OpportunityWorkspaceRecord["scorecards"][number]["factorScores"][number],
): OpportunityWorkspaceScoreFactor {
  return {
    id: factor.id,
    factorKey: factor.factorKey,
    factorLabel: factor.factorLabel,
    weight: factor.weight?.toString() ?? null,
    score: factor.score?.toString() ?? null,
    maximumScore: factor.maximumScore?.toString() ?? null,
    explanation: factor.explanation,
  };
}

function resolveWorkspaceScorecard({
  opportunity,
  organizationProfile,
  referenceDate,
}: {
  opportunity: OpportunityWorkspaceRecord;
  organizationProfile: OrganizationScoringProfileRecord;
  referenceDate: Date;
}) {
  if (opportunity.scorecards[0]) {
    return null;
  }

  return calculateOpportunityScorecard(
    opportunity,
    organizationProfile,
    referenceDate,
  );
}

function mapWorkspaceScorecard(
  scorecard: OpportunityWorkspaceRecord["scorecards"][number] | undefined,
  calculatedScorecard?: CalculatedOpportunityScorecard | null,
): OpportunityWorkspaceScorecard | null {
  if (!scorecard && !calculatedScorecard) {
    return null;
  }

  if (scorecard) {
    return {
      scoringModelKey: scorecard.scoringModelKey,
      scoringModelVersion: scorecard.scoringModelVersion,
      totalScore: scorecard.totalScore?.toString() ?? null,
      maximumScore: scorecard.maximumScore?.toString() ?? null,
      scorePercent: scorecard.scorePercent?.toString() ?? null,
      recommendationOutcome: scorecard.recommendationOutcome,
      recommendationSummary: scorecard.recommendationSummary,
      summary: scorecard.summary,
      calculatedAt: scorecard.calculatedAt.toISOString(),
      factors: scorecard.factorScores.map(mapWorkspaceScoreFactor),
    };
  }

  return {
    scoringModelKey: calculatedScorecard?.scoringModelKey ?? null,
    scoringModelVersion: calculatedScorecard?.scoringModelVersion ?? null,
    totalScore: calculatedScorecard
      ? formatNumericScore(calculatedScorecard.totalScore)
      : null,
    maximumScore: calculatedScorecard
      ? formatNumericScore(calculatedScorecard.maximumScore)
      : null,
    scorePercent: calculatedScorecard
      ? formatNumericScore(calculatedScorecard.scorePercent)
      : null,
    recommendationOutcome: calculatedScorecard?.recommendationOutcome ?? null,
    recommendationSummary: calculatedScorecard?.recommendationSummary ?? null,
    summary: calculatedScorecard?.summary ?? null,
    calculatedAt: calculatedScorecard?.calculatedAt ?? "",
    factors:
      calculatedScorecard?.factors.map((factor) => ({
        id: factor.id,
        factorKey: factor.factorKey,
        factorLabel: factor.factorLabel,
        weight: formatNumericScore(factor.weight),
        score: formatNumericScore(factor.score),
        maximumScore: formatNumericScore(factor.maximumScore),
        explanation: factor.explanation,
      })) ?? [],
  };
}

function formatNumericScore(value: number) {
  return value.toFixed(2);
}

function mapWorkspaceBidDecision(
  bidDecision: OpportunityWorkspaceRecord["bidDecisions"][number] | undefined,
): OpportunityWorkspaceBidDecision | null {
  if (!bidDecision) {
    return null;
  }

  return {
    decisionTypeKey: bidDecision.decisionTypeKey,
    recommendationOutcome: bidDecision.recommendationOutcome,
    finalOutcome: bidDecision.finalOutcome,
    recommendationSummary: bidDecision.recommendationSummary,
    finalRationale: bidDecision.finalRationale,
    recommendedAt: toIsoString(bidDecision.recommendedAt),
    recommendedByLabel:
      bidDecision.recommendedByIdentifier ?? "Deterministic rule engine",
    decidedByName: formatPersonLabel(bidDecision.decidedByUser),
    decidedAt: toIsoString(bidDecision.decidedAt),
  };
}

function mapWorkspaceDocument(
  document: OpportunityWorkspaceRecord["documents"][number],
): OpportunityWorkspaceDocument {
  return {
    id: document.id,
    title: document.title,
    documentType: document.documentType,
    sourceType: document.sourceType,
    sourceUrl: document.sourceUrl,
    originalFileName: document.originalFileName,
    mimeType: document.mimeType,
    fileSizeBytes: document.fileSizeBytes,
    extractionStatus: document.extractionStatus,
    extractedAt: toIsoString(document.extractedAt),
    extractedText: document.extractedText,
    uploadedByName: formatPersonLabel(document.uploadedByUser),
    createdAt: document.createdAt.toISOString(),
  };
}

function mapWorkspaceNote(
  note: OpportunityWorkspaceRecord["notes"][number],
): OpportunityWorkspaceNote {
  return {
    id: note.id,
    title: note.title,
    body: note.body,
    contentFormat: note.contentFormat,
    isPinned: note.isPinned,
    authorName: formatPersonLabel(note.authorUser),
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

function mapWorkspaceActivity(
  event: OpportunityWorkspaceRecord["activityEvents"][number],
): OpportunityWorkspaceActivity {
  return {
    id: event.id,
    eventType: event.eventType,
    title: event.title,
    description: event.description,
    actorLabel: formatPersonLabel(event.actorUser) ?? event.actorIdentifier,
    relatedEntityType: event.relatedEntityType,
    occurredAt: event.occurredAt.toISOString(),
  };
}

function mapWorkspaceStageTransition(
  transition: OpportunityWorkspaceRecord["stageTransitions"][number],
): OpportunityWorkspaceStageTransition {
  return {
    id: transition.id,
    triggerType: transition.triggerType,
    fromStageLabel: transition.fromStageLabel,
    toStageLabel: transition.toStageLabel ?? "Stage updated",
    rationale: transition.rationale,
    actorName: formatPersonLabel(transition.actorUser),
    transitionedAt: transition.transitionedAt.toISOString(),
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
  return (
    opportunity.tasks.some(
      (task) =>
        task.priority === "CRITICAL" ||
        task.status === "BLOCKED" ||
        task.deadlineReminderState === "OVERDUE",
    ) ||
    opportunity.milestones.some(
      (milestone) => milestone.deadlineReminderState === "OVERDUE",
    )
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

function comparePersonalTaskBoardItems(
  left: PersonalTaskBoardItem,
  right: PersonalTaskBoardItem,
) {
  const statusComparison =
    getPersonalTaskStatusRank(left.status) - getPersonalTaskStatusRank(right.status);

  if (statusComparison !== 0) {
    return statusComparison;
  }

  const taskComparison = compareTaskSummaries(left, right);

  if (taskComparison !== 0) {
    return taskComparison;
  }

  return left.opportunityTitle.localeCompare(right.opportunityTitle);
}

function getPersonalTaskStatusRank(status: PersonalTaskBoardItem["status"]) {
  switch (status) {
    case "BLOCKED":
      return 0;
    case "IN_PROGRESS":
      return 1;
    case "NOT_STARTED":
      return 2;
    case "COMPLETED":
      return 3;
    case "CANCELLED":
      return 4;
    default:
      return 5;
  }
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

function formatPersonLabel(
  person:
    | {
        name: string | null;
        email: string;
      }
    | null
    | undefined,
) {
  return person?.name ?? person?.email ?? null;
}

function joinLocationParts(parts: Array<string | null>) {
  const normalizedParts = parts.filter(
    (part): part is string => Boolean(part && part.trim()),
  );

  return normalizedParts.length > 0 ? normalizedParts.join(", ") : null;
}

function toIsoString(value: Date | null) {
  return value?.toISOString() ?? null;
}
