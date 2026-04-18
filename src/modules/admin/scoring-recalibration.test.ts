import { describe, expect, it } from "vitest";

import { buildScoringRecalibrationSnapshot } from "./scoring-recalibration";

describe("scoring-recalibration", () => {
  it("builds factor insights and suggested weights from observed outcomes", () => {
    const snapshot = buildScoringRecalibrationSnapshot({
      criteria: [
        {
          key: "capability_fit",
          label: "Capability fit",
          description: "Capability evidence",
          weight: 30,
        },
        {
          key: "strategic_alignment",
          label: "Strategic alignment",
          description: "Agency alignment evidence",
          weight: 20,
        },
        {
          key: "vehicle_access",
          label: "Vehicle access",
          description: "Vehicle evidence",
          weight: 15,
        },
      ],
      observations: [
        {
          opportunityId: "opp_award_1",
          opportunityTitle: "Awarded opportunity",
          outcomeKey: "awarded",
          scorePercent: 88,
          recommendationAligned: true,
          factorPercents: {
            capability_fit: 92,
            strategic_alignment: 86,
            vehicle_access: 78,
          },
        },
        {
          opportunityId: "opp_award_2",
          opportunityTitle: "Awarded opportunity 2",
          outcomeKey: "awarded",
          scorePercent: 84,
          recommendationAligned: true,
          factorPercents: {
            capability_fit: 88,
            strategic_alignment: 82,
            vehicle_access: 72,
          },
        },
        {
          opportunityId: "opp_lost",
          opportunityTitle: "Lost opportunity",
          outcomeKey: "lost",
          scorePercent: 58,
          recommendationAligned: false,
          factorPercents: {
            capability_fit: 62,
            strategic_alignment: 55,
            vehicle_access: 70,
          },
        },
        {
          opportunityId: "opp_no_bid",
          opportunityTitle: "No bid opportunity",
          outcomeKey: "no_bid",
          scorePercent: 46,
          recommendationAligned: true,
          factorPercents: {
            capability_fit: 50,
            strategic_alignment: 48,
            vehicle_access: 68,
          },
        },
      ],
    });

    expect(snapshot.closedOpportunityCount).toBe(4);
    expect(snapshot.recommendationAlignmentPercent).toBe("75.00");
    expect(snapshot.outcomeSummaries).toEqual([
      {
        key: "awarded",
        label: "Awarded",
        opportunityCount: 2,
        averageScorePercent: "86.00",
      },
      {
        key: "lost",
        label: "Lost",
        opportunityCount: 1,
        averageScorePercent: "58.00",
      },
      {
        key: "no_bid",
        label: "No bid",
        opportunityCount: 1,
        averageScorePercent: "46.00",
      },
    ]);

    expect(snapshot.factorInsights).toEqual([
      expect.objectContaining({
        key: "capability_fit",
        currentWeight: "30.00",
        suggestedWeight: "31.33",
        outcomeLiftPercent: "34.00",
        recommendation: "increase",
      }),
      expect.objectContaining({
        key: "strategic_alignment",
        currentWeight: "20.00",
        suggestedWeight: "20.89",
        outcomeLiftPercent: "32.50",
        recommendation: "increase",
      }),
      expect.objectContaining({
        key: "vehicle_access",
        currentWeight: "15.00",
        suggestedWeight: "12.78",
        outcomeLiftPercent: "6.00",
        recommendation: "decrease",
      }),
    ]);
    expect(snapshot.suggestionSummary).toMatch(/4 closed opportunities/i);
  });

  it("holds current weights when closed outcome evidence is missing", () => {
    const snapshot = buildScoringRecalibrationSnapshot({
      criteria: [
        {
          key: "risk",
          label: "Risk",
          description: null,
          weight: 10,
        },
      ],
      observations: [],
    });

    expect(snapshot.closedOpportunityCount).toBe(0);
    expect(snapshot.factorInsights).toEqual([
      expect.objectContaining({
        key: "risk",
        currentWeight: "10.00",
        suggestedWeight: "10.00",
        recommendation: "hold",
      }),
    ]);
    expect(snapshot.suggestionSummary).toMatch(/no closed scorecard outcomes/i);
  });
});
