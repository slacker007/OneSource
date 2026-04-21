import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { OpportunityForm } from "./opportunity-form";
import type { OpportunityFormActionState } from "@/modules/opportunities/opportunity-form.schema";
import type { OpportunityFormSnapshot } from "@/modules/opportunities/opportunity.types";

const snapshot: OpportunityFormSnapshot = {
  agencyOptions: [
    {
      label: "PEO Enterprise Information Systems (W91QUZ)",
      value: "agency_123",
    },
  ],
  currentStageKey: "identified",
  currentStageLabel: "Identified",
  draftStorageKey: "onesource:opportunity-form:new",
  initialValues: {
    title: "",
    description: "",
    leadAgencyId: "",
    responseDeadlineAt: "",
    solicitationNumber: "",
    naicsCode: "",
  },
  mode: "create",
  opportunityId: null,
  organization: {
    id: "org_123",
    name: "Default Organization",
    slug: "default-org",
  },
  originSourceSystem: null,
  updatedAt: null,
};

describe("OpportunityForm", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders product-facing stage guidance", async () => {
    render(
      <OpportunityForm
        action={mockAction}
        feedback={null}
        snapshot={snapshot}
      />,
    );

    await screen.findByText(
      /create a tracked opportunity/i,
    );
    expect(
      screen.getByText(
        /new opportunities begin in the identified stage\. move them forward from the workspace when the record is ready for capture review\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /move the pursuit forward from the workspace, where stage rationale and required details stay together\./i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/PRD slice|P4-04/i)).not.toBeInTheDocument();
  });

  it("restores and persists browser-local drafts", async () => {
    window.localStorage.setItem(
      snapshot.draftStorageKey,
      JSON.stringify({
        ...snapshot.initialValues,
        title: "Restored pursuit title",
        description: "Restored draft summary.",
      }),
    );

    render(
      <OpportunityForm
        action={mockAction}
        feedback={null}
        snapshot={snapshot}
      />,
    );

    expect(
      await screen.findByText(/restored an unsaved draft from this browser/i),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(/restored pursuit title/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/opportunity title/i), {
      target: { value: "Updated local draft" },
    });

    await waitFor(() => {
      expect(
        JSON.parse(
          window.localStorage.getItem(snapshot.draftStorageKey) ?? "{}",
        ),
      ).toMatchObject({
        title: "Updated local draft",
        description: "Restored draft summary.",
      });
    });
    expect(await screen.findByText(/draft saved locally at/i)).toBeInTheDocument();
  });
});

async function mockAction(state: OpportunityFormActionState) {
  return state;
}
