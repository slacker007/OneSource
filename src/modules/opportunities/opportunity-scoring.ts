const DEFAULT_SCORING_MODEL_KEY = "default_capture_v1";
const DEFAULT_SCORING_MODEL_VERSION = "unconfigured";

const CLOSED_STAGE_KEYS = new Set(["submitted", "awarded", "lost", "no_bid"]);

const DEFAULT_FACTOR_WEIGHTS = {
  capability_fit: 30,
  strategic_alignment: 20,
  vehicle_access: 15,
  relationship_strength: 15,
  schedule_realism: 10,
  risk: 10,
} as const;

const DEFAULT_FACTOR_LABELS = {
  capability_fit: "Capability fit",
  strategic_alignment: "Strategic alignment",
  vehicle_access: "Vehicle access",
  relationship_strength: "Relationship strength",
  schedule_realism: "Schedule realism",
  risk: "Risk",
} as const;

const STOP_WORDS = new Set([
  "a",
  "about",
  "after",
  "all",
  "and",
  "are",
  "before",
  "but",
  "can",
  "for",
  "from",
  "has",
  "have",
  "into",
  "its",
  "not",
  "now",
  "the",
  "their",
  "then",
  "they",
  "this",
  "used",
  "using",
  "where",
  "with",
]);

export const SCORING_FACTOR_KEYS = [
  "capability_fit",
  "strategic_alignment",
  "vehicle_access",
  "relationship_strength",
  "schedule_realism",
  "risk",
] as const;

export type OpportunityScoringFactorKey = (typeof SCORING_FACTOR_KEYS)[number];

export type OpportunityScoringAgencyInput = {
  id: string;
  name: string;
  organizationCode: string | null;
};

export type OpportunityScoringCapabilityInput = {
  key: string;
  label: string;
  category: string | null;
  keywords: string[];
};

export type OpportunityScoringCertificationInput = {
  key: string;
  label: string;
  code: string | null;
};

export type OpportunityScoringVehicleInput = {
  id: string;
  code: string;
  name: string;
  isPreferred: boolean;
};

export type OpportunityScoringCriterionInput = {
  key: OpportunityScoringFactorKey;
  label: string;
  weight: number;
};

export type OrganizationScoringProfileInput = {
  activeScoringModelKey: string | null;
  activeScoringModelVersion: string | null;
  strategicFocus: string | null;
  targetNaicsCodes: string[];
  priorityAgencyIds: string[];
  relationshipAgencyIds: string[];
  capabilities: OpportunityScoringCapabilityInput[];
  certifications: OpportunityScoringCertificationInput[];
  selectedVehicles: OpportunityScoringVehicleInput[];
  scoringCriteria: OpportunityScoringCriterionInput[];
};

export type OpportunityScoringCompetitorInput = {
  name: string;
  role: string;
};

export type OpportunityScoringOpportunityInput = {
  id: string;
  title: string;
  description: string | null;
  sourceSummaryText: string | null;
  responseDeadlineAt: string | null;
  currentStageKey: string | null;
  naicsCode: string | null;
  leadAgency: OpportunityScoringAgencyInput | null;
  isActiveSourceRecord: boolean;
  isArchivedSourceRecord: boolean;
  vehicles: Array<{
    id: string;
    code: string;
    name: string;
    isPrimary: boolean;
  }>;
  competitors: OpportunityScoringCompetitorInput[];
};

export type CalculatedOpportunityScoreFactor = {
  id: string;
  factorKey: OpportunityScoringFactorKey;
  factorLabel: string;
  weight: number;
  score: number;
  maximumScore: number;
  explanation: string;
};

export type CalculatedOpportunityScorecard = {
  scoringModelKey: string;
  scoringModelVersion: string;
  totalScore: number;
  maximumScore: number;
  scorePercent: number;
  recommendationOutcome: null;
  recommendationSummary: null;
  summary: string;
  calculatedAt: string;
  factors: CalculatedOpportunityScoreFactor[];
};

type FactorComputation = {
  ratio: number;
  explanation: string;
};

type ResolvedCriterion = {
  key: OpportunityScoringFactorKey;
  label: string;
  weight: number;
};

