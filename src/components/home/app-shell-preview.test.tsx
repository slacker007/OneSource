import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardLanding } from "@/components/home/dashboard-landing";
import type { HomeDashboardSnapshot } from "@/modules/opportunities/opportunity.types";

const snapshot: HomeDashboardSnapshot = {
  organization: {
    id: "org_123",
    name: "Default Organization",
    slug: "default-org",
  },
  connectors: [
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
  ],
  trackedOpportunityCount: 2,
  activeOpportunityCount: 1,
  upcomingDeadlineCount: 2,
  enabledConnectorCount: 1,
  opportunitiesRequiringAttentionCount: 1,
  attentionQueue: [
    {
      opportunityId: "opp_123",
      opportunityTitle: "Enterprise Knowledge Management Support Services",
      stageLabel: "Capture Active",
      reasonLabel: "Blocked overdue task",
      supportingDetail: "Confirm incumbent teaming posture",
      responseDeadlineAt: "2026-05-01T17:00:00.000Z",
      tone: "danger",
    },
  ],
  stageSummaries: [
    {
      stageKey: "capture_active",
      stageLabel: "Capture Active",
      opportunityCount: 1,
    },
    {
      stageKey: "qualified",
      stageLabel: "Qualified",
      opportunityCount: 1,
    },
  ],
  pipelineConversionSummaries: [
    {
      key: "qualification",
      label: "Qualification rate",
      numerator: 2,
      denominator: 2,
      ratePercent: 100,
    },
    {
      key: "approval",
      label: "Pursuit approval rate",
      numerator: 1,
      denominator: 2,
      ratePercent: 50,
    },
    {
      key: "proposal",
      label: "Proposal start rate",
      numerator: 1,
      denominator: 1,
      ratePercent: 100,
    },
    {
      key: "submission",
      label: "Submission rate",
      numerator: 0,
      denominator: 1,
      ratePercent: 0,
    },
  ],
  pipelineStageAgingSummaries: [
    {
      stageKey: "capture_active",
      stageLabel: "Capture Active",
      opportunityCount: 1,
      averageAgeDays: 7,
      oldestAgeDays: 7,
      oldestOpportunityTitle:
        "Enterprise Knowledge Management Support Services",
    },
  ],
  upcomingDeadlines: [
    {
      id: "opp_123:response-deadline",
      title: "Response deadline",
      deadlineAt: "2026-05-01T17:00:00.000Z",
      deadlineType: "RESPONSE_DEADLINE",
      opportunityId: "opp_123",
      opportunityTitle: "Enterprise Knowledge Management Support Services",
      stageLabel: "Capture Active",
    },
    {
      id: "opp_123:milestone:milestone_1",
      title: "Go/No-Go Board",
      deadlineAt: "2026-04-24T15:00:00.000Z",
      deadlineType: "MILESTONE",
      opportunityId: "opp_123",
      opportunityTitle: "Enterprise Knowledge Management Support Services",
      stageLabel: "Capture Active",
    },
  ],
  taskBurden: {
    openTaskCount: 2,
    blockedTaskCount: 1,
    criticalTaskCount: 1,
    overdueTaskCount: 1,
    upcomingTaskCount: 1,
    opportunitiesWithOpenTasksCount: 1,
    busiestOpportunities: [
      {
        opportunityId: "opp_123",
        opportunityTitle: "Enterprise Knowledge Management Support Services",
        openTaskCount: 2,
        blockedTaskCount: 1,
        criticalTaskCount: 1,
        overdueTaskCount: 1,
      },
    ],
  },
  recentSourceActivity: [
    {
      id: "sync_run_1",
      sourceSystem: "sam_gov",
      sourceDisplayName: "SAM.gov",
      status: "SUCCEEDED",
      triggerType: "SCHEDULED",
      requestedAt: "2026-04-18T06:00:00.000Z",
      completedAt: "2026-04-18T06:02:00.000Z",
      savedSearchName: "Air Force knowledge services",
      recordsFetched: 24,
      recordsImported: 3,
      recordsFailed: 0,
    },
  ],
  topOpportunities: [
    {
      id: "opp_123",
      title: "Enterprise Knowledge Management Support Services",
      solicitationNumber: "FA4861-26-R-0012",
      leadAgency: {
        id: "agency_1",
        name: "99th Contracting Squadron",
        organizationCode: "FA4861",
      },
      currentStageKey: "capture_active",
      currentStageLabel: "Capture Active",
      responseDeadlineAt: "2026-05-01T17:00:00.000Z",
      originSourceSystem: "sam_gov",
      naicsCode: "541511",
      sourceSummaryText: "Knowledge management support.",
      updatedAt: "2026-04-18T02:00:00.000Z",
      score: {
        totalScore: "79.50",
        maximumScore: "100.00",
        recommendationOutcome: "GO",
        calculatedAt: "2026-04-15T16:00:00.000Z",
      },
      bidDecision: {
        decisionTypeKey: "initial_pursuit",
        recommendationOutcome: "GO",
        finalOutcome: "GO",
        decidedAt: "2026-04-15T16:05:00.000Z",
      },
      vehicles: [],
      competitors: [],
      tasks: [],
      milestones: [],
    },
  ],
};

describe("DashboardLanding", () => {
  it("renders the seeded dashboard widgets", () => {
    render(<DashboardLanding snapshot={snapshot} />);

    expect(
      screen.getByRole("heading", {
        name: /attention queue/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /top pursuits/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /upcoming deadlines/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /task burden/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /pipeline risk/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /recent source activity/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/enterprise knowledge management support services/i)
        .length,
    ).toBeGreaterThanOrEqual(4);
    expect(screen.getByText(/tracked pursuits/i)).toBeInTheDocument();
    expect(screen.getByText(/blocked overdue task/i)).toBeInTheDocument();
    expect(screen.getByText(/score 79\.50\/100/i)).toBeInTheDocument();
    expect(screen.getByText(/go\/no-go board/i)).toBeInTheDocument();
    expect(screen.getByText(/open tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/avg age 7 days/i)).toBeInTheDocument();
    expect(screen.getByText(/sam\.gov/i)).toBeInTheDocument();
  });

  it("renders an error state when no snapshot is available", () => {
    render(<DashboardLanding snapshot={null} />);

    expect(screen.getByText(/dashboard data unavailable/i)).toBeInTheDocument();
    expect(
      screen.getByText(/seeded default organization/i),
    ).toBeInTheDocument();
  });
});
