import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OpportunityProposalManager } from "./opportunity-proposal-manager";
import {
  INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE,
  type OpportunityProposalActionState,
} from "@/modules/opportunities/opportunity-proposal-form.schema";
import type {
  OpportunityTaskAssigneeOption,
  OpportunityWorkspaceDocument,
  OpportunityWorkspaceProposal,
} from "@/modules/opportunities/opportunity.types";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

const ownerOptions: OpportunityTaskAssigneeOption[] = [
  { label: "OneSource Admin", value: "user_admin" },
  { label: "Casey Brooks", value: "user_casey" },
];

const documents: OpportunityWorkspaceDocument[] = [
  {
    id: "doc_1",
    title: "Capture plan",
    documentType: "capture_plan",
    downloadUrl: "/api/opportunities/documents/doc_1/download",
    sourceType: "USER_UPLOAD",
    sourceUrl: null,
    originalFileName: "capture-plan.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileSizeBytes: 245760,
    extractionStatus: "SUCCEEDED",
    extractedAt: "2026-04-18T10:00:00.000Z",
    extractedText: null,
    uploadedByName: "OneSource Admin",
    createdAt: "2026-04-18T10:00:00.000Z",
  },
];

const currentProposal: OpportunityWorkspaceProposal = {
  id: "proposal_1",
  status: "IN_PROGRESS",
  statusLabel: "In Progress",
  ownerUserId: "",
  ownerName: null,
  submittedAt: null,
  createdAt: "2026-04-16T10:00:00.000Z",
  updatedAt: "2026-04-18T10:00:00.000Z",
  completedChecklistCount: 1,
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
      isComplete: false,
      completedAt: null,
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
  linkedDocuments: [],
};

describe("OpportunityProposalManager", () => {
  beforeEach(() => {
    refreshMock.mockReset();
  });

  it("submits updated proposal status, owner, checklist, and linked documents", async () => {
    const user = userEvent.setup();
    let submission: {
      checklistKeys: string[];
      linkedDocumentIds: string[];
      ownerUserId: string;
      status: string;
    } | null = null;

    const saveAction = vi.fn(
      async (
        _previousState: OpportunityProposalActionState,
        formData: FormData,
      ) => {
        submission = {
          checklistKeys: formData
            .getAll("complianceChecklistKeys")
            .map((value) => String(value)),
          linkedDocumentIds: formData
            .getAll("linkedDocumentIds")
            .map((value) => String(value)),
          ownerUserId: String(formData.get("ownerUserId") ?? ""),
          status: String(formData.get("status") ?? ""),
        };

        return {
          ...INITIAL_OPPORTUNITY_PROPOSAL_ACTION_STATE,
          successMessage: "Proposal tracking saved to the workspace.",
        };
      },
    );

    render(
      <OpportunityProposalManager
        currentProposal={currentProposal}
        currentStageKey="proposal_in_development"
        currentStageLabel="Proposal In Development"
        documents={documents}
        opportunityId="opp_123"
        ownerOptions={ownerOptions}
        saveAction={saveAction}
      />,
    );

    fireEvent.change(screen.getByLabelText(/proposal status/i), {
      target: { value: "SUBMITTED" },
    });
    fireEvent.change(screen.getByLabelText(/proposal owner/i), {
      target: { value: "user_casey" },
    });
    await user.click(
      screen.getByRole("checkbox", {
        name: /final compliance review complete/i,
      }),
    );
    await user.click(screen.getByRole("checkbox", { name: /capture plan/i }));
    await user.click(screen.getByRole("button", { name: /^save proposal$/i }));

    await waitFor(() => expect(saveAction).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1));

    expect(submission).toMatchObject({
      checklistKeys: expect.arrayContaining([
        "requirement_matrix_reviewed",
        "final_compliance_review_complete",
      ]),
      linkedDocumentIds: ["doc_1"],
      ownerUserId: "user_casey",
      status: "SUBMITTED",
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      /proposal tracking saved to the workspace/i,
    );
  }, 20_000);
});
