import { describe, expect, it, vi } from "vitest";

import {
  getDecisionConsoleSnapshot,
  getPersonalTaskBoardSnapshot,
  getOpportunityListSnapshot,
  getOpportunityWorkspaceSnapshot,
  getHomeDashboardSnapshot,
  listOpportunitySummaries,
  parseDecisionConsoleSearchParams,
  parseOpportunityListSearchParams,
  type PersonalTaskBoardRecord,
  type PersonalTaskBoardRepositoryClient,
  type OpportunityRepositoryClient,
  type OrganizationDashboardRecord,
  type OpportunityWorkspaceRecord,
  type OpportunityWorkspaceRepositoryClient,
} from "@/modules/opportunities/opportunity.repository";

function buildOrganizationProfileRecord() {
  return {
    activeScoringModelKey: "default_capture_v1",
    activeScoringModelVersion: "2026-04-18",
    goRecommendationThreshold: { toString: () => "70.00" },
    deferRecommendationThreshold: { toString: () => "45.00" },
    minimumRiskScorePercent: { toString: () => "50.00" },
    strategicFocus:
      "Prioritize Air Force and Army workflow modernization pursuits with vehicle access already in place.",
    targetNaicsCodes: ["541511", "541512"],
    priorityAgencyIds: ["agency_1"],
    relationshipAgencyIds: ["agency_1"],
    capabilities: [
      {
        capabilityKey: "knowledge-management",
        capabilityLabel: "Knowledge management",
        capabilityCategory: "data",
        capabilityKeywords: ["knowledge management", "workflow modernization"],
      },
      {
        capabilityKey: "cloud-operations",
        capabilityLabel: "Cloud operations",
        capabilityCategory: "cloud",
        capabilityKeywords: ["cloud operations", "sustainment support"],
      },
    ],
    certifications: [
      {
        certificationKey: "iso-27001",
        certificationLabel: "ISO 27001",
        certificationCode: "ISO-27001",
      },
    ],
    selectedVehicles: [
      {
        isPreferred: true,
        vehicle: {
          id: "vehicle_1",
          code: "OASIS-PLUS-UNR",
          name: "OASIS+ Unrestricted",
        },
      },
    ],
    scoringCriteria: [
      {
        factorKey: "capability_fit",
        factorLabel: "Capability fit",
        weight: { toString: () => "30.00" },
      },
      {
        factorKey: "strategic_alignment",
        factorLabel: "Strategic alignment",
        weight: { toString: () => "20.00" },
      },
      {
        factorKey: "vehicle_access",
        factorLabel: "Vehicle access",
        weight: { toString: () => "15.00" },
      },
      {
        factorKey: "relationship_strength",
        factorLabel: "Relationship strength",
        weight: { toString: () => "15.00" },
      },
      {
        factorKey: "schedule_realism",
        factorLabel: "Schedule realism",
        weight: { toString: () => "10.00" },
      },
      {
        factorKey: "risk",
        factorLabel: "Risk",
        weight: { toString: () => "10.00" },
      },
    ],
  };
}

