import { describe, expect, it, vi } from "vitest";

import {
  getAdminAuditSettingsSnapshot,
  getAdminConnectorSettingsSnapshot,
  getAdminSavedSearchSettingsSnapshot,
  getAdminScoringSettingsSnapshot,
  getAdminSettingsSnapshot,
  getAdminSettingsOverviewSnapshot,
  getAdminUserManagementSnapshot,
  type AdminRepositoryClient,
  type OrganizationSettingsRecord,
  type OrganizationUserManagementRecord,
} from "./admin.repository";

function buildOrganizationAdminRecord():
  | OrganizationSettingsRecord
  | OrganizationUserManagementRecord {
  return {
    id: "org_123",
    name: "Default Organization",
    agencies: [
      {
        id: "agency_air_force",
        name: "99th Contracting Squadron",
        organizationCode: "FA4861",
      },
      {
        id: "agency_army",
        name: "PEO Enterprise Information Systems",
        organizationCode: "W91QUZ",
      },
      {
        id: "agency_va",
        name: "Technology Acquisition Center",
        organizationCode: "36C10B",
      },
    ],
    organizationProfile: {
      overview:
        "Mid-sized federal integrator focused on cloud modernization and cyber operations.",
      strategicFocus:
        "Prioritize Air Force, Army, and VA digital-transformation pursuits.",
      targetNaicsCodes: ["541512", "541519"],
      priorityAgencyIds: ["agency_air_force", "agency_army"],
      relationshipAgencyIds: ["agency_army", "agency_va"],
      activeScoringModelKey: "default_capture_v1",
      activeScoringModelVersion: "2026-04-18",
      goRecommendationThreshold: { toString: () => "70.00" },
      deferRecommendationThreshold: { toString: () => "45.00" },
      minimumRiskScorePercent: { toString: () => "50.00" },
      capabilities: [
        {
          id: "cap_cloud",
          capabilityKey: "cloud-platform-engineering",
          capabilityLabel: "Cloud platform engineering",
          capabilityCategory: "cloud_operations",
          capabilityKeywords: ["cloud operations", "platform engineering"],
          description: "Cloud modernization delivery support.",
        },
      ],
      certifications: [
        {
          id: "cert_iso",
          certificationKey: "iso-27001",
          certificationLabel: "ISO/IEC 27001",
          certificationCode: "ISO-27001",
          issuingBody: "ISO",
          description: "Information-security management baseline.",
        },
      ],
      selectedVehicles: [
        {
          isPreferred: true,
          usageNotes: "Default preferred vehicle for high-fit pursuits.",
          vehicle: {
            id: "vehicle_oasis",
            code: "OASIS-PLUS-UNR",
            name: "OASIS+ Unrestricted",
            vehicleType: "IDIQ",
            awardingAgency: "General Services Administration",
          },
        },
      ],
      scoringCriteria: [
        {
          id: "criterion_capability_fit",
          factorKey: "capability_fit",
          factorLabel: "Capability fit",
          description: "Measures capability match against the opportunity.",
          weight: { toString: () => "30.00" },
          isActive: true,
        },
      ],
    },
    _count: {
      users: 3,
      auditLogs: 18,
    },
    roles: [
      {
        key: "admin",
        name: "Admin",
        description: "Manages workspace configuration and users.",
      },
      {
        key: "executive",
        name: "Executive",
        description: "Reviews portfolio health and bid decisions.",
      },
      {
        key: "capture_manager",
        name: "Capture Manager",
        description: "Owns pursuit execution workflows.",
      },
    ],
    users: [
      {
        id: "user_admin",
        name: "Alex Morgan",
        email: "admin@onesource.local",
        status: "ACTIVE",
        roles: [
          {
            assignedAt: new Date("2026-04-17T12:00:00.000Z"),
            role: {
              key: "admin",
              name: "Admin",
            },
          },
          {
            assignedAt: new Date("2026-04-17T12:01:00.000Z"),
            role: {
              key: "executive",
              name: "Executive",
            },
          },
        ],
      },
      {
        id: "user_capture",
        name: "Morgan Patel",
        email: "morgan.patel@onesource.local",
        status: "ACTIVE",
        roles: [
          {
            assignedAt: new Date("2026-04-17T12:02:00.000Z"),
            role: {
              key: "capture_manager",
              name: "Capture Manager",
            },
          },
        ],
      },
      {
        id: "user_viewer",
        name: null,
        email: "avery.stone@onesource.local",
        status: "INVITED",
        roles: [],
      },
    ],
    auditLogs: [
      {
        id: "audit_1",
        occurredAt: new Date("2026-04-18T01:00:00.000Z"),
        action: "seed.bootstrap",
        actorType: "USER",
        actorIdentifier: "admin@onesource.local",
        targetType: "organization",
        targetId: "org_123",
        targetDisplay: "Default Organization",
        summary:
          "Initialized baseline organization, connector metadata, and multi-source opportunity seed data.",
        metadata: {
          seededOpportunityCount: 5,
        },
        actorUser: {
          name: "Alex Morgan",
          email: "admin@onesource.local",
        },
      },
      {
        id: "audit_2",
        occurredAt: new Date("2026-04-18T00:59:00.000Z"),
        action: "opportunity.stage_transition",
        actorType: "SYSTEM",
        actorIdentifier: null,
        targetType: "opportunity",
        targetId: "opp_123",
        targetDisplay: null,
        summary: null,
        metadata: null,
        actorUser: null,
      },
    ],
  };
}

