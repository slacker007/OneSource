import { render, screen } from "@testing-library/react";
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
    },
    {
      id: "opp_beta",
      title: "Army Cloud Operations Recompete",
      currentStageLabel: "Unstaged",
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
    },
  ],
};

describe("DecisionConsole", () => {
  it("renders ranked opportunity comparisons and active ranking controls", () => {
    render(<DecisionConsole snapshot={snapshot} />);

    expect(
      screen.getByRole("heading", { name: /decision console/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/current value lens uses the strategic-alignment/i)).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /decision console rankings/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /rank by/i }),
    ).toHaveValue("risk");
    expect(
      screen.getByRole("combobox", { name: /scope/i }),
    ).toHaveValue("active");
    expect(
      screen.getByText(/enterprise knowledge management support services/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/55.00%/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /open workspace/i })[0],
    ).toHaveAttribute("href", "/opportunities/opp_alpha");
  });
});
