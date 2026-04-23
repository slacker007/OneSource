import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { KnowledgeLibrary } from "./knowledge-library";
import type { KnowledgeLibrarySnapshot } from "@/modules/knowledge/knowledge.types";

const snapshot: KnowledgeLibrarySnapshot = {
  availableFilterCount: 1,
  filterOptions: {
    agencies: [
      {
        label: "Army PEO EIS (W52P1J)",
        value: "agency_army",
      },
    ],
    assetTypes: [
      {
        label: "Win theme",
        value: "WIN_THEME",
      },
    ],
    capabilities: [
      {
        label: "Cloud platform engineering",
        value: "cloud-platform-engineering",
      },
    ],
    contractTypes: [
      {
        label: "Solicitation",
        value: "solicitation",
      },
    ],
    opportunities: [
      {
        label: "Army Cloud Operations Recompete",
        value: "opp_army",
        currentStageLabel: "Qualified",
      },
    ],
    tags: [
      {
        label: "army",
        value: "army",
      },
    ],
    vehicles: [
      {
        label: "OASIS-PLUS-UNR · OASIS+ Unrestricted",
        value: "OASIS-PLUS-UNR",
      },
    ],
  },
  organization: {
    id: "org_123",
    name: "Default Organization",
    slug: "default-org",
  },
  query: {
    agencyId: "agency_army",
    query: null,
    assetType: "WIN_THEME",
    capabilityKey: null,
    contractType: null,
    tag: null,
    opportunityId: null,
    vehicleCode: null,
  },
  results: [
    {
      id: "asset_army",
      assetType: "WIN_THEME",
      title: "Army cloud transition win theme",
      summary: "Reusable transition-risk narrative.",
      body: "Reusable transition-risk narrative that explains how to stabilize the environment while preserving mission continuity.",
      bodyPreview: "Reusable transition-risk narrative.",
      facets: {
        agencies: ["Army PEO EIS (W52P1J)"],
        capabilities: ["Cloud platform engineering"],
        contractTypes: ["Solicitation"],
        vehicles: ["OASIS-PLUS-UNR · OASIS+ Unrestricted"],
      },
      tags: ["army", "cloud operations"],
      linkedOpportunities: [
        {
          id: "opp_army",
          title: "Army Cloud Operations Recompete",
          currentStageLabel: "Qualified",
        },
      ],
      createdByLabel: "Taylor Reed",
      updatedByLabel: "Taylor Reed",
      updatedAt: "2026-04-18T12:00:00.000Z",
    },
  ],
  totalCount: 1,
  totalLinkedOpportunityCount: 1,
  totalTagCount: 2,
};

describe("KnowledgeLibrary", () => {
  it("renders a preview-first knowledge browser with linked opportunities", () => {
    render(
      <KnowledgeLibrary
        allowManageKnowledge
        notice={null}
        snapshot={snapshot}
        viewState={{
          previewAssetId: "asset_army",
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /knowledge library/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /create knowledge asset/i }),
    ).toHaveAttribute("href", "/knowledge/new");
    expect(
      screen.getByRole("table", { name: /knowledge asset results/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/^selected asset$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /copy reusable content/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/army cloud transition win theme/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/army cloud operations recompete/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/cloud operations/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/army peo eis/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/oasis-plus-unr/i).length).toBeGreaterThan(0);

    const previewHeading = within(
      screen.getByRole("complementary", { name: /selected asset/i }),
    ).getByRole("heading", {
      name: /army cloud transition win theme/i,
    });
    expect(previewHeading).toBeInTheDocument();
  }, 20_000);

  it("honors the requested preview asset when the URL selects a row", () => {
    render(
      <KnowledgeLibrary
        allowManageKnowledge
        notice={null}
        snapshot={{
          ...snapshot,
          results: [
            snapshot.results[0],
            {
              ...snapshot.results[0],
              id: "asset_second",
              title: "VA intake boilerplate",
              assetType: "BOILERPLATE_CONTENT",
              body: "Reusable VA intake boilerplate body.",
              bodyPreview: "Reusable VA intake boilerplate body.",
            },
          ],
        }}
        viewState={{
          previewAssetId: "asset_second",
        }}
      />,
    );

    const previewHeading = within(
      screen.getByRole("complementary", { name: /selected asset/i }),
    ).getByRole("heading", {
      name: /va intake boilerplate/i,
    });
    expect(previewHeading).toBeInTheDocument();
  });

  it("renders a truthful empty state when filters exclude every asset", () => {
    render(
      <KnowledgeLibrary
        allowManageKnowledge
        notice={null}
        snapshot={{
          ...snapshot,
          results: [],
          totalCount: 0,
        }}
        viewState={{
          previewAssetId: null,
        }}
      />,
    );

    expect(
      screen.getByText(/no knowledge assets match the current view/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /create a reusable knowledge asset or clear the current filters to restore the full strategic library/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders an error state when the knowledge snapshot is unavailable", () => {
    render(
      <KnowledgeLibrary
        allowManageKnowledge
        notice={null}
        snapshot={null}
        viewState={{
          previewAssetId: null,
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /knowledge library/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/knowledge data is unavailable/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /the knowledge library could not load an organization-scoped snapshot/i,
      ),
    ).toBeInTheDocument();
  });
});
