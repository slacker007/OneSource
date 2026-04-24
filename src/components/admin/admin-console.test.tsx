import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AdminAuditSettings,
  AdminConnectorSettings,
  AdminConsole,
  AdminSavedSearchSettings,
  AdminScoringSettings,
} from "./admin-console";
import type {
  AdminAuditSettingsSnapshot,
  AdminConnectorSettingsSnapshot,
  AdminSavedSearchSettingsSnapshot,
  AdminScoringSettingsSnapshot,
  AdminSettingsOverviewSnapshot,
} from "@/modules/admin/admin.types";

describe("settings admin workspaces", () => {
  it("renders a lightweight settings overview with links into focused workspaces", () => {
    render(
      <AdminConsole
        sessionUser={{
          name: "Alex Morgan",
          email: "admin@onesource.local",
        }}
        snapshot={overviewSnapshot}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /workspace settings/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /operator briefing/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: /source connector health/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open connectors/i }),
    ).toHaveAttribute("href", "/settings/connectors");
    expect(
      screen.getByRole("link", { name: /open saved searches/i }),
    ).toHaveAttribute("href", "/settings/saved-searches");
    expect(
      screen.getByRole("link", { name: /open scoring profile/i }),
    ).toHaveAttribute("href", "/settings/scoring");
    expect(
      screen.getByRole("link", { name: /open audit activity/i }),
    ).toHaveAttribute("href", "/settings/audit");
    expect(
      screen.getByRole("link", { name: /open users & roles/i }),
    ).toHaveAttribute("href", "/settings/users");
  });

  it("renders connector operations, source sync runs, and retry controls", () => {
    render(
      <AdminConnectorSettings
        retrySourceSyncAction={async () => undefined}
        sourceSyncRetryNotice={{
          message:
            "The saved search retry has been queued for the next sync sweep.",
          tone: "accent",
        }}
        snapshot={connectorSnapshot}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /connector operations/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the saved search retry has been queued/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /source connector health/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /recent source sync runs/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /failed import review/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /retry sync/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/rate limited/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/sam_gov_http_429/i)).toBeInTheDocument();
  });

  it("renders saved-search registry as its own workspace", () => {
    render(<AdminSavedSearchSettings snapshot={savedSearchSnapshot} />);

    expect(
      screen.getByRole("heading", { name: /^saved searches$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /saved searches/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/daily air force search/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/keywords: knowledge management/i),
    ).toBeInTheDocument();
  });

  it("renders scoring profile and recalibration controls as its own workspace", () => {
    render(
      <AdminScoringSettings
        recalibrateScoringProfileAction={async () => undefined}
        scoringRecalibrationNotice={{
          message:
            "Manual scoring recalibration was saved. 3 scorecards were recalculated under model version 2026-04-18.",
          tone: "accent",
        }}
        snapshot={scoringSnapshot}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /scoring profile/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/manual scoring recalibration was saved/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /organization capabilities/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /weighted scoring criteria/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /scoring recalibration/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /apply observed-outcome suggestions/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save manual recalibration/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/go >= 70\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/cloud platform engineering/i)).toBeInTheDocument();
  });

  it("renders audit activity as its own workspace", () => {
    render(<AdminAuditSettings snapshot={auditSnapshot} />);

    expect(
      screen.getByRole("heading", { name: /audit activity/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /audit activity/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("seed.bootstrap")).toBeInTheDocument();
  });

  it("renders clear empty states when focused workspace snapshots are empty", () => {
    render(
      <AdminConnectorSettings
        retrySourceSyncAction={async () => undefined}
        snapshot={{
          organizationId: "org_123",
          organizationName: "Default Organization",
          sourceOperations: {
            totalConnectorCount: 0,
            activeConnectorCount: 0,
            healthyConnectorCount: 0,
            rateLimitedConnectorCount: 0,
            failedImportReviewCount: 0,
            lastSuccessfulSyncAt: null,
            lastSuccessfulSyncSourceDisplayName: null,
            connectorHealth: [],
            recentSyncRuns: [],
            failedImportReviews: [],
          },
        }}
      />,
    );

    expect(
      screen.getByText(/no source connectors are configured yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no source sync runs are recorded yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no failed import review items are queued/i),
    ).toBeInTheDocument();
  });
});

