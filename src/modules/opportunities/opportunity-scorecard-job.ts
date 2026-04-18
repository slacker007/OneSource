import { AuditActorType, Prisma } from "@prisma/client";

import { AUDIT_ACTIONS, recordAuditEvent } from "@/modules/audit/audit.service";
import {
  calculateOpportunityScore,
  SCORING_FACTOR_KEYS,
  type CalculatedOpportunityScorecard,
  type OrganizationScoringProfileInput,
  type OpportunityScoringOpportunityInput,
} from "@/modules/opportunities/opportunity-scoring";

export const OPPORTUNITY_SCORECARD_WORKER_IDENTIFIER =
  "opportunity-scorecard-worker";

type OpportunityScorecardJobRecord = {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  sourceSummaryText: string | null;
  responseDeadlineAt: Date | null;
  currentStageKey: string | null;
  naicsCode: string | null;
  originSourceSystem: string | null;
  isActiveSourceRecord: boolean;
  isArchivedSourceRecord: boolean;
  updatedAt: Date;
  leadAgency: {
    id: string;
    name: string;
    organizationCode: string | null;
  } | null;
  vehicles: Array<{
    isPrimary: boolean;
    vehicle: {
      id: string;
      code: string;
      name: string;
    };
  }>;
  competitors: Array<{
    role: string;
    competitor: {
      name: string;
    };
  }>;
  organization: {
    organizationProfile: OrganizationScoringProfileRecord | null;
  };
  scorecards: Array<{
    id: string;
    calculatedAt: Date;
    inputSnapshot: Prisma.JsonValue | null;
    scoringModelKey: string | null;
    scoringModelVersion: string | null;
  }>;
};

type OrganizationScoringProfileRecord = {
  activeScoringModelKey: string;
  activeScoringModelVersion: string;
  goRecommendationThreshold: { toString(): string };
  deferRecommendationThreshold: { toString(): string };
  minimumRiskScorePercent: { toString(): string };
  strategicFocus: string | null;
  targetNaicsCodes: string[];
  priorityAgencyIds: string[];
  relationshipAgencyIds: string[];
  capabilities: Array<{
    capabilityKey: string;
    capabilityLabel: string;
    capabilityCategory: string | null;
    capabilityKeywords: string[];
  }>;
  certifications: Array<{
    certificationKey: string;
    certificationLabel: string;
    certificationCode: string | null;
  }>;
  selectedVehicles: Array<{
    isPreferred: boolean;
    vehicle: {
      id: string;
      code: string;
      name: string;
    };
  }>;
  scoringCriteria: Array<{
    factorKey: string;
    factorLabel: string;
    weight: { toString(): string };
  }>;
};

type OpportunityScorecardTransactionClient = {
  opportunityScorecard: {
    updateMany(args: {
      where: {
        opportunityId: string;
        isCurrent: boolean;
      };
      data: Prisma.OpportunityScorecardUncheckedUpdateManyInput;
    }): Promise<unknown>;
    create(args: {
      data: Prisma.OpportunityScorecardUncheckedCreateInput & {
        factorScores: {
          create: Prisma.OpportunityScoreFactorCreateWithoutScorecardInput[];
        };
      };
      select: {
        id: true;
      };
    }): Promise<{
      id: string;
    }>;
  };
  opportunityActivityEvent: {
    create(args: {
      data: Prisma.OpportunityActivityEventUncheckedCreateInput;
    }): Promise<unknown>;
  };
  auditLog: {
    create(args: {
      data: Prisma.AuditLogUncheckedCreateInput;
    }): Promise<unknown>;
  };
};

