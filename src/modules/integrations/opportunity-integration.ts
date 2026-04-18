import type {
  OpportunityWorkspaceProposalChecklistItem,
  OpportunityWorkspaceSnapshot,
} from "@/modules/opportunities/opportunity.types";

import type {
  IntegrationAdapterDescriptor,
  IntegrationDispatchResult,
} from "./integration.types";

export type OpportunityIntegrationCounts = {
  documentCount: number;
  openTaskCount: number;
  overdueTaskCount: number;
  upcomingMilestoneCount: number;
};

export type CrmOpportunitySyncPayload = {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  opportunity: {
    id: string;
    title: string;
    currentStageKey: string | null;
    currentStageLabel: string;
    solicitationNumber: string | null;
    externalNoticeId: string | null;
    leadAgencyName: string | null;
    responseDeadlineAt: string | null;
    originSourceSystem: string | null;
    sourceSummaryText: string | null;
    updatedAt: string;
  };
  scorecard: {
    totalScore: string | null;
    maximumScore: string | null;
    scorePercent: string | null;
    recommendationOutcome: string | null;
    recommendationSummary: string | null;
    scoringModelVersion: string | null;
  } | null;
  decision: {
    finalOutcome: string | null;
    recommendationOutcome: string | null;
    decidedAt: string | null;
    finalRationale: string | null;
  } | null;
  proposal: {
    status: string;
    statusLabel: string;
    ownerName: string | null;
    submittedAt: string | null;
    completedChecklistCount: number;
    totalChecklistCount: number;
  } | null;
  counts: OpportunityIntegrationCounts;
};

export type DocumentRepositorySyncPayload = {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  opportunity: {
    id: string;
    title: string;
    currentStageLabel: string;
    solicitationNumber: string | null;
  };
  proposal: {
    status: string;
    statusLabel: string;
    linkedChecklistItems: Array<{
      key: string;
      label: string;
      isComplete: boolean;
      completedAt: string | null;
    }>;
  } | null;
  documents: Array<{
    id: string;
    title: string;
    documentType: string | null;
    originalFileName: string | null;
    mimeType: string | null;
    fileSizeBytes: number | null;
    extractionStatus: string;
    downloadUrl: string | null;
    sourceUrl: string | null;
    createdAt: string;
  }>;
};

type DocumentRepositoryChecklistItem =
  NonNullable<DocumentRepositorySyncPayload["proposal"]>["linkedChecklistItems"][number];

export type CommunicationDigestPayload = {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  opportunity: {
    id: string;
    title: string;
    currentStageLabel: string;
    leadAgencyName: string | null;
    responseDeadlineAt: string | null;
  };
  digest: {
    headline: string;
    scoreSummary: string;
    proposalSummary: string;
    overdueTasks: string[];
    upcomingMilestones: string[];
  };
};

export type OpportunityIntegrationPayloadSet = {
  communication: CommunicationDigestPayload;
  crm: CrmOpportunitySyncPayload;
  documentRepository: DocumentRepositorySyncPayload;
};

export interface CrmIntegrationAdapter {
  descriptor: IntegrationAdapterDescriptor<"crm">;
  describeCapabilities(): IntegrationAdapterDescriptor<"crm">["operations"];
  upsertOpportunity(
    payload: CrmOpportunitySyncPayload,
  ): Promise<IntegrationDispatchResult<"crm">>;
}

export interface DocumentRepositoryIntegrationAdapter {
  descriptor: IntegrationAdapterDescriptor<"document_repository">;
  describeCapabilities(): IntegrationAdapterDescriptor<"document_repository">["operations"];
  syncOpportunityDocuments(
    payload: DocumentRepositorySyncPayload,
  ): Promise<IntegrationDispatchResult<"document_repository">>;
}

export interface CommunicationIntegrationAdapter {
  descriptor: IntegrationAdapterDescriptor<"communication">;
  describeCapabilities(): IntegrationAdapterDescriptor<"communication">["operations"];
  publishOpportunityDigest(
    payload: CommunicationDigestPayload,
  ): Promise<IntegrationDispatchResult<"communication">>;
}

