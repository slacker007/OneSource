import type { OpportunityScoringFactorKey } from "@/modules/opportunities/opportunity-scoring";

export const SCORING_RECALIBRATION_OUTCOME_KEYS = [
  "awarded",
  "lost",
  "no_bid",
] as const;

export type ScoringRecalibrationOutcomeKey =
  (typeof SCORING_RECALIBRATION_OUTCOME_KEYS)[number];

export type ScoringRecalibrationCriterionInput = {
  key: OpportunityScoringFactorKey;
  label: string;
  description: string | null;
  weight: number;
};

export type ScoringRecalibrationObservation = {
  opportunityId: string;
  opportunityTitle: string;
  outcomeKey: ScoringRecalibrationOutcomeKey;
  scorePercent: number | null;
  recommendationAligned: boolean | null;
  factorPercents: Partial<Record<OpportunityScoringFactorKey, number | null>>;
};

export type ScoringRecalibrationOutcomeSummary = {
  key: ScoringRecalibrationOutcomeKey;
  label: string;
  opportunityCount: number;
  averageScorePercent: string | null;
};

export type ScoringRecalibrationFactorInsight = {
  key: OpportunityScoringFactorKey;
  label: string;
  description: string | null;
  currentWeight: string;
  suggestedWeight: string;
  awardedAveragePercent: string | null;
  nonAwardAveragePercent: string | null;
  outcomeLiftPercent: string | null;
  evidenceCount: number;
  recommendation: "increase" | "decrease" | "hold";
  rationale: string;
};

export type ScoringRecalibrationSnapshot = {
  closedOpportunityCount: number;
  sampledOpportunityCount: number;
  recommendationAlignmentPercent: string | null;
  outcomeSummaries: ScoringRecalibrationOutcomeSummary[];
  factorInsights: ScoringRecalibrationFactorInsight[];
  suggestionSummary: string;
};

type FactorSignal = {
  key: OpportunityScoringFactorKey;
  awardedAverage: number | null;
  nonAwardAverage: number | null;
  outcomeLift: number | null;
  evidenceCount: number;
  multiplier: number;
};

const OUTCOME_LABELS: Record<ScoringRecalibrationOutcomeKey, string> = {
  awarded: "Awarded",
  lost: "Lost",
  no_bid: "No bid",
};

export function buildScoringRecalibrationSnapshot({
  criteria,
  observations,
}: {
  criteria: ScoringRecalibrationCriterionInput[];
  observations: ScoringRecalibrationObservation[];
}): ScoringRecalibrationSnapshot {
  const awardedObservations = observations.filter(
    (observation) => observation.outcomeKey === "awarded",
  );
  const nonAwardObservations = observations.filter(
    (observation) => observation.outcomeKey !== "awarded",
  );
  const factorSignals = criteria.map((criterion) =>
    buildFactorSignal({
      awardedObservations,
      criterion,
      nonAwardObservations,
    }),
  );
  const suggestedWeightByKey = buildSuggestedWeightMap({
    criteria,
    factorSignals,
  });
  const comparableRecommendationCount = observations.filter(
    (observation) => observation.recommendationAligned !== null,
  ).length;
  const alignedRecommendationCount = observations.filter(
    (observation) => observation.recommendationAligned === true,
  ).length;

  return {
    closedOpportunityCount: observations.length,
    sampledOpportunityCount: observations.filter(
      (observation) => observation.scorePercent !== null,
    ).length,
    recommendationAlignmentPercent:
      comparableRecommendationCount === 0
        ? null
        : formatNumeric(
            (alignedRecommendationCount / comparableRecommendationCount) * 100,
          ),
    outcomeSummaries: SCORING_RECALIBRATION_OUTCOME_KEYS.map((outcomeKey) => {
      const outcomeObservations = observations.filter(
        (observation) => observation.outcomeKey === outcomeKey,
      );

      return {
        key: outcomeKey,
        label: OUTCOME_LABELS[outcomeKey],
        opportunityCount: outcomeObservations.length,
        averageScorePercent: formatAverage(
          outcomeObservations.map((observation) => observation.scorePercent),
        ),
      };
    }),
    factorInsights: criteria.map((criterion, index) =>
      buildFactorInsight({
        criterion,
        signal: factorSignals[index],
        suggestedWeight: suggestedWeightByKey.get(criterion.key) ?? criterion.weight,
      }),
    ),
    suggestionSummary: buildSuggestionSummary({
      alignedRecommendationCount,
      comparableRecommendationCount,
      observations,
    }),
  };
}

function buildFactorSignal({
  awardedObservations,
  criterion,
  nonAwardObservations,
}: {
  awardedObservations: ScoringRecalibrationObservation[];
  criterion: ScoringRecalibrationCriterionInput;
  nonAwardObservations: ScoringRecalibrationObservation[];
}): FactorSignal {
  const awardedAverage = average(
    awardedObservations.map(
      (observation) => observation.factorPercents[criterion.key] ?? null,
    ),
  );
  const nonAwardAverage = average(
    nonAwardObservations.map(
      (observation) => observation.factorPercents[criterion.key] ?? null,
    ),
  );
  const outcomeLift =
    awardedAverage === null || nonAwardAverage === null
      ? null
      : roundNumber(awardedAverage - nonAwardAverage);
  const evidenceCount =
    awardedObservations.filter(
      (observation) => observation.factorPercents[criterion.key] !== null,
    ).length +
    nonAwardObservations.filter(
      (observation) => observation.factorPercents[criterion.key] !== null,
    ).length;

  return {
    key: criterion.key,
    awardedAverage,
    nonAwardAverage,
    outcomeLift,
    evidenceCount,
    multiplier:
      outcomeLift === null ? 1 : clamp(1 + outcomeLift / 100, 0.7, 1.3),
  };
}

