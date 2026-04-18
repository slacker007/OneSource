import type { OpportunityWorkspaceSnapshot } from "./opportunity.types";

export const OPPORTUNITY_STAGE_POLICY_VERSION = "2026-04-18-p4-04";

export const OPPORTUNITY_STAGE_DEFINITIONS = [
  {
    key: "identified",
    label: "Identified",
    description: "New intake record pending basic qualification.",
  },
  {
    key: "qualified",
    label: "Qualified",
    description: "Core opportunity details are complete enough for review.",
  },
  {
    key: "pursuit_approved",
    label: "Pursuit Approved",
    description: "The opportunity has enough decision support for a pursuit call.",
  },
  {
    key: "capture_active",
    label: "Capture Active",
    description: "The team is actively executing the capture plan.",
  },
  {
    key: "proposal_in_development",
    label: "Proposal In Development",
    description: "Proposal work is underway and execution artifacts are present.",
  },
  {
    key: "submitted",
    label: "Submitted",
    description: "The response package has been finalized and submitted.",
  },
  {
    key: "awarded",
    label: "Awarded",
    description: "The pursuit closed as a win.",
  },
  {
    key: "lost",
    label: "Lost",
    description: "The pursuit closed as a loss.",
  },
  {
    key: "no_bid",
    label: "No Bid",
    description: "The pursuit was closed without submission.",
  },
] as const;

export type OpportunityStageKey =
  (typeof OPPORTUNITY_STAGE_DEFINITIONS)[number]["key"];

type OpportunityBidDecisionOutcome = "GO" | "NO_GO" | "DEFER";

type OpportunityStageRequirementKey =
  | "lead_agency"
  | "response_deadline"
  | "solicitation_number"
  | "naics_code"
  | "scorecard"
  | "go_decision"
  | "task"
  | "milestone"
  | "document";

export type OpportunityStageRequirementStatus = {
  description: string;
  isSatisfied: boolean;
  key: OpportunityStageRequirementKey;
  label: string;
};

export type OpportunityStageTransitionOption = {
  description: string;
  isAllowed: boolean;
  missingRequirementLabels: string[];
  requirements: OpportunityStageRequirementStatus[];
  stageKey: OpportunityStageKey;
  stageLabel: string;
};

export type OpportunityStageControlSnapshot = {
  currentStageKey: OpportunityStageKey;
  currentStageLabel: string;
  defaultToStageKey: OpportunityStageKey | null;
  options: OpportunityStageTransitionOption[];
  policyVersion: string;
  rationaleRequired: boolean;
};

export type OpportunityStageTransitionActionState = {
  formError: string | null;
  successMessage: string | null;
};

export const INITIAL_OPPORTUNITY_STAGE_TRANSITION_ACTION_STATE: OpportunityStageTransitionActionState =
  {
    formError: null,
    successMessage: null,
  };

export type OpportunityStageValidationContext = {
  bidDecisionCount: number;
  currentBidDecisionFinalOutcome: OpportunityBidDecisionOutcome | null;
  currentStageKey: string | null;
  currentStageLabel: string | null;
  documentCount: number;
  leadAgencyId: string | null;
  milestoneCount: number;
  naicsCode: string | null;
  noteCount: number;
  responseDeadlineAt: string | null;
  scorecardCount: number;
  solicitationNumber: string | null;
  taskCount: number;
};

export class OpportunityStageTransitionValidationError extends Error {
  readonly reasons: string[];

  constructor(message: string, reasons: string[]) {
    super(message);
    this.name = "OpportunityStageTransitionValidationError";
    this.reasons = reasons;
  }
}

const STAGE_KEY_SET = new Set<string>(
  OPPORTUNITY_STAGE_DEFINITIONS.map((definition) => definition.key),
);

const STAGE_TRANSITIONS: Record<OpportunityStageKey, OpportunityStageKey[]> = {
  identified: ["qualified", "no_bid"],
  qualified: ["identified", "pursuit_approved", "no_bid"],
  pursuit_approved: ["qualified", "capture_active", "no_bid"],
  capture_active: ["pursuit_approved", "proposal_in_development", "no_bid"],
  proposal_in_development: ["capture_active", "submitted", "no_bid"],
  submitted: ["proposal_in_development", "awarded", "lost"],
  awarded: [],
  lost: [],
  no_bid: [],
};