export type OpportunityIntegrationAdapters = {
  communication: CommunicationIntegrationAdapter[];
  crm: CrmIntegrationAdapter[];
  documentRepository: DocumentRepositoryIntegrationAdapter[];
};

export const DEFAULT_OPPORTUNITY_INTEGRATION_ADAPTERS: OpportunityIntegrationAdapters =
  {
    crm: [createPipelineCrmDryRunAdapter()],
    documentRepository: [createWorkspaceDocumentRepositoryDryRunAdapter()],
    communication: [createCaptureDigestDryRunAdapter()],
  };

export function prepareOpportunityIntegrationPayloads(
  snapshot: OpportunityWorkspaceSnapshot,
  options?: {
    now?: Date;
  },
): OpportunityIntegrationPayloadSet {
  const now = options?.now ?? new Date();
  const counts = summarizeOpportunityCounts(snapshot, now);

  return {
    crm: {
      organization: snapshot.organization,
      opportunity: {
        id: snapshot.opportunity.id,
        title: snapshot.opportunity.title,
        currentStageKey: snapshot.opportunity.currentStageKey,
        currentStageLabel: snapshot.opportunity.currentStageLabel,
        solicitationNumber: snapshot.opportunity.solicitationNumber,
        externalNoticeId: snapshot.opportunity.externalNoticeId,
        leadAgencyName: snapshot.opportunity.leadAgency?.name ?? null,
        responseDeadlineAt: snapshot.opportunity.responseDeadlineAt,
        originSourceSystem: snapshot.opportunity.originSourceSystem,
        sourceSummaryText: snapshot.opportunity.sourceSummaryText,
        updatedAt: snapshot.opportunity.updatedAt,
      },
      scorecard: snapshot.scorecard
        ? {
            totalScore: snapshot.scorecard.totalScore,
            maximumScore: snapshot.scorecard.maximumScore,
            scorePercent: snapshot.scorecard.scorePercent,
            recommendationOutcome: snapshot.scorecard.recommendationOutcome,
            recommendationSummary: snapshot.scorecard.recommendationSummary,
            scoringModelVersion: snapshot.scorecard.scoringModelVersion,
          }
        : null,
      decision: snapshot.bidDecision
        ? {
            finalOutcome: snapshot.bidDecision.finalOutcome,
            recommendationOutcome: snapshot.bidDecision.recommendationOutcome,
            decidedAt: snapshot.bidDecision.decidedAt,
            finalRationale: snapshot.bidDecision.finalRationale,
          }
        : null,
      proposal: snapshot.proposal
        ? {
            status: snapshot.proposal.status,
            statusLabel: snapshot.proposal.statusLabel,
            ownerName: snapshot.proposal.ownerName,
            submittedAt: snapshot.proposal.submittedAt,
            completedChecklistCount: snapshot.proposal.completedChecklistCount,
            totalChecklistCount: snapshot.proposal.totalChecklistCount,
          }
        : null,
      counts,
    },
    documentRepository: {
      organization: snapshot.organization,
      opportunity: {
        id: snapshot.opportunity.id,
        title: snapshot.opportunity.title,
        currentStageLabel: snapshot.opportunity.currentStageLabel,
        solicitationNumber: snapshot.opportunity.solicitationNumber,
      },
      proposal: snapshot.proposal
        ? {
            status: snapshot.proposal.status,
            statusLabel: snapshot.proposal.statusLabel,
            linkedChecklistItems: snapshot.proposal.checklistItems.map(
              mapChecklistItem,
            ),
          }
        : null,
      documents: snapshot.documents.map((document) => ({
        id: document.id,
        title: document.title,
        documentType: document.documentType,
        originalFileName: document.originalFileName,
        mimeType: document.mimeType,
        fileSizeBytes: document.fileSizeBytes,
        extractionStatus: document.extractionStatus,
        downloadUrl: document.downloadUrl,
        sourceUrl: document.sourceUrl,
        createdAt: document.createdAt,
      })),
    },
    communication: {
      organization: snapshot.organization,
      opportunity: {
        id: snapshot.opportunity.id,
        title: snapshot.opportunity.title,
        currentStageLabel: snapshot.opportunity.currentStageLabel,
        leadAgencyName: snapshot.opportunity.leadAgency?.name ?? null,
        responseDeadlineAt: snapshot.opportunity.responseDeadlineAt,
      },
      digest: {
        headline: `Capture digest for ${snapshot.opportunity.title}`,
        scoreSummary: buildScoreSummary(snapshot),
        proposalSummary: buildProposalSummary(snapshot),
        overdueTasks: snapshot.tasks
          .filter((task) => isOverdue(task.dueAt, now))
          .map((task) => task.title),
        upcomingMilestones: snapshot.milestones
          .filter((milestone) => isUpcoming(milestone.targetDate, now))
          .map((milestone) => milestone.title),
      },
    },
  };
}