function buildConnectorHealthRecords() {
  return [
    {
      id: "connector_sam",
      sourceSystemKey: "sam_gov",
      sourceDisplayName: "SAM.gov",
      isEnabled: true,
      validationStatus: "VALID",
      connectorVersion: "sam-gov.v1",
      lastValidatedAt: new Date("2026-04-18T08:00:00.000Z"),
      lastValidationMessage: "Public API key verified for opportunity search.",
      rateLimitProfile: {
        strategy: "bounded_api_key",
        notes: "postedFrom/postedTo required; limit capped at 1000.",
      },
      _count: {
        savedSearches: 1,
      },
      syncRuns: [
        {
          id: "sync_failed_429",
          status: "FAILED",
          requestedAt: new Date("2026-04-18T08:15:00.000Z"),
          completedAt: new Date("2026-04-18T08:15:05.000Z"),
          errorCode: "sam_gov_http_429",
          errorMessage: "SAM.gov returned HTTP 429: Too many requests.",
          savedSearch: {
            id: "saved_search_123",
            name: "Active Air Force Knowledge Management",
          },
          searchExecution: {
            httpStatus: 429,
            errorCode: "sam_gov_http_429",
            errorMessage: "SAM.gov returned HTTP 429: Too many requests.",
          },
        },
        {
          id: "sync_sam_success",
          status: "SUCCEEDED",
          requestedAt: new Date("2026-04-18T08:05:00.000Z"),
          completedAt: new Date("2026-04-18T08:05:12.000Z"),
          errorCode: null,
          errorMessage: null,
          savedSearch: {
            id: "saved_search_123",
            name: "Active Air Force Knowledge Management",
          },
          searchExecution: {
            httpStatus: 200,
            errorCode: null,
            errorMessage: null,
          },
        },
      ],
    },
    {
      id: "connector_usaspending",
      sourceSystemKey: "usaspending_api",
      sourceDisplayName: "USAspending API",
      isEnabled: true,
      validationStatus: "VALID",
      connectorVersion: "usaspending.v1",
      lastValidatedAt: new Date("2026-04-18T08:10:00.000Z"),
      lastValidationMessage:
        "Public award-search endpoint validated without stored credentials.",
      rateLimitProfile: {
        strategy: "public_post_api",
        notes:
          "Award intelligence requests are body-based rather than query-only.",
      },
      _count: {
        savedSearches: 1,
      },
      syncRuns: [
        {
          id: "sync_usaspending_success",
          status: "SUCCEEDED",
          requestedAt: new Date("2026-04-18T08:20:00.000Z"),
          completedAt: new Date("2026-04-18T08:20:08.000Z"),
          errorCode: null,
          errorMessage: null,
          savedSearch: {
            id: "saved_search_456",
            name: "Incumbent Award Context For KM Support",
          },
          searchExecution: {
            httpStatus: 200,
            errorCode: null,
            errorMessage: null,
          },
        },
      ],
    },
  ];
}