export function calculateOpportunityScore({
  opportunity,
  profile,
  referenceDate = new Date(),
}: {
  opportunity: OpportunityScoringOpportunityInput;
  profile?: OrganizationScoringProfileInput | null;
  referenceDate?: Date;
}): CalculatedOpportunityScorecard {
  const resolvedProfile = resolveProfile(profile);
  const criteria = resolveCriteria(resolvedProfile.scoringCriteria);
  const deadlineDate = parseDate(opportunity.responseDeadlineAt);

  const factorDetails = {
    capability_fit: computeCapabilityFit(opportunity, resolvedProfile),
    strategic_alignment: computeStrategicAlignment(opportunity, resolvedProfile),
    vehicle_access: computeVehicleAccess(opportunity, resolvedProfile),
    relationship_strength: computeRelationshipStrength(opportunity, resolvedProfile),
    schedule_realism: computeScheduleRealism(opportunity, deadlineDate, referenceDate),
    risk: computeRisk(opportunity, resolvedProfile, deadlineDate, referenceDate),
  } satisfies Record<OpportunityScoringFactorKey, FactorComputation>;

  const factors = criteria.map((criterion) => {
    const factor = factorDetails[criterion.key];
    return {
      id: `calculated:${opportunity.id}:${criterion.key}`,
      factorKey: criterion.key,
      factorLabel: criterion.label,
      weight: criterion.weight,
      score: roundScore(criterion.weight * factor.ratio),
      maximumScore: roundScore(criterion.weight),
      explanation: factor.explanation,
    };
  });

  const totalScore = roundScore(
    factors.reduce((sum, factor) => sum + factor.score, 0),
  );
  const maximumScore = roundScore(
    factors.reduce((sum, factor) => sum + factor.maximumScore, 0),
  );
  const scorePercent =
    maximumScore > 0 ? roundScore((totalScore / maximumScore) * 100) : 0;

  return {
    scoringModelKey:
      resolvedProfile.activeScoringModelKey ?? DEFAULT_SCORING_MODEL_KEY,
    scoringModelVersion:
      resolvedProfile.activeScoringModelVersion ??
      DEFAULT_SCORING_MODEL_VERSION,
    totalScore,
    maximumScore,
    scorePercent,
    recommendationOutcome: null,
    recommendationSummary: null,
    summary: buildScoreSummary({ factors, totalScore, maximumScore }),
    calculatedAt: referenceDate.toISOString(),
    factors,
  };
}

function resolveProfile(
  profile: OrganizationScoringProfileInput | null | undefined,
): OrganizationScoringProfileInput {
  if (profile) {
    return profile;
  }

  return {
    activeScoringModelKey: DEFAULT_SCORING_MODEL_KEY,
    activeScoringModelVersion: DEFAULT_SCORING_MODEL_VERSION,
    strategicFocus: null,
    targetNaicsCodes: [],
    priorityAgencyIds: [],
    relationshipAgencyIds: [],
    capabilities: [],
    certifications: [],
    selectedVehicles: [],
    scoringCriteria: [],
  };
}

function resolveCriteria(
  criteria: OpportunityScoringCriterionInput[],
): ResolvedCriterion[] {
  const criteriaByKey = new Map(criteria.map((criterion) => [criterion.key, criterion]));

  return SCORING_FACTOR_KEYS.map((key) => {
    const configured = criteriaByKey.get(key);
    return {
      key,
      label: configured?.label?.trim() || DEFAULT_FACTOR_LABELS[key],
      weight: configured?.weight ?? DEFAULT_FACTOR_WEIGHTS[key],
    };
  });
}

function computeCapabilityFit(
  opportunity: OpportunityScoringOpportunityInput,
  profile: OrganizationScoringProfileInput,
): FactorComputation {
  const haystack = buildTextHaystack(opportunity);
  const activeCapabilities = profile.capabilities.filter(
    (capability) => capability.key.trim().length > 0,
  );
  const activeCertifications = profile.certifications.filter(
    (certification) => certification.key.trim().length > 0,
  );

  if (activeCapabilities.length === 0 && activeCertifications.length === 0) {
    return {
      ratio: 0.45,
      explanation:
        "No organization capabilities or certifications are configured yet, so capability fit is using a conservative baseline.",
    };
  }

  const matchedCapabilities = activeCapabilities.filter((capability) =>
    buildCapabilitySignals(capability).some((signal) => haystack.includes(signal)),
  );
  const matchedCertifications = activeCertifications.filter((certification) =>
    buildCertificationSignals(certification).some((signal) =>
      haystack.includes(signal),
    ),
  );

  const capabilityCoverage =
    activeCapabilities.length > 0
      ? matchedCapabilities.length / activeCapabilities.length
      : 0;
  const certificationCoverage =
    activeCertifications.length > 0
      ? matchedCertifications.length / activeCertifications.length
      : 0;

  const ratio = clamp01(capabilityCoverage * 0.9 + certificationCoverage * 0.1);
  const matchedCapabilityLabels = matchedCapabilities.map(
    (capability) => capability.label,
  );
  const matchedCertificationLabels = matchedCertifications.map(
    (certification) => certification.label,
  );

  if (matchedCapabilityLabels.length === 0 && matchedCertificationLabels.length === 0) {
    return {
      ratio: Math.max(ratio, 0.1),
      explanation:
        "Opportunity text does not clearly match the configured capability inventory yet, so fit remains low until the scope is clarified.",
    };
  }

  const parts = [];

  if (matchedCapabilityLabels.length > 0) {
    parts.push(`Matched capabilities: ${matchedCapabilityLabels.join(", ")}.`);
  }

  if (matchedCertificationLabels.length > 0) {
    parts.push(
      `Detected certification or compliance signals for ${matchedCertificationLabels.join(", ")}.`,
    );
  }

  return {
    ratio,
    explanation: parts.join(" "),
  };
}

