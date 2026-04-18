import Link from "next/link";

import { OpportunityBidDecisionManager } from "@/components/opportunities/opportunity-bid-decision-manager";
import { OpportunityCloseoutManager } from "@/components/opportunities/opportunity-closeout-manager";
import { OpportunityDocumentManager } from "@/components/opportunities/opportunity-document-manager";
import { OpportunityMilestoneManager } from "@/components/opportunities/opportunity-milestone-manager";
import { OpportunityNoteManager } from "@/components/opportunities/opportunity-note-manager";
import { OpportunityProposalManager } from "@/components/opportunities/opportunity-proposal-manager";
import { OpportunityStageTransitionPanel } from "@/components/opportunities/opportunity-stage-transition-panel";
import { OpportunityTaskManager } from "@/components/opportunities/opportunity-task-manager";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { KNOWLEDGE_ASSET_TYPE_LABELS } from "@/modules/knowledge/knowledge.types";
import type { OpportunityBidDecisionActionState } from "@/modules/opportunities/opportunity-bid-decision-form.schema";
import type { OpportunityCloseoutActionState } from "@/modules/opportunities/opportunity-closeout-form.schema";
import type { OpportunityDocumentActionState } from "@/modules/opportunities/opportunity-document-form.schema";
import type { OpportunityMilestoneActionState } from "@/modules/opportunities/opportunity-milestone-form.schema";
import type { OpportunityNoteActionState } from "@/modules/opportunities/opportunity-note-form.schema";
import type { OpportunityProposalActionState } from "@/modules/opportunities/opportunity-proposal-form.schema";
import type { OpportunityTaskActionState } from "@/modules/opportunities/opportunity-task-form.schema";
import { canTrackProposalForStage } from "@/modules/opportunities/opportunity-proposal";
import {
  buildOpportunityStageControlSnapshotFromWorkspace,
  type OpportunityStageTransitionActionState,
} from "@/modules/opportunities/opportunity-stage-policy";
import type {
  OpportunityWorkspaceActivity,
  OpportunityWorkspaceBidDecisionHistoryEntry,
  OpportunityWorkspaceDocument,
  OpportunityWorkspaceKnowledgeSuggestion,
  OpportunityWorkspaceMilestone,
  OpportunityWorkspaceNote,
  OpportunityWorkspaceProposal,
  OpportunityWorkspaceSnapshot,
  OpportunityWorkspaceStageTransition,
  OpportunityTaskAssigneeOption,
  OpportunityWorkspaceTask,
} from "@/modules/opportunities/opportunity.types";

type OpportunityWorkspaceProps = {
  snapshot: OpportunityWorkspaceSnapshot | null;
  allowManagePipeline?: boolean;
  recordBidDecisionAction?: (
    state: OpportunityBidDecisionActionState,
    formData: FormData,
  ) => Promise<OpportunityBidDecisionActionState>;
  createMilestoneAction?: (
    state: OpportunityMilestoneActionState,
    formData: FormData,
  ) => Promise<OpportunityMilestoneActionState>;
  recordCloseoutAction?: (
    state: OpportunityCloseoutActionState,
    formData: FormData,
  ) => Promise<OpportunityCloseoutActionState>;
  createDocumentAction?: (
    state: OpportunityDocumentActionState,
    formData: FormData,
  ) => Promise<OpportunityDocumentActionState>;
  createNoteAction?: (
    state: OpportunityNoteActionState,
    formData: FormData,
  ) => Promise<OpportunityNoteActionState>;
  deleteProposalAction?: (
    state: OpportunityProposalActionState,
    formData: FormData,
  ) => Promise<OpportunityProposalActionState>;
  createTaskAction?: (
    state: OpportunityTaskActionState,
    formData: FormData,
  ) => Promise<OpportunityTaskActionState>;
  updateMilestoneAction?: (
    state: OpportunityMilestoneActionState,
    formData: FormData,
  ) => Promise<OpportunityMilestoneActionState>;
  updateTaskAction?: (
    state: OpportunityTaskActionState,
    formData: FormData,
  ) => Promise<OpportunityTaskActionState>;
  deleteMilestoneAction?: (
    state: OpportunityMilestoneActionState,
    formData: FormData,
  ) => Promise<OpportunityMilestoneActionState>;
  saveProposalAction?: (
    state: OpportunityProposalActionState,
    formData: FormData,
  ) => Promise<OpportunityProposalActionState>;
  deleteTaskAction?: (
    state: OpportunityTaskActionState,
    formData: FormData,
  ) => Promise<OpportunityTaskActionState>;
  stageTransitionAction?: (
    state: OpportunityStageTransitionActionState,
    formData: FormData,
  ) => Promise<OpportunityStageTransitionActionState>;
};

