import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OpportunityList } from "./opportunity-list";
import type { OpportunityListSnapshot } from "@/modules/opportunities/opportunity.types";

const snapshot: OpportunityListSnapshot = {
  organization: {
    id: "org_123",
    name: "Default Organization",
    slug: "default-org",
  },
  query: {
    query: "cloud",
    agencyId: null,
    naicsCode: "541512",
    stageKey: "qualified",
    sourceSystem: "manual_entry",
    dueWindow: "next_30_days",
    sort: "deadline_asc",
    page: 1,
    pageSize: 4,
  },
  totalCount: 1,
  pageCount: 1,
  pageResultCount: 1,
  availableFilterCount: 5,
  filterOptions: {
    agencies: [],
    dueWindows: [{ label: "Next 30 days", value: "next_30_days" }],
    sortOptions: [{ label: "Deadline: soonest first", value: "deadline_asc" }],
    sources: [{ label: "Manual entry", value: "manual_entry", count: 1 }],
    stages: [{ label: "Qualified", value: "qualified", count: 1 }],
  },
  results: [
    {
      id: "opp_123",
      title: "Army Cloud Operations Recompete",
      solicitationNumber: "W91QUZ-26-R-1042",
      leadAgency: {
        id: "agency_1",
        name: "PEO Enterprise Information Systems",
        organizationCode: "W91QUZ",
      },
      currentStageKey: "qualified",
      currentStageLabel: "Qualified",
      responseDeadlineAt: "2026-05-08T21:00:00.000Z",
      originSourceSystem: "manual_entry",
      sourceDisplayLabel: "Manual entry",
      naicsCode: "541512",
      sourceSummaryText: "Cloud operations and platform engineering support.",
      updatedAt: "2026-04-18T02:00:00.000Z",
      score: {
        totalScore: "68.00",
        maximumScore: "100.00",
        recommendationOutcome: "DEFER",
        calculatedAt: "2026-04-17T20:00:00.000Z",
      },
      bidDecision: {
        decisionTypeKey: "initial_pursuit",
        recommendationOutcome: "DEFER",
        finalOutcome: "DEFER",
        decidedAt: "2026-04-17T21:00:00.000Z",
      },
      vehicles: [],
      competitors: [],
      tasks: [],
      milestones: [],
    },
  ],
};

describe("OpportunityList", () => {
  it("renders the URL-synced opportunity pipeline results", () => {
    render(
      <OpportunityList
        snapshot={snapshot}
        viewState={{
          density: "compact",
          previewOpportunityId: "opp_123",
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /opportunity pipeline/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /opportunity pipeline results/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/army cloud operations recompete/i),
    ).toHaveLength(2);
    expect(screen.getByText(/search · cloud/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/541512/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /create tracked opportunity/i }),
    ).toHaveAttribute("href", "/opportunities/new");
    expect(
      screen.getByRole("link", { name: /preview brief/i }),
    ).toHaveAttribute(
      "href",
      "/opportunities?q=cloud&naics=541512&stage=qualified&source=manual_entry&due=next_30_days&sort=deadline_asc&density=compact&preview=opp_123",
    );
    expect(
      screen.getAllByRole("link", { name: /open workspace/i }),
    ).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: /edit opportunity/i }),
    ).toHaveAttribute("href", "/opportunities/opp_123/edit");
    expect(
      screen.getByRole("cell", { name: /manual entry/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", {
        name: /army cloud operations recompete/i,
      }),
    ).toHaveLength(2);
    expect(screen.getByText(/capture brief/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /due soon/i }),
    ).toHaveAttribute("href", "/opportunities?due=next_30_days&sort=deadline_asc&density=compact");
    expect(
      screen.getByRole("link", { name: /compact/i }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByText(/search · cloud/i)).toBeInTheDocument();
  });

  it("renders an empty state when no rows match the current filters", () => {
    render(
      <OpportunityList
        snapshot={{
          ...snapshot,
          pageResultCount: 0,
          results: [],
          totalCount: 0,
        }}
        viewState={{
          density: "comfortable",
          previewOpportunityId: null,
        }}
      />,
    );

    expect(
      screen.getByText(/no opportunities match this filter set/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /reset to all opportunities/i }),
    ).toHaveAttribute("href", "/opportunities");
  });
});
