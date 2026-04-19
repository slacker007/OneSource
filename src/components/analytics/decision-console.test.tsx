import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionConsole } from "./decision-console";
import type { DecisionConsoleSnapshot } from "@/modules/opportunities/opportunity.types";

const snapshot: DecisionConsoleSnapshot = {
  organization: {
    id: "org_123",
    name: "Default Organization",
    slug: "default-org",
  },
  query: {
    ranking: "risk",
    scope: "active",
  },
  comparedOpportunityCount: 2,
  goOpportunityCount: 1,
  urgentOpportunityCount: 1,
  decisionAnalytics: {
    reviewedOpportunityCount: 3,
    finalDecisionCount: 2,
    recommendationOnlyCount: 1,
    recentDecisionVolume: 2,
    recommendationAlignmentPercent: "100.00",
    effortSignalLabel:
      "Tracked execution artifacts: tasks, milestones, notes, documents, activity, and stage changes.",
    outcomeSummaries: [
      {
        outcome: "GO",
        label: "Go",
        opportunityCount: 2,
        percentage: "66.67",
      },
      {
        outcome: "DEFER",
        label: "Defer",
        opportunityCount: 1,
        percentage: "33.33",
      },
      {
        outcome: "NO_GO",
        label: "No-go",
        opportunityCount: 0,
        percentage: "0.00",
      },
    ],
    scoreDistributionBuckets: [
      {
        key: "50_to_69",
        label: "50-69%",
        opportunityCount: 1,
        currentCallCounts: {
          GO: 0,
          DEFER: 1,
          NO_GO: 0,
        },
      },
      {
        key: "70_to_84",
        label: "70-84%",
        opportunityCount: 1,
        currentCallCounts: {
          GO: 1,
          DEFER: 0,
          NO_GO: 0,
        },
      },
      {
        key: "85_plus",
        label: "85%+",
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
        label: "Go",
        opportunityCount: 2,
        averageEffortUnits: "9.0",
        averageTaskCount: "1.5",
        averageMilestoneCount: "1.0",
        averageArtifactCount: "6.5",
      },
      {
        outcome: "DEFER",
        label: "Defer",
        opportunityCount: 1,
        averageEffortUnits: "0.0",
        averageTaskCount: "0.0",
        averageMilestoneCount: "0.0",
        averageArtifactCount: "0.0",
      },
      {
        outcome: "NO_GO",
        label: "No-go",
        opportunityCount: 0,
        averageEffortUnits: "0.0",
        averageTaskCount: "0.0",
        averageMilestoneCount: "0.0",
        averageArtifactCount: "0.0",
      },
    ],
  },
  pipelineConversionSummaries: [
    {
      key: "qualification",
      label: "Qualification rate",
      numeratorStageKey: "qualified",
      denominatorStageKey: null,
      numerator: 3,
      denominator: 4,
      ratePercent: 75,
    },
    {
      key: "approval",
      label: "Pursuit approval rate",
      numeratorStageKey: "pursuit_approved",
      denominatorStageKey: "qualified",
      numerator: 2,
      denominator: 3,
      ratePercent: 66.67,
    },
  ],
  pipelineStageAgingSummaries: [
    {
      stageKey: "capture_active",
      stageLabel: "Capture Active",
      opportunityCount: 2,
      averageAgeDays: 14,
      oldestAgeDays: 21,
      oldestOpportunityId: "opp_alpha",
      oldestOpportunityTitle: "Enterprise Knowledge Management Support Services",
    },
  ],
  rankingOptions: [
    {
      label: "Value lens",
      value: "value",
    },
    {
      label: "Overall score",
      value: "score",
    },
    {
      label: "Urgency",
      value: "urgency",
    },
    {
      label: "Risk pressure",
      value: "risk",
    },
  ],
  scopeOptions: [
    {
      label: "Active pipeline",
      value: "active",
    },
    {
      label: "All tracked records",
      value: "all",
    },
  ],
  rankedOpportunities: [
    {
      id: "opp_alpha",
      title: "Enterprise Knowledge Management Support Services",
      currentStageKey: "capture_active",
      currentStageLabel: "Capture Active",
      leadAgency: {
        id: "agency_1",
        name: "99th Contracting Squadron",
        organizationCode: "FA4861",
      },
      responseDeadlineAt: "2026-05-01T17:00:00.000Z",
      updatedAt: "2026-04-18T01:00:00.000Z",
      sourceDisplayLabel: "SAM.gov",
      scorePercent: "79.50",
      strategicValuePercent: "90.00",
      riskPressurePercent: "55.00",
      urgencyScore: "75.00",
      urgencyDays: 13,
      urgencyLabel: "13 days left",
      recommendationOutcome: "GO",
      finalDecision: "GO",
      currentOutcome: "GO",
      effortTaskCount: 2,
      effortMilestoneCount: 1,
      effortArtifactCount: 7,
      effortUnits: 10,
    },
    {
      id: "opp_beta",
      title: "Army Cloud Operations Recompete",
      currentStageKey: "qualified",
      currentStageLabel: "Qualified",
      leadAgency: null,
      responseDeadlineAt: null,
      updatedAt: "2026-04-17T01:00:00.000Z",
      sourceDisplayLabel: "SAM.gov",
      scorePercent: "68.00",
      strategicValuePercent: "60.00",
      riskPressurePercent: "35.00",
      urgencyScore: "0.00",
      urgencyDays: null,
      urgencyLabel: "No deadline",
      recommendationOutcome: "DEFER",
      finalDecision: null,
      currentOutcome: "DEFER",
      effortTaskCount: 0,
      effortMilestoneCount: 0,
      effortArtifactCount: 0,
      effortUnits: 0,
    },
  ],
};

