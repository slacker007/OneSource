import { describe, expect, it, vi } from "vitest";

import { AUDIT_ACTIONS } from "@/modules/audit/audit.service";

import {
  parseRequiredDecimal,
  parseScoringWeightMap,
  persistScoringRecalibration,
} from "./scoring-recalibration.service";

describe("scoring-recalibration.service", () => {
  it("persists updated weights, bumps the model version, audits the change, and recalculates scorecards", async () => {
    const tx = {
      organizationProfile: {
        update: vi.fn().mockResolvedValue({ id: "profile_123" }),
      },
      organizationScoringCriterion: {
        update: vi.fn().mockResolvedValue({}),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit_123" }),
      },
    };
    const runScorecardSweep = vi.fn().mockResolvedValue({
      processedOpportunities: 3,
      recalculatedOpportunities: 3,
      skippedOpportunities: 0,
    });
    const db = {
      organizationProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: "profile_123",
          activeScoringModelKey: "default_capture_v1",
          activeScoringModelVersion: "2026-04-18",
          scoringCriteria: [
            {
              id: "criterion_capability_fit",
              factorKey: "capability_fit",
              factorLabel: "Capability fit",
              weight: { toString: () => "30.00" },
            },
            {
              id: "criterion_risk",
              factorKey: "risk",
              factorLabel: "Risk",
              weight: { toString: () => "10.00" },
            },
          ],
        }),
      },
      opportunity: {
        count: vi.fn().mockResolvedValue(3),
      },
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    const result = await persistScoringRecalibration({
      db: db as never,
      input: {
        organizationId: "org_123",
        performedByUserId: "user_admin",
        mode: "manual",
        note: "Raised capability emphasis after recent award review.",
        goRecommendationThreshold: 72,
        deferRecommendationThreshold: 48,
        minimumRiskScorePercent: 55,
        weightByFactorKey: {
          capability_fit: 34,
          risk: 8,
        },
      },
      now: new Date("2026-04-18T16:00:00.000Z"),
      runScorecardSweep,
    });

    expect(tx.organizationProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          activeScoringModelVersion: "2026-04-18T16:00:00Z",
        }),
      }),
    );
    expect(tx.organizationScoringCriterion.update).toHaveBeenCalledTimes(2);
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.organizationScoringRecalibrate,
        targetType: "organization_profile",
      }),
    });
    expect(runScorecardSweep).toHaveBeenCalledWith({
      db,
      batchSize: 3,
      now: new Date("2026-04-18T16:00:00.000Z"),
      organizationId: "org_123",
    });
    expect(result).toMatchObject({
      scoringModelKey: "default_capture_v1",
      scoringModelVersion: "2026-04-18T16:00:00Z",
      sweepResult: {
        recalculatedOpportunities: 3,
      },
      updatedCriteria: [
        {
          factorKey: "capability_fit",
          previousWeight: "30.00",
          nextWeight: "34.00",
        },
        {
          factorKey: "risk",
          previousWeight: "10.00",
          nextWeight: "8.00",
        },
      ],
    });
  });

  it("parses required decimal fields and dynamic scoring weight maps", () => {
    expect(parseRequiredDecimal("72.5", "go threshold")).toBe(72.5);
    expect(
      parseScoringWeightMap(
        {
          weight_capability_fit: "31",
          weight_strategic_alignment: "19",
          weight_vehicle_access: "14",
          weight_relationship_strength: "15",
          weight_schedule_realism: "11",
          weight_risk: "10",
        },
        "weight",
      ),
    ).toMatchObject({
      capability_fit: 31,
      strategic_alignment: 19,
      vehicle_access: 14,
      relationship_strength: 15,
      schedule_realism: 11,
      risk: 10,
    });
  });

  it("rejects missing numeric inputs", () => {
    expect(() => parseRequiredDecimal("", "risk floor")).toThrow(
      /risk floor/i,
    );
    expect(() =>
      parseScoringWeightMap(
        {
          weight_capability_fit: "31",
          weight_strategic_alignment: "19",
          weight_vehicle_access: "14",
          weight_relationship_strength: "15",
          weight_schedule_realism: null,
          weight_risk: "10",
        },
        "weight",
      ),
    ).toThrow(/schedule_realism/i);
  });
});
