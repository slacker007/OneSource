export const OPPORTUNITY_PROPOSAL_STATUSES = [
  "PLANNING",
  "IN_PROGRESS",
  "IN_REVIEW",
  "SUBMITTED",
] as const;

export type OpportunityProposalStatus =
  (typeof OPPORTUNITY_PROPOSAL_STATUSES)[number];

export const OPPORTUNITY_PROPOSAL_STATUS_LABELS: Record<
  OpportunityProposalStatus,
  string
> = {
  PLANNING: "Planning",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  SUBMITTED: "Submitted",
};

export const OPPORTUNITY_PROPOSAL_TRACKING_STAGE_KEYS = [
  "pursuit_approved",
  "capture_active",
  "proposal_in_development",
  "submitted",
  "awarded",
  "lost",
  "no_bid",
] as const;

export const OPPORTUNITY_PROPOSAL_CHECKLIST_ITEMS = [
  {
    key: "requirement_matrix_reviewed",
    label: "Requirement matrix reviewed",
    description:
      "The team has a current compliance matrix tied to the customer requirements.",
  },
  {
    key: "section_owners_assigned",
    label: "Section owners assigned",
    description:
      "Each proposal section has an explicit owner and drafting responsibility.",
  },
  {
    key: "pricing_package_aligned",
    label: "Pricing package aligned",
    description:
      "Pricing assumptions and narrative artifacts are aligned before final review.",
  },
  {
    key: "final_compliance_review_complete",
    label: "Final compliance review complete",
    description:
      "The final package passed the last compliance and submission-readiness check.",
  },
] as const;

export type OpportunityProposalChecklistKey =
  (typeof OPPORTUNITY_PROPOSAL_CHECKLIST_ITEMS)[number]["key"];

export function canTrackProposalForStage(stageKey: string | null) {
  if (!stageKey) {
    return false;
  }

  return OPPORTUNITY_PROPOSAL_TRACKING_STAGE_KEYS.includes(
    stageKey as (typeof OPPORTUNITY_PROPOSAL_TRACKING_STAGE_KEYS)[number],
  );
}

export function getOpportunityProposalStatusLabel(
  status: OpportunityProposalStatus,
) {
  return OPPORTUNITY_PROPOSAL_STATUS_LABELS[status];
}