function buildRecentSyncRuns() {
  return [
    {
      id: "sync_failed_429",
      sourceSystem: "sam_gov",
      status: "FAILED",
      triggerType: "SCHEDULED",
      recordsFetched: 0,
      recordsImported: 0,
      recordsFailed: 1,
      requestedAt: new Date("2026-04-18T08:15:00.000Z"),
      completedAt: new Date("2026-04-18T08:15:05.000Z"),
      errorCode: "sam_gov_http_429",
      errorMessage: "SAM.gov returned HTTP 429: Too many requests.",
      connectorConfig: {
        sourceDisplayName: "SAM.gov",
        sourceSystemKey: "sam_gov",
      },
      savedSearch: {
        id: "saved_search_123",
        name: "Active Air Force Knowledge Management",
      },
      searchExecution: {
        httpStatus: 429,
        errorCode: "sam_gov_http_429",
        errorMessage: "SAM.gov returned HTTP 429: Too many requests.",
      },
    },
    {
      id: "sync_usaspending_success",
      sourceSystem: "usaspending_api",
      status: "SUCCEEDED",
      triggerType: "MANUAL",
      recordsFetched: 1,
      recordsImported: 1,
      recordsFailed: 0,
      requestedAt: new Date("2026-04-18T08:20:00.000Z"),
      completedAt: new Date("2026-04-18T08:20:08.000Z"),
      errorCode: null,
      errorMessage: null,
      connectorConfig: {
        sourceDisplayName: "USAspending API",
        sourceSystemKey: "usaspending_api",
      },
      savedSearch: {
        id: "saved_search_456",
        name: "Incumbent Award Context For KM Support",
      },
      searchExecution: {
        httpStatus: 200,
        errorCode: null,
        errorMessage: null,
      },
    },
  ];
}

function buildFailedImportReviews() {
  return [
    {
      id: "import_review_1",
      mode: "CREATE_OPPORTUNITY",
      status: "REJECTED",
      rationale:
        "Rejected because the notice was already canonicalized into the tracked pipeline.",
      requestedAt: new Date("2026-04-18T08:17:00.000Z"),
      decidedAt: new Date("2026-04-18T08:18:00.000Z"),
      connectorConfig: {
        sourceDisplayName: "SAM.gov",
      },
      sourceRecord: {
        sourceSystem: "sam_gov",
        sourceRecordId: "FA4861-26-R-0001",
        sourceImportPreviewPayload: {
          source: {
            title: "Enterprise Knowledge Management Support Services",
          },
        },
        sourceNormalizedPayload: {
          normalizedPayload: {
            title: "Enterprise Knowledge Management Support Services",
          },
        },
        sourceRawPayload: {
          title: "Enterprise Knowledge Management Support Services",
        },
      },
      targetOpportunity: {
        title: "Enterprise Knowledge Management Support Services",
      },
    },
  ];
}