function buildOrganizationDashboardRecord(): OrganizationDashboardRecord {
  return {
    id: "org_123",
    name: "Default Organization",
    slug: "default-org",
    organizationProfile: buildOrganizationProfileRecord(),
    sourceConnectorConfigs: [
      {
        id: "connector_1",
        sourceSystemKey: "sam_gov",
        sourceDisplayName: "SAM.gov",
        authType: "API_KEY",
        isEnabled: true,
        supportsSearch: true,
        supportsScheduledSync: true,
        supportsResultPreview: true,
        connectorVersion: "sam-gov.v1",
      },
      {
        id: "connector_2",
        sourceSystemKey: "usaspending_api",
        sourceDisplayName: "USAspending API",
        authType: "NONE",
        isEnabled: true,
        supportsSearch: true,
        supportsScheduledSync: true,
        supportsResultPreview: true,
        connectorVersion: "usaspending.v1",
      },
      {
        id: "connector_3",
        sourceSystemKey: "gsa_ebuy",
        sourceDisplayName: "GSA eBuy",
        authType: "SESSION",
        isEnabled: false,
        supportsSearch: true,
        supportsScheduledSync: false,
        supportsResultPreview: true,
        connectorVersion: "gsa-ebuy.v1",
      },
    ],
    opportunities: [
      {
        id: "opp_alpha",
        title: "Enterprise Knowledge Management Support Services",
        solicitationNumber: "FA4861-26-R-0012",
        currentStageKey: "capture_active",
        currentStageLabel: "Capture Active",
        currentStageChangedAt: new Date("2026-04-10T00:00:00.000Z"),
        responseDeadlineAt: new Date("2026-05-01T17:00:00.000Z"),
        originSourceSystem: "sam_gov",
        naicsCode: "541511",
        sourceSummaryText:
          "Enterprise knowledge management and workflow modernization support.",
        createdAt: new Date("2026-03-20T00:00:00.000Z"),
        isActiveSourceRecord: true,
        isArchivedSourceRecord: false,
        updatedAt: new Date("2026-04-18T01:00:00.000Z"),
        leadAgency: {
          id: "agency_1",
          name: "99th Contracting Squadron",
          organizationCode: "FA4861",
        },
        vehicles: [
          {
            isPrimary: true,
            vehicle: {
              id: "vehicle_1",
              code: "OASIS-PLUS-UNR",
              name: "OASIS+ Unrestricted",
              vehicleType: "IDIQ",
            },
          },
        ],
        competitors: [
          {
            role: "INCUMBENT",
            competitor: {
              id: "competitor_1",
              name: "Vector Analytics LLC",
              websiteUrl: "https://vector-analytics.example",
            },
          },
        ],
        tasks: [
          {
            id: "task_blocked",
            title: "Confirm incumbent teaming posture",
            status: "BLOCKED",
            priority: "CRITICAL",
            dueAt: new Date("2026-04-16T16:00:00.000Z"),
            deadlineReminderState: "OVERDUE",
            deadlineReminderUpdatedAt: new Date("2026-04-18T08:00:00.000Z"),
            assigneeUser: {
              id: "user_1",
              name: "Alex Morgan",
              email: "alex@example.com",
            },
          },
          {
            id: "task_followup",
            title: "Review PWS changes",
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueAt: new Date("2026-04-22T16:00:00.000Z"),
            deadlineReminderState: "UPCOMING",
            deadlineReminderUpdatedAt: new Date("2026-04-18T08:00:00.000Z"),
            assigneeUser: {
              id: "user_2",
              name: null,
              email: "capture@example.com",
            },
          },
        ],
        milestones: [
          {
            id: "milestone_1",
            title: "Go/No-Go Board",
            status: "AT_RISK",
            targetDate: new Date("2026-04-24T15:00:00.000Z"),
            deadlineReminderState: "UPCOMING",
            deadlineReminderUpdatedAt: new Date("2026-04-18T08:00:00.000Z"),
          },
        ],
        scorecards: [
          {
            totalScore: { toString: () => "79.50" },
            maximumScore: { toString: () => "100.00" },
            scorePercent: { toString: () => "79.50" },
            recommendationOutcome: "GO",
            recommendationSummary:
              "Vehicle access and strategic alignment support pursuit.",
            calculatedAt: new Date("2026-04-15T16:00:00.000Z"),
            factorScores: [
              {
                id: "alpha_factor_strategic",
                factorKey: "strategic_alignment",
                factorLabel: "Strategic alignment",
                weight: { toString: () => "20.00" },
                score: { toString: () => "18.00" },
                maximumScore: { toString: () => "20.00" },
                explanation: "Strong Air Force alignment.",
              },
              {
                id: "alpha_factor_risk",
                factorKey: "risk",
                factorLabel: "Risk",
                weight: { toString: () => "10.00" },
                score: { toString: () => "4.50" },
                maximumScore: { toString: () => "10.00" },
                explanation: "Incumbent and overdue work increase pressure.",
              },
            ],
          },
        ],
        bidDecisions: [
          {
            id: "decision_alpha",
            isCurrent: true,
            decisionTypeKey: "initial_pursuit",
            recommendationOutcome: "GO",
            finalOutcome: "GO",
            decidedAt: new Date("2026-04-15T16:05:00.000Z"),
          },
        ],
        stageTransitions: [
          {
            fromStageKey: "identified",
            toStageKey: "qualified",
          },
          {
            fromStageKey: "qualified",
            toStageKey: "pursuit_approved",
          },
          {
            fromStageKey: "pursuit_approved",
            toStageKey: "capture_active",
          },
        ],
        _count: {
          activityEvents: 2,
          documents: 1,
          milestones: 1,
          notes: 1,
          tasks: 2,
        },
      },
      {
        id: "opp_beta",
        title: "Army Cloud Operations Recompete",
        solicitationNumber: "W91QUZ-26-R-1042",
        currentStageKey: null,
        currentStageLabel: null,
        currentStageChangedAt: null,
        responseDeadlineAt: new Date("2026-06-20T17:00:00.000Z"),
        originSourceSystem: "sam_gov",
        naicsCode: "541512",
        sourceSummaryText: "Cloud operations and sustainment support.",
        createdAt: new Date("2026-04-09T00:00:00.000Z"),
        isActiveSourceRecord: true,
        isArchivedSourceRecord: false,
        updatedAt: new Date("2026-04-17T01:00:00.000Z"),
        leadAgency: null,
        vehicles: [],
        competitors: [],
        tasks: [],
        milestones: [],
        scorecards: [],
        bidDecisions: [],
        stageTransitions: [],
        _count: {
          activityEvents: 0,
          documents: 0,
          milestones: 0,
          notes: 0,
          tasks: 0,
        },
      },
      {
        id: "opp_gamma",
        title: "DHS Zero Trust Assessment Support",
        solicitationNumber: "70RCSJ-26-R-ZT01",
        currentStageKey: "submitted",
        currentStageLabel: "Submitted",
        currentStageChangedAt: new Date("2026-04-16T00:00:00.000Z"),
        responseDeadlineAt: new Date("2026-04-18T21:00:00.000Z"),
        originSourceSystem: "manual_entry",
        naicsCode: "541519",
        sourceSummaryText: "Submitted cyber support pursuit.",
        createdAt: new Date("2026-03-28T00:00:00.000Z"),
        isActiveSourceRecord: true,
        isArchivedSourceRecord: false,
        updatedAt: new Date("2026-04-18T02:00:00.000Z"),
        leadAgency: {
          id: "agency_2",
          name: "CISA OCPO",
          organizationCode: "70RCSJ",
        },
        vehicles: [],
        competitors: [],
        tasks: [
          {
            id: "task_submitted",
            title: "Prepare oral presentation backup deck",
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueAt: new Date("2026-04-22T18:00:00.000Z"),
            deadlineReminderState: "UPCOMING",
            deadlineReminderUpdatedAt: new Date("2026-04-18T08:00:00.000Z"),
            assigneeUser: {
              id: "user_3",
              name: "Casey Brooks",
              email: "casey@example.com",
            },
          },
        ],
        milestones: [
          {
            id: "milestone_submitted",
            title: "Proposal submitted",
            status: "COMPLETED",
            targetDate: new Date("2026-04-18T21:00:00.000Z"),
            deadlineReminderState: "NONE",
            deadlineReminderUpdatedAt: null,
          },
        ],
        scorecards: [
          {
            totalScore: { toString: () => "91.00" },
            maximumScore: { toString: () => "100.00" },
            scorePercent: { toString: () => "91.00" },
            recommendationOutcome: "GO",
            recommendationSummary: "Submitted proposal remains a strong fit.",
            calculatedAt: new Date("2026-04-18T20:00:00.000Z"),
            factorScores: [
              {
                id: "gamma_factor_strategic",
                factorKey: "strategic_alignment",
                factorLabel: "Strategic alignment",
                weight: { toString: () => "20.00" },
                score: { toString: () => "14.00" },
                maximumScore: { toString: () => "20.00" },
                explanation: "Good but not top-tier strategic fit.",
              },
              {
                id: "gamma_factor_risk",
                factorKey: "risk",
                factorLabel: "Risk",
                weight: { toString: () => "10.00" },
                score: { toString: () => "8.50" },
                maximumScore: { toString: () => "10.00" },
                explanation: "Low execution risk after submission.",
              },
            ],
          },
        ],
        bidDecisions: [
          {
            id: "decision_gamma",
            isCurrent: true,
            decisionTypeKey: "submit_authorization",
            recommendationOutcome: "GO",
            finalOutcome: "GO",
            decidedAt: new Date("2026-04-18T20:15:00.000Z"),
          },
        ],
        stageTransitions: [
          {
            fromStageKey: "capture_active",
            toStageKey: "proposal_in_development",
          },
          {
            fromStageKey: "proposal_in_development",
            toStageKey: "submitted",
          },
        ],
        _count: {
          activityEvents: 2,
          documents: 1,
          milestones: 1,
          notes: 1,
          tasks: 1,
        },
      },
    ],
  } as OrganizationDashboardRecord;
}