export type OpportunityScorecardJobClient = {
  opportunity: {
    findMany(args: {
      orderBy: Prisma.OpportunityOrderByWithRelationInput[];
      select: {
        id: true;
        organizationId: true;
        title: true;
        description: true;
        sourceSummaryText: true;
        responseDeadlineAt: true;
        currentStageKey: true;
        naicsCode: true;
        originSourceSystem: true;
        isActiveSourceRecord: true;
        isArchivedSourceRecord: true;
        updatedAt: true;
        leadAgency: {
          select: {
            id: true;
            name: true;
            organizationCode: true;
          };
        };
        vehicles: {
          select: {
            isPrimary: true;
            vehicle: {
              select: {
                id: true;
                code: true;
                name: true;
              };
            };
          };
        };
        competitors: {
          select: {
            role: true;
            competitor: {
              select: {
                name: true;
              };
            };
          };
        };
        organization: {
          select: {
            organizationProfile: {
              select: {
                activeScoringModelKey: true;
                activeScoringModelVersion: true;
                goRecommendationThreshold: true;
                deferRecommendationThreshold: true;
                minimumRiskScorePercent: true;
                strategicFocus: true;
                targetNaicsCodes: true;
                priorityAgencyIds: true;
                relationshipAgencyIds: true;
                capabilities: {
                  where: {
                    isActive: true;
                  };
                  orderBy: Prisma.OrganizationCapabilityOrderByWithRelationInput[];
                  select: {
                    capabilityKey: true;
                    capabilityLabel: true;
                    capabilityCategory: true;
                    capabilityKeywords: true;
                  };
                };
                certifications: {
                  where: {
                    isActive: true;
                  };
                  orderBy: Prisma.OrganizationCertificationOrderByWithRelationInput[];
                  select: {
                    certificationKey: true;
                    certificationLabel: true;
                    certificationCode: true;
                  };
                };
                selectedVehicles: {
                  orderBy: Prisma.OrganizationProfileVehicleOrderByWithRelationInput[];
                  select: {
                    isPreferred: true;
                    vehicle: {
                      select: {
                        id: true;
                        code: true;
                        name: true;
                      };
                    };
                  };
                };
                scoringCriteria: {
                  where: {
                    isActive: true;
                  };
                  orderBy: Prisma.OrganizationScoringCriterionOrderByWithRelationInput[];
                  select: {
                    factorKey: true;
                    factorLabel: true;
                    weight: true;
                  };
                };
              };
            };
          };
        };
        scorecards: {
          where: {
            isCurrent: true;
          };
          orderBy: Prisma.OpportunityScorecardOrderByWithRelationInput[];
          take: number;
          select: {
            id: true;
            calculatedAt: true;
            inputSnapshot: true;
            scoringModelKey: true;
            scoringModelVersion: true;
          };
        };
      };
      take: number;
    }): Promise<OpportunityScorecardJobRecord[]>;
  };
  $transaction<T>(
    callback: (tx: OpportunityScorecardTransactionClient) => Promise<T>,
  ): Promise<T>;
};

export type OpportunityScorecardSweepResult = {
  processedOpportunities: number;
  recalculatedOpportunities: number;
  skippedOpportunities: number;
};