function computeStrategicAlignment(
  opportunity: OpportunityScoringOpportunityInput,
  profile: OrganizationScoringProfileInput,
): FactorComputation {
  const matchedSignals: string[] = [];
  let score = 0;

  if (
    opportunity.leadAgency &&
    profile.priorityAgencyIds.includes(opportunity.leadAgency.id)
  ) {
    score += 0.55;
    matchedSignals.push(`priority agency ${opportunity.leadAgency.name}`);
  }

  if (
    opportunity.naicsCode &&
    profile.targetNaicsCodes.includes(opportunity.naicsCode)
  ) {
    score += 0.25;
    matchedSignals.push(`target NAICS ${opportunity.naicsCode}`);
  }

  const focusTerms = extractStrategicFocusTerms(profile.strategicFocus);
  const haystack = buildTextHaystack(opportunity);
  const matchedFocusTerms = focusTerms.filter((term) => haystack.includes(term));

  if (matchedFocusTerms.length > 0) {
    score += Math.min(0.2, matchedFocusTerms.length * 0.05);
    matchedSignals.push(
      `strategic-focus terms ${matchedFocusTerms.slice(0, 4).join(", ")}`,
    );
  }

  if (matchedSignals.length === 0) {
    return {
      ratio: 0.2,
      explanation:
        "The opportunity does not currently map to a priority agency, target NAICS code, or clear strategic-focus theme.",
    };
  }

  return {
    ratio: clamp01(score),
    explanation: `Aligned signals: ${matchedSignals.join("; ")}.`,
  };
}

function computeVehicleAccess(
  opportunity: OpportunityScoringOpportunityInput,
  profile: OrganizationScoringProfileInput,
): FactorComputation {
  const selectedVehicles = profile.selectedVehicles;
  const selectedVehicleIds = new Set(selectedVehicles.map((vehicle) => vehicle.id));
  const preferredVehicleIds = new Set(
    selectedVehicles
      .filter((vehicle) => vehicle.isPreferred)
      .map((vehicle) => vehicle.id),
  );
  const matchedVehicles = opportunity.vehicles.filter((vehicle) =>
    selectedVehicleIds.has(vehicle.id),
  );
  const matchedPreferredVehicles = matchedVehicles.filter((vehicle) =>
    preferredVehicleIds.has(vehicle.id),
  );

  if (matchedPreferredVehicles.some((vehicle) => vehicle.isPrimary)) {
    return {
      ratio: 1,
      explanation: `Primary pursuit vehicle access is already in place on ${matchedPreferredVehicles[0]?.name}.`,
    };
  }

  if (matchedPreferredVehicles.length > 0) {
    return {
      ratio: 0.9,
      explanation: `Preferred vehicle access is available through ${matchedPreferredVehicles.map((vehicle) => vehicle.name).join(", ")}.`,
    };
  }

  if (matchedVehicles.length > 0) {
    return {
      ratio: 0.75,
      explanation: `The opportunity aligns to selected vehicle access through ${matchedVehicles.map((vehicle) => vehicle.name).join(", ")}.`,
    };
  }

  const haystack = buildTextHaystack(opportunity);
  const mentionedPreferredVehicle = selectedVehicles.find(
    (vehicle) =>
      vehicle.isPreferred &&
      [vehicle.code, vehicle.name].some((signal) =>
        haystack.includes(normalizeSignal(signal)),
      ),
  );

  if (mentionedPreferredVehicle) {
    return {
      ratio: 0.7,
      explanation: `The opportunity text references preferred vehicle ${mentionedPreferredVehicle.name}, but structured vehicle linkage is still missing.`,
    };
  }

  if (opportunity.vehicles.length === 0) {
    return {
      ratio: selectedVehicles.length > 0 ? 0.35 : 0.4,
      explanation:
        "No structured contract-vehicle linkage is captured yet, so vehicle access remains uncertain.",
    };
  }

  return {
    ratio: 0.1,
    explanation:
      "The opportunity currently points to vehicles outside the configured organization profile, so access likely depends on a partner or a new contract path.",
  };
}