const STAGE_REQUIREMENTS: Record<
  OpportunityStageKey,
  OpportunityStageRequirementKey[]
> = {
  identified: [],
  qualified: [
    "lead_agency",
    "response_deadline",
    "solicitation_number",
    "naics_code",
  ],
  pursuit_approved: [
    "lead_agency",
    "response_deadline",
    "solicitation_number",
    "naics_code",
    "scorecard",
  ],
  capture_active: ["go_decision", "task", "milestone"],
  proposal_in_development: ["go_decision", "task", "milestone", "document"],
  submitted: ["response_deadline", "task", "milestone", "document"],
  awarded: ["document"],
  lost: ["document"],
  no_bid: [],
};

const REQUIREMENT_DEFINITIONS: Record<
  OpportunityStageRequirementKey,
  {
    description: string;
    isSatisfied: (context: OpportunityStageValidationContext) => boolean;
    label: string;
  }
> = {
  lead_agency: {
    label: "Lead agency",
    description: "Assign the opportunity to a lead agency.",
    isSatisfied: (context) => Boolean(context.leadAgencyId),
  },
  response_deadline: {
    label: "Response deadline",
    description: "Capture the external response deadline.",
    isSatisfied: (context) => Boolean(context.responseDeadlineAt),
  },
  solicitation_number: {
    label: "Solicitation number",
    description: "Capture the solicitation or notice number.",
    isSatisfied: (context) => Boolean(context.solicitationNumber),
  },
  naics_code: {
    label: "NAICS code",
    description: "Capture the primary NAICS code.",
    isSatisfied: (context) => Boolean(context.naicsCode),
  },
  scorecard: {
    label: "Current scorecard",
    description: "Keep one current scorecard on the workspace before approval.",
    isSatisfied: (context) => context.scorecardCount > 0,
  },
  go_decision: {
    label: "Current GO decision",
    description: "Record a current GO decision before deeper execution stages.",
    isSatisfied: (context) =>
      context.bidDecisionCount > 0 &&
      context.currentBidDecisionFinalOutcome === "GO",
  },
  task: {
    label: "At least one task",
    description: "Add an execution task to the workspace.",
    isSatisfied: (context) => context.taskCount > 0,
  },
  milestone: {
    label: "At least one milestone",
    description: "Add a milestone that tracks the next capture checkpoint.",
    isSatisfied: (context) => context.milestoneCount > 0,
  },
  document: {
    label: "At least one document",
    description: "Attach at least one document or source artifact.",
    isSatisfied: (context) => context.documentCount > 0,
  },
};

export function buildOpportunityStageControlSnapshot({
  context,
}: {
  context: OpportunityStageValidationContext;
}): OpportunityStageControlSnapshot {
  const currentStageKey = normalizeStageKey(context.currentStageKey) ?? "identified";
  const currentStageLabel =
    context.currentStageLabel ?? getStageDefinition(currentStageKey).label;
  const options = STAGE_TRANSITIONS[currentStageKey].map((stageKey) =>
    buildStageTransitionOption({
      context,
      stageKey,
    }),
  );

  return {
    currentStageKey,
    currentStageLabel,
    defaultToStageKey: options.find((option) => option.isAllowed)?.stageKey ?? null,
    options,
    policyVersion: OPPORTUNITY_STAGE_POLICY_VERSION,
    rationaleRequired: true,
  };
}

export function buildOpportunityStageControlSnapshotFromWorkspace(
  snapshot: OpportunityWorkspaceSnapshot,
) {
  return buildOpportunityStageControlSnapshot({
    context: buildOpportunityStageValidationContextFromWorkspace(snapshot),
  });
}

export function buildOpportunityStageValidationContextFromWorkspace(
  snapshot: OpportunityWorkspaceSnapshot,
): OpportunityStageValidationContext {
  return {
    bidDecisionCount: snapshot.bidDecision ? 1 : 0,
    currentBidDecisionFinalOutcome: snapshot.bidDecision?.finalOutcome ?? null,
    currentStageKey: snapshot.opportunity.currentStageKey,
    currentStageLabel: snapshot.opportunity.currentStageLabel,
    documentCount: snapshot.documents.length,
    leadAgencyId: snapshot.opportunity.leadAgency?.id ?? null,
    milestoneCount: snapshot.milestones.length,
    naicsCode: snapshot.opportunity.naicsCode,
    noteCount: snapshot.notes.length,
    responseDeadlineAt: snapshot.opportunity.responseDeadlineAt,
    scorecardCount: snapshot.scorecard ? 1 : 0,
    solicitationNumber: snapshot.opportunity.solicitationNumber,
    taskCount: snapshot.tasks.length,
  };
}