export async function runOpportunityScorecardSweep({
  db,
  batchSize = 10,
  now = new Date(),
  log,
}: {
  db: OpportunityScorecardJobClient;
  batchSize?: number;
  now?: Date;
  log?: JobLogger;
}): Promise<OpportunityScorecardSweepResult> {
  const opportunities = await db.opportunity.findMany({
    orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      organizationId: true,
      title: true,
      description: true,
      sourceSummaryText: true,
      responseDeadlineAt: true,
      currentStageKey: true,
      naicsCode: true,
      originSourceSystem: true,
      isActiveSourceRecord: true,
      isArchivedSourceRecord: true,
      updatedAt: true,
      leadAgency: {
        select: {
          id: true,
          name: true,
          organizationCode: true,
        },
      },
      vehicles: {
        select: {
          isPrimary: true,
          vehicle: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
      competitors: {
        select: {
          role: true,
          competitor: {
            select: {
              name: true,
            },
          },
        },
      },
      organization: {
        select: {
          organizationProfile: {
            select: {
              activeScoringModelKey: true,
              activeScoringModelVersion: true,
              goRecommendationThreshold: true,
              deferRecommendationThreshold: true,
              minimumRiskScorePercent: true,
              strategicFocus: true,
              targetNaicsCodes: true,
              priorityAgencyIds: true,
              relationshipAgencyIds: true,
              capabilities: {
                where: {
                  isActive: true,
                },
                orderBy: [{ sortOrder: "asc" }, { capabilityLabel: "asc" }],
                select: {
                  capabilityKey: true,
                  capabilityLabel: true,
                  capabilityCategory: true,
                  capabilityKeywords: true,
                },
              },
              certifications: {
                where: {
                  isActive: true,
                },
                orderBy: [{ sortOrder: "asc" }, { certificationLabel: "asc" }],
                select: {
                  certificationKey: true,
                  certificationLabel: true,
                  certificationCode: true,
                },
              },
              selectedVehicles: {
                orderBy: [{ isPreferred: "desc" }, { sortOrder: "asc" }],
                select: {
                  isPreferred: true,
                  vehicle: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                    },
                  },
                },
              },
              scoringCriteria: {
                where: {
                  isActive: true,
                },
                orderBy: [{ sortOrder: "asc" }, { factorLabel: "asc" }],
                select: {
                  factorKey: true,
                  factorLabel: true,
                  weight: true,
                },
              },
            },
          },
        },
      },
      scorecards: {
        where: {
          isCurrent: true,
        },
        orderBy: [{ calculatedAt: "desc" }],
        take: 1,
        select: {
          id: true,
          calculatedAt: true,
          inputSnapshot: true,
          scoringModelKey: true,
          scoringModelVersion: true,
        },
      },
    },
    take: batchSize * 5,
  });

  const eligibleOpportunities = opportunities
    .filter((opportunity) => {
      const currentScorecard = opportunity.scorecards[0];
      return (
        !currentScorecard ||
        opportunity.updatedAt.getTime() > currentScorecard.calculatedAt.getTime()
      );
    })
    .slice(0, batchSize);

  let recalculatedOpportunities = 0;
  let skippedOpportunities = 0;

  for (const opportunity of eligibleOpportunities) {
    const profile = mapOrganizationScoringProfile(
      opportunity.organization.organizationProfile,
    );
    const scoringInput = buildOpportunityScoringInput(opportunity);
    const calculatedScorecard = calculateOpportunityScore({
      opportunity: scoringInput,
      profile,
      referenceDate: now,
    });
    const inputSnapshot = buildScorecardInputSnapshot({
      opportunity: scoringInput,
      profile,
    });
    const currentScorecard = opportunity.scorecards[0];

    if (
      currentScorecard &&
      currentScorecard.scoringModelKey === calculatedScorecard.scoringModelKey &&
      currentScorecard.scoringModelVersion ===
        calculatedScorecard.scoringModelVersion &&
      isEqualJsonValue(currentScorecard.inputSnapshot, inputSnapshot)
    ) {
      skippedOpportunities += 1;
      continue;
    }

    await db.$transaction(async (tx) => {
      await tx.opportunityScorecard.updateMany({
        where: {
          opportunityId: opportunity.id,
          isCurrent: true,
        },
        data: {
          isCurrent: false,
        },
      });

      const persistedScorecard = await tx.opportunityScorecard.create({
        data: buildOpportunityScorecardCreateInput({
          calculatedScorecard,
          inputSnapshot,
          opportunity,
        }),
        select: {
          id: true,
        },
      });

      await tx.opportunityActivityEvent.create({
        data: {
          actorIdentifier: OPPORTUNITY_SCORECARD_WORKER_IDENTIFIER,
          actorType: AuditActorType.SYSTEM,
          description: `Background recalculation persisted a current scorecard for ${opportunity.title}.`,
          eventType: "scorecard_recalculated",
          metadata: {
            recommendationOutcome: calculatedScorecard.recommendationOutcome,
            scoringModelKey: calculatedScorecard.scoringModelKey,
            scoringModelVersion: calculatedScorecard.scoringModelVersion,
            totalScore: calculatedScorecard.totalScore,
          },
          occurredAt: now,
          opportunityId: opportunity.id,
          organizationId: opportunity.organizationId,
          relatedEntityId: persistedScorecard.id,
          relatedEntityType: "opportunity_scorecard",
          title: `Scorecard recalculated: ${opportunity.title}`,
        },
      });

      await recordAuditEvent({
        db: tx,
        event: {
          action: AUDIT_ACTIONS.opportunityScorecardRecalculate,
          actor: {
            identifier: OPPORTUNITY_SCORECARD_WORKER_IDENTIFIER,
            type: AuditActorType.SYSTEM,
          },
          metadata: {
            recommendationOutcome: calculatedScorecard.recommendationOutcome,
            scoringModelKey: calculatedScorecard.scoringModelKey,
            scoringModelVersion: calculatedScorecard.scoringModelVersion,
            totalScore: calculatedScorecard.totalScore,
          },
          occurredAt: now,
          organizationId: opportunity.organizationId,
          summary: `Persisted a recalculated scorecard for ${opportunity.title}.`,
          target: {
            display: opportunity.title,
            id: persistedScorecard.id,
            type: "opportunity_scorecard",
          },
        },
      });
    });

    recalculatedOpportunities += 1;
    log?.({
      detail: {
        opportunityId: opportunity.id,
        recommendationOutcome: calculatedScorecard.recommendationOutcome,
      },
      level: "info",
      message: `Recalculated scorecard for ${opportunity.title}.`,
    });
  }

  return {
    processedOpportunities: eligibleOpportunities.length,
    recalculatedOpportunities,
    skippedOpportunities,
  };
}

function buildOpportunityScoringInput(
  opportunity: OpportunityScorecardJobRecord,
): OpportunityScoringOpportunityInput {
  return {
    id: opportunity.id,
    title: opportunity.title,
    description: opportunity.description,
    sourceSummaryText: opportunity.sourceSummaryText,
    responseDeadlineAt: opportunity.responseDeadlineAt?.toISOString() ?? null,
    currentStageKey: opportunity.currentStageKey,
    naicsCode: opportunity.naicsCode,
    leadAgency: opportunity.leadAgency
      ? {
          id: opportunity.leadAgency.id,
          name: opportunity.leadAgency.name,
          organizationCode: opportunity.leadAgency.organizationCode,
        }
      : null,
    isActiveSourceRecord: opportunity.isActiveSourceRecord,
    isArchivedSourceRecord: opportunity.isArchivedSourceRecord,
    vehicles: opportunity.vehicles.map((vehicleLink) => ({
      id: vehicleLink.vehicle.id,
      code: vehicleLink.vehicle.code,
      name: vehicleLink.vehicle.name,
      isPrimary: vehicleLink.isPrimary,
    })),
    competitors: opportunity.competitors.map((competitorLink) => ({
      name: competitorLink.competitor.name,
      role: competitorLink.role,
    })),
  };
}