function computeRelationshipStrength(
  opportunity: OpportunityScoringOpportunityInput,
  profile: OrganizationScoringProfileInput,
): FactorComputation {
  if (!opportunity.leadAgency) {
    return {
      ratio: 0.3,
      explanation:
        "No lead agency is assigned yet, so relationship strength cannot be validated beyond a conservative baseline.",
    };
  }

  if (
    profile.relationshipAgencyIds.includes(opportunity.leadAgency.id)
  ) {
    return {
      ratio: 1,
      explanation: `The lead agency ${opportunity.leadAgency.name} is on the seeded relationship-coverage list.`,
    };
  }

  if (profile.priorityAgencyIds.includes(opportunity.leadAgency.id)) {
    return {
      ratio: 0.7,
      explanation: `The lead agency ${opportunity.leadAgency.name} is a priority account, but explicit relationship coverage is not recorded yet.`,
    };
  }

  return {
    ratio: 0.35,
    explanation:
      "The opportunity sits outside the seeded relationship-agency set, so account familiarity remains limited.",
  };
}

function computeScheduleRealism(
  opportunity: OpportunityScoringOpportunityInput,
  deadlineDate: Date | null,
  referenceDate: Date,
): FactorComputation {
  const isClosedStage =
    opportunity.currentStageKey !== null &&
    CLOSED_STAGE_KEYS.has(opportunity.currentStageKey);

  if (!deadlineDate) {
    return {
      ratio: isClosedStage ? 0.7 : 0.4,
      explanation: isClosedStage
        ? "The workspace is already in a closed stage, so the missing deadline is less actionable for schedule scoring."
        : "No response deadline is recorded yet, so schedule realism remains uncertain.",
    };
  }

  const daysUntilDeadline = Math.floor(
    (deadlineDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (isClosedStage && daysUntilDeadline < 0) {
    return {
      ratio: 0.75,
      explanation:
        "The opportunity is already in a closed stage, so the passed deadline is treated as historical rather than a live schedule blocker.",
    };
  }

  if (daysUntilDeadline >= 45) {
    return {
      ratio: 1,
      explanation: `There are ${daysUntilDeadline} days remaining, which supports a full capture and proposal rhythm.`,
    };
  }

  if (daysUntilDeadline >= 30) {
    return {
      ratio: 0.9,
      explanation: `There are ${daysUntilDeadline} days remaining, which is still healthy for a disciplined response plan.`,
    };
  }

  if (daysUntilDeadline >= 21) {
    return {
      ratio: 0.8,
      explanation: `There are ${daysUntilDeadline} days remaining, so the timeline is workable but no longer forgiving.`,
    };
  }

  if (daysUntilDeadline >= 14) {
    return {
      ratio: 0.65,
      explanation: `There are ${daysUntilDeadline} days remaining, so proposal planning needs immediate execution discipline.`,
    };
  }

  if (daysUntilDeadline >= 7) {
    return {
      ratio: 0.45,
      explanation: `Only ${daysUntilDeadline} days remain before the deadline, which compresses capture and review time.`,
    };
  }

  if (daysUntilDeadline >= 0) {
    return {
      ratio: 0.15,
      explanation: `The response deadline is only ${daysUntilDeadline} days away, making the schedule highly compressed.`,
    };
  }

  return {
    ratio: 0,
    explanation:
      "The recorded response deadline has already passed while the opportunity is still active, so the schedule is no longer realistic.",
  };
}

function computeRisk(
  opportunity: OpportunityScoringOpportunityInput,
  profile: OrganizationScoringProfileInput,
  deadlineDate: Date | null,
  referenceDate: Date,
): FactorComputation {
  const riskDrivers: string[] = [];
  const mitigators: string[] = [];
  let ratio = 0.7;

  const incumbentCompetitor = opportunity.competitors.find(
    (competitor) => competitor.role === "INCUMBENT",
  );

  if (incumbentCompetitor) {
    ratio -= 0.25;
    riskDrivers.push(`known incumbent ${incumbentCompetitor.name}`);
  } else {
    ratio += 0.1;
    mitigators.push("no incumbent competitor is recorded");
  }

  if (opportunity.competitors.length >= 3) {
    ratio -= 0.1;
    riskDrivers.push("crowded competitor field");
  }

  if (!opportunity.isActiveSourceRecord || opportunity.isArchivedSourceRecord) {
    ratio -= 0.2;
    riskDrivers.push("inactive or archived source status");
  }

  if (!opportunity.leadAgency) {
    ratio -= 0.1;
    riskDrivers.push("missing lead-agency ownership");
  }

  const hasPreferredVehicleAccess = opportunity.vehicles.some((vehicle) =>
    profile.selectedVehicles.some(
      (selectedVehicle) =>
        selectedVehicle.id === vehicle.id && selectedVehicle.isPreferred,
    ),
  );

  if (hasPreferredVehicleAccess) {
    ratio += 0.1;
    mitigators.push("preferred vehicle access is already confirmed");
  }

  if (deadlineDate) {
    const daysUntilDeadline = Math.floor(
      (deadlineDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilDeadline < 7 && !CLOSED_STAGE_KEYS.has(opportunity.currentStageKey ?? "")) {
      ratio -= 0.15;
      riskDrivers.push("response timeline is inside one week");
    }
  }

  const haystack = buildTextHaystack(opportunity);
  const matchingCertification = profile.certifications.find((certification) =>
    buildCertificationSignals(certification).some((signal) =>
      haystack.includes(signal),
    ),
  );

  if (matchingCertification) {
    ratio += 0.05;
    mitigators.push(
      `configured certification coverage exists for ${matchingCertification.label}`,
    );
  }

  const clampedRatio = clamp01(ratio);

  if (riskDrivers.length === 0) {
    return {
      ratio: clampedRatio,
      explanation: `Risk posture is favorable because ${mitigators.join(" and ")}.`,
    };
  }

  const explanationParts = [
    `Primary risk drivers: ${riskDrivers.join(", ")}.`,
  ];

  if (mitigators.length > 0) {
    explanationParts.push(`Mitigators: ${mitigators.join(", ")}.`);
  }

  return {
    ratio: clampedRatio,
    explanation: explanationParts.join(" "),
  };
}

function buildCapabilitySignals(
  capability: OpportunityScoringCapabilityInput,
): string[] {
  return [
    capability.label,
    capability.category,
    ...capability.keywords,
  ]
    .filter((signal): signal is string => Boolean(signal))
    .map(normalizeSignal);
}

function buildCertificationSignals(
  certification: OpportunityScoringCertificationInput,
): string[] {
  return [certification.label, certification.code]
    .filter((signal): signal is string => Boolean(signal))
    .map(normalizeSignal);
}

function buildTextHaystack(opportunity: OpportunityScoringOpportunityInput): string {
  return [
    opportunity.title,
    opportunity.description,
    opportunity.sourceSummaryText,
    opportunity.naicsCode,
    opportunity.leadAgency?.name,
    opportunity.leadAgency?.organizationCode,
    ...opportunity.vehicles.flatMap((vehicle) => [vehicle.code, vehicle.name]),
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeSignal)
    .join(" ");
}

function normalizeSignal(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractStrategicFocusTerms(strategicFocus: string | null): string[] {
  if (!strategicFocus) {
    return [];
  }

  const uniqueTerms = new Set<string>();

  for (const token of normalizeSignal(strategicFocus).split(" ")) {
    if (token.length < 5 || STOP_WORDS.has(token)) {
      continue;
    }

    uniqueTerms.add(token);

    if (uniqueTerms.size >= 8) {
      break;
    }
  }

  return [...uniqueTerms];
}

function buildScoreSummary({
  factors,
  totalScore,
  maximumScore,
}: {
  factors: CalculatedOpportunityScoreFactor[];
  totalScore: number;
  maximumScore: number;
}) {
  const rankedFactors = [...factors].sort((left, right) => {
    const leftRatio =
      left.maximumScore > 0 ? left.score / left.maximumScore : 0;
    const rightRatio =
      right.maximumScore > 0 ? right.score / right.maximumScore : 0;

    return rightRatio - leftRatio;
  });
  const strongestFactors = rankedFactors.slice(0, 2).map((factor) => factor.factorLabel);
  const weakestFactors = [...rankedFactors]
    .reverse()
    .slice(0, 2)
    .map((factor) => factor.factorLabel.toLowerCase());

  return `Deterministic score ${totalScore.toFixed(2)}/${maximumScore.toFixed(2)}. Strongest factors: ${strongestFactors.join(", ")}. Main constraints: ${weakestFactors.join(", ")}.`;
}

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

function clamp01(value: number) {
  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
}