function createRepositoryClient(record: OrganizationDashboardRecord | null) {
  return {
    organization: {
      findUnique: vi.fn().mockResolvedValue(record),
    },
  } as unknown as OpportunityRepositoryClient;
}

function buildOpportunityWorkspaceRecord(): OpportunityWorkspaceRecord {
  return {
    id: "opp_alpha",
    organization: {
      id: "org_123",
      name: "Default Organization",
      slug: "default-org",
      organizationProfile: buildOrganizationProfileRecord(),
      users: [
        {
          id: "user_admin",
          name: "OneSource Admin",
          email: "admin@onesource.local",
        },
        {
          id: "user_taylor",
          name: "Taylor Reed",
          email: "taylor@example.com",
        },
      ],
      competitors: [
        {
          id: "competitor_harbor",
          name: "Harbor Mission Technologies",
        },
        {
          id: "competitor_1",
          name: "Vector Analytics LLC",
        },
      ],
      knowledgeAssets: [
        {
          id: "knowledge_air_force",
          assetType: "PAST_PERFORMANCE_SNIPPET",
          title: "Air Force operational planning past performance",
          summary:
            "Reusable past-performance proof point for enterprise knowledge management and workflow modernization work inside Air Force operational planning organizations.",
          body: "Delivered enterprise knowledge management modernization for an Air Force operational planning customer by consolidating fragmented SharePoint workflows, automating approval routing, and deploying role-aware analytics dashboards.",
          updatedAt: new Date("2026-04-18T03:00:00.000Z"),
          updatedByUser: {
            name: "Alex Morgan",
            email: "alex@example.com",
          },
          tags: [
            {
              label: "99th Contracting Squadron (FA4861)",
              normalizedLabel: "99th contracting squadron",
              tagKey: "agency_1",
              tagType: "AGENCY",
            },
            {
              label: "Knowledge management",
              normalizedLabel: "knowledge management",
              tagKey: "knowledge-management",
              tagType: "CAPABILITY",
            },
            {
              label: "Solicitation",
              normalizedLabel: "solicitation",
              tagKey: "solicitation",
              tagType: "CONTRACT_TYPE",
            },
            {
              label: "knowledge management",
              normalizedLabel: "knowledge management",
              tagKey: "knowledge management",
              tagType: "FREEFORM",
            },
            {
              label: "OASIS-PLUS-UNR · OASIS+ Unrestricted",
              normalizedLabel: "oasis-plus-unr",
              tagKey: "OASIS-PLUS-UNR",
              tagType: "VEHICLE",
            },
          ],
          linkedOpportunities: [
            {
              opportunity: {
                id: "opp_alpha",
                title: "Enterprise Knowledge Management Support Services",
                currentStageLabel: "Capture Active",
              },
            },
          ],
        },
        {
          id: "knowledge_army",
          assetType: "WIN_THEME",
          title: "Army cloud transition win theme",
          summary:
            "Reusable win-theme narrative for controlled cloud transition risk.",
          body: "OneSource can position around controlled transition risk with a disciplined migration path.",
          updatedAt: new Date("2026-04-17T03:00:00.000Z"),
          updatedByUser: {
            name: "Taylor Reed",
            email: "taylor@example.com",
          },
          tags: [
            {
              label: "PEO Enterprise Information Systems",
              normalizedLabel: "peo enterprise information systems",
              tagKey: "agency_2",
              tagType: "AGENCY",
            },
            {
              label: "Cloud platform engineering",
              normalizedLabel: "cloud platform engineering",
              tagKey: "cloud-platform-engineering",
              tagType: "CAPABILITY",
            },
          ],
          linkedOpportunities: [
            {
              opportunity: {
                id: "opp_beta",
                title: "Army Cloud Operations Recompete",
                currentStageLabel: "Qualified",
              },
            },
          ],
        },
      ],
    },
    title: "Enterprise Knowledge Management Support Services",
    description:
      "Capture-ready record normalized from a seeded SAM.gov solicitation.",
    externalNoticeId: "FA4861-26-R-0001",
    solicitationNumber: "FA4861-26-R-0001",
    sourceSummaryText:
      "Enterprise knowledge management and workflow modernization support.",
    sourceSummaryUrl: "https://sam.gov/opp/FA4861-26-R-0001/view",
    postedAt: new Date("2026-03-15T00:00:00.000Z"),
    responseDeadlineAt: new Date("2026-05-01T17:00:00.000Z"),
    originSourceSystem: "sam_gov",
    naicsCode: "541511",
    procurementTypeLabel: "Solicitation",
    procurementBaseTypeLabel: "Solicitation",
    isActiveSourceRecord: true,
    isArchivedSourceRecord: false,
    classificationCode: "D302",
    setAsideDescription: "Small Business Set-Aside",
    currentStageKey: "capture_active",
    currentStageLabel: "Capture Active",
    currentStageChangedAt: new Date("2026-04-15T16:05:00.000Z"),
    updatedAt: new Date("2026-04-18T04:00:00.000Z"),
    uiLink: "https://sam.gov/opp/FA4861-26-R-0001/view",
    officeCity: "Nellis AFB",
    officeState: "NV",
    officePostalCode: "89191",
    placeOfPerformanceCityName: "Las Vegas",
    placeOfPerformanceStateName: "Nevada",
    placeOfPerformancePostalCode: "89191",
    leadAgency: {
      id: "agency_1",
      name: "99th Contracting Squadron",
      organizationCode: "FA4861",
    },
    vehicles: [
      {
        isPrimary: true,
        vehicle: {
          id: "vehicle_1",
          code: "OASIS-PLUS-UNR",
          name: "OASIS+ Unrestricted",
          vehicleType: "IDIQ",
        },
      },
    ],
    competitors: [
      {
        role: "INCUMBENT",
        competitor: {
          id: "competitor_1",
          name: "Vector Analytics LLC",
          websiteUrl: "https://vector-analytics.example",
        },
      },
    ],
    tasks: [
      {
        id: "task_1",
        title: "Complete incumbent analysis brief",
        description: "Summarize incumbent strengths before capture stand-up.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueAt: new Date("2026-04-16T17:00:00.000Z"),
        startedAt: new Date("2026-04-16T14:00:00.000Z"),
        completedAt: null,
        deadlineReminderState: "OVERDUE",
        deadlineReminderUpdatedAt: new Date("2026-04-18T08:00:00.000Z"),
        createdByUser: {
          name: "OneSource Admin",
          email: "admin@onesource.local",
        },
        assigneeUser: {
          id: "user_taylor",
          name: "Taylor Reed",
          email: "taylor@example.com",
        },
      },
    ],
    milestones: [
      {
        id: "milestone_1",
        title: "Customer questions due",
        description: "Submit clarifications before the Q&A period closes.",
        milestoneTypeKey: "question_deadline",
        status: "PLANNED",
        targetDate: new Date("2026-04-18T23:59:00.000Z"),
        completedAt: null,
        deadlineReminderState: "UPCOMING",
        deadlineReminderUpdatedAt: new Date("2026-04-18T08:00:00.000Z"),
      },
    ],
    notes: [
      {
        id: "note_1",
        title: "Capture summary",
        body: "Vehicle access is confirmed and mission fit is strong.",
        contentFormat: "markdown",
        isPinned: true,
        createdAt: new Date("2026-04-15T09:30:00.000Z"),
        updatedAt: new Date("2026-04-15T09:30:00.000Z"),
        authorUser: {
          name: "OneSource Admin",
          email: "admin@onesource.local",
        },
      },
    ],
    documents: [
      {
        id: "doc_1",
        title: "Performance Work Statement",
        documentType: "statement_of_work",
        sourceType: "SOURCE_ATTACHMENT",
        sourceUrl:
          "https://sam.gov/opp/FA4861-26-R-0001/documents/performance-work-statement.pdf",
        storagePath: null,
        originalFileName: "performance-work-statement.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 245760,
        extractionStatus: "SUCCEEDED",
        extractedAt: new Date("2026-04-12T14:06:10.000Z"),
        extractedText:
          "Performance work statement summary: provide enterprise knowledge management support.",
        createdAt: new Date("2026-04-12T14:06:10.000Z"),
        uploadedByUser: {
          name: "OneSource Admin",
          email: "admin@onesource.local",
        },
      },
    ],
    activityEvents: [
      {
        id: "activity_1",
        eventType: "bid_decision_recorded",
        title: "Bid decision recorded as GO",
        description:
          "Leadership approved pursuit and documented the rationale in the workspace.",
        actorIdentifier: "admin@onesource.local",
        relatedEntityType: "bid_decision",
        occurredAt: new Date("2026-04-16T14:10:00.000Z"),
        actorUser: {
          name: "OneSource Admin",
          email: "admin@onesource.local",
        },
      },
    ],
    stageTransitions: [
      {
        id: "transition_1",
        triggerType: "MANUAL",
        fromStageLabel: "Pursuit Approved",
        toStageLabel: "Capture Active",
        rationale:
          "Capture activities started after the first scorecard and bid decision were recorded.",
        transitionedAt: new Date("2026-04-15T16:05:00.000Z"),
        actorUser: {
          name: "OneSource Admin",
          email: "admin@onesource.local",
        },
      },
    ],
    scorecards: [
      {
        scoringModelKey: "default_capture_v1",
        scoringModelVersion: "2026-04-01",
        totalScore: { toString: () => "79.50" },
        maximumScore: { toString: () => "100.00" },
        scorePercent: { toString: () => "79.50" },
        recommendationOutcome: "GO",
        recommendationSummary:
          "Vehicle access and capability fit support pursuit.",
        summary: "The seeded opportunity scores as a strong pursuit candidate.",
        calculatedAt: new Date("2026-04-15T16:30:00.000Z"),
        factorScores: [
          {
            id: "factor_1",
            factorKey: "capability_fit",
            factorLabel: "Capability Fit",
            weight: { toString: () => "30.00" },
            score: { toString: () => "24.00" },
            maximumScore: { toString: () => "30.00" },
            explanation:
              "Past performance and service offerings align with the opportunity.",
          },
        ],
      },
    ],
    bidDecisions: [
      {
        id: "decision_current",
        isCurrent: true,
        decisionTypeKey: "initial_pursuit",
        recommendationOutcome: "GO",
        finalOutcome: "GO",
        recommendationSummary:
          "Proceed with capture because the opportunity fits strategic priorities.",
        finalRationale:
          "Leadership approved pursuit because vehicle access is already cleared.",
        recommendedAt: new Date("2026-04-15T16:31:00.000Z"),
        recommendedByIdentifier: "rule_engine:default_capture_v1",
        decidedAt: new Date("2026-04-16T14:10:00.000Z"),
        decidedByUser: {
          name: "OneSource Admin",
          email: "admin@onesource.local",
        },
      },
      {
        id: "decision_previous",
        isCurrent: false,
        decisionTypeKey: "qualification_review",
        recommendationOutcome: "DEFER",
        finalOutcome: "DEFER",
        recommendationSummary:
          "Defer pursuit until the customer confirms the vehicle path.",
        finalRationale:
          "Leadership held the record until the teaming structure was clarified.",
        recommendedAt: new Date("2026-04-10T10:00:00.000Z"),
        recommendedByIdentifier: "rule_engine:default_capture_v1",
        decidedAt: new Date("2026-04-10T12:00:00.000Z"),
        decidedByUser: {
          name: "OneSource Admin",
          email: "admin@onesource.local",
        },
      },
    ],
    closeouts: [],
  };
}