function mapOrganizationScoringProfile(
  profile: OrganizationScoringProfileRecord | null,
): OrganizationScoringProfileInput | null {
  if (!profile) {
    return null;
  }

  return {
    activeScoringModelKey: profile.activeScoringModelKey,
    activeScoringModelVersion: profile.activeScoringModelVersion,
    goRecommendationThreshold: Number.parseFloat(
      profile.goRecommendationThreshold.toString(),
    ),
    deferRecommendationThreshold: Number.parseFloat(
      profile.deferRecommendationThreshold.toString(),
    ),
    minimumRiskScorePercent: Number.parseFloat(
      profile.minimumRiskScorePercent.toString(),
    ),
    strategicFocus: profile.strategicFocus,
    targetNaicsCodes: profile.targetNaicsCodes,
    priorityAgencyIds: profile.priorityAgencyIds,
    relationshipAgencyIds: profile.relationshipAgencyIds,
    capabilities: profile.capabilities.map((capability) => ({
      key: capability.capabilityKey,
      label: capability.capabilityLabel,
      category: capability.capabilityCategory,
      keywords: capability.capabilityKeywords,
    })),
    certifications: profile.certifications.map((certification) => ({
      key: certification.certificationKey,
      label: certification.certificationLabel,
      code: certification.certificationCode,
    })),
    selectedVehicles: profile.selectedVehicles.map((selection) => ({
      id: selection.vehicle.id,
      code: selection.vehicle.code,
      isPreferred: selection.isPreferred,
      name: selection.vehicle.name,
    })),
    scoringCriteria: profile.scoringCriteria
      .map((criterion) => {
        if (!SCORING_FACTOR_KEYS.includes(criterion.factorKey as never)) {
          return null;
        }

        return {
          key: criterion.factorKey as (typeof SCORING_FACTOR_KEYS)[number],
          label: criterion.factorLabel,
          weight: Number.parseFloat(criterion.weight.toString()),
        };
      })
      .filter((criterion) => criterion !== null),
  };
}

function buildScorecardInputSnapshot({
  opportunity,
  profile,
}: {
  opportunity: OpportunityScoringOpportunityInput;
  profile: OrganizationScoringProfileInput | null;
}) {
  return {
    opportunity,
    profile,
  } satisfies Prisma.InputJsonValue;
}

function buildOpportunityScorecardCreateInput({
  calculatedScorecard,
  inputSnapshot,
  opportunity,
}: {
  calculatedScorecard: CalculatedOpportunityScorecard;
  inputSnapshot: Prisma.InputJsonValue;
  opportunity: OpportunityScorecardJobRecord;
}) {
  return {
    calculatedAt: new Date(calculatedScorecard.calculatedAt),
    calculatedByUserId: null,
    inputSnapshot,
    isCurrent: true,
    maximumScore: calculatedScorecard.maximumScore,
    opportunityId: opportunity.id,
    organizationId: opportunity.organizationId,
    recommendationOutcome: calculatedScorecard.recommendationOutcome,
    recommendationSummary: calculatedScorecard.recommendationSummary,
    scorePercent: calculatedScorecard.scorePercent,
    scoringModelKey: calculatedScorecard.scoringModelKey,
    scoringModelVersion: calculatedScorecard.scoringModelVersion,
    summary: calculatedScorecard.summary,
    totalScore: calculatedScorecard.totalScore,
    factorScores: {
      create: calculatedScorecard.factors.map((factor, index) => ({
        explanation: factor.explanation,
        factorKey: factor.factorKey,
        factorLabel: factor.factorLabel,
        factorMetadata: Prisma.JsonNull,
        maximumScore: factor.maximumScore,
        score: factor.score,
        sortOrder: index,
        weight: factor.weight,
      })),
    },
  } satisfies Prisma.OpportunityScorecardUncheckedCreateInput & {
    factorScores: {
      create: Prisma.OpportunityScoreFactorCreateWithoutScorecardInput[];
    };
  };
}

function isEqualJsonValue(
  left: Prisma.JsonValue | null,
  right: Prisma.InputJsonValue,
) {
  return JSON.stringify(left ?? null) === JSON.stringify(right);
}

type JobLogger = (entry: {
  detail?: Record<string, unknown>;
  level: "error" | "info" | "warn";
  message: string;
}) => void;