function buildSavedSearches() {
  return [
    {
      id: "saved_search_123",
      sourceSystem: "sam_gov",
      name: "Active Air Force Knowledge Management",
      description: "Daily discovery coverage for Air Force knowledge pursuits.",
      canonicalFilters: {
        keywords: "knowledge management",
        naicsCode: "541511",
        organizationCode: "FA4861",
        status: "active",
        procurementTypes: ["r", "o"],
        postedDateFrom: "04/01/2026",
        postedDateTo: "04/18/2026",
      },
      createdAt: new Date("2026-04-17T08:00:00.000Z"),
      updatedAt: new Date("2026-04-18T08:05:00.000Z"),
      lastExecutedAt: new Date("2026-04-18T08:15:00.000Z"),
      lastSyncedAt: new Date("2026-04-18T08:05:12.000Z"),
      connectorConfig: {
        sourceDisplayName: "SAM.gov",
        connectorVersion: "sam-gov.v1",
      },
      createdByUser: {
        name: "Alex Morgan",
        email: "admin@onesource.local",
      },
    },
    {
      id: "saved_search_456",
      sourceSystem: "usaspending_api",
      name: "Award context backlog",
      description: null,
      canonicalFilters: {
        organizationName: "Department of Veterans Affairs",
      },
      createdAt: new Date("2026-04-16T08:00:00.000Z"),
      updatedAt: new Date("2026-04-18T07:00:00.000Z"),
      lastExecutedAt: null,
      lastSyncedAt: null,
      connectorConfig: null,
      createdByUser: null,
    },
  ];
}

function buildRecalibrationOpportunities() {
  return [
    {
      id: "opp_awarded",
      title: "Awarded cloud support bridge",
      currentStageKey: "awarded",
      currentStageLabel: "Awarded",
      scorecards: [
        {
          scorePercent: { toString: () => "86.00" },
          factorScores: [
            {
              factorKey: "capability_fit",
              score: { toString: () => "27.60" },
              maximumScore: { toString: () => "30.00" },
            },
          ],
        },
      ],
      bidDecisions: [
        {
          recommendationOutcome: "GO",
          finalOutcome: "GO",
        },
      ],
      closeouts: [
        {
          outcomeStageKey: "awarded",
        },
      ],
    },
    {
      id: "opp_lost",
      title: "Lost sustainment recompete",
      currentStageKey: "lost",
      currentStageLabel: "Lost",
      scorecards: [
        {
          scorePercent: { toString: () => "54.00" },
          factorScores: [
            {
              factorKey: "capability_fit",
              score: { toString: () => "16.20" },
              maximumScore: { toString: () => "30.00" },
            },
          ],
        },
      ],
      bidDecisions: [
        {
          recommendationOutcome: "GO",
          finalOutcome: "NO_GO",
        },
      ],
      closeouts: [
        {
          outcomeStageKey: "lost",
        },
      ],
    },
  ];
}

function createRepositoryClient(
  record: OrganizationSettingsRecord | OrganizationUserManagementRecord | null,
) {
  return {
    organization: {
      findUnique: vi.fn().mockResolvedValue(record),
    },
    user: {
      count: vi.fn().mockResolvedValue(1),
    },
    opportunity: {
      findMany: vi.fn().mockResolvedValue(buildRecalibrationOpportunities()),
    },
    sourceConnectorConfig: {
      findMany: vi.fn().mockResolvedValue(buildConnectorHealthRecords()),
    },
    sourceSyncRun: {
      findMany: vi.fn().mockResolvedValue(buildRecentSyncRuns()),
    },
    sourceSavedSearch: {
      count: vi.fn().mockResolvedValue(2),
      findMany: vi.fn().mockResolvedValue(buildSavedSearches()),
    },
    sourceImportDecision: {
      findMany: vi.fn().mockResolvedValue(buildFailedImportReviews()),
    },
  } as unknown as AdminRepositoryClient;
}

