import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { KnowledgeForm } from "./knowledge-form";
import {
  INITIAL_KNOWLEDGE_ASSET_FORM_ACTION_STATE,
  type KnowledgeAssetFormActionState,
} from "@/modules/knowledge/knowledge-form.schema";
import type { KnowledgeAssetFormSnapshot } from "@/modules/knowledge/knowledge.types";

const snapshot: KnowledgeAssetFormSnapshot = {
  agencyOptions: [
    {
      description: "Army delivery footprint",
      label: "Army PEO EIS",
      value: "agency_army",
    },
  ],
  assetId: "asset_army",
  capabilityOptions: [
    {
      description: "Cloud transition work",
      label: "Cloud platform engineering",
      value: "cloud-platform-engineering",
    },
  ],
  contractTypeOptions: [
    {
      description: "Solicitation support",
      label: "Solicitation",
      value: "solicitation",
    },
  ],
  initialValues: {
    agencyIds: ["agency_army"],
    assetType: "WIN_THEME",
    body: "Reusable transition-risk narrative.",
    capabilityKeys: ["cloud-platform-engineering"],
    contractTypes: ["solicitation"],
    opportunityIds: ["opp_army"],
    summary: "Reusable Army transition summary.",
    tags: "army, cloud",
    title: "Army cloud transition win theme",
    vehicleCodes: ["OASIS-PLUS-UNR"],
  },
  mode: "edit",
  opportunityOptions: [
    {
      currentStageLabel: "Qualified",
      label: "Army Cloud Operations Recompete",
      value: "opp_army",
    },
  ],
  organization: {
    id: "org_123",
    name: "Default Organization",
    slug: "default-org",
  },
  updatedAt: "2026-04-21T12:00:00.000Z",
  vehicleOptions: [
    {
      description: "Unrestricted vehicle",
      label: "OASIS+ Unrestricted",
      value: "OASIS-PLUS-UNR",
    },
  ],
};

describe("KnowledgeForm", () => {
  it("renders the MUI-backed edit workspace with action buttons and checkbox sections", () => {
    const action = vi.fn<
      (
        state: KnowledgeAssetFormActionState,
        formData: FormData,
      ) => Promise<KnowledgeAssetFormActionState>
    >().mockResolvedValue(INITIAL_KNOWLEDGE_ASSET_FORM_ACTION_STATE);
    const deleteAction = vi.fn<(formData: FormData) => Promise<void>>().mockResolvedValue();

    render(
      <KnowledgeForm
        action={action}
        deleteAction={deleteAction}
        feedback={{
          message: "Knowledge asset saved.",
          title: "Saved",
          tone: "accent",
        }}
        snapshot={snapshot}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /army cloud transition win theme/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save knowledge asset/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute(
      "href",
      "/knowledge",
    );
    expect(
      screen.getByRole("button", { name: /delete knowledge asset/i }),
    ).toBeVisible();
    expect(screen.getByRole("checkbox", { name: /army peo eis/i })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /army cloud operations recompete/i }),
    ).toBeChecked();
    expect(screen.getByText(/knowledge asset saved/i)).toBeInTheDocument();
  });
});
