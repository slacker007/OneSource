import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OpportunityWorkspace } from "./opportunity-workspace";
import { INITIAL_OPPORTUNITY_BID_DECISION_ACTION_STATE } from "@/modules/opportunities/opportunity-bid-decision-form.schema";
import { INITIAL_OPPORTUNITY_CLOSEOUT_ACTION_STATE } from "@/modules/opportunities/opportunity-closeout-form.schema";
import { INITIAL_OPPORTUNITY_DOCUMENT_ACTION_STATE } from "@/modules/opportunities/opportunity-document-form.schema";
import { INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE } from "@/modules/opportunities/opportunity-milestone-form.schema";
import { INITIAL_OPPORTUNITY_NOTE_ACTION_STATE } from "@/modules/opportunities/opportunity-note-form.schema";
import { INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE } from "@/modules/opportunities/opportunity-proposal-form.schema";
import { INITIAL_OPPORTUNITY_STAGE_TRANSITION_ACTION_STATE } from "@/modules/opportunities/opportunity-stage-policy";
import { INITIAL_OPPORTUNITY_TASK_ACTION_STATE } from "@/modules/opportunities/opportunity-task-form.schema";
import type { OpportunityWorkspaceSnapshot } from "@/modules/opportunities/opportunity.types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

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
    procurementTypeLabel: "Solicitation",
    procurementBaseTypeLabel: "Solicitation",
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
        dueAt: "2026-04-16T17:00:00.000Z",
        deadlineReminderState: "OVERDUE",
        deadlineReminderUpdatedAt: "2026-04-18T08:00:00.000Z",
        assigneeName: "Taylor Reed",
      },
    ],
    milestones: [
      {
        id: "milestone_1",
        title: "Customer questions due",
        status: "PLANNED",
        targetDate: "2026-04-18T23:59:00.000Z",
        deadlineReminderState: "UPCOMING",
        deadlineReminderUpdatedAt: "2026-04-18T08:00:00.000Z",
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
    id: "decision_current",
    isCurrent: true,
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
  decisionHistory: [
    {
      id: "decision_current",
      isCurrent: true,
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
    {
      id: "decision_previous",
      isCurrent: false,
      decisionTypeKey: "qualification_review",
      recommendationOutcome: "DEFER",
      finalOutcome: "DEFER",
      recommendationSummary:
        "Defer pursuit until the customer confirms the vehicle path.",
      finalRationale:
        "Leadership held the record until the teaming structure was clarified.",
      recommendedAt: "2026-04-10T10:00:00.000Z",
      recommendedByLabel: "rule_engine:default_capture_v1",
      decidedByName: "OneSource Admin",
      decidedAt: "2026-04-10T12:00:00.000Z",
    },
  ],
  taskAssigneeOptions: [
    {
      label: "OneSource Admin",
      value: "user_admin",
    },
    {
      label: "Taylor Reed",
      value: "user_taylor",
    },
  ],
  competitorOptions: [
    {
      label: "Harbor Mission Technologies",
      value: "competitor_harbor",
    },
    {
      label: "Vector Analytics LLC",
      value: "competitor_1",
    },
  ],
  closeout: null,
  proposal: {
    id: "proposal_1",
    status: "IN_PROGRESS",
    statusLabel: "In Progress",
    ownerUserId: "user_admin",
    ownerName: "OneSource Admin",
    submittedAt: null,
    createdAt: "2026-04-16T10:00:00.000Z",
    updatedAt: "2026-04-18T04:00:00.000Z",
    completedChecklistCount: 2,
    totalChecklistCount: 4,
    checklistItems: [
      {
        id: "proposal_check_1",
        checklistKey: "requirement_matrix_reviewed",
        checklistLabel: "Requirement matrix reviewed",
        isComplete: true,
        completedAt: "2026-04-16T15:00:00.000Z",
      },
      {
        id: "proposal_check_2",
        checklistKey: "section_owners_assigned",
        checklistLabel: "Section owners assigned",
        isComplete: true,
        completedAt: "2026-04-16T16:00:00.000Z",
      },
      {
        id: "proposal_check_3",
        checklistKey: "pricing_package_aligned",
        checklistLabel: "Pricing package aligned",
        isComplete: false,
        completedAt: null,
      },
      {
        id: "proposal_check_4",
        checklistKey: "final_compliance_review_complete",
        checklistLabel: "Final compliance review complete",
        isComplete: false,
        completedAt: null,
      },
    ],
    linkedDocuments: [
      {
        id: "doc_1",
        title: "Performance Work Statement",
        documentType: "statement_of_work",
        downloadUrl: "/api/opportunities/documents/doc_1/download",
      },
    ],
  },
  tasks: [
    {
      id: "task_1",
      title: "Complete incumbent analysis brief",
      description:
        "Summarize incumbent strengths, likely discriminators, and contract history.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueAt: "2026-04-16T17:00:00.000Z",
      startedAt: "2026-04-16T14:00:00.000Z",
      completedAt: null,
      deadlineReminderState: "OVERDUE",
      deadlineReminderUpdatedAt: "2026-04-18T08:00:00.000Z",
      assigneeUserId: "user_taylor",
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
      deadlineReminderState: "UPCOMING",
      deadlineReminderUpdatedAt: "2026-04-18T08:00:00.000Z",
    },
  ],
  documents: [
    {
      id: "doc_1",
      title: "Performance Work Statement",
      documentType: "statement_of_work",
      downloadUrl: "/api/opportunities/documents/doc_1/download",
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
  knowledgeSuggestions: [
    {
      id: "knowledge_1",
      assetType: "PAST_PERFORMANCE_SNIPPET",
      title: "Air Force operational planning past performance",
      summary:
        "Reusable past-performance proof point for enterprise knowledge management and workflow modernization work inside Air Force operational planning organizations.",
      bodyPreview:
        "Reusable past-performance proof point for enterprise knowledge management and workflow modernization work inside Air Force operational planning organizations.",
      matchReasons: [
        "Linked to this opportunity",
        "Lead agency: 99th Contracting Squadron (FA4861)",
        "Capability fit: Data and AI modernization, Enterprise service delivery",
        "Vehicle coverage: OASIS-PLUS-UNR",
        "Contract type: Solicitation",
      ],
      matchedFacets: {
        agencies: ["99th Contracting Squadron (FA4861)"],
        capabilities: [
          "Data and AI modernization",
          "Enterprise service delivery",
        ],
        contractTypes: ["Solicitation"],
        freeformTags: ["knowledge management"],
        vehicles: ["OASIS-PLUS-UNR"],
      },
      linkedOpportunities: [
        {
          id: "opp_123",
          title: "Enterprise Knowledge Management Support Services",
          currentStageLabel: "Capture Active",
        },
      ],
      updatedAt: "2026-04-18T04:00:00.000Z",
      updatedByLabel: "Alex Morgan",
    },
  ],
};

describe("OpportunityWorkspace", () => {
  it("renders the sectioned workspace shell and focused zone content", () => {
    const renderWorkspace = (activeSection?: Parameters<
      typeof OpportunityWorkspace
    >[0]["activeSection"]) => (
      <OpportunityWorkspace
        activeSection={activeSection}
        allowManagePipeline
        recordBidDecisionAction={async () =>
          INITIAL_OPPORTUNITY_BID_DECISION_ACTION_STATE
        }
        createDocumentAction={async () =>
          INITIAL_OPPORTUNITY_DOCUMENT_ACTION_STATE
        }
        createMilestoneAction={async () =>
          INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE
        }
        createNoteAction={async () => INITIAL_OPPORTUNITY_NOTE_ACTION_STATE}
        deleteProposalAction={async () =>
          INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE
        }
        createTaskAction={async () => INITIAL_OPPORTUNITY_TASK_ACTION_STATE}
        deleteMilestoneAction={async () =>
          INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE
        }
        deleteTaskAction={async () => INITIAL_OPPORTUNITY_TASK_ACTION_STATE}
        recordCloseoutAction={async () =>
          INITIAL_OPPORTUNITY_CLOSEOUT_ACTION_STATE
        }
        saveProposalAction={async () =>
          INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE
        }
        snapshot={snapshot}
        stageTransitionAction={async () =>
          INITIAL_OPPORTUNITY_STAGE_TRANSITION_ACTION_STATE
        }
        updateMilestoneAction={async () =>
          INITIAL_OPPORTUNITY_MILESTONE_ACTION_STATE
        }
        updateTaskAction={async () => INITIAL_OPPORTUNITY_TASK_ACTION_STATE}
      />
    );

    const { rerender } = render(renderWorkspace("summary"));

    expect(
      screen.getByRole("heading", {
        name: /enterprise knowledge management support services/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^Opportunities$/i }),
    ).toHaveAttribute("href", "/opportunities");
    expect(
      screen.getByRole("navigation", {
        name: /opportunity workspace sections/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Summary$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^Capture/i }),
    ).toHaveAttribute("href", "/opportunities/opp_123?section=capture");
    expect(
      screen.getByRole("heading", { name: /^Capture summary$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /suggested reusable content/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/linked to this opportunity/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open filtered library/i }),
    ).toHaveAttribute("href", "/knowledge?opportunity=opp_123");
    expect(
      screen.getByRole("link", { name: /open asset/i }),
    ).toHaveAttribute("href", "/knowledge/knowledge_1/edit");
    expect(
      screen.getByRole("link", { name: /open source notice/i }),
    ).toHaveAttribute("href", "https://sam.gov/opp/FA4861-26-R-0001/view");
    expect(
      screen.getByRole("link", { name: /edit details/i }),
    ).toHaveAttribute("href", "/opportunities/opp_123/edit");

    rerender(renderWorkspace("capture"));

    expect(screen.getByRole("heading", { name: /^Capture$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Scoring$/i })).toBeInTheDocument();
    expect(screen.getByText(/weight 30\.00/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^Initial Pursuit$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^Decision history$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /^Closeout$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^record decision$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /decision checkpoint/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /final decision/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^recorded rationale$/i, {
        selector: "textarea#decision-create-rationale",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^Stage transition$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /move to/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^recorded rationale$/i, {
        selector: "textarea#stage-transition-rationale",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /move to pursuit approved/i }),
    ).toBeInTheDocument();

    rerender(renderWorkspace("tasks"));

    expect(screen.getByRole("heading", { name: /^Tasks$/i })).toBeInTheDocument();
    expect(screen.getByText(/^overdue$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/upcoming deadline/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/complete incumbent analysis brief/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^create task$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^save task$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^create milestone$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^save milestone$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("textbox", { name: /^description$/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByDisplayValue(/customer questions due/i),
    ).toBeInTheDocument();

    rerender(renderWorkspace("documents"));

    expect(
      screen.getByRole("heading", { name: /^Documents$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { name: /performance work statement/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /^upload document$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /download stored file/i }),
    ).toHaveAttribute("href", "/api/opportunities/documents/doc_1/download");

    rerender(renderWorkspace("notes"));

    expect(screen.getByRole("heading", { name: /^Notes$/i })).toBeInTheDocument();
    expect(screen.getByText(/capture summary/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^add note$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /^pin note$/i }),
    ).toBeInTheDocument();

    rerender(renderWorkspace("proposal"));

    expect(
      screen.getByRole("heading", { name: /^Proposal tracking$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/requirement matrix reviewed/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /^save proposal$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^delete proposal record$/i }),
    ).toBeInTheDocument();

    rerender(renderWorkspace("history"));

    expect(screen.getByRole("heading", { name: /^History$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^Activity feed$/i }),
    ).toBeInTheDocument();
  });

  it("renders the closeout section for closed opportunities", () => {
    const closedSnapshot: OpportunityWorkspaceSnapshot = {
      ...snapshot,
      opportunity: {
        ...snapshot.opportunity,
        currentStageKey: "no_bid",
        currentStageLabel: "No Bid",
      },
      closeout: {
        id: "closeout_1",
        isCurrent: true,
        outcomeStageKey: "no_bid",
        outcomeStageLabel: "No Bid",
        competitorId: "competitor_harbor",
        competitorName: "Harbor Mission Technologies",
        outcomeReason:
          "The team passed because the incumbent relationship advantage was too strong.",
        lessonsLearned:
          "Exit weaker pursuits earlier and document the relationship gap before bid review.",
        recordedAt: "2026-04-18T08:00:00.000Z",
        recordedByName: "Sam Rivera",
      },
      activity: [
        {
          id: "activity_closeout",
          eventType: "opportunity_closeout_recorded",
          title: "Closeout recorded for No Bid",
          description:
            "The team passed because the incumbent relationship advantage was too strong.",
          actorLabel: "Sam Rivera",
          relatedEntityType: "opportunity_closeout",
          occurredAt: "2026-04-18T08:00:00.000Z",
        },
        ...snapshot.activity,
      ],
    };

    render(
      <OpportunityWorkspace
        activeSection="capture"
        allowManagePipeline
        recordBidDecisionAction={async () =>
          INITIAL_OPPORTUNITY_BID_DECISION_ACTION_STATE
        }
        deleteProposalAction={async () =>
          INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE
        }
        recordCloseoutAction={async () =>
          INITIAL_OPPORTUNITY_CLOSEOUT_ACTION_STATE
        }
        saveProposalAction={async () =>
          INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE
        }
        snapshot={closedSnapshot}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /^Closeout$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /the team passed because the incumbent relationship advantage was too strong/i,
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        /exit weaker pursuits earlier and document the relationship gap before bid review/i,
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("combobox", { name: /recorded competitor/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^outcome reason$/i, {
        selector: "textarea#closeout-outcome-reason",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^lessons learned$/i, {
        selector: "textarea#closeout-lessons-learned",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^update closeout$/i }),
    ).toBeInTheDocument();
  });
});
