import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShellPreview } from "@/components/home/app-shell-preview";
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
  activeOpportunityCount: 1,
  upcomingDeadlineCount: 1,
  enabledConnectorCount: 1,
  opportunitiesRequiringAttentionCount: 1,
  stageSummaries: [
    {
      stageKey: "capture_active",
      stageLabel: "Capture Active",
      opportunityCount: 1,
    },
  ],
  decisionQueue: [
    {
      id: "opp_123",
      title: "Enterprise Knowledge Management Support Services",
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
  focusOpportunity: {
    id: "opp_123",
    title: "Enterprise Knowledge Management Support Services",
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
  focusTasks: [
    {
      id: "task_1",
      title: "Confirm incumbent teaming posture",
      status: "BLOCKED",
      priority: "CRITICAL",
      dueAt: "2026-04-20T16:00:00.000Z",
      assigneeName: "Alex Morgan",
    },
  ],
  focusMilestones: [
    {
      id: "milestone_1",
      title: "Go/No-Go Board",
      status: "AT_RISK",
      targetDate: "2026-04-24T15:00:00.000Z",
    },
  ],
};

describe("AppShellPreview", () => {
  it("renders the typed homepage shell", () => {
    render(<AppShellPreview snapshot={snapshot} />);

    expect(
      screen.getByRole("heading", {
        name: /capture command center/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /current score 79\.50 \/ 100\.00 with go recommendation/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/seeded pipeline preview cards/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/dashboard preview/i)).toBeInTheDocument();
  });

  it("renders an empty-state shell when no snapshot is available", () => {
    render(<AppShellPreview snapshot={null} />);

    expect(
      screen.getByText(/no persisted opportunities yet/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/awaiting seeded data/i)).toBeInTheDocument();
  });
});