const overviewSnapshot: AdminSettingsOverviewSnapshot = {
  organizationId: "org_123",
  organizationName: "Default Organization",
  totalUserCount: 7,
  adminUserCount: 1,
  totalAuditLogCount: 54,
  savedSearchCount: 2,
  scoringProfileSummary: {
    activeScoringModelKey: "default_capture_v1",
    activeScoringModelVersion: "2026-04-18",
    capabilityCount: 4,
    scoringCriteriaCount: 6,
  },
  sourceOperationsSummary: {
    totalConnectorCount: 4,
    activeConnectorCount: 3,
    healthyConnectorCount: 1,
    rateLimitedConnectorCount: 1,
    failedImportReviewCount: 1,
    lastSuccessfulSyncAt: "2026-04-18T08:10:00.000Z",
    lastSuccessfulSyncSourceDisplayName: "USAspending API",
  },
};

const connectorSnapshot: AdminConnectorSettingsSnapshot = {
  organizationId: "org_123",
  organizationName: "Default Organization",
  sourceOperations: {
    totalConnectorCount: 4,
    activeConnectorCount: 3,
    healthyConnectorCount: 2,
    rateLimitedConnectorCount: 1,
    failedImportReviewCount: 1,
    lastSuccessfulSyncAt: "2026-04-18T08:10:00.000Z",
    lastSuccessfulSyncSourceDisplayName: "USAspending API",
    connectorHealth: [
      {
        id: "connector_sam",
        sourceSystemKey: "sam_gov",
        sourceDisplayName: "SAM.gov",
        isEnabled: true,
        validationStatus: "VALID",
        connectorVersion: "sam-gov.v1",
        savedSearchCount: 1,
        latestRetryableSavedSearchId: "saved_search_123",
        lastValidatedAt: "2026-04-18T08:00:00.000Z",
        lastValidationMessage:
          "Public API key validated for opportunity search.",
        lastSyncAttemptAt: "2026-04-18T08:15:00.000Z",
        lastSuccessfulSyncAt: "2026-04-18T08:05:00.000Z",
        lastSyncStatus: "FAILED",
        healthStatus: "rate_limited",
        rateLimitStrategy: "bounded_api_key",
        rateLimitNotes: "postedFrom/postedTo required; limit capped at 1000.",
        latestRateLimitAt: "2026-04-18T08:15:00.000Z",
        latestRateLimitMessage: "SAM.gov returned HTTP 429: Too many requests.",
      },
    ],
    recentSyncRuns: [
      {
        id: "sync_run_1",
        sourceDisplayName: "SAM.gov",
        sourceSystemKey: "sam_gov",
        sourceSystem: "sam_gov",
        savedSearchId: "saved_search_123",
        savedSearchName: "Daily Air Force Search",
        requestedAt: "2026-04-18T08:15:00.000Z",
        completedAt: "2026-04-18T08:15:30.000Z",
        status: "FAILED",
        triggerType: "SCHEDULED",
        recordsFetched: 0,
        recordsImported: 0,
        recordsFailed: 1,
        httpStatus: 429,
        errorCode: "sam_gov_http_429",
        errorMessage: "SAM.gov returned HTTP 429: Too many requests.",
        isRateLimited: true,
        canRetry: true,
      },
    ],
    failedImportReviews: [
      {
        id: "import_review_1",
        sourceDisplayName: "SAM.gov",
        sourceSystem: "sam_gov",
        sourceRecordId: "FA4861-26-R-0001",
        sourceTitle: "Enterprise Knowledge Management Support Services",
        mode: "CREATE_OPPORTUNITY",
        status: "REJECTED",
        requestedAt: "2026-04-18T08:17:00.000Z",
        decidedAt: "2026-04-18T08:18:00.000Z",
        rationale:
          "Rejected because the notice was already canonicalized into the tracked pipeline.",
        targetOpportunityTitle:
          "Enterprise Knowledge Management Support Services",
      },
    ],
  },
};