export async function runOpportunityIntegrationDryRun(
  snapshot: OpportunityWorkspaceSnapshot,
  options?: {
    adapters?: OpportunityIntegrationAdapters;
    now?: Date;
  },
) {
  const adapters =
    options?.adapters ?? DEFAULT_OPPORTUNITY_INTEGRATION_ADAPTERS;
  const payloads = prepareOpportunityIntegrationPayloads(snapshot, {
    now: options?.now,
  });

  const crmResults = await Promise.all(
    adapters.crm.map((adapter) => adapter.upsertOpportunity(payloads.crm)),
  );
  const documentRepositoryResults = await Promise.all(
    adapters.documentRepository.map((adapter) =>
      adapter.syncOpportunityDocuments(payloads.documentRepository),
    ),
  );
  const communicationResults = await Promise.all(
    adapters.communication.map((adapter) =>
      adapter.publishOpportunityDigest(payloads.communication),
    ),
  );

  return {
    adapters,
    payloads,
    results: {
      communication: communicationResults,
      crm: crmResults,
      documentRepository: documentRepositoryResults,
    },
  };
}

function createPipelineCrmDryRunAdapter(): CrmIntegrationAdapter {
  const descriptor: IntegrationAdapterDescriptor<"crm"> = {
    key: "dry_run_capture_crm",
    domain: "crm",
    displayName: "Capture CRM dry run",
    provider: "internal_stub",
    direction: "bidirectional",
    summary:
      "Exercises the stable CRM payload contract without reaching a live pipeline system.",
    operations: [
      {
        key: "upsert_pipeline_opportunity",
        label: "Upsert pipeline opportunity",
        description:
          "Prepare one canonical opportunity record for create or update in a downstream CRM.",
      },
      {
        key: "pull_owner_feedback",
        label: "Pull owner feedback",
        description:
          "Reserve the interface shape for inbound owner or stage updates from an external CRM.",
      },
    ],
  };

  return {
    descriptor,
    describeCapabilities() {
      return descriptor.operations;
    },
    async upsertOpportunity(payload) {
      return {
        adapterKey: descriptor.key,
        domain: descriptor.domain,
        status: "dry_run",
        summary: `Prepared CRM payload for ${payload.opportunity.title} with ${payload.counts.openTaskCount} open tasks.`,
        externalReference: null,
        payloadPreview: {
          stage: payload.opportunity.currentStageLabel,
          title: payload.opportunity.title,
          recommendation: payload.scorecard?.recommendationOutcome ?? null,
          scorePercent: payload.scorecard?.scorePercent ?? null,
          proposalStatus: payload.proposal?.status ?? null,
        },
      };
    },
  };
}

function createWorkspaceDocumentRepositoryDryRunAdapter(): DocumentRepositoryIntegrationAdapter {
  const descriptor: IntegrationAdapterDescriptor<"document_repository"> = {
    key: "dry_run_workspace_documents",
    domain: "document_repository",
    displayName: "Workspace documents dry run",
    provider: "internal_stub",
    direction: "bidirectional",
    summary:
      "Exercises the document-repository boundary with metadata-only payloads and no external file transfer.",
    operations: [
      {
        key: "mirror_workspace_documents",
        label: "Mirror workspace documents",
        description:
          "Prepare upload or update requests for a downstream document repository.",
      },
      {
        key: "link_external_folder",
        label: "Link external folder",
        description:
          "Reserve the interface shape for mapping an external repository folder back to the pursuit.",
      },
    ],
  };

  return {
    descriptor,
    describeCapabilities() {
      return descriptor.operations;
    },
    async syncOpportunityDocuments(payload) {
      return {
        adapterKey: descriptor.key,
        domain: descriptor.domain,
        status: "dry_run",
        summary: `Prepared ${payload.documents.length} document metadata records for ${payload.opportunity.title}.`,
        externalReference: null,
        payloadPreview: {
          title: payload.opportunity.title,
          stage: payload.opportunity.currentStageLabel,
          documentCount: payload.documents.length,
          firstDocumentTitle: payload.documents[0]?.title ?? null,
        },
      };
    },
  };
}

