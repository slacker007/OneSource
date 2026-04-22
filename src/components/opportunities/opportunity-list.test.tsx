import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OpportunityList } from "./opportunity-list";
import type { OpportunityListSnapshot } from "@/modules/opportunities/opportunity.types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const snapshot: OpportunityListSnapshot = {
  organization: {
    id: "org_123",
    name: "Default Organization",
    slug: "default-org",
  },
  query: {
    savedViewKey: "due_soon",
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
  savedViews: [
    {
      count: 7,
      key: "all",
      label: "All pursuits",
      supportingText: "Default queue",
    },
    {
      count: 3,
      key: "due_soon",
      label: "Due soon",
      supportingText: "30-day window",
    },
    {
      count: 2,
      key: "qualified",
      label: "Qualified review",
      supportingText: "Triage next",
    },
    {
      count: 1,
      key: "proposal_sprint",
      label: "Proposal sprint",
      supportingText: "Proposal stage",
    },
  ],
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
  it("renders the MUI opportunity pipeline shell and filters", () => {
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
      screen.getByRole("grid", { name: /opportunity pipeline results/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/queue · due soon/i)).toBeInTheDocument();
    expect(screen.getByText(/search · cloud/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/541512/i)).toBeInTheDocument();
    expect(screen.getByText(/3 · 30-day window/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /create tracked opportunity/i }),
    ).toHaveAttribute("href", "/opportunities/new");
    expect(
      screen.getByRole("link", { name: /due soon\s*3 · 30-day window/i }),
    ).toHaveAttribute(
      "href",
      "/opportunities?view=due_soon&due=next_30_days&sort=deadline_asc&density=compact",
    );
    expect(screen.getByRole("link", { name: /^compact$/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  }, 20_000);

  it("renders the current pursuit preview and workspace actions", () => {
    render(
      <OpportunityList
        snapshot={snapshot}
        viewState={{
          density: "compact",
          previewOpportunityId: "opp_123",
        }}
      />,
    );

    expect(screen.getAllByRole("link", { name: /open brief/i })[0]).toHaveAttribute(
      "href",
      "/opportunities?view=due_soon&q=cloud&naics=541512&stage=qualified&source=manual_entry&due=next_30_days&sort=deadline_asc&density=compact&preview=opp_123",
    );
    expect(
      screen.getAllByRole("link", { name: /open workspace/i }).length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole("link", { name: /edit record/i })[0]).toHaveAttribute(
      "href",
      "/opportunities/opp_123/edit",
    );
    expect(screen.getAllByText(/manual entry/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("heading", {
        name: /army cloud operations recompete/i,
      }).length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/capture brief/i).length).toBeGreaterThan(0);
  }, 20_000);

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
      screen
        .getAllByRole("link", { name: /reset to all opportunities/i })
        .every((link) => link.getAttribute("href") === "/opportunities"),
    ).toBe(true);
  }, 20_000);
});
