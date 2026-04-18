import { describe, expect, it, vi } from "vitest";

import {
  getOpportunityListSnapshot,
  getHomeDashboardSnapshot,
  listOpportunitySummaries,
  parseOpportunityListSearchParams,
  type OpportunityRepositoryClient,
  type OrganizationDashboardRecord,
} from "@/modules/opportunities/opportunity.repository";

function buildOrganizationDashboardRecord(): OrganizationDashboardRecord {
  return {
    id: "org_123",
    name: "Default Organization",
    slug: "default-org",
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
        responseDeadlineAt: new Date("2026-05-01T17:00:00.000Z"),
        originSourceSystem: "sam_gov",
        naicsCode: "541511",
        sourceSummaryText:
          "Enterprise knowledge management and workflow modernization support.",
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
            dueAt: new Date("2026-04-20T16:00:00.000Z"),
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
          },
        ],
        scorecards: [
          {
            totalScore: { toString: () => "79.50" },
            maximumScore: { toString: () => "100.00" },
            recommendationOutcome: "GO",
            calculatedAt: new Date("2026-04-15T16:00:00.000Z"),
          },
        ],
        bidDecisions: [
          {
            decisionTypeKey: "initial_pursuit",
            recommendationOutcome: "GO",
            finalOutcome: "GO",
            decidedAt: new Date("2026-04-15T16:05:00.000Z"),
          },
        ],
      },
      {
        id: "opp_beta",
        title: "Army Cloud Operations Recompete",
        solicitationNumber: "W91QUZ-26-R-1042",
        currentStageKey: null,
        currentStageLabel: null,
        responseDeadlineAt: new Date("2026-06-20T17:00:00.000Z"),
        originSourceSystem: "sam_gov",
        naicsCode: "541512",
        sourceSummaryText: "Cloud operations and sustainment support.",
        updatedAt: new Date("2026-04-17T01:00:00.000Z"),
        leadAgency: null,
        vehicles: [],
        competitors: [],
        tasks: [],
        milestones: [],
        scorecards: [],
        bidDecisions: [],
      },
      {
        id: "opp_gamma",
        title: "DHS Zero Trust Assessment Support",
        solicitationNumber: "70RCSJ-26-R-ZT01",
        currentStageKey: "submitted",
        currentStageLabel: "Submitted",
        responseDeadlineAt: new Date("2026-04-18T21:00:00.000Z"),
        originSourceSystem: "manual_entry",
        naicsCode: "541519",
        sourceSummaryText: "Submitted cyber support pursuit.",
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
          },
        ],
        scorecards: [
          {
            totalScore: { toString: () => "91.00" },
            maximumScore: { toString: () => "100.00" },
            recommendationOutcome: "GO",
            calculatedAt: new Date("2026-04-18T20:00:00.000Z"),
          },
        ],
        bidDecisions: [
          {
            decisionTypeKey: "submit_authorization",
            recommendationOutcome: "GO",
            finalOutcome: "GO",
            decidedAt: new Date("2026-04-18T20:15:00.000Z"),
          },
        ],
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
      priority: "CRITICAL",
    });
    expect(summaries[1].currentStageLabel).toBe("Unstaged");
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