function createCaptureDigestDryRunAdapter(): CommunicationIntegrationAdapter {
  const descriptor: IntegrationAdapterDescriptor<"communication"> = {
    key: "dry_run_capture_digest",
    domain: "communication",
    displayName: "Capture digest dry run",
    provider: "internal_stub",
    direction: "outbound",
    summary:
      "Exercises the team-communication boundary with digest payloads and no live message delivery.",
    operations: [
      {
        key: "publish_capture_digest",
        label: "Publish capture digest",
        description:
          "Prepare a structured pursuit digest for a collaboration tool such as Slack or email.",
      },
      {
        key: "publish_deadline_alert",
        label: "Publish deadline alert",
        description:
          "Reserve the interface shape for task or milestone deadline notifications.",
      },
    ],
  };

  return {
    descriptor,
    describeCapabilities() {
      return descriptor.operations;
    },
    async publishOpportunityDigest(payload) {
      return {
        adapterKey: descriptor.key,
        domain: descriptor.domain,
        status: "dry_run",
        summary: `Prepared pursuit digest for ${payload.opportunity.title} with ${payload.digest.overdueTasks.length} overdue tasks.`,
        externalReference: null,
        payloadPreview: {
          headline: payload.digest.headline,
          scoreSummary: payload.digest.scoreSummary,
          proposalSummary: payload.digest.proposalSummary,
          overdueTaskCount: payload.digest.overdueTasks.length,
          upcomingMilestoneCount: payload.digest.upcomingMilestones.length,
        },
      };
    },
  };
}

function summarizeOpportunityCounts(
  snapshot: OpportunityWorkspaceSnapshot,
  now: Date,
): OpportunityIntegrationCounts {
  return {
    documentCount: snapshot.documents.length,
    openTaskCount: snapshot.tasks.filter((task) => task.status !== "COMPLETED")
      .length,
    overdueTaskCount: snapshot.tasks.filter((task) => isOverdue(task.dueAt, now))
      .length,
    upcomingMilestoneCount: snapshot.milestones.filter((milestone) =>
      isUpcoming(milestone.targetDate, now),
    ).length,
  };
}

function buildScoreSummary(snapshot: OpportunityWorkspaceSnapshot) {
  if (!snapshot.scorecard) {
    return "No scored recommendation is available yet.";
  }

  const scorePercent = snapshot.scorecard.scorePercent ?? "Unscored";
  const recommendation =
    snapshot.scorecard.recommendationOutcome ?? "No recommendation";

  return `${scorePercent} score with ${recommendation} recommendation.`;
}

function buildProposalSummary(snapshot: OpportunityWorkspaceSnapshot) {
  if (!snapshot.proposal) {
    return "No proposal record is linked yet.";
  }

  const owner = snapshot.proposal.ownerName ?? "Unassigned owner";
  return `${snapshot.proposal.statusLabel} proposal owned by ${owner}.`;
}

function mapChecklistItem(
  item: OpportunityWorkspaceProposalChecklistItem,
): DocumentRepositoryChecklistItem {
  return {
    key: item.checklistKey,
    label: item.checklistLabel,
    isComplete: item.isComplete,
    completedAt: item.completedAt,
  };
}

function isOverdue(value: string | null, now: Date) {
  if (!value) {
    return false;
  }

  return new Date(value).getTime() < now.getTime();
}

function isUpcoming(value: string | null, now: Date) {
  if (!value) {
    return false;
  }

  const target = new Date(value).getTime();
  const nowTime = now.getTime();
  const upcomingWindowEnd = nowTime + 1000 * 60 * 60 * 24 * 14;

  return target >= nowTime && target <= upcomingWindowEnd;
}