function buildPersonalTaskBoardRecord(): PersonalTaskBoardRecord {
  return {
    id: "user_taylor",
    name: "Taylor Reed",
    email: "taylor@example.com",
    organization: {
      id: "org_123",
      name: "Default Organization",
      slug: "default-org",
    },
    assignedOpportunityTasks: [
      {
        ...buildOpportunityWorkspaceRecord().tasks[0],
        opportunity: {
          id: "opp_alpha",
          title: "Enterprise Knowledge Management Support Services",
          currentStageLabel: "Capture Active",
        },
      },
      {
        id: "task_2",
        title: "Prepare customer questions draft",
        description: null,
        status: "COMPLETED",
        priority: "MEDIUM",
        dueAt: new Date("2026-04-18T16:00:00.000Z"),
        startedAt: new Date("2026-04-17T16:00:00.000Z"),
        completedAt: new Date("2026-04-18T15:30:00.000Z"),
        deadlineReminderState: "NONE",
        deadlineReminderUpdatedAt: null,
        createdByUser: {
          name: "OneSource Admin",
          email: "admin@onesource.local",
        },
        assigneeUserId: "user_taylor",
        assigneeUser: {
          id: "user_taylor",
          name: "Taylor Reed",
          email: "taylor@example.com",
        },
        opportunity: {
          id: "opp_beta",
          title: "Army Cloud Operations Recompete",
          currentStageLabel: "Qualified",
        },
      },
    ],
  };
}

