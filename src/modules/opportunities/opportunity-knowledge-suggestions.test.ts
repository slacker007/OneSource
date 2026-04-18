import { describe, expect, it } from "vitest";

import { rankOpportunityKnowledgeSuggestions } from "./opportunity-knowledge-suggestions";

describe("opportunity-knowledge-suggestions", () => {
  it("prioritizes directly linked assets with agency, vehicle, capability, and contract-type matches", () => {
    const suggestions = rankOpportunityKnowledgeSuggestions({
      capabilities: [
        {
          capabilityKey: "data-ai-modernization",
          capabilityLabel: "Data and AI modernization",
          capabilityKeywords: [
            "knowledge management",
            "analytics",
            "automation",
          ],
        },
        {
          capabilityKey: "enterprise-service-delivery",
          capabilityLabel: "Enterprise service delivery",
          capabilityKeywords: ["workflow modernization", "service desk"],
        },
      ],
      opportunity: {
        id: "opp_air_force",
        title: "Enterprise Knowledge Management Support Services",
        description:
          "Workflow modernization and analytics support for Air Force operations.",
        sourceSummaryText:
          "Knowledge management modernization support for operational planning teams.",
        leadAgency: {
          id: "agency_air_force",
          name: "99th Contracting Squadron",
        },
        procurementTypeLabel: "Solicitation",
        procurementBaseTypeLabel: "Solicitation",
        vehicles: [
          {
            vehicle: {
              code: "OASIS-PLUS-UNR",
            },
          },
        ],
      },
      knowledgeAssets: [
        {
          id: "asset_best",
          assetType: "PAST_PERFORMANCE_SNIPPET",
          title: "Air Force operational planning past performance",
          summary:
            "Reusable past-performance proof point for enterprise knowledge management work.",
          body: "Detailed content.",
          updatedAt: new Date("2026-04-18T03:00:00.000Z"),
          updatedByUser: {
            name: "Alex Morgan",
            email: "alex@example.com",
          },
          tags: [
            {
              label: "99th Contracting Squadron (FA4861)",
              normalizedLabel: "99th contracting squadron",
              tagKey: "agency_air_force",
              tagType: "AGENCY",
            },
            {
              label: "Data and AI modernization",
              normalizedLabel: "data and ai modernization",
              tagKey: "data-ai-modernization",
              tagType: "CAPABILITY",
            },
            {
              label: "Enterprise service delivery",
              normalizedLabel: "enterprise service delivery",
              tagKey: "enterprise-service-delivery",
              tagType: "CAPABILITY",
            },
            {
              label: "Solicitation",
              normalizedLabel: "solicitation",
              tagKey: "solicitation",
              tagType: "CONTRACT_TYPE",
            },
            {
              label: "knowledge management",
              normalizedLabel: "knowledge management",
              tagKey: "knowledge management",
              tagType: "FREEFORM",
            },
            {
              label: "OASIS-PLUS-UNR · OASIS+ Unrestricted",
              normalizedLabel: "oasis-plus-unr",
              tagKey: "OASIS-PLUS-UNR",
              tagType: "VEHICLE",
            },
          ],
          linkedOpportunities: [
            {
              opportunity: {
                id: "opp_air_force",
                title: "Enterprise Knowledge Management Support Services",
                currentStageLabel: "Capture Active",
              },
            },
          ],
        },
        {
          id: "asset_weaker",
          assetType: "WIN_THEME",
          title: "Army cloud transition win theme",
          summary: "Cloud transition narrative.",
          body: "Cloud content.",
          updatedAt: new Date("2026-04-17T03:00:00.000Z"),
          updatedByUser: {
            name: "Taylor Reed",
            email: "taylor@example.com",
          },
          tags: [
            {
              label: "Cloud platform engineering",
              normalizedLabel: "cloud platform engineering",
              tagKey: "cloud-platform-engineering",
              tagType: "CAPABILITY",
            },
          ],
          linkedOpportunities: [],
        },
      ],
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      id: "asset_best",
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
      updatedByLabel: "Alex Morgan",
    });
    expect(suggestions[0]?.matchReasons).toContain("Linked to this opportunity");
  });

  it("returns no suggestions when workspace metadata has no matching tagged assets", () => {
    const suggestions = rankOpportunityKnowledgeSuggestions({
      capabilities: [],
      opportunity: {
        id: "opp_none",
        title: "Facilities support bridge",
        description: "A logistics-only bridge requirement.",
        sourceSummaryText: null,
        leadAgency: null,
        procurementTypeLabel: "Sources Sought",
        procurementBaseTypeLabel: "Sources Sought",
        vehicles: [],
      },
      knowledgeAssets: [
        {
          id: "asset_other",
          assetType: "BOILERPLATE_CONTENT",
          title: "Claims intake modernization boilerplate",
          summary: "Claims content.",
          body: "Claims content.",
          updatedAt: new Date("2026-04-17T03:00:00.000Z"),
          updatedByUser: null,
          tags: [
            {
              label: "Department of Veterans Affairs",
              normalizedLabel: "department of veterans affairs",
              tagKey: "agency_va",
              tagType: "AGENCY",
            },
          ],
          linkedOpportunities: [],
        },
      ],
    });

    expect(suggestions).toEqual([]);
  });
});
