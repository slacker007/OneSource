import { AuditActorType, Prisma, type PrismaClient } from "@prisma/client";

import { AUDIT_ACTIONS, recordAuditEvent } from "@/modules/audit/audit.service";
import {
  runOpportunityScorecardSweep,
  type OpportunityScorecardJobClient,
  type OpportunityScorecardSweepResult,
} from "@/modules/opportunities/opportunity-scorecard-job";
import {
  SCORING_FACTOR_KEYS,
  type OpportunityScoringFactorKey,
} from "@/modules/opportunities/opportunity-scoring";

export type ScoringRecalibrationMode = "manual" | "suggested";

export type PersistedScoringRecalibrationInput = {
  deferRecommendationThreshold: number;
  goRecommendationThreshold: number;
  minimumRiskScorePercent: number;
  mode: ScoringRecalibrationMode;
  note: string | null;
  organizationId: string;
  performedByUserId: string;
  weightByFactorKey: Partial<Record<OpportunityScoringFactorKey, number>>;
};

type OrganizationProfileRecord = {
  id: string;
  activeScoringModelKey: string;
  activeScoringModelVersion: string;
  scoringCriteria: Array<{
    id: string;
    factorKey: string;
    factorLabel: string;
    weight: { toString(): string };
  }>;
};

type RecalibrationTransactionClient = {
  organizationProfile: {
    update(args: {
      where: {
        id: string;
      };
      data: Prisma.OrganizationProfileUncheckedUpdateInput;
    }): Promise<unknown>;
  };
  organizationScoringCriterion: {
    update(args: {
      where: {
        id: string;
      };
      data: Prisma.OrganizationScoringCriterionUncheckedUpdateInput;
    }): Promise<unknown>;
  };
  auditLog: {
    create(args: {
      data: Prisma.AuditLogUncheckedCreateInput;
    }): Promise<unknown>;
  };
};

export type ScoringRecalibrationServiceClient = Pick<
  PrismaClient,
  "$transaction" | "opportunity" | "organizationProfile"
> & {
  organizationProfile: {
    findUnique(args: {
      where: {
        organizationId: string;
      };
      select: {
        id: true;
        activeScoringModelKey: true;
        activeScoringModelVersion: true;
        scoringCriteria: {
          where: {
            isActive: true;
          };
          orderBy: Prisma.OrganizationScoringCriterionOrderByWithRelationInput[];
          select: {
            id: true;
            factorKey: true;
            factorLabel: true;
            weight: true;
          };
        };
      };
    }): Promise<OrganizationProfileRecord | null>;
  };
  opportunity: {
    count(args: {
      where: {
        organizationId: string;
      };
    }): Promise<number>;
  };
  $transaction<T>(
    callback: (tx: RecalibrationTransactionClient) => Promise<T>,
  ): Promise<T>;
};

export type PersistedScoringRecalibrationResult = {
  scoringModelKey: string;
  scoringModelVersion: string;
  sweepResult: OpportunityScorecardSweepResult;
  updatedCriteria: Array<{
    factorKey: string;
    factorLabel: string;
    previousWeight: string;
    nextWeight: string;
  }>;
};

