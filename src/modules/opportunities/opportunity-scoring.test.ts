import { describe, expect, it } from "vitest";

import { calculateOpportunityScore } from "./opportunity-scoring";

const profile = {
  activeScoringModelKey: "default_capture_v1",
  activeScoringModelVersion: "2026-04-18",
  strategicFocus:
    "Prioritize cloud modernization and workflow automation pursuits for priority agencies.",
  targetNaicsCodes: ["541512"],
  priorityAgencyIds: ["agency_priority"],
  relationshipAgencyIds: ["agency_priority"],
  capabilities: [
    {
      key: "cloud-platform",
      label: "Cloud platform engineering",
      category: "cloud",
      keywords: ["cloud platform", "cloud modernization"],
    },
    {
      key: "workflow-automation",
      label: "Workflow automation",
      category: "automation",
      keywords: ["workflow automation", "automation"],
    },
  ],
  certifications: [
    {
      key: "iso-27001",
      label: "ISO 27001",
      code: "ISO-27001",
    },
  ],
  selectedVehicles: [
    {
      id: "vehicle_preferred",
      code: "OASIS-PLUS-UNR",
      name: "OASIS+ Unrestricted",
      isPreferred: true,
    },
  ],
  scoringCriteria: [
    {
      key: "capability_fit" as const,
      label: "Capability fit",
      weight: 30,
    },
    {
      key: "strategic_alignment" as const,
      label: "Strategic alignment",
      weight: 20,
    },
    {
      key: "vehicle_access" as const,
      label: "Vehicle access",
      weight: 15,
    },
    {
      key: "relationship_strength" as const,
      label: "Relationship strength",
      weight: 15,
    },
    {
      key: "schedule_realism" as const,
      label: "Schedule realism",
      weight: 10,
    },
    {
      key: "risk" as const,
      label: "Risk",
      weight: 10,
    },
  ],
};

describe("opportunity-scoring", () => {
  it("calculates a strong deterministic score with factor-level explanations", () => {
    const scorecard = calculateOpportunityScore({
      referenceDate: new Date("2026-04-18T00:00:00.000Z"),
      profile,
      opportunity: {
        id: "opp_strong",
        title: "Cloud modernization and workflow automation support",
        description:
          "Provide cloud platform engineering, workflow automation, and ISO 27001-aligned delivery support.",
        sourceSummaryText:
          "Priority-agency modernization effort with OASIS-PLUS-UNR access already identified.",
        responseDeadlineAt: "2026-06-15T17:00:00.000Z",
        currentStageKey: "capture_active",
        naicsCode: "541512",
        leadAgency: {
          id: "agency_priority",
          name: "Priority Agency",
          organizationCode: "PA-001",
        },
        isActiveSourceRecord: true,
        isArchivedSourceRecord: false,
        vehicles: [
          {
            id: "vehicle_preferred",
            code: "OASIS-PLUS-UNR",
            name: "OASIS+ Unrestricted",
            isPrimary: true,
          },
        ],
        competitors: [],
      },
    });

    expect(scorecard).toMatchObject({
      scoringModelKey: "default_capture_v1",
      scoringModelVersion: "2026-04-18",
      totalScore: 99.5,
      maximumScore: 100,
      scorePercent: 99.5,
      recommendationOutcome: null,
    });
    expect(scorecard.factors).toHaveLength(6);
    expect(scorecard.factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          factorKey: "capability_fit",
          score: 30,
          explanation: expect.stringMatching(/matched capabilities/i),
        }),
        expect.objectContaining({
          factorKey: "strategic_alignment",
          score: 20,
        }),
        expect.objectContaining({
          factorKey: "risk",
          score: 9.5,
          explanation: expect.stringMatching(/no incumbent competitor/i),
        }),
      ]),
    );
  });

  it("penalizes compressed timelines, incumbency pressure, and missing alignment", () => {
    const scorecard = calculateOpportunityScore({
      referenceDate: new Date("2026-04-18T00:00:00.000Z"),
      profile,
      opportunity: {
        id: "opp_risky",
        title: "General program support",
        description: "Legacy support requirement with limited scope detail.",
        sourceSummaryText: null,
        responseDeadlineAt: "2026-04-20T17:00:00.000Z",
        currentStageKey: "capture_active",
        naicsCode: "999999",
        leadAgency: null,
        isActiveSourceRecord: false,
        isArchivedSourceRecord: true,
        vehicles: [],
        competitors: [
          {
            name: "Vector Analytics LLC",
            role: "INCUMBENT",
          },
          {
            name: "Northstar Digital Group",
            role: "KNOWN_COMPETITOR",
          },
          {
            name: "Sentinel Cyber Operations",
            role: "KNOWN_COMPETITOR",
          },
        ],
      },
    });

    expect(scorecard.totalScore).toBe(18.25);
    expect(scorecard.factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          factorKey: "capability_fit",
          score: 3,
        }),
        expect.objectContaining({
          factorKey: "schedule_realism",
          score: 1.5,
          explanation: expect.stringMatching(/highly compressed/i),
        }),
        expect.objectContaining({
          factorKey: "risk",
          score: 0,
          explanation: expect.stringMatching(/known incumbent/i),
        }),
      ]),
    );
  });

  it("still produces a normalized scorecard when the organization profile is missing", () => {
    const scorecard = calculateOpportunityScore({
      referenceDate: new Date("2026-04-18T00:00:00.000Z"),
      profile: null,
      opportunity: {
        id: "opp_unconfigured",
        title: "Submitted historical pursuit",
        description: "Previously submitted opportunity retained for analytics.",
        sourceSummaryText: null,
        responseDeadlineAt: "2026-04-10T17:00:00.000Z",
        currentStageKey: "submitted",
        naicsCode: null,
        leadAgency: null,
        isActiveSourceRecord: true,
        isArchivedSourceRecord: false,
        vehicles: [],
        competitors: [],
      },
    });

    expect(scorecard).toMatchObject({
      scoringModelKey: "default_capture_v1",
      scoringModelVersion: "unconfigured",
      maximumScore: 100,
      recommendationOutcome: null,
    });
    expect(scorecard.factors.map((factor) => factor.factorKey)).toEqual([
      "capability_fit",
      "strategic_alignment",
      "vehicle_access",
      "relationship_strength",
      "schedule_realism",
      "risk",
    ]);
    expect(
      scorecard.factors.find((factor) => factor.factorKey === "schedule_realism")
        ?.score,
    ).toBe(7.5);
  });
});
