import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("restores and persists browser-local drafts", async () => {
    window.localStorage.setItem(
      snapshot.draftStorageKey,
      JSON.stringify({
        ...snapshot.initialValues,
        title: "Restored pursuit title",
        description: "Restored draft summary.",
      }),
    );

    const user = userEvent.setup();

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

    await user.clear(screen.getByLabelText(/opportunity title/i));
    await user.type(
      screen.getByLabelText(/opportunity title/i),
      "Updated local draft",
    );

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