describe("admin.repository", () => {
  it("maps settings operations into the admin settings snapshot", async () => {
    const db = createRepositoryClient(buildOrganizationAdminRecord());

    const snapshot = await getAdminSettingsSnapshot({
      db,
      organizationId: "org_123",
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot).toMatchObject({
      organizationName: "Default Organization",
      totalUserCount: 3,
      adminUserCount: 1,
      totalAuditLogCount: 18,
    });
    expect(snapshot?.scoringProfile).toMatchObject({
      activeScoringModelKey: "default_capture_v1",
      activeScoringModelVersion: "2026-04-18",
      goRecommendationThreshold: "70.00",
      deferRecommendationThreshold: "45.00",
      minimumRiskScorePercent: "50.00",
      targetNaicsCodes: ["541512", "541519"],
      priorityAgencies: [
        { id: "agency_air_force", label: "99th Contracting Squadron (FA4861)" },
        {
          id: "agency_army",
          label: "PEO Enterprise Information Systems (W91QUZ)",
        },
      ],
      relationshipAgencies: [
        {
          id: "agency_army",
          label: "PEO Enterprise Information Systems (W91QUZ)",
        },
        {
          id: "agency_va",
          label: "Technology Acquisition Center (36C10B)",
        },
      ],
    });
    expect(snapshot?.scoringProfile?.capabilities[0]).toMatchObject({
      key: "cloud-platform-engineering",
      category: "cloud_operations",
      keywords: ["cloud operations", "platform engineering"],
    });
    expect(snapshot?.scoringProfile?.scoringCriteria[0]).toMatchObject({
      key: "capability_fit",
      weight: "30.00",
    });
    expect(snapshot?.scoringProfile?.recalibration).toMatchObject({
      closedOpportunityCount: 2,
      sampledOpportunityCount: 2,
      recommendationAlignmentPercent: "50.00",
    });
    expect(
      snapshot?.scoringProfile?.recalibration.factorInsights[0],
    ).toMatchObject({
      key: "capability_fit",
      currentWeight: "30.00",
      suggestedWeight: "30.00",
      outcomeLiftPercent: "38.00",
      recommendation: "hold",
    });

    expect(snapshot?.recentAuditEvents[0]).toMatchObject({
      action: "seed.bootstrap",
      actionLabel: "Seed / Bootstrap",
      actorLabel: "Alex Morgan",
      targetLabel: "Default Organization",
    });
    expect(snapshot?.recentAuditEvents[0].metadataPreview).toContain(
      '"seededOpportunityCount":5',
    );
    expect(snapshot?.recentAuditEvents[1]).toMatchObject({
      actionLabel: "Opportunity / Stage Transition",
      actorLabel: "System",
      targetLabel: "opp_123",
    });
    expect(snapshot?.sourceOperations).toMatchObject({
      totalConnectorCount: 2,
      activeConnectorCount: 2,
      healthyConnectorCount: 1,
      rateLimitedConnectorCount: 1,
      failedImportReviewCount: 1,
      lastSuccessfulSyncSourceDisplayName: "USAspending API",
    });
    expect(snapshot?.sourceOperations.connectorHealth[0]).toMatchObject({
      sourceDisplayName: "SAM.gov",
      healthStatus: "rate_limited",
      latestRateLimitAt: "2026-04-18T08:15:00.000Z",
      latestRetryableSavedSearchId: "saved_search_123",
    });
    expect(snapshot?.sourceOperations.recentSyncRuns[0]).toMatchObject({
      sourceDisplayName: "SAM.gov",
      canRetry: true,
      isRateLimited: true,
      httpStatus: 429,
      savedSearchId: "saved_search_123",
    });
    expect(snapshot?.sourceOperations.failedImportReviews[0]).toMatchObject({
      sourceTitle: "Enterprise Knowledge Management Support Services",
      status: "REJECTED",
    });
    expect(snapshot?.savedSearches[0]).toMatchObject({
      name: "Active Air Force Knowledge Management",
      sourceDisplayName: "SAM.gov",
      connectorVersion: "sam-gov.v1",
      createdByLabel: "Alex Morgan",
      lastExecutedAt: "2026-04-18T08:15:00.000Z",
      lastSyncedAt: "2026-04-18T08:05:12.000Z",
      filterSummary: [
        "Keywords: knowledge management",
        "NAICS 541511",
        "Agency FA4861",
        "Status active",
      ],
    });
    expect(snapshot?.savedSearches[1]).toMatchObject({
      name: "Award context backlog",
      sourceDisplayName: "Usaspending Api",
      connectorVersion: null,
      createdByLabel: "Unknown owner",
      filterSummary: ["Agency Department of Veterans Affairs"],
    });
  });

  it("maps focused settings route snapshots without requiring one oversized page payload", async () => {
    const db = createRepositoryClient(buildOrganizationAdminRecord());

    const overview = await getAdminSettingsOverviewSnapshot({
      db,
      organizationId: "org_123",
    });
    const connectors = await getAdminConnectorSettingsSnapshot({
      db,
      organizationId: "org_123",
    });
    const savedSearches = await getAdminSavedSearchSettingsSnapshot({
      db,
      organizationId: "org_123",
    });
    const scoring = await getAdminScoringSettingsSnapshot({
      db,
      organizationId: "org_123",
    });
    const audit = await getAdminAuditSettingsSnapshot({
      db,
      organizationId: "org_123",
    });

    expect(overview).toMatchObject({
      organizationName: "Default Organization",
      savedSearchCount: 2,
      scoringProfileSummary: {
        activeScoringModelKey: "default_capture_v1",
        activeScoringModelVersion: "2026-04-18",
        capabilityCount: 1,
        scoringCriteriaCount: 1,
      },
      sourceOperationsSummary: {
        totalConnectorCount: 2,
        activeConnectorCount: 2,
        failedImportReviewCount: 1,
      },
    });
    expect(connectors?.sourceOperations.connectorHealth[0]).toMatchObject({
      sourceDisplayName: "SAM.gov",
      healthStatus: "rate_limited",
    });
    expect(savedSearches?.savedSearches[0]).toMatchObject({
      name: "Active Air Force Knowledge Management",
      sourceDisplayName: "SAM.gov",
    });
    expect(scoring?.scoringProfile).toMatchObject({
      activeScoringModelKey: "default_capture_v1",
    });
    expect(audit?.recentAuditEvents[0]).toMatchObject({
      action: "seed.bootstrap",
      actorLabel: "Alex Morgan",
    });
  });

  it("maps workspace users and role options into the user-management snapshot", async () => {
    const db = createRepositoryClient(buildOrganizationAdminRecord());

    const snapshot = await getAdminUserManagementSnapshot({
      db,
      organizationId: "org_123",
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot).toMatchObject({
      organizationName: "Default Organization",
      totalUserCount: 3,
      activeUserCount: 2,
      invitedUserCount: 1,
      disabledUserCount: 0,
      adminUserCount: 1,
    });
    expect(snapshot?.roleOptions).toEqual([
      {
        key: "admin",
        label: "Admin",
        description: "Manages workspace configuration and users.",
      },
      {
        key: "executive",
        label: "Executive",
        description: "Reviews portfolio health and bid decisions.",
      },
      {
        key: "capture_manager",
        label: "Capture Manager",
        description: "Owns pursuit execution workflows.",
      },
    ]);
    expect(snapshot?.users[0]).toMatchObject({
      name: "Alex Morgan",
      email: "admin@onesource.local",
      latestRoleAssignedAt: "2026-04-17T12:01:00.000Z",
      roleKeys: ["admin", "executive"],
      roleLabels: ["Admin", "Executive"],
    });
    expect(snapshot?.users[2]).toMatchObject({
      email: "avery.stone@onesource.local",
      latestRoleAssignedAt: null,
      roleKeys: [],
      roleLabels: [],
    });
  });

  it("returns null when the organization is missing", async () => {
    const db = createRepositoryClient(null);

    await expect(
      getAdminSettingsSnapshot({
        db,
        organizationId: "missing_org",
      }),
    ).resolves.toBeNull();
    await expect(
      getAdminUserManagementSnapshot({
        db,
        organizationId: "missing_org",
      }),
    ).resolves.toBeNull();
  });
});