export function validateOpportunityStageTransition({
  context,
  rationale,
  toStageKey,
}: {
  context: OpportunityStageValidationContext;
  rationale: string | null | undefined;
  toStageKey: string;
}) {
  const currentStageKey = normalizeStageKey(context.currentStageKey) ?? "identified";
  const targetStageKey = normalizeStageKey(toStageKey);
  const normalizedRationale = rationale?.trim() ?? "";

  if (!targetStageKey) {
    throw new OpportunityStageTransitionValidationError(
      "The requested stage is not recognized by the current pipeline policy.",
      ["Select a valid destination stage."],
    );
  }

  if (!STAGE_TRANSITIONS[currentStageKey].includes(targetStageKey)) {
    throw new OpportunityStageTransitionValidationError(
      `A ${getStageDefinition(currentStageKey).label} opportunity cannot move directly to ${getStageDefinition(targetStageKey).label}.`,
      ["Select one of the allowed adjacent stage transitions."],
    );
  }

  if (normalizedRationale.length === 0) {
    throw new OpportunityStageTransitionValidationError(
      "A transition rationale is required before changing the opportunity stage.",
      ["Add a short rationale describing why the stage is changing now."],
    );
  }

  const option = buildStageTransitionOption({
    context,
    stageKey: targetStageKey,
  });

  if (!option.isAllowed) {
    throw new OpportunityStageTransitionValidationError(
      `${option.stageLabel} still requires ${option.missingRequirementLabels.join(", ")}.`,
      option.missingRequirementLabels,
    );
  }

  return {
    fromStageKey: currentStageKey,
    fromStageLabel:
      context.currentStageLabel ?? getStageDefinition(currentStageKey).label,
    rationale: normalizedRationale,
    requiredFieldsSnapshot: {
      policyVersion: OPPORTUNITY_STAGE_POLICY_VERSION,
      rationaleRequired: true,
      requirements: option.requirements.map((requirement) => ({
        description: requirement.description,
        key: requirement.key,
        label: requirement.label,
        status: requirement.isSatisfied ? "satisfied" : "missing",
      })),
      toStageKey: option.stageKey,
      toStageLabel: option.stageLabel,
    },
    toStageKey: option.stageKey,
    toStageLabel: option.stageLabel,
  };
}

function buildStageTransitionOption({
  context,
  stageKey,
}: {
  context: OpportunityStageValidationContext;
  stageKey: OpportunityStageKey;
}): OpportunityStageTransitionOption {
  const requirements = STAGE_REQUIREMENTS[stageKey].map((requirementKey) =>
    buildRequirementStatus({
      context,
      requirementKey,
    }),
  );

  return {
    description: getStageDefinition(stageKey).description,
    isAllowed: requirements.every((requirement) => requirement.isSatisfied),
    missingRequirementLabels: requirements
      .filter((requirement) => !requirement.isSatisfied)
      .map((requirement) => requirement.label),
    requirements,
    stageKey,
    stageLabel: getStageDefinition(stageKey).label,
  };
}

function buildRequirementStatus({
  context,
  requirementKey,
}: {
  context: OpportunityStageValidationContext;
  requirementKey: OpportunityStageRequirementKey;
}): OpportunityStageRequirementStatus {
  const definition = REQUIREMENT_DEFINITIONS[requirementKey];

  return {
    description: definition.description,
    isSatisfied: definition.isSatisfied(context),
    key: requirementKey,
    label: definition.label,
  };
}

function getStageDefinition(stageKey: OpportunityStageKey) {
  return (
    OPPORTUNITY_STAGE_DEFINITIONS.find(
      (definition) => definition.key === stageKey,
    ) ?? OPPORTUNITY_STAGE_DEFINITIONS[0]
  );
}

function normalizeStageKey(stageKey: string | null | undefined) {
  if (!stageKey || !STAGE_KEY_SET.has(stageKey)) {
    return null;
  }

  return stageKey as OpportunityStageKey;
}