export async function persistScoringRecalibration({
  db,
  input,
  now = new Date(),
  runScorecardSweep = runOpportunityScorecardSweep,
}: {
  db: ScoringRecalibrationServiceClient;
  input: PersistedScoringRecalibrationInput;
  now?: Date;
  runScorecardSweep?: (args: {
    db: OpportunityScorecardJobClient;
    batchSize?: number;
    now?: Date;
    organizationId?: string;
  }) => Promise<OpportunityScorecardSweepResult>;
}): Promise<PersistedScoringRecalibrationResult> {
  const profile = await db.organizationProfile.findUnique({
    where: {
      organizationId: input.organizationId,
    },
    select: {
      id: true,
      activeScoringModelKey: true,
      activeScoringModelVersion: true,
      scoringCriteria: {
        where: {
          isActive: true,
        },
        orderBy: [{ sortOrder: "asc" }, { factorLabel: "asc" }],
        select: {
          id: true,
          factorKey: true,
          factorLabel: true,
          weight: true,
        },
      },
    },
  });

  if (!profile) {
    throw new Error(
      "The organization scoring profile is missing. Re-seed the workspace before recalibrating scoring.",
    );
  }

  const updatedCriteria = profile.scoringCriteria.map((criterion) => {
    const factorKey = criterion.factorKey as OpportunityScoringFactorKey;
    const nextWeight = input.weightByFactorKey[factorKey];

    if (typeof nextWeight !== "number" || !Number.isFinite(nextWeight)) {
      throw new Error(`A valid recalibration weight is missing for ${factorKey}.`);
    }

    return {
      criterionId: criterion.id,
      factorKey,
      factorLabel: criterion.factorLabel,
      nextWeight,
      previousWeight: criterion.weight.toString(),
    };
  });

  const nextModelVersion = now.toISOString().replace(".000Z", "Z");

  await db.$transaction(async (tx) => {
    await tx.organizationProfile.update({
      where: {
        id: profile.id,
      },
      data: {
        activeScoringModelVersion: nextModelVersion,
        deferRecommendationThreshold: new Prisma.Decimal(
          input.deferRecommendationThreshold,
        ),
        goRecommendationThreshold: new Prisma.Decimal(
          input.goRecommendationThreshold,
        ),
        minimumRiskScorePercent: new Prisma.Decimal(
          input.minimumRiskScorePercent,
        ),
      },
    });

    for (const criterion of updatedCriteria) {
      await tx.organizationScoringCriterion.update({
        where: {
          id: criterion.criterionId,
        },
        data: {
          weight: new Prisma.Decimal(criterion.nextWeight),
        },
      });
    }

    await recordAuditEvent({
      db: tx,
      event: {
        action: AUDIT_ACTIONS.organizationScoringRecalibrate,
        actor: {
          type: AuditActorType.USER,
          userId: input.performedByUserId,
        },
        metadata: {
          deferRecommendationThreshold: input.deferRecommendationThreshold,
          goRecommendationThreshold: input.goRecommendationThreshold,
          minimumRiskScorePercent: input.minimumRiskScorePercent,
          mode: input.mode,
          nextModelVersion,
          note: input.note,
          previousModelVersion: profile.activeScoringModelVersion,
          updatedCriteria: updatedCriteria.map((criterion) => ({
            factorKey: criterion.factorKey,
            factorLabel: criterion.factorLabel,
            nextWeight: criterion.nextWeight,
            previousWeight: criterion.previousWeight,
          })),
        },
        occurredAt: now,
        organizationId: input.organizationId,
        summary: `Updated the organization scoring profile using ${input.mode} recalibration settings.`,
        target: {
          type: "organization_profile",
          id: profile.id,
          display: "Organization scoring profile",
        },
      },
    });
  });

  const opportunityCount = await db.opportunity.count({
    where: {
      organizationId: input.organizationId,
    },
  });
  const sweepResult = await runScorecardSweep({
    db: db as unknown as OpportunityScorecardJobClient,
    batchSize: Math.max(opportunityCount, 1),
    now,
    organizationId: input.organizationId,
  });

  return {
    scoringModelKey: profile.activeScoringModelKey,
    scoringModelVersion: nextModelVersion,
    sweepResult,
    updatedCriteria: updatedCriteria.map((criterion) => ({
      factorKey: criterion.factorKey,
      factorLabel: criterion.factorLabel,
      previousWeight: criterion.previousWeight,
      nextWeight: criterion.nextWeight.toFixed(2),
    })),
  };
}

export function parseScoringWeightMap(
  values: Record<string, FormDataEntryValue | null>,
  prefix: string,
) {
  const entries = Object.entries(values).filter(([key]) =>
    key.startsWith(`${prefix}_`),
  );

  if (entries.length === 0) {
    throw new Error("No scoring weights were submitted for recalibration.");
  }

  return Object.fromEntries(
    entries.map(([key, value]) => {
      const factorKey = key.slice(`${prefix}_`.length);

      if (!SCORING_FACTOR_KEYS.includes(factorKey as OpportunityScoringFactorKey)) {
        throw new Error(`An unsupported scoring factor was submitted: ${factorKey}.`);
      }

      return [
        factorKey,
        parseRequiredDecimal(value, factorKey),
      ];
    }),
  ) as Partial<Record<OpportunityScoringFactorKey, number>>;
}

export function parseRequiredDecimal(
  value: FormDataEntryValue | null,
  label: string,
) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`A numeric value is required for ${label}.`);
  }

  const parsedValue = Number.parseFloat(value);

  if (!Number.isFinite(parsedValue)) {
    throw new Error(`A valid numeric value is required for ${label}.`);
  }

  return parsedValue;
}
