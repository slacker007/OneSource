import { describe, expect, it } from "vitest";

import {
  parseKnowledgeTagsInput,
  validateKnowledgeAssetFormSubmission,
} from "./knowledge-form.schema";

describe("knowledge-form.schema", () => {
  it("parses and deduplicates comma-separated or newline tags", () => {
    expect(
      parseKnowledgeTagsInput(
        "air force, workflow modernization\nworkflow modernization, capture",
      ),
    ).toEqual(["air force", "workflow modernization", "capture"]);
  });

  it("validates submissions and returns normalized link ids", () => {
    const result = validateKnowledgeAssetFormSubmission({
      assetType: "WIN_THEME",
      agencyIds: ["agency_army", "agency_army"],
      title: " Transition-focused win theme ",
      summary: "Reusable strategy narrative.",
      body: "This reusable win theme explains how to minimize transition risk while modernizing the operating model.",
      capabilityKeys: [
        "cloud-platform-engineering",
        "cloud-platform-engineering",
      ],
      contractTypes: ["Solicitation", "Solicitation"],
      tags: "army, cloud operations, army",
      opportunityIds: ["opp_1", "opp_2", "opp_1"],
      vehicleCodes: ["OASIS-PLUS-UNR", "OASIS-PLUS-UNR"],
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.submission).toMatchObject({
      assetType: "WIN_THEME",
      agencyIds: ["agency_army"],
      title: "Transition-focused win theme",
      summary: "Reusable strategy narrative.",
      capabilityKeys: ["cloud-platform-engineering"],
      contractTypes: ["Solicitation"],
      tags: ["army", "cloud operations"],
      opportunityIds: ["opp_1", "opp_2"],
      vehicleCodes: ["OASIS-PLUS-UNR"],
    });
  });

  it("returns field errors for incomplete content", () => {
    const result = validateKnowledgeAssetFormSubmission({
      assetType: "PAST_PERFORMANCE_SNIPPET",
      agencyIds: [],
      title: "No",
      summary: "",
      body: "Too short",
      capabilityKeys: [],
      contractTypes: [],
      tags: "",
      opportunityIds: [],
      vehicleCodes: [],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.state.fieldErrors.title).toMatch(/at least 3 characters/i);
    expect(result.state.fieldErrors.body).toMatch(/at least 20 characters/i);
    expect(result.state.formError).toMatch(/highlighted fields/i);
  });
});
