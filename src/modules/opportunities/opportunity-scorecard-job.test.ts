import { describe, expect, it, vi } from "vitest";

import { AUDIT_ACTIONS } from "@/modules/audit/audit.service";

import { runOpportunityScorecardSweep } from "./opportunity-scorecard-job";

describe("opportunity-scorecard-job", () => {
  it("persists a current scorecard for stale imported opportunities", async () => {
    const tx = {
      opportunityScorecard: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue({ id: "scorecard_123" }),
      },
      opportunityActivityEvent: {
        create: vi.fn().mockResolvedValue({ id: "activity_123" }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit_123" }),
      },
    };

    const db = {
      opportunity: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "opp_123",
            organizationId: "org_123",
            title: "Army Cloud Operations Recompete",
            description: "Cloud operations and sustainment support.",
            sourceSummaryText: "Cloud operations and sustainment support.",
            responseDeadlineAt: new Date("2026-05-20T21:00:00.000Z"),
            currentStageKey: "qualified",
            naicsCode: "541512",
            originSourceSystem: "sam_gov",
            isActiveSourceRecord: true,
            isArchivedSourceRecord: false,
            updatedAt: new Date("2026-04-18T12:00:00.000Z"),
            leadAgency: {
              id: "agency_123",
              name: "PEO Enterprise Information Systems",
              organizationCode: "W91QUZ",
            },
            vehicles: [],
            competitors: [],
            organization: {
              organizationProfile: {
                activeScoringModelKey: "default_capture_v1",
                activeScoringModelVersion: "2026.04",
                goRecommendationThreshold: { toString: () => "70" },
                deferRecommendationThreshold: { toString: () => "45" },
                minimumRiskScorePercent: { toString: () => "50" },
                strategicFocus: "Cloud modernization",
                targetNaicsCodes: ["541512"],
                priorityAgencyIds: ["agency_123"],
                relationshipAgencyIds: [],
                capabilities: [
                  {
                    capabilityKey: "cloud_ops",
                    capabilityLabel: "Cloud Operations",
                    capabilityCategory: "delivery",
                    capabilityKeywords: ["cloud", "operations", "sustainment"],
                  },
                ],
                certifications: [],
                selectedVehicles: [],
                scoringCriteria: [
                  {
                    factorKey: "capability_fit",
                    factorLabel: "Capability fit",
                    weight: { toString: () => "30" },
                  },
                  {
                    factorKey: "strategic_alignment",
                    factorLabel: "Strategic alignment",
                    weight: { toString: () => "20" },
                  },
                  {
                    factorKey: "vehicle_access",
                    factorLabel: "Vehicle access",
                    weight: { toString: () => "15" },
                  },
                  {
                    factorKey: "relationship_strength",
                    factorLabel: "Relationship strength",
                    weight: { toString: () => "15" },
                  },
                  {
                    factorKey: "schedule_realism",
                    factorLabel: "Schedule realism",
                    weight: { toString: () => "10" },
                  },
                  {
                    factorKey: "risk",
                    factorLabel: "Risk",
                    weight: { toString: () => "10" },
                  },
                ],
              },
            },
            scorecards: [],
          },
        ]),
      },
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    const result = await runOpportunityScorecardSweep({
      batchSize: 5,
      db: db as never,
      now: new Date("2026-04-18T12:00:00.000Z"),
    });

    expect(result).toEqual({
      processedOpportunities: 1,
      recalculatedOpportunities: 1,
      skippedOpportunities: 0,
    });
    expect(tx.opportunityScorecard.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          opportunityId: "opp_123",
          isCurrent: true,
          factorScores: {
            create: expect.any(Array),
          },
        }),
      }),
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AUDIT_ACTIONS.opportunityScorecardRecalculate,
        targetType: "opportunity_scorecard",
        targetId: "scorecard_123",
      }),
    });
  });

  it("skips recalculation when the current scorecard snapshot already matches", async () => {
    const db = {
      opportunity: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "opp_123",
            organizationId: "org_123",
            title: "Army Cloud Operations Recompete",
            description: "Cloud operations and sustainment support.",
            sourceSummaryText: "Cloud operations and sustainment support.",
            responseDeadlineAt: new Date("2026-05-20T21:00:00.000Z"),
            currentStageKey: "qualified",
            naicsCode: "541512",
            originSourceSystem: "sam_gov",
            isActiveSourceRecord: true,
            isArchivedSourceRecord: false,
            updatedAt: new Date("2026-04-18T13:00:00.000Z"),
            leadAgency: null,
            vehicles: [],
            competitors: [],
            organization: {
              organizationProfile: null,
            },
            scorecards: [
              {
                id: "scorecard_current",
                calculatedAt: new Date("2026-04-18T12:00:00.000Z"),
                inputSnapshot: {
                  opportunity: {
                    id: "opp_123",
                    title: "Army Cloud Operations Recompete",
                    description: "Cloud operations and sustainment support.",
                    sourceSummaryText: "Cloud operations and sustainment support.",
                    responseDeadlineAt: "2026-05-20T21:00:00.000Z",
                    currentStageKey: "qualified",
                    naicsCode: "541512",
                    leadAgency: null,
                    isActiveSourceRecord: true,
                    isArchivedSourceRecord: false,
                    vehicles: [],
                    competitors: [],
                  },
                  profile: null,
                },
                scoringModelKey: "default_capture_v1",
                scoringModelVersion: "unconfigured",
              },
            ],
          },
        ]),
      },
      $transaction: vi.fn(),
    };

    const result = await runOpportunityScorecardSweep({
      batchSize: 5,
      db: db as never,
      now: new Date("2026-04-18T13:00:00.000Z"),
    });

    expect(result).toEqual({
      processedOpportunities: 1,
      recalculatedOpportunities: 0,
      skippedOpportunities: 1,
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
