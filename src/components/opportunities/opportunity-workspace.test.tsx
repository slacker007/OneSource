import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OpportunityWorkspace } from "./opportunity-workspace";
import type { OpportunityWorkspaceSnapshot } from "@/modules/opportunities/opportunity.types";

const snapshot: OpportunityWorkspaceSnapshot = {
  organization: {
    id: "org_123",
    name: "Default Organization",
    slug: "default-org",
  },
  opportunity: {
    id: "opp_123",
    title: "Enterprise Knowledge Management Support Services",
    description:
      "Capture-ready record normalized from a seeded SAM.gov opportunity.",
    externalNoticeId: "FA4861-26-R-0001",
    solicitationNumber: "FA4861-26-R-0001",
    sourceSummaryText:
      "Provide enterprise knowledge management, workflow modernization, and analytics support.",
    sourceSummaryUrl: "https://sam.gov/opp/FA4861-26-R-0001/view",
    postedAt: "2026-03-15T00:00:00.000Z",
    responseDeadlineAt: "2026-05-01T17:00:00.000Z",
    originSourceSystem: "sam_gov",
    naicsCode: "541511",
    classificationCode: "D302",
    setAsideDescription: "Small Business Set-Aside",
    currentStageKey: "capture_active",
    currentStageLabel: "Capture Active",
    currentStageChangedAt: "2026-04-15T16:05:00.000Z",
    updatedAt: "2026-04-18T04:00:00.000Z",
    uiLink: "https://sam.gov/opp/FA4861-26-R-0001/view",
    officeLocation: "Nellis AFB, NV, 89191",
    placeOfPerformanceLocation: "Las Vegas, Nevada, 89191",
    leadAgency: {
      id: "agency_1",
      name: "99th Contracting Squadron",
      organizationCode: "FA4861",
    },
    score: {
      totalScore: "79.50",
      maximumScore: "100.00",
      recommendationOutcome: "GO",
      calculatedAt: "2026-04-15T16:30:00.000Z",
    },
    bidDecision: {
      decisionTypeKey: "initial_pursuit",
      recommendationOutcome: "GO",
      finalOutcome: "GO",
      decidedAt: "2026-04-16T14:10:00.000Z",
    },
    vehicles: [
      {
        id: "vehicle_1",
        code: "OASIS-PLUS-UNR",
        name: "OASIS+ Unrestricted",
        vehicleType: "IDIQ",
        isPrimary: true,
      },
    ],
    competitors: [
      {
        id: "competitor_1",
        name: "Vector Analytics LLC",
        role: "INCUMBENT",
        websiteUrl: null,
      },
    ],
    tasks: [
      {
        id: "task_1",
        title: "Complete incumbent analysis brief",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueAt: "2026-04-20T17:00:00.000Z",
        assigneeName: "Taylor Reed",
      },
    ],
    milestones: [
      {
        id: "milestone_1",
        title: "Customer questions due",
        status: "PLANNED",
        targetDate: "2026-04-18T23:59:00.000Z",
      },
    ],
  },
  scorecard: {
    scoringModelKey: "default_capture_v1",
    scoringModelVersion: "2026-04-01",
    totalScore: "79.50",
    maximumScore: "100.00",
    scorePercent: "79.50",
    recommendationOutcome: "GO",
    recommendationSummary:
      "Vehicle access and capability fit support pursuit.",
    summary: "The seeded opportunity scores as a strong pursuit candidate.",
    calculatedAt: "2026-04-15T16:30:00.000Z",
    factors: [
      {
        id: "factor_1",
        factorKey: "capability_fit",
        factorLabel: "Capability Fit",
        weight: "30.00",
        score: "24.00",
        maximumScore: "30.00",
        explanation:
          "Past performance and service offerings align with the opportunity.",
      },
    ],
  },
  bidDecision: {
    decisionTypeKey: "initial_pursuit",
    recommendationOutcome: "GO",
    finalOutcome: "GO",
    recommendationSummary:
      "Proceed with capture because the opportunity fits strategic priorities.",
    finalRationale:
      "Leadership approved pursuit because vehicle access is already cleared.",
    recommendedAt: "2026-04-15T16:31:00.000Z",
    recommendedByLabel: "rule_engine:default_capture_v1",
    decidedByName: "OneSource Admin",
    decidedAt: "2026-04-16T14:10:00.000Z",
  },
  tasks: [
    {
      id: "task_1",
      title: "Complete incumbent analysis brief",
      description:
        "Summarize incumbent strengths, likely discriminators, and contract history.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueAt: "2026-04-20T17:00:00.000Z",
      startedAt: "2026-04-16T14:00:00.000Z",
      completedAt: null,
      assigneeName: "Taylor Reed",
      createdByName: "OneSource Admin",
    },
  ],
  milestones: [
    {
      id: "milestone_1",
      title: "Customer questions due",
      description: "Submit clarifications before the Q&A period closes.",
      milestoneTypeKey: "question_deadline",
      status: "PLANNED",
      targetDate: "2026-04-18T23:59:00.000Z",
      completedAt: null,
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
      originalFileName: "performance-work-statement.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 245760,
      extractionStatus: "SUCCEEDED",
      extractedAt: "2026-04-12T14:06:10.000Z",
      extractedText:
        "Performance work statement summary: provide enterprise knowledge management support.",
      uploadedByName: "OneSource Admin",
      createdAt: "2026-04-12T14:06:10.000Z",
    },
  ],
  notes: [
    {
      id: "note_1",
      title: "Capture summary",
      body: "Air Force mission fit is strong and vehicle access is confirmed.",
      contentFormat: "markdown",
      isPinned: true,
      authorName: "OneSource Admin",
      createdAt: "2026-04-15T09:30:00.000Z",
      updatedAt: "2026-04-15T09:30:00.000Z",
    },
  ],
  activity: [
    {
      id: "activity_1",
      eventType: "bid_decision_recorded",
      title: "Bid decision recorded as GO",
      description:
        "Leadership approved pursuit and documented the rationale in the workspace.",
      actorLabel: "OneSource Admin",
      relatedEntityType: "bid_decision",
      occurredAt: "2026-04-16T14:10:00.000Z",
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
      actorName: "OneSource Admin",
      transitionedAt: "2026-04-15T16:05:00.000Z",
    },
  ],
};

describe("OpportunityWorkspace", () => {
  it("renders the workspace sections and seeded execution context", () => {
    render(<OpportunityWorkspace allowManagePipeline snapshot={snapshot} />);

    expect(
      screen.getByRole("heading", {
        name: /enterprise knowledge management support services/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Overview$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Scoring$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Tasks$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Documents$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Notes$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^History$/i })).toBeInTheDocument();
    expect(
      screen.getByText(/complete incumbent analysis brief/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /performance work statement/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/capture summary/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /capability fit/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/bid decision recorded as go/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open source notice/i }),
    ).toHaveAttribute("href", "https://sam.gov/opp/FA4861-26-R-0001/view");
    expect(
      screen.getByRole("link", { name: /edit details/i }),
    ).toHaveAttribute("href", "/opportunities/opp_123/edit");
  });
});