const savedSearchSnapshot: AdminSavedSearchSettingsSnapshot = {
  organizationId: "org_123",
  organizationName: "Default Organization",
  savedSearches: [
    {
      id: "saved_search_123",
      name: "Daily Air Force Search",
      description: "Daily discovery coverage for Air Force knowledge work.",
      sourceSystem: "sam_gov",
      sourceDisplayName: "SAM.gov",
      connectorVersion: "sam-gov.v1",
      createdByLabel: "Alex Morgan",
      createdAt: "2026-04-17T08:00:00.000Z",
      updatedAt: "2026-04-18T08:05:00.000Z",
      lastExecutedAt: "2026-04-18T08:15:00.000Z",
      lastSyncedAt: "2026-04-18T08:05:12.000Z",
      filterSummary: [
        "Keywords: knowledge management",
        "NAICS 541511",
        "Agency FA4861",
        "Status active",
      ],
    },
  ],
};

const scoringSnapshot: AdminScoringSettingsSnapshot = {
  organizationId: "org_123",
  organizationName: "Default Organization",
  scoringProfile: {
    overview:
      "Mid-sized federal integrator focused on cloud modernization and cyber operations.",
    strategicFocus:
      "Prioritize Air Force, Army, and VA digital-transformation pursuits.",
    targetNaicsCodes: ["541512", "541519"],
    activeScoringModelKey: "default_capture_v1",
    activeScoringModelVersion: "2026-04-18",
    goRecommendationThreshold: "70.00",
    deferRecommendationThreshold: "45.00",
    minimumRiskScorePercent: "50.00",
    priorityAgencies: [
      {
        id: "agency_air_force",
        label: "99th Contracting Squadron (FA4861)",
      },
    ],
    relationshipAgencies: [
      {
        id: "agency_army",
        label: "PEO Enterprise Information Systems (W91QUZ)",
      },
    ],
    capabilities: [
      {
        id: "cap_cloud",
        key: "cloud-platform-engineering",
        label: "Cloud platform engineering",
        category: "cloud_operations",
        keywords: ["cloud operations", "platform engineering"],
        description: "Cloud modernization delivery support.",
      },
    ],
    certifications: [
      {
        id: "cert_iso",
        key: "iso-27001",
        label: "ISO/IEC 27001",
        code: "ISO-27001",
        issuingBody: "ISO",
        description: "Information-security management baseline.",
      },
    ],
    selectedVehicles: [
      {
        id: "vehicle_oasis",
        code: "OASIS-PLUS-UNR",
        name: "OASIS+ Unrestricted",
        vehicleType: "IDIQ",
        awardingAgency: "GSA",
        isPreferred: true,
        usageNotes: "Default preferred vehicle for high-fit pursuits.",
      },
    ],
    scoringCriteria: [
      {
        id: "criterion_capability_fit",
        key: "capability_fit",
        label: "Capability fit",
        description: "Measures capability match against the opportunity.",
        weight: "30.00",
        isActive: true,
      },
    ],
    recalibration: {
      closedOpportunityCount: 3,
      sampledOpportunityCount: 3,
      recommendationAlignmentPercent: "66.67",
      outcomeSummaries: [
        {
          key: "awarded",
          label: "Awarded",
          opportunityCount: 1,
          averageScorePercent: "86.00",
        },
      ],
      factorInsights: [
        {
          key: "capability_fit",
          label: "Capability fit",
          description: "Measures capability match against the opportunity.",
          currentWeight: "30.00",
          suggestedWeight: "32.00",
          awardedAveragePercent: "92.00",
          nonAwardAveragePercent: "56.00",
          outcomeLiftPercent: "36.00",
          evidenceCount: 3,
          recommendation: "increase",
          rationale:
            "Capability fit scored higher on awarded work, so the suggested weight increases.",
        },
      ],
      suggestionSummary:
        "Observed outcomes cover 3 closed opportunities and highlight where weights can shift.",
    },
  },
};

const auditSnapshot: AdminAuditSettingsSnapshot = {
  organizationId: "org_123",
  organizationName: "Default Organization",
  totalAuditLogCount: 9,
  recentAuditEvents: [
    {
      id: "audit_1",
      occurredAt: "2026-04-18T01:00:00.000Z",
      action: "seed.bootstrap",
      actionLabel: "Seed / Bootstrap",
      actorType: "USER",
      actorLabel: "Alex Morgan",
      targetLabel: "Default Organization",
      targetType: "organization",
      summary: "Initialized baseline organization.",
      metadataPreview: '{"seededOpportunityCount":5}',
    },
  ],
};