describe("DecisionConsole", () => {
  it("renders comparison modules, controls, and drill-through links", () => {
    render(<DecisionConsole snapshot={snapshot} />);

    expect(
      screen.getByRole("heading", { name: /decision console/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/recommendation alignment/i)).toHaveLength(2);
    expect(
      screen.getByRole("table", { name: /decision console rankings/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /score bands/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /effort versus outcome/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /stage conversion funnel/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /stage aging/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /rank by/i }),
    ).toHaveValue("risk");
    expect(screen.getByRole("combobox", { name: /scope/i })).toHaveValue(
      "active",
    );
    expect(
      screen.getAllByText(/enterprise knowledge management support services/i)
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /view capture active queue/i }),
    ).toHaveAttribute("href", "/opportunities?stage=capture_active");
    expect(
      screen.getByRole("link", { name: /view qualified queue/i }),
    ).toHaveAttribute("href", "/opportunities?stage=qualified");
    expect(
      screen.getByRole("link", { name: /open oldest pursuit/i }),
    ).toHaveAttribute("href", "/opportunities/opp_alpha");

    const scoreBandTable = screen.getByRole("table", {
      name: /score band comparison/i,
    });
    expect(within(scoreBandTable).getByText(/85%\+/i)).toBeInTheDocument();
    expect(
      within(scoreBandTable).getAllByText(/go 1 \/ defer 0 \/ no-go 0/i)
        .length,
    ).toBeGreaterThan(0);
  });

  it("renders a truthful empty state when no pursuits match the current view", () => {
    render(
      <DecisionConsole
        snapshot={{
          ...snapshot,
          comparedOpportunityCount: 0,
          goOpportunityCount: 0,
          urgentOpportunityCount: 0,
          rankedOpportunities: [],
        }}
      />,
    );

    expect(screen.getByText(/no pursuits to compare/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /the current ranking lens and scope did not return any opportunities/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /no recommendation-only pursuits are visible in the current ranking set/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders an error state when the decision snapshot is unavailable", () => {
    render(<DecisionConsole snapshot={null} />);

    expect(
      screen.getByRole("heading", { name: /decision console/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/decision data is unavailable/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /the decision-support console could not load an organization-scoped snapshot/i,
      ),
    ).toBeInTheDocument();
  });
});