export function OpportunityWorkspace({
  snapshot,
  allowManagePipeline = false,
  recordBidDecisionAction,
  recordCloseoutAction,
  createMilestoneAction,
  createDocumentAction,
  createNoteAction,
  deleteProposalAction,
  createTaskAction,
  updateMilestoneAction,
  saveProposalAction,
  updateTaskAction,
  deleteMilestoneAction,
  deleteTaskAction,
  stageTransitionAction,
}: OpportunityWorkspaceProps) {
  if (!snapshot) {
    return (
      <section className="space-y-4">
        <p className="text-muted text-sm tracking-[0.26em] uppercase">
          Opportunities
        </p>
        <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
          Opportunity workspace
        </h1>
        <ErrorState
          message="The requested opportunity workspace could not be loaded for the current organization. Re-seed the local database or confirm the selected record still exists."
          title="Workspace data is unavailable"
        />
      </section>
    );
  }

  const decisionLabel =
    snapshot.bidDecision?.finalOutcome ??
    snapshot.scorecard?.recommendationOutcome ??
    "Pending";
  const stageControlSnapshot = buildOpportunityStageControlSnapshotFromWorkspace(
    snapshot,
  );

  return (
    <section className="space-y-6">
      <header className="border-border bg-surface rounded-[28px] border px-6 py-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Opportunity workspace</Badge>
              <Badge tone="muted">{snapshot.opportunity.currentStageLabel}</Badge>
              <Badge tone="warning">
                {humanizeSourceSystem(snapshot.opportunity.originSourceSystem)}
              </Badge>
              <Badge tone="accent">{decisionLabel}</Badge>
            </div>
            <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
              {snapshot.opportunity.title}
            </h1>
            <p className="text-muted max-w-3xl text-sm leading-7">
              {snapshot.opportunity.description ??
                snapshot.opportunity.sourceSummaryText ??
                "No opportunity summary has been captured yet."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {snapshot.opportunity.uiLink ? (
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white px-5 py-3 text-sm font-medium text-foreground transition hover:bg-[rgba(15,28,31,0.03)]"
                href={snapshot.opportunity.uiLink}
                rel="noreferrer"
                target="_blank"
              >
                Open source notice
              </Link>
            ) : null}

            {allowManagePipeline ? (
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)]"
                href={`/opportunities/${snapshot.opportunity.id}/edit`}
              >
                Edit details
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Lead agency"
            supportingText={
              snapshot.opportunity.leadAgency?.organizationCode ?? "No agency code"
            }
            value={snapshot.opportunity.leadAgency?.name ?? "Unassigned"}
          />
          <SummaryCard
            label="Response deadline"
            supportingText={
              snapshot.opportunity.postedAt
                ? `Posted ${formatDate(snapshot.opportunity.postedAt)}`
                : "Posted date unavailable"
            }
            value={
              snapshot.opportunity.responseDeadlineAt
                ? formatDate(snapshot.opportunity.responseDeadlineAt)
                : "Not set"
            }
          />
          <SummaryCard
            label="Workspace scope"
            supportingText={`Updated ${formatDate(snapshot.opportunity.updatedAt)}`}
            value={snapshot.organization.name}
          />
          <SummaryCard
            label="Score"
            supportingText={
              snapshot.scorecard?.recommendationSummary ??
              snapshot.scorecard?.summary ??
              "No deterministic score has been calculated yet."
            }
            value={
              snapshot.scorecard?.totalScore
                ? `${snapshot.scorecard.totalScore}/100`
                : "Unscored"
            }
          />
        </div>
      </header>

      {allowManagePipeline && stageTransitionAction ? (
        <OpportunityStageTransitionPanel
          action={stageTransitionAction}
          opportunityId={snapshot.opportunity.id}
          snapshot={stageControlSnapshot}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <OverviewSection snapshot={snapshot} />
        <ScoringSection
          allowManagePipeline={allowManagePipeline}
          decisionHistory={snapshot.decisionHistory}
          recordBidDecisionAction={recordBidDecisionAction}
          snapshot={snapshot}
        />
      </div>

      {snapshot.proposal ||
      canTrackProposalForStage(snapshot.opportunity.currentStageKey) ? (
        <ProposalSection
          allowManagePipeline={allowManagePipeline}
          deleteProposalAction={deleteProposalAction}
          documents={snapshot.documents}
          ownerOptions={snapshot.taskAssigneeOptions}
          opportunityId={snapshot.opportunity.id}
          proposal={snapshot.proposal}
          saveProposalAction={saveProposalAction}
          stageKey={snapshot.opportunity.currentStageKey}
          stageLabel={snapshot.opportunity.currentStageLabel}
        />
      ) : null}

      {isClosedOpportunityStage(snapshot.opportunity.currentStageKey) ||
      snapshot.closeout ? (
        <CloseoutSection
          allowManagePipeline={allowManagePipeline}
          recordCloseoutAction={recordCloseoutAction}
          snapshot={snapshot}
        />
      ) : null}

      <KnowledgeSuggestionsSection
        opportunityId={snapshot.opportunity.id}
        suggestions={snapshot.knowledgeSuggestions}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <TasksSection
          allowManagePipeline={allowManagePipeline}
          createMilestoneAction={createMilestoneAction}
          createTaskAction={createTaskAction}
          deleteMilestoneAction={deleteMilestoneAction}
          deleteTaskAction={deleteTaskAction}
          milestones={snapshot.milestones}
          opportunityId={snapshot.opportunity.id}
          taskAssigneeOptions={snapshot.taskAssigneeOptions}
          tasks={snapshot.tasks}
          updateMilestoneAction={updateMilestoneAction}
          updateTaskAction={updateTaskAction}
        />
        <DocumentsSection
          allowManagePipeline={allowManagePipeline}
          createDocumentAction={createDocumentAction}
          documents={snapshot.documents}
          opportunityId={snapshot.opportunity.id}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <NotesSection
          allowManagePipeline={allowManagePipeline}
          createNoteAction={createNoteAction}
          notes={snapshot.notes}
          opportunityId={snapshot.opportunity.id}
        />
        <HistorySection
          activity={snapshot.activity}
          stageTransitions={snapshot.stageTransitions}
        />
      </div>
    </section>
  );
}

function OverviewSection({
  snapshot,
}: {
  snapshot: OpportunityWorkspaceSnapshot;
}) {
  const detailBadges = [
    snapshot.opportunity.solicitationNumber
      ? `Solicitation ${snapshot.opportunity.solicitationNumber}`
      : null,
    snapshot.opportunity.externalNoticeId
      ? `Notice ${snapshot.opportunity.externalNoticeId}`
      : null,
    snapshot.opportunity.naicsCode
      ? `NAICS ${snapshot.opportunity.naicsCode}`
      : null,
    snapshot.opportunity.classificationCode
      ? `PSC ${snapshot.opportunity.classificationCode}`
      : null,
    snapshot.opportunity.setAsideDescription,
  ].filter((value): value is string => Boolean(value));

  return (
    <article className="border-border rounded-[28px] border bg-white p-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-muted text-xs tracking-[0.24em] uppercase">
            Overview
          </p>
          <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Overview
          </h2>
        </div>
        <Badge tone="muted">{snapshot.opportunity.currentStageLabel}</Badge>
      </div>

      <div className="mt-6 space-y-5">
        {detailBadges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {detailBadges.map((badge) => (
              <Badge key={badge} tone="muted">
                {badge}
              </Badge>
            ))}
          </div>
        ) : null}

        <DetailRow
          label="Vehicles"
          value={
            snapshot.opportunity.vehicles.length > 0
              ? snapshot.opportunity.vehicles
                  .map((vehicle) => vehicle.code)
                  .join(", ")
              : "No contract vehicles linked"
          }
        />
        <DetailRow
          label="Competitors"
          value={
            snapshot.opportunity.competitors.length > 0
              ? snapshot.opportunity.competitors
                  .map((competitor) => competitor.name)
                  .join(", ")
              : "No competitor context linked"
          }
        />
        <DetailRow
          label="Office location"
          value={snapshot.opportunity.officeLocation ?? "Not captured"}
        />
        <DetailRow
          label="Place of performance"
          value={snapshot.opportunity.placeOfPerformanceLocation ?? "Not captured"}
        />

        <div className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-[rgba(255,249,239,0.78)] px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-foreground">
              Milestones
            </h3>
            <Badge tone="warning">{snapshot.milestones.length}</Badge>
          </div>
          {snapshot.milestones.length > 0 ? (
            <div className="mt-4 space-y-3">
              {snapshot.milestones.map((milestone) => (
                <MilestoneCard key={milestone.id} milestone={milestone} />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-4 bg-white/80"
              message="Milestones will appear here as capture checkpoints are recorded."
              title="No milestones yet"
            />
          )}
        </div>
      </div>
    </article>
  );
}

function KnowledgeSuggestionsSection({
  opportunityId,
  suggestions,
}: {
  opportunityId: string;
  suggestions: OpportunityWorkspaceKnowledgeSuggestion[];
}) {
  return (
    <article className="border-border rounded-[28px] border bg-white p-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-muted text-xs tracking-[0.24em] uppercase">
            Knowledge suggestions
          </p>
          <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Suggested reusable content
          </h2>
          <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
            Ranked from direct opportunity linkage, lead-agency alignment,
            contract-vehicle coverage, inferred capability fit, and contract-type
            overlap.
          </p>
        </div>

        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-[rgba(15,28,31,0.03)]"
          href={`/knowledge?opportunity=${opportunityId}`}
        >
          Open filtered library
        </Link>
      </div>

      {suggestions.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            message="No reusable assets matched the current opportunity metadata yet. Add agency, vehicle, capability, or contract-type tags in the knowledge library to improve workspace suggestions."
            title="No knowledge suggestions yet"
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {suggestions.map((suggestion) => (
            <article
              key={suggestion.id}
              className="border-border rounded-[24px] border bg-[rgba(248,248,245,0.9)] p-5"
            >
              <div className="flex flex-wrap gap-2">
                <Badge>
                  {KNOWLEDGE_ASSET_TYPE_LABELS[suggestion.assetType]}
                </Badge>
                {suggestion.matchedFacets.agencies.map((agency) => (
                  <Badge key={`${suggestion.id}-${agency}`} tone="accent">
                    {agency}
                  </Badge>
                ))}
                {suggestion.matchedFacets.capabilities.map((capability) => (
                  <Badge key={`${suggestion.id}-${capability}`} tone="warning">
                    {capability}
                  </Badge>
                ))}
                {suggestion.matchedFacets.contractTypes.map((contractType) => (
                  <Badge key={`${suggestion.id}-${contractType}`} tone="muted">
                    {contractType}
                  </Badge>
                ))}
                {suggestion.matchedFacets.vehicles.map((vehicle) => (
                  <Badge key={`${suggestion.id}-${vehicle}`} tone="accent">
                    {vehicle}
                  </Badge>
                ))}
                {suggestion.matchedFacets.freeformTags.map((tag) => (
                  <Badge key={`${suggestion.id}-${tag}`} tone="muted">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-foreground text-lg font-semibold">
                    {suggestion.title}
                  </h3>
                  <Link
                    className="text-sm font-medium text-[rgb(19,78,68)] hover:text-[rgb(16,66,57)]"
                    href={`/knowledge/${suggestion.id}/edit`}
                  >
                    Open asset
                  </Link>
                </div>
                {suggestion.summary ? (
                  <p className="text-muted text-sm leading-6">
                    {suggestion.summary}
                  </p>
                ) : null}
                <p className="text-muted text-sm leading-6">
                  {suggestion.bodyPreview}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-muted text-xs tracking-[0.18em] uppercase">
                    Why suggested
                  </p>
                  <ul className="text-foreground mt-2 space-y-1 text-sm leading-6">
                    {suggestion.matchReasons.map((reason) => (
                      <li key={`${suggestion.id}-${reason}`}>{reason}</li>
                    ))}
                  </ul>
                </div>

                {suggestion.linkedOpportunities.length > 0 ? (
                  <div>
                    <p className="text-muted text-xs tracking-[0.18em] uppercase">
                      Linked pursuits
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {suggestion.linkedOpportunities.map((opportunity) => (
                        <Badge
                          key={`${suggestion.id}-${opportunity.id}`}
                          tone="muted"
                        >
                          {opportunity.title} · {opportunity.currentStageLabel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                <p className="text-muted text-xs">
                  Updated {formatDateTime(suggestion.updatedAt)}
                  {suggestion.updatedByLabel
                    ? ` by ${suggestion.updatedByLabel}`
                    : ""}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </article>
  );
}

function ScoringSection({
  allowManagePipeline,
  decisionHistory,
  recordBidDecisionAction,
  snapshot,
}: {
  allowManagePipeline: boolean;
  decisionHistory: OpportunityWorkspaceBidDecisionHistoryEntry[];
  recordBidDecisionAction?: OpportunityWorkspaceProps["recordBidDecisionAction"];
  snapshot: OpportunityWorkspaceSnapshot;
}) {
  const recommendationSourceLabel = snapshot.scorecard?.scoringModelKey
    ? `rule_engine:${snapshot.scorecard.scoringModelKey}`
    : snapshot.bidDecision?.recommendedByLabel ?? null;

  return (
    <article className="border-border rounded-[28px] border bg-[linear-gradient(135deg,rgba(32,95,85,0.97),rgba(16,58,53,1))] p-6 text-white shadow-[0_22px_60px_rgba(16,58,53,0.28)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.24em] text-white/70 uppercase">
            Scoring
          </p>
          <h2 className="font-heading mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Scoring
          </h2>
        </div>
        <Badge className="border-white/20 bg-white/10 text-white" tone="muted">
          {snapshot.bidDecision?.finalOutcome ??
            snapshot.scorecard?.recommendationOutcome ??
            "Pending"}
        </Badge>
      </div>

      {snapshot.scorecard ? (
        <div className="mt-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <WorkspaceMetric
              label="Current score"
              value={`${snapshot.scorecard.totalScore ?? "0"}/${snapshot.scorecard.maximumScore ?? "100"}`}
            />
            <WorkspaceMetric
              label="Calculated"
              value={formatDate(snapshot.scorecard.calculatedAt)}
            />
            <WorkspaceMetric
              label="Recommendation"
              value={humanizeDecisionOutcome(
                snapshot.scorecard.recommendationOutcome ?? "DEFER",
              )}
            />
          </div>

          <p className="text-sm leading-7 text-white/80">
            {snapshot.scorecard.summary ??
              snapshot.scorecard.recommendationSummary ??
              "No score summary is available yet."}
          </p>

          <div className="space-y-3">
            {snapshot.scorecard.factors.map((factor) => (
              <div
                className="rounded-[22px] border border-white/12 bg-white/7 px-4 py-4"
                key={factor.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold">{factor.factorLabel}</h3>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Badge
                      className="border-white/15 bg-white/10 text-white"
                      tone="muted"
                    >
                      Weight {factor.weight ?? "0"}
                    </Badge>
                    <Badge
                      className="border-white/15 bg-white/10 text-white"
                      tone="muted"
                    >
                      {factor.score ?? "0"}/{factor.maximumScore ?? "0"}
                    </Badge>
                  </div>
                </div>
                {factor.explanation ? (
                  <p className="mt-2 text-sm leading-6 text-white/78">
                    {factor.explanation}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          {snapshot.bidDecision ? (
            <div className="rounded-[22px] border border-white/12 bg-white/7 px-5 py-4">
              <h3 className="text-base font-semibold">Current decision</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="border-white/15 bg-white/10 text-white" tone="muted">
                  {snapshot.bidDecision.decisionTypeKey
                    ? humanizeEnum(snapshot.bidDecision.decisionTypeKey)
                    : "Decision record"}
                </Badge>
                <Badge className="border-white/15 bg-white/10 text-white" tone="muted">
                  Final {humanizeDecisionOutcome(snapshot.bidDecision.finalOutcome ?? "DEFER")}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-white/80">
                Recommendation:{" "}
                {snapshot.bidDecision.recommendationOutcome
                  ? humanizeDecisionOutcome(snapshot.bidDecision.recommendationOutcome)
                  : "Pending"}
                {snapshot.bidDecision.decidedByName
                  ? ` · Finalized by ${snapshot.bidDecision.decidedByName}`
                  : ""}
                {snapshot.bidDecision.decidedAt
                  ? ` · ${formatDate(snapshot.bidDecision.decidedAt)}`
                  : ""}
              </p>
              {snapshot.bidDecision.recommendationSummary ? (
                <p className="mt-2 text-sm leading-6 text-white/80">
                  {snapshot.bidDecision.recommendationSummary}
                </p>
              ) : null}
              {snapshot.bidDecision.finalRationale ? (
                <p className="mt-2 text-sm leading-6 text-white/80">
                  {snapshot.bidDecision.finalRationale}
                </p>
              ) : null}
            </div>
          ) : null}

          {allowManagePipeline && recordBidDecisionAction ? (
            <OpportunityBidDecisionManager
              action={recordBidDecisionAction}
              currentDecisionTypeKey={snapshot.bidDecision?.decisionTypeKey}
              opportunityId={snapshot.opportunity.id}
              recommendationSourceLabel={recommendationSourceLabel}
              scorecard={snapshot.scorecard}
            />
          ) : null}

          <div className="rounded-[22px] border border-white/12 bg-white/7 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">Decision history</h3>
              <Badge className="border-white/15 bg-white/10 text-white" tone="muted">
                {decisionHistory.length} recorded
              </Badge>
            </div>
            {decisionHistory.length > 0 ? (
              <div className="mt-4 space-y-3">
                {decisionHistory.map((decision) => (
                  <DecisionHistoryCard decision={decision} key={decision.id} />
                ))}
              </div>
            ) : (
              <EmptyState
                className="mt-4 border-white/15 bg-white/5 text-white"
                message="Record the first final decision to preserve the human rationale alongside the deterministic recommendation."
                title="No decision history yet"
              />
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          className="mt-6 border-white/15 bg-white/5 text-white"
          message="A current scorecard is not available for this opportunity yet."
          title="No scoring context yet"
        />
      )}
    </article>
  );
}

function ProposalSection({
  allowManagePipeline,
  deleteProposalAction,
  documents,
  opportunityId,
  ownerOptions,
  proposal,
  saveProposalAction,
  stageKey,
  stageLabel,
}: {
  allowManagePipeline: boolean;
  deleteProposalAction?: (
    state: OpportunityProposalActionState,
    formData: FormData,
  ) => Promise<OpportunityProposalActionState>;
  documents: OpportunityWorkspaceDocument[];
  opportunityId: string;
  ownerOptions: OpportunityTaskAssigneeOption[];
  proposal: OpportunityWorkspaceProposal | null;
  saveProposalAction?: (
    state: OpportunityProposalActionState,
    formData: FormData,
  ) => Promise<OpportunityProposalActionState>;
  stageKey: string | null;
  stageLabel: string;
}) {
  return (
    <article className="border-border rounded-[28px] border bg-white p-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted text-xs tracking-[0.24em] uppercase">
            Proposal
          </p>
          <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Proposal tracking
          </h2>
          <p className="text-muted mt-2 max-w-3xl text-sm leading-6">
            Keep proposal ownership, readiness, and linked artifacts visible in
            the pursuit workspace without introducing a separate authoring tool.
          </p>
        </div>

        {proposal ? (
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">{proposal.statusLabel}</Badge>
            <Badge tone="muted">
              {proposal.completedChecklistCount}/{proposal.totalChecklistCount} checklist
            </Badge>
            {proposal.ownerName ? <Badge>{proposal.ownerName}</Badge> : null}
          </div>
        ) : (
          <Badge tone="warning">Proposal record not started</Badge>
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Proposal status"
          supportingText="Workspace-level response posture."
          value={proposal?.statusLabel ?? "Not started"}
        />
        <SummaryCard
          label="Owner"
          supportingText="Current proposal lead."
          value={proposal?.ownerName ?? "Unassigned"}
        />
        <SummaryCard
          label="Checklist"
          supportingText="Compliance checkpoints complete."
          value={
            proposal
              ? `${proposal.completedChecklistCount}/${proposal.totalChecklistCount}`
              : "0/4"
          }
        />
        <SummaryCard
          label="Linked docs"
          supportingText="Artifacts tied to the active response."
          value={String(proposal?.linkedDocuments.length ?? 0)}
        />
      </div>

      {proposal ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Current checklist
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted">
                Completed checkpoints retain timestamps so the workspace shows
                when the team considered the response package ready.
              </p>
            </div>
            <div className="space-y-3">
              {proposal.checklistItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-[rgba(15,28,31,0.08)] bg-[rgba(244,248,246,0.72)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {item.checklistLabel}
                    </p>
                    <Badge tone={item.isComplete ? "accent" : "warning"}>
                      {item.isComplete ? "Complete" : "Open"}
                    </Badge>
                  </div>
                  <p className="text-muted mt-2 text-xs">
                    {item.completedAt
                      ? `Completed ${formatDate(item.completedAt)}`
                      : "Not completed yet"}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Linked proposal artifacts
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted">
                Documents linked here define the working response package and
                final submission set.
              </p>
            </div>
            {proposal.linkedDocuments.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {proposal.linkedDocuments.map((document) => (
                  <article
                    key={document.id}
                    className="rounded-[22px] border border-[rgba(15,28,31,0.08)] bg-[rgba(244,248,246,0.72)] px-4 py-4"
                  >
                    <h4 className="text-sm font-semibold text-foreground">
                      {document.title}
                    </h4>
                    <p className="text-muted mt-2 text-xs">
                      {document.documentType
                        ? humanizeEnum(document.documentType)
                        : "General workspace artifact"}
                    </p>
                    {document.downloadUrl ? (
                      <Link
                        className="mt-3 inline-flex text-sm font-medium text-[rgb(19,78,68)] hover:text-[rgb(16,66,57)]"
                        href={document.downloadUrl}
                      >
                        Download linked artifact
                      </Link>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                message="No workspace documents are linked to this proposal record yet."
                title="No linked proposal artifacts"
              />
            )}
          </section>
        </div>
      ) : null}

      {allowManagePipeline && saveProposalAction ? (
        <div className="mt-6">
          <OpportunityProposalManager
            currentProposal={proposal}
            currentStageKey={stageKey}
            currentStageLabel={stageLabel}
            deleteAction={deleteProposalAction}
            documents={documents}
            opportunityId={opportunityId}
            ownerOptions={ownerOptions}
            saveAction={saveProposalAction}
          />
        </div>
      ) : null}
    </article>
  );
}

function CloseoutSection({
  allowManagePipeline,
  recordCloseoutAction,
  snapshot,
}: {
  allowManagePipeline: boolean;
  recordCloseoutAction?: OpportunityWorkspaceProps["recordCloseoutAction"];
  snapshot: OpportunityWorkspaceSnapshot;
}) {
  return (
    <article className="border-border rounded-[28px] border bg-[linear-gradient(135deg,rgba(250,246,238,0.98),rgba(244,235,220,0.96))] p-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-muted text-xs tracking-[0.24em] uppercase">
            Closeout
          </p>
          <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
            Closeout
          </h2>
          <p className="text-muted max-w-3xl text-sm leading-6">
            Preserve the final outcome reason, competitor context, and lessons
            learned so postmortem reviews do not depend on memory.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="warning">{snapshot.opportunity.currentStageLabel}</Badge>
          <Badge tone="muted">
            {snapshot.closeout ? "Recorded" : "Awaiting postmortem"}
          </Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            Current closeout
          </h3>
          {snapshot.closeout ? (
            <div className="space-y-4 rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-white px-5 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="accent">{snapshot.closeout.outcomeStageLabel}</Badge>
                  <Badge tone="muted">
                    {snapshot.closeout.competitorName ?? "No competitor recorded"}
                  </Badge>
                </div>
                <p className="text-sm text-muted">
                  {formatDate(snapshot.closeout.recordedAt)}
                  {snapshot.closeout.recordedByName
                    ? ` · ${snapshot.closeout.recordedByName}`
                    : ""}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Outcome reason
                </h4>
                <p className="text-sm leading-6 text-muted">
                  {snapshot.closeout.outcomeReason}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Lessons learned
                </h4>
                <p className="text-sm leading-6 text-muted">
                  {snapshot.closeout.lessonsLearned}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              message="Once the opportunity is closed, record the reason and postmortem here so outcome analysis stays durable."
              title="No closeout notes recorded"
            />
          )}
        </div>

        {allowManagePipeline && recordCloseoutAction ? (
          <OpportunityCloseoutManager
            action={recordCloseoutAction}
            competitorOptions={snapshot.competitorOptions}
            currentCloseout={snapshot.closeout}
            currentStageKey={snapshot.opportunity.currentStageKey}
            currentStageLabel={snapshot.opportunity.currentStageLabel}
            opportunityId={snapshot.opportunity.id}
          />
        ) : null}
      </div>
    </article>
  );
}

function TasksSection({
  allowManagePipeline,
  createMilestoneAction,
  createTaskAction,
  deleteMilestoneAction,
  deleteTaskAction,
  milestones,
  opportunityId,
  taskAssigneeOptions,
  tasks,
  updateMilestoneAction,
  updateTaskAction,
}: {
  allowManagePipeline: boolean;
  createMilestoneAction?: OpportunityWorkspaceProps["createMilestoneAction"];
  createTaskAction?: OpportunityWorkspaceProps["createTaskAction"];
  deleteMilestoneAction?: OpportunityWorkspaceProps["deleteMilestoneAction"];
  deleteTaskAction?: OpportunityWorkspaceProps["deleteTaskAction"];
  milestones: OpportunityWorkspaceMilestone[];
  opportunityId: string;
  taskAssigneeOptions: OpportunityWorkspaceSnapshot["taskAssigneeOptions"];
  tasks: OpportunityWorkspaceTask[];
  updateMilestoneAction?: OpportunityWorkspaceProps["updateMilestoneAction"];
  updateTaskAction?: OpportunityWorkspaceProps["updateTaskAction"];
}) {
  return (
    <article className="border-border rounded-[28px] border bg-white p-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-muted text-xs tracking-[0.24em] uppercase">
            Execution
          </p>
          <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Tasks
          </h2>
        </div>
        <Badge tone="warning">{tasks.length} open records</Badge>
      </div>

      <div className="mt-6">
        {allowManagePipeline &&
        createTaskAction &&
        updateTaskAction &&
        deleteTaskAction ? (
          <OpportunityTaskManager
            assigneeOptions={taskAssigneeOptions}
            createAction={createTaskAction}
            deleteAction={deleteTaskAction}
            opportunityId={opportunityId}
            tasks={tasks}
            updateAction={updateTaskAction}
          />
        ) : tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-[rgba(246,239,228,0.55)] px-5 py-5"
                key={task.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">
                      {task.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={priorityTone(task.priority)}>
                        {humanizeEnum(task.priority)}
                      </Badge>
                      <Badge tone="muted">{humanizeEnum(task.status)}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted">
                    {task.dueAt ? `Due ${formatDate(task.dueAt)}` : "No due date"}
                  </p>
                </div>

                {task.description ? (
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {task.description}
                  </p>
                ) : null}

                <p className="mt-3 text-sm text-muted">
                  Owner: {task.assigneeName ?? "Unassigned"}
                  {task.createdByName ? ` · Created by ${task.createdByName}` : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-6"
            message="Execution tasks will appear here once pipeline work starts."
            title="No tasks yet"
          />
        )}
      </div>

      <div className="mt-6 rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-[rgba(255,255,255,0.9)] px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">Milestones</h3>
          <Badge tone="muted">{milestones.length}</Badge>
        </div>

        <div className="mt-4">
          {allowManagePipeline &&
          createMilestoneAction &&
          updateMilestoneAction &&
          deleteMilestoneAction ? (
            <OpportunityMilestoneManager
              createAction={createMilestoneAction}
              deleteAction={deleteMilestoneAction}
              milestones={milestones}
              opportunityId={opportunityId}
              updateAction={updateMilestoneAction}
            />
          ) : milestones.length > 0 ? (
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <MilestoneCard key={milestone.id} milestone={milestone} compact />
              ))}
            </div>
          ) : (
            <EmptyState
              className="bg-white"
              message="Milestones will appear here as capture checkpoints are recorded."
              title="No milestones yet"
            />
          )}
        </div>
      </div>
    </article>
  );
}

function DocumentsSection({
  allowManagePipeline,
  createDocumentAction,
  documents,
  opportunityId,
}: {
  allowManagePipeline: boolean;
  createDocumentAction?: (
    state: OpportunityDocumentActionState,
    formData: FormData,
  ) => Promise<OpportunityDocumentActionState>;
  documents: OpportunityWorkspaceDocument[];
  opportunityId: string;
}) {
  return (
    <article className="border-border rounded-[28px] border bg-white p-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-muted text-xs tracking-[0.24em] uppercase">
            Artifacts
          </p>
          <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Documents
          </h2>
        </div>
        <Badge tone="muted">{documents.length}</Badge>
      </div>

      {allowManagePipeline && createDocumentAction ? (
        <OpportunityDocumentManager
          createAction={createDocumentAction}
          opportunityId={opportunityId}
        />
      ) : null}

      {documents.length > 0 ? (
        <div className="mt-6 space-y-4">
          {documents.map((document) => (
            <div
              className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-[rgba(255,249,239,0.7)] px-5 py-5"
              key={document.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {document.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="muted">
                      {document.documentType
                        ? humanizeEnum(document.documentType)
                        : "General"}
                    </Badge>
                    <Badge tone="warning">
                      {humanizeEnum(document.sourceType)}
                    </Badge>
                    <Badge tone="accent">
                      {humanizeEnum(document.extractionStatus)}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted">
                  Added {formatDate(document.createdAt)}
                </p>
              </div>

              <p className="mt-3 text-sm text-muted">
                {document.originalFileName ?? "No local file name"}
                {document.mimeType ? ` · ${document.mimeType}` : ""}
                {document.fileSizeBytes
                  ? ` · ${formatFileSize(document.fileSizeBytes)}`
                  : ""}
                {document.uploadedByName
                  ? ` · Uploaded by ${document.uploadedByName}`
                  : ""}
              </p>

              {document.extractedText ? (
                <p className="mt-3 text-sm leading-6 text-muted">
                  {truncateText(document.extractedText, 220)}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-4">
                {document.downloadUrl ? (
                  <Link
                    className="inline-flex text-sm font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
                    href={document.downloadUrl}
                  >
                    Download stored file
                  </Link>
                ) : null}
                {document.sourceUrl ? (
                  <Link
                    className="inline-flex text-sm font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
                    href={document.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open document source
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-6"
          message="Source attachments and uploaded files will appear here."
          title="No documents yet"
        />
      )}
    </article>
  );
}

function NotesSection({
  allowManagePipeline,
  createNoteAction,
  notes,
  opportunityId,
}: {
  allowManagePipeline: boolean;
  createNoteAction?: (
    state: OpportunityNoteActionState,
    formData: FormData,
  ) => Promise<OpportunityNoteActionState>;
  notes: OpportunityWorkspaceNote[];
  opportunityId: string;
}) {
  return (
    <article className="border-border rounded-[28px] border bg-white p-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-muted text-xs tracking-[0.24em] uppercase">Notes</p>
          <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Notes
          </h2>
        </div>
        <Badge tone="muted">{notes.length}</Badge>
      </div>

      {allowManagePipeline && createNoteAction ? (
        <OpportunityNoteManager
          createAction={createNoteAction}
          opportunityId={opportunityId}
        />
      ) : null}

      {notes.length > 0 ? (
        <div className="mt-6 space-y-4">
          {notes.map((note) => (
            <div
              className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-[rgba(255,255,255,0.9)] px-5 py-5"
              key={note.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {note.isPinned ? <Badge>Pinned</Badge> : null}
                    <Badge tone="muted">{note.contentFormat}</Badge>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {note.title ?? "Untitled note"}
                  </h3>
                </div>
                <div className="space-y-1 text-right text-sm text-muted">
                  <p>{note.authorName ?? "Unknown author"}</p>
                  <p>Created {formatDate(note.createdAt)}</p>
                  {note.updatedAt !== note.createdAt ? (
                    <p>Updated {formatDate(note.updatedAt)}</p>
                  ) : null}
                </div>
              </div>

              <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-6 text-muted">
                {note.body}
              </pre>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-6"
          message="Pursuit notes and working assumptions will appear here."
          title="No notes yet"
        />
      )}
    </article>
  );
}

function HistorySection({
  activity,
  stageTransitions,
}: {
  activity: OpportunityWorkspaceActivity[];
  stageTransitions: OpportunityWorkspaceStageTransition[];
}) {
  return (
    <article className="border-border rounded-[28px] border bg-white p-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-muted text-xs tracking-[0.24em] uppercase">
            Timeline
          </p>
          <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
            History
          </h2>
        </div>
        <Badge tone="warning">{activity.length + stageTransitions.length} events</Badge>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            Activity feed
          </h3>
          {activity.length > 0 ? (
            activity.map((event) => (
              <TimelineCard
                detail={event.description}
                key={event.id}
                metadata={[
                  event.actorLabel ?? "Unknown actor",
                  event.relatedEntityType
                    ? humanizeEnum(event.relatedEntityType)
                    : null,
                  formatDate(event.occurredAt),
                ]}
                title={event.title}
              />
            ))
          ) : (
            <EmptyState
              message="User and system activity will appear here once recorded."
              title="No activity yet"
            />
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            Stage transitions
          </h3>
          {stageTransitions.length > 0 ? (
            stageTransitions.map((transition) => (
              <TimelineCard
                detail={transition.rationale}
                key={transition.id}
                metadata={[
                  transition.fromStageLabel
                    ? `${transition.fromStageLabel} -> ${transition.toStageLabel}`
                    : transition.toStageLabel,
                  humanizeEnum(transition.triggerType),
                  transition.actorName,
                  formatDate(transition.transitionedAt),
                ]}
                title={`Moved to ${transition.toStageLabel}`}
              />
            ))
          ) : (
            <EmptyState
              message="Stage transitions will appear once the opportunity moves through the pipeline."
              title="No transition history yet"
            />
          )}
        </div>
      </div>
    </article>
  );
}

function MilestoneCard({
  milestone,
  compact = false,
}: {
  milestone: OpportunityWorkspaceMilestone;
  compact?: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-[rgba(15,28,31,0.08)] bg-white/75 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h4 className={`${compact ? "text-sm" : "text-base"} font-semibold text-foreground`}>
            {milestone.title}
          </h4>
          <p className="text-sm text-muted">
            {formatDate(milestone.targetDate)}
            {milestone.milestoneTypeKey
              ? ` · ${humanizeEnum(milestone.milestoneTypeKey)}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={milestoneTone(milestone.status)}>
            {humanizeEnum(milestone.status)}
          </Badge>
          {milestone.deadlineReminderState !== "NONE" ? (
            <Badge
              tone={
                milestone.deadlineReminderState === "OVERDUE" ? "warning" : "accent"
              }
            >
              {milestone.deadlineReminderState === "OVERDUE"
                ? "Overdue"
                : "Upcoming deadline"}
            </Badge>
          ) : null}
        </div>
      </div>
      {milestone.description ? (
        <p className="mt-2 text-sm leading-6 text-muted">{milestone.description}</p>
      ) : null}
    </div>
  );
}

function TimelineCard({
  detail,
  metadata,
  title,
}: {
  detail: string | null;
  metadata: Array<string | null>;
  title: string;
}) {
  return (
    <div className="rounded-[22px] border border-[rgba(15,28,31,0.08)] bg-[rgba(246,239,228,0.45)] px-4 py-4">
      <h4 className="text-base font-semibold text-foreground">{title}</h4>
      <p className="mt-2 text-sm text-muted">{metadata.filter(Boolean).join(" · ")}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-muted">{detail}</p> : null}
    </div>
  );
}

function DecisionHistoryCard({
  decision,
}: {
  decision: OpportunityWorkspaceBidDecisionHistoryEntry;
}) {
  const metadata = [
    decision.decisionTypeKey ? humanizeEnum(decision.decisionTypeKey) : null,
    decision.finalOutcome
      ? `Final ${humanizeDecisionOutcome(decision.finalOutcome)}`
      : null,
    decision.recommendationOutcome
      ? `Recommended ${humanizeDecisionOutcome(decision.recommendationOutcome)}`
      : null,
    decision.decidedByName ? `By ${decision.decidedByName}` : null,
    decision.decidedAt ? formatDate(decision.decidedAt) : null,
  ].filter(Boolean);

  return (
    <div className="rounded-[22px] border border-white/12 bg-white/6 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-white">
            {decision.decisionTypeKey
              ? humanizeEnum(decision.decisionTypeKey)
              : "Decision record"}
          </h4>
          <p className="mt-2 text-sm text-white/75">{metadata.join(" · ")}</p>
        </div>
        {decision.isCurrent ? (
          <Badge className="border-white/20 bg-white/10 text-white" tone="muted">
            Current
          </Badge>
        ) : null}
      </div>

      {decision.recommendationSummary ? (
        <p className="mt-3 text-sm leading-6 text-white/78">
          {decision.recommendationSummary}
        </p>
      ) : null}

      {decision.finalRationale ? (
        <p className="mt-2 text-sm leading-6 text-white/85">
          {decision.finalRationale}
        </p>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  supportingText,
  value,
}: {
  label: string;
  supportingText: string;
  value: string;
}) {
  return (
    <article className="border-border rounded-[24px] border bg-white px-4 py-4 text-sm shadow-[0_12px_30px_rgba(20,37,34,0.06)]">
      <p className="text-muted text-xs tracking-[0.2em] uppercase">{label}</p>
      <p className="mt-2 font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-muted">{supportingText}</p>
    </article>
  );
}

function WorkspaceMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/12 bg-white/7 px-4 py-4">
      <p className="text-xs tracking-[0.2em] text-white/65 uppercase">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-[rgba(15,28,31,0.06)] pb-4 last:border-b-0 last:pb-0">
      <p className="text-muted text-xs tracking-[0.2em] uppercase">{label}</p>
      <p className="text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function humanizeSourceSystem(sourceSystem: string | null) {
  if (!sourceSystem) {
    return "Manual entry";
  }

  return sourceSystem
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function humanizeEnum(value: string) {
  return value
    .split(/[_-]/g)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function humanizeDecisionOutcome(value: string) {
  return value === "NO_GO" ? "No Go" : humanizeEnum(value);
}

function isClosedOpportunityStage(stageKey: string | null) {
  return stageKey === "awarded" || stageKey === "lost" || stageKey === "no_bid";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatFileSize(fileSizeBytes: number) {
  if (fileSizeBytes < 1024) {
    return `${fileSizeBytes} B`;
  }

  if (fileSizeBytes < 1024 * 1024) {
    return `${Math.round(fileSizeBytes / 1024)} KB`;
  }

  return `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateText(value: string, length: number) {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length - 3).trimEnd()}...`;
}

function priorityTone(priority: string) {
  if (priority === "CRITICAL") {
    return "danger" as const;
  }

  if (priority === "HIGH") {
    return "warning" as const;
  }

  if (priority === "LOW") {
    return "muted" as const;
  }

  return "accent" as const;
}

function milestoneTone(status: string) {
  if (status === "MISSED") {
    return "danger" as const;
  }

  if (status === "AT_RISK") {
    return "warning" as const;
  }

  if (status === "COMPLETED") {
    return "accent" as const;
  }

  return "muted" as const;
}