function buildSuggestedWeightMap({
  criteria,
  factorSignals,
}: {
  criteria: ScoringRecalibrationCriterionInput[];
  factorSignals: FactorSignal[];
}) {
  const totalCurrentWeight = criteria.reduce(
    (sum, criterion) => sum + criterion.weight,
    0,
  );
  const rawWeights = criteria.map((criterion, index) => ({
    key: criterion.key,
    rawWeight: roundNumber(criterion.weight * factorSignals[index].multiplier),
  }));
  const totalRawWeight = rawWeights.reduce((sum, item) => sum + item.rawWeight, 0);

  if (totalCurrentWeight <= 0 || totalRawWeight <= 0) {
    return new Map(criteria.map((criterion) => [criterion.key, criterion.weight]));
  }

  const normalizedWeights = rawWeights.map((item) => ({
    key: item.key,
    weight: roundNumber((item.rawWeight / totalRawWeight) * totalCurrentWeight),
  }));
  const normalizedTotal = normalizedWeights.reduce(
    (sum, item) => sum + item.weight,
    0,
  );
  const remainder = roundNumber(totalCurrentWeight - normalizedTotal);

  if (normalizedWeights.length > 0 && remainder !== 0) {
    const lastWeight = normalizedWeights[normalizedWeights.length - 1];

    lastWeight.weight = roundNumber(lastWeight.weight + remainder);
  }

  return new Map(
    normalizedWeights.map((item) => [item.key, Math.max(item.weight, 0.01)]),
  );
}

function buildFactorInsight({
  criterion,
  signal,
  suggestedWeight,
}: {
  criterion: ScoringRecalibrationCriterionInput;
  signal: FactorSignal;
  suggestedWeight: number;
}): ScoringRecalibrationFactorInsight {
  const weightDelta = suggestedWeight - criterion.weight;
  const recommendation =
    Math.abs(weightDelta) < 0.5
      ? "hold"
      : weightDelta > 0
      ? "increase"
      : "decrease";

  return {
    key: criterion.key,
    label: criterion.label,
    description: criterion.description,
    currentWeight: formatNumeric(criterion.weight),
    suggestedWeight: formatNumeric(suggestedWeight),
    awardedAveragePercent: signal.awardedAverage === null
      ? null
      : formatNumeric(signal.awardedAverage),
    nonAwardAveragePercent:
      signal.nonAwardAverage === null ? null : formatNumeric(signal.nonAwardAverage),
    outcomeLiftPercent:
      signal.outcomeLift === null ? null : formatNumeric(signal.outcomeLift),
    evidenceCount: signal.evidenceCount,
    recommendation,
    rationale: buildFactorRationale({
      criterion,
      recommendation,
      signal,
      suggestedWeight,
    }),
  };
}

function buildFactorRationale({
  criterion,
  recommendation,
  signal,
  suggestedWeight,
}: {
  criterion: ScoringRecalibrationCriterionInput;
  recommendation: ScoringRecalibrationFactorInsight["recommendation"];
  signal: FactorSignal;
  suggestedWeight: number;
}) {
  if (signal.awardedAverage === null || signal.nonAwardAverage === null) {
    return `Hold ${criterion.label.toLowerCase()} until both awarded and non-award outcomes have scored evidence.`;
  }

  if (recommendation === "increase") {
    return `${criterion.label} scored ${formatNumeric(
      signal.outcomeLift ?? 0,
    )} points higher on awarded work than on lost or no-bid work, so the suggested weight rises to ${formatNumeric(suggestedWeight)}.`;
  }

  if (recommendation === "decrease") {
    return `${criterion.label} did not separate awarded work from lost or no-bid work, so the suggested weight drops to ${formatNumeric(suggestedWeight)}.`;
  }

  return `${criterion.label} is performing close to its current weight, so the suggested recalibration keeps it near ${formatNumeric(suggestedWeight)}.`;
}

function buildSuggestionSummary({
  alignedRecommendationCount,
  comparableRecommendationCount,
  observations,
}: {
  alignedRecommendationCount: number;
  comparableRecommendationCount: number;
  observations: ScoringRecalibrationObservation[];
}) {
  if (observations.length === 0) {
    return "No closed scorecard outcomes are available yet, so the workflow keeps the current weights until win/loss evidence accumulates.";
  }

  if (comparableRecommendationCount === 0) {
    return "Closed outcomes exist, but the current sample does not yet include enough comparable recommendation history to calibrate beyond the observed factor separation.";
  }

  return `Observed outcomes cover ${observations.length} closed opportunities, and ${alignedRecommendationCount} of ${comparableRecommendationCount} comparable records matched the current recommendation.`;
}

function average(values: Array<number | null | undefined>) {
  const numericValues = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );

  if (numericValues.length === 0) {
    return null;
  }

  return roundNumber(
    numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length,
  );
}

function formatAverage(values: Array<number | null | undefined>) {
  const computedAverage = average(values);
  return computedAverage === null ? null : formatNumeric(computedAverage);
}

function formatNumeric(value: number) {
  return value.toFixed(2);
}

function roundNumber(value: number) {
  return Number.parseFloat(value.toFixed(2));
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}