function createWorkspaceRepositoryClient(record: OpportunityWorkspaceRecord | null) {
  return {
    opportunity: {
      findFirst: vi.fn().mockResolvedValue(record),
    },
  } as unknown as OpportunityWorkspaceRepositoryClient;
}

function createPersonalTaskBoardRepositoryClient(
  record: PersonalTaskBoardRecord | null,
) {
  return {
    user: {
      findFirst: vi.fn().mockResolvedValue(record),
    },
  } as unknown as PersonalTaskBoardRepositoryClient;
}

describe("opportunity.repository", () => {
  it("maps opportunity summaries into shared domain DTOs", async () => {
    const db = createRepositoryClient(buildOrganizationDashboardRecord());

    const summaries = await listOpportunitySummaries({ db });

    expect(summaries).toHaveLength(3);
    expect(summaries[0]).toMatchObject({
      title: "Enterprise Knowledge Management Support Services",
      solicitationNumber: "FA4861-26-R-0012",
      currentStageLabel: "Capture Active",
      leadAgency: {
        name: "99th Contracting Squadron",
      },
      score: {
        totalScore: "79.50",
        recommendationOutcome: "GO",
      },
    });
    expect(summaries[0].tasks[0]).toMatchObject({
      title: "Confirm incumbent teaming posture",
      assigneeName: "Alex Morgan",
      deadlineReminderState: "OVERDUE",
      priority: "CRITICAL",
    });
    expect(summaries[1].currentStageLabel).toBe("Unstaged");
    expect(summaries[1].score).toMatchObject({
      maximumScore: "100.00",
      recommendationOutcome: "DEFER",
    });
    expect(summaries[2]).toMatchObject({
      title: "DHS Zero Trust Assessment Support",
      currentStageLabel: "Submitted",
    });
  });

  it("builds a home dashboard snapshot from typed repository data", async () => {
    const db = createRepositoryClient(buildOrganizationDashboardRecord());

    const snapshot = await getHomeDashboardSnapshot({
      db,
      now: new Date("2026-04-17T00:00:00.000Z"),
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot).toMatchObject({
      trackedOpportunityCount: 3,
      activeOpportunityCount: 2,
      upcomingDeadlineCount: 2,
      enabledConnectorCount: 2,
      opportunitiesRequiringAttentionCount: 1,
      organization: {
        slug: "default-org",
      },
      topOpportunities: [
        {
          title: "Enterprise Knowledge Management Support Services",
        },
        {
          title: "Army Cloud Operations Recompete",
        },
      ],
      upcomingDeadlines: [
        {
          title: "Go/No-Go Board",
          opportunityTitle: "Enterprise Knowledge Management Support Services",
        },
        {
          title: "Response deadline",
          opportunityTitle: "Enterprise Knowledge Management Support Services",
        },
      ],
      pipelineConversionSummaries: [
        {
          key: "qualification",
          numerator: 2,
          denominator: 3,
          ratePercent: 66.67,
        },
        {
          key: "approval",
          numerator: 2,
          denominator: 2,
          ratePercent: 100,
        },
        {
          key: "proposal",
          numerator: 1,
          denominator: 2,
          ratePercent: 50,
        },
        {
          key: "submission",
          numerator: 1,
          denominator: 1,
          ratePercent: 100,
        },
      ],
      pipelineStageAgingSummaries: [
        {
          stageKey: "unstaged",
          averageAgeDays: 8,
          oldestAgeDays: 8,
          oldestOpportunityTitle: "Army Cloud Operations Recompete",
        },
        {
          stageKey: "capture_active",
          averageAgeDays: 7,
          oldestAgeDays: 7,
          oldestOpportunityTitle: "Enterprise Knowledge Management Support Services",
        },
      ],
    });

    expect(snapshot?.stageSummaries).toEqual([
      {
        stageKey: "capture_active",
        stageLabel: "Capture Active",
        opportunityCount: 1,
      },
      {
        stageKey: "submitted",
        stageLabel: "Submitted",
        opportunityCount: 1,
      },
      {
        stageKey: "unstaged",
        stageLabel: "Unstaged",
        opportunityCount: 1,
      },
    ]);

    expect(snapshot?.topOpportunities).toHaveLength(2);
    expect(
      snapshot?.topOpportunities.map((opportunity) => opportunity.title),
    ).not.toContain("DHS Zero Trust Assessment Support");
  });

  it("parses and applies decision-console ranking lenses", async () => {
    const db = createRepositoryClient(buildOrganizationDashboardRecord());
    const query = parseDecisionConsoleSearchParams({
      ranking: "risk",
      scope: "active",
    });

    const snapshot = await getDecisionConsoleSnapshot({
      db,
      now: new Date("2026-04-18T00:00:00.000Z"),
      query,
    });

    expect(query).toEqual({
      ranking: "risk",
      scope: "active",
    });
    expect(snapshot).not.toBeNull();
    expect(snapshot).toMatchObject({
      comparedOpportunityCount: 2,
      goOpportunityCount: 1,
      urgentOpportunityCount: 1,
      decisionAnalytics: {
        reviewedOpportunityCount: 3,
        finalDecisionCount: 2,
        recommendationOnlyCount: 1,
        recentDecisionVolume: 1,
        recommendationAlignmentPercent: "100.00",
        outcomeSummaries: [
          {
            outcome: "GO",
            opportunityCount: 2,
            percentage: "66.67",
          },
          {
            outcome: "DEFER",
            opportunityCount: 1,
            percentage: "33.33",
          },
          {
            outcome: "NO_GO",
            opportunityCount: 0,
            percentage: "0.00",
          },
        ],
        scoreDistributionBuckets: [
          {
            key: "under_50",
            opportunityCount: 1,
            currentCallCounts: {
              GO: 0,
              DEFER: 1,
              NO_GO: 0,
            },
          },
          {
            key: "50_to_69",
            opportunityCount: 0,
            currentCallCounts: {
              GO: 0,
              DEFER: 0,
              NO_GO: 0,
            },
          },
          {
            key: "70_to_84",
            opportunityCount: 1,
            currentCallCounts: {
              GO: 1,
              DEFER: 0,
              NO_GO: 0,
            },
          },
          {
            key: "85_plus",
            opportunityCount: 1,
            currentCallCounts: {
              GO: 1,
              DEFER: 0,
              NO_GO: 0,
            },
          },
        ],
        effortOutcomeSummaries: [
          {
            outcome: "GO",
            opportunityCount: 2,
            averageEffortUnits: "9.0",
            averageTaskCount: "1.5",
            averageMilestoneCount: "1.0",
            averageArtifactCount: "6.5",
          },
          {
            outcome: "DEFER",
            opportunityCount: 1,
            averageEffortUnits: "0.0",
            averageTaskCount: "0.0",
            averageMilestoneCount: "0.0",
            averageArtifactCount: "0.0",
          },
          {
            outcome: "NO_GO",
            opportunityCount: 0,
            averageEffortUnits: "0.0",
            averageTaskCount: "0.0",
            averageMilestoneCount: "0.0",
            averageArtifactCount: "0.0",
          },
        ],
      },
      rankedOpportunities: [
        {
          title: "Enterprise Knowledge Management Support Services",
          strategicValuePercent: "90.00",
          riskPressurePercent: "55.00",
          urgencyLabel: "14 days left",
        },
        {
          title: "Army Cloud Operations Recompete",
          urgencyLabel: "64 days left",
        },
      ],
    });
    expect(
      snapshot?.rankedOpportunities.map((opportunity) => opportunity.title),
    ).not.toContain("DHS Zero Trust Assessment Support");
  });

  it("builds an opportunity workspace snapshot with overview, scoring, and history data", async () => {
    const db = createWorkspaceRepositoryClient(buildOpportunityWorkspaceRecord());

    const snapshot = await getOpportunityWorkspaceSnapshot({
      db,
      opportunityId: "opp_alpha",
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot).toMatchObject({
      organization: {
        slug: "default-org",
      },
      taskAssigneeOptions: [
        {
          label: "OneSource Admin",
          value: "user_admin",
        },
        {
          label: "Taylor Reed",
          value: "user_taylor",
        },
      ],
      competitorOptions: [
        {
          label: "Harbor Mission Technologies",
          value: "competitor_harbor",
        },
        {
          label: "Vector Analytics LLC",
          value: "competitor_1",
        },
      ],
      closeout: null,
      opportunity: {
        title: "Enterprise Knowledge Management Support Services",
        procurementTypeLabel: "Solicitation",
        officeLocation: "Nellis AFB, NV, 89191",
        placeOfPerformanceLocation: "Las Vegas, Nevada, 89191",
      },
      scorecard: {
        totalScore: "79.50",
        factors: [
          {
            factorLabel: "Capability Fit",
          },
        ],
      },
      bidDecision: {
        id: "decision_current",
        isCurrent: true,
        finalOutcome: "GO",
        decidedByName: "OneSource Admin",
      },
      decisionHistory: [
        {
          id: "decision_current",
          isCurrent: true,
          decisionTypeKey: "initial_pursuit",
          finalOutcome: "GO",
        },
        {
          id: "decision_previous",
          isCurrent: false,
          decisionTypeKey: "qualification_review",
          finalOutcome: "DEFER",
        },
      ],
      tasks: [
        {
          title: "Complete incumbent analysis brief",
          assigneeUserId: "user_taylor",
          assigneeName: "Taylor Reed",
          deadlineReminderState: "OVERDUE",
        },
      ],
      documents: [
        {
          downloadUrl: null,
          title: "Performance Work Statement",
          extractionStatus: "SUCCEEDED",
        },
      ],
      notes: [
        {
          title: "Capture summary",
          isPinned: true,
        },
      ],
      activity: [
        {
          title: "Bid decision recorded as GO",
        },
      ],
      stageTransitions: [
        {
          toStageLabel: "Capture Active",
        },
      ],
      knowledgeSuggestions: [
        {
          id: "knowledge_air_force",
          title: "Air Force operational planning past performance",
          matchedFacets: {
            agencies: ["99th Contracting Squadron (FA4861)"],
            capabilities: ["Knowledge management"],
            contractTypes: ["Solicitation"],
            vehicles: ["OASIS-PLUS-UNR"],
          },
        },
      ],
    });
    expect(snapshot?.knowledgeSuggestions).toHaveLength(1);
    expect(snapshot?.knowledgeSuggestions[0]?.matchReasons).toContain(
      "Linked to this opportunity",
    );
  });

  it("maps the current closeout for closed opportunity workspaces", async () => {
    const record = buildOpportunityWorkspaceRecord();

    record.currentStageKey = "no_bid";
    record.currentStageLabel = "No Bid";
    record.closeouts = [
      {
        id: "closeout_1",
        isCurrent: true,
        outcomeStageKey: "no_bid",
        outcomeStageLabel: "No Bid",
        outcomeReason:
          "The team passed because customer access and incumbent advantage were both weak.",
        lessonsLearned:
          "Document relationship gaps before the first bid review so the team exits sooner.",
        recordedAt: new Date("2026-04-18T09:00:00.000Z"),
        recordedByUser: {
          name: "Sam Rivera",
          email: "sam@example.com",
        },
        competitor: {
          id: "competitor_harbor",
          name: "Harbor Mission Technologies",
        },
      },
    ];

    const db = createWorkspaceRepositoryClient(record);
    const snapshot = await getOpportunityWorkspaceSnapshot({
      db,
      opportunityId: "opp_alpha",
    });

    expect(snapshot?.closeout).toMatchObject({
      id: "closeout_1",
      outcomeStageKey: "no_bid",
      outcomeStageLabel: "No Bid",
      competitorId: "competitor_harbor",
      competitorName: "Harbor Mission Technologies",
      recordedByName: "Sam Rivera",
    });
  });

  it("calculates a workspace scorecard when no persisted current scorecard exists", async () => {
    const record = buildOpportunityWorkspaceRecord();

    record.scorecards = [];

    const db = createWorkspaceRepositoryClient(record);
    const snapshot = await getOpportunityWorkspaceSnapshot({
      db,
      opportunityId: "opp_alpha",
    });

    expect(snapshot?.scorecard).toMatchObject({
      scoringModelKey: "default_capture_v1",
      scoringModelVersion: "2026-04-18",
      maximumScore: "100.00",
      recommendationOutcome: "GO",
      recommendationSummary: expect.stringMatching(/recommend go/i),
    });
    expect(snapshot?.scorecard?.factors).toHaveLength(6);
    expect(snapshot?.opportunity.score?.maximumScore).toBe("100.00");
  });

  it("builds a personal assigned-task board snapshot with opportunity linkage", async () => {
    const db = createPersonalTaskBoardRepositoryClient(
      buildPersonalTaskBoardRecord(),
    );

    const snapshot = await getPersonalTaskBoardSnapshot({
      db,
      userId: "user_taylor",
    });

    expect(snapshot).toMatchObject({
      userDisplayName: "Taylor Reed",
      assignedTaskCount: 2,
      completedTaskCount: 1,
      overdueTaskCount: 1,
      tasks: [
        {
          title: "Complete incumbent analysis brief",
          deadlineReminderState: "OVERDUE",
          opportunityTitle: "Enterprise Knowledge Management Support Services",
          opportunityStageLabel: "Capture Active",
        },
        {
          title: "Prepare customer questions draft",
          deadlineReminderState: "NONE",
          opportunityTitle: "Army Cloud Operations Recompete",
          opportunityStageLabel: "Qualified",
        },
      ],
    });
  });

  it("parses and applies URL-synced opportunity list filters", async () => {
    const db = createRepositoryClient(buildOrganizationDashboardRecord());
    const query = parseOpportunityListSearchParams({
      due: "next_30_days",
      naics: "541511",
      page: "9",
      q: "knowledge",
      sort: "deadline_asc",
      source: "sam_gov",
      stage: "capture_active",
    });

    const snapshot = await getOpportunityListSnapshot({
      db,
      now: new Date("2026-04-18T00:00:00.000Z"),
      query,
    });

    expect(query).toMatchObject({
      query: "knowledge",
      naicsCode: "541511",
      stageKey: "capture_active",
      sourceSystem: "sam_gov",
      dueWindow: "next_30_days",
      sort: "deadline_asc",
      page: 9,
      pageSize: 4,
    });
    expect(snapshot).not.toBeNull();
    expect(snapshot?.totalCount).toBe(1);
    expect(snapshot?.pageCount).toBe(1);
    expect(snapshot?.query.page).toBe(1);
    expect(snapshot?.availableFilterCount).toBe(6);
    expect(snapshot?.results).toHaveLength(1);
    expect(snapshot?.results[0]).toMatchObject({
      title: "Enterprise Knowledge Management Support Services",
      sourceDisplayLabel: "SAM.gov",
    });
    expect(snapshot?.filterOptions.sources).toEqual([
      {
        count: 1,
        label: "Manual entry",
        value: "manual_entry",
      },
      {
        count: 2,
        label: "SAM.gov",
        value: "sam_gov",
      },
    ]);
  });

  it("returns null when the requested organization is missing", async () => {
    const db = createRepositoryClient(null);

    const snapshot = await getHomeDashboardSnapshot({ db });
    const summaries = await listOpportunitySummaries({ db });

    expect(snapshot).toBeNull();
    expect(summaries).toEqual([]);
  });
});
