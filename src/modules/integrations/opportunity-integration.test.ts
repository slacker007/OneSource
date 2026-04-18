import { describe, expect, it } from "vitest";

import {
  DEFAULT_OPPORTUNITY_INTEGRATION_ADAPTERS,
  prepareOpportunityIntegrationPayloads,
  runOpportunityIntegrationDryRun,
  type OpportunityIntegrationAdapters,
} from "./opportunity-integration";
import type { OpportunityWorkspaceSnapshot } from "@/modules/opportunities/opportunity.types";

const FIXED_NOW = new Date("2026-04-18T17:30:00.000Z");

describe("prepareOpportunityIntegrationPayloads", () => {
  it("builds canonical CRM, document, and communication payloads from the workspace snapshot", () => {
    const payloads = prepareOpportunityIntegrationPayloads(
      buildWorkspaceSnapshot(),
      { now: FIXED_NOW },
    );

    expect(payloads.crm.opportunity.title).toBe(
      "Army Cloud Operations Recompete",
    );
    expect(payloads.crm.opportunity.leadAgencyName).toBe(
      "PEO Enterprise Information Systems",
    );
    expect(payloads.crm.counts).toEqual({
      documentCount: 2,
      openTaskCount: 2,
      overdueTaskCount: 1,
      upcomingMilestoneCount: 1,
    });
    expect(payloads.crm.scorecard?.recommendationOutcome).toBe("GO");
    expect(payloads.crm.proposal?.status).toBe("IN_PROGRESS");

    expect(payloads.documentRepository.documents).toHaveLength(2);
    expect(
      payloads.documentRepository.proposal?.linkedChecklistItems[0],
    ).toEqual({
      key: "requirement_matrix_reviewed",
      label: "Requirement matrix reviewed",
      isComplete: true,
      completedAt: "2026-04-14T09:15:00.000Z",
    });

    expect(payloads.communication.digest.headline).toBe(
      "Capture digest for Army Cloud Operations Recompete",
    );
    expect(payloads.communication.digest.overdueTasks).toEqual([
      "Refresh incumbent analysis",
    ]);
    expect(payloads.communication.digest.upcomingMilestones).toEqual([
      "Pink team review",
    ]);
  });
});

describe("runOpportunityIntegrationDryRun", () => {
  it("executes the default dry-run adapters across all supported integration domains", async () => {
    const result = await runOpportunityIntegrationDryRun(
      buildWorkspaceSnapshot(),
      { now: FIXED_NOW },
    );

    expect(DEFAULT_OPPORTUNITY_INTEGRATION_ADAPTERS.crm).toHaveLength(1);
    expect(result.results.crm).toEqual([
      expect.objectContaining({
        adapterKey: "dry_run_capture_crm",
        domain: "crm",
        status: "dry_run",
      }),
    ]);
    expect(result.results.documentRepository).toEqual([
      expect.objectContaining({
        adapterKey: "dry_run_workspace_documents",
        domain: "document_repository",
        status: "dry_run",
      }),
    ]);
    expect(result.results.communication).toEqual([
      expect.objectContaining({
        adapterKey: "dry_run_capture_digest",
        domain: "communication",
        status: "dry_run",
      }),
    ]);
  });

  it("supports injecting custom adapters without changing the payload builder", async () => {
    const customAdapters: OpportunityIntegrationAdapters = {
      crm: [
        {
          descriptor: {
            key: "custom_crm",
            domain: "crm",
            displayName: "Custom CRM",
            provider: "test",
            direction: "outbound",
            summary: "Custom CRM adapter",
            operations: [],
          },
          describeCapabilities() {
            return [];
          },
          async upsertOpportunity(payload) {
            return {
              adapterKey: "custom_crm",
              domain: "crm",
              status: "success",
              summary: payload.opportunity.title,
              externalReference: "CRM-123",
              payloadPreview: {
                scorePercent: payload.scorecard?.scorePercent ?? null,
              },
            };
          },
        },
      ],
      documentRepository: [],
      communication: [],
    };

    const result = await runOpportunityIntegrationDryRun(
      buildWorkspaceSnapshot(),
      {
        adapters: customAdapters,
        now: FIXED_NOW,
      },
    );

    expect(result.results.crm).toEqual([
      {
        adapterKey: "custom_crm",
        domain: "crm",
        status: "success",
        summary: "Army Cloud Operations Recompete",
        externalReference: "CRM-123",
        payloadPreview: {
          scorePercent: "84.00",
        },
      },
    ]);
    expect(result.results.documentRepository).toEqual([]);
    expect(result.results.communication).toEqual([]);
  });
});

function buildWorkspaceSnapshot(): OpportunityWorkspaceSnapshot {
  return {
    organization: {
      id: "org-1",
      name: "Default Org",
      slug: "default-org",
    },
    opportunity: {
      id: "opp-1",
      title: "Army Cloud Operations Recompete",
      description: "Multi-year cloud operations recompete.",
      externalNoticeId: "W91QUZ-26-R-1001",
      solicitationNumber: "W91QUZ-26-R-1001",
      sourceSummaryText: "Cloud operations modernization support.",
      sourceSummaryUrl: "https://sam.gov/opp/W91QUZ-26-R-1001/view",
      postedAt: "2026-04-01T00:00:00.000Z",
      responseDeadlineAt: "2026-05-15T00:00:00.000Z",
      originSourceSystem: "sam_gov",
      naicsCode: "541512",
      procurementTypeLabel: "Solicitation",
      procurementBaseTypeLabel: "Solicitation",
      isActiveSourceRecord: true,
      isArchivedSourceRecord: false,
      classificationCode: "D302",
      setAsideDescription: "Total Small Business Set-Aside",
      currentStageKey: "proposal_in_development",
      currentStageLabel: "Proposal in Development",
      currentStageChangedAt: "2026-04-12T12:00:00.000Z",
      updatedAt: "2026-04-18T09:00:00.000Z",
      uiLink: "https://sam.gov/opp/W91QUZ-26-R-1001/view",
      officeLocation: "Fort Belvoir, VA 22060",
      placeOfPerformanceLocation: "Arlington, VA 22202",
      leadAgency: {
        id: "agency-1",
        name: "PEO Enterprise Information Systems",
        organizationCode: "PEOEIS",
      },
      vehicles: [],
      competitors: [],
      tasks: [],
      milestones: [],
      score: {
        totalScore: "84.00",
        maximumScore: "100.00",
        recommendationOutcome: "GO",
        calculatedAt: "2026-04-17T10:00:00.000Z",
      },
      bidDecision: {
        decisionTypeKey: "final",
        recommendationOutcome: "GO",
        finalOutcome: "GO",
        decidedAt: "2026-04-17T12:00:00.000Z",
      },
    },
    scorecard: {
      totalScore: "84.00",
      maximumScore: "100.00",
      recommendationOutcome: "GO",
      calculatedAt: "2026-04-17T10:00:00.000Z",
      scoringModelKey: "default",
      scoringModelVersion: "default.v2",
      scorePercent: "84.00",
      recommendationSummary: "Strong capability fit and healthy schedule.",
      summary: "Strong capability fit and healthy schedule.",
      factors: [],
    },
    bidDecision: {
      id: "decision-1",
      decisionTypeKey: "final",
      recommendationOutcome: "GO",
      finalOutcome: "GO",
      decidedAt: "2026-04-17T12:00:00.000Z",
      isCurrent: true,
      recommendationSummary: "Recommended GO",
      finalRationale: "Aligned with growth priorities.",
      recommendedAt: "2026-04-17T10:00:00.000Z",
      recommendedByLabel: "System recommendation",
      decidedByName: "Avery Admin",
    },
    decisionHistory: [],
    taskAssigneeOptions: [],
    competitorOptions: [],
    closeout: null,
    proposal: {
      id: "proposal-1",
      status: "IN_PROGRESS",
      statusLabel: "In Progress",
      ownerUserId: "user-1",
      ownerName: "Priya Proposal",
      submittedAt: null,
      createdAt: "2026-04-10T11:00:00.000Z",
      updatedAt: "2026-04-18T09:00:00.000Z",
      completedChecklistCount: 1,
      totalChecklistCount: 2,
      checklistItems: [
        {
          id: "check-1",
          checklistKey: "requirement_matrix_reviewed",
          checklistLabel: "Requirement matrix reviewed",
          isComplete: true,
          completedAt: "2026-04-14T09:15:00.000Z",
        },
        {
          id: "check-2",
          checklistKey: "section_owners_assigned",
          checklistLabel: "Section owners assigned",
          isComplete: false,
          completedAt: null,
        },
      ],
      linkedDocuments: [
        {
          id: "doc-1",
          title: "Compliance matrix",
          documentType: "COMPLIANCE",
          downloadUrl: "/api/opportunities/documents/doc-1/download",
        },
      ],
    },
    tasks: [
      {
        id: "task-1",
        title: "Refresh incumbent analysis",
        description: "Update current incumbent strengths and risks.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueAt: "2026-04-16T12:00:00.000Z",
        startedAt: "2026-04-15T12:00:00.000Z",
        completedAt: null,
        deadlineReminderState: "OVERDUE",
        deadlineReminderUpdatedAt: "2026-04-16T12:05:00.000Z",
        createdByName: "Avery Admin",
        assigneeName: "Casey Capture",
        assigneeUserId: "user-2",
      },
      {
        id: "task-2",
        title: "Confirm staffing matrix",
        description: "Validate staffing assumptions with delivery.",
        status: "NOT_STARTED",
        priority: "MEDIUM",
        dueAt: "2026-04-25T12:00:00.000Z",
        startedAt: null,
        completedAt: null,
        deadlineReminderState: "UPCOMING",
        deadlineReminderUpdatedAt: "2026-04-18T08:00:00.000Z",
        createdByName: "Avery Admin",
        assigneeName: "Priya Proposal",
        assigneeUserId: "user-1",
      },
    ],
    milestones: [
      {
        id: "milestone-1",
        title: "Pink team review",
        description: "Internal pink team review session.",
        milestoneTypeKey: "pink_team",
        status: "PLANNED",
        targetDate: "2026-04-24T15:00:00.000Z",
        completedAt: null,
        deadlineReminderState: "UPCOMING",
        deadlineReminderUpdatedAt: "2026-04-18T08:00:00.000Z",
      },
    ],
    documents: [
      {
        id: "doc-1",
        title: "Compliance matrix",
        documentType: "COMPLIANCE",
        sourceType: "UPLOAD",
        downloadUrl: "/api/opportunities/documents/doc-1/download",
        sourceUrl: null,
        originalFileName: "compliance-matrix.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileSizeBytes: 2048,
        extractionStatus: "NOT_REQUESTED",
        extractedAt: null,
        extractedText: null,
        uploadedByName: "Priya Proposal",
        createdAt: "2026-04-11T10:00:00.000Z",
      },
      {
        id: "doc-2",
        title: "Customer questions log",
        documentType: "Q_AND_A",
        sourceType: "UPLOAD",
        downloadUrl: "/api/opportunities/documents/doc-2/download",
        sourceUrl: null,
        originalFileName: "questions-log.txt",
        mimeType: "text/plain",
        fileSizeBytes: 512,
        extractionStatus: "SUCCEEDED",
        extractedAt: "2026-04-12T10:10:00.000Z",
        extractedText: "Question and answer log",
        uploadedByName: "Casey Capture",
        createdAt: "2026-04-12T10:00:00.000Z",
      },
    ],
    notes: [],
    activity: [],
    stageTransitions: [],
    knowledgeSuggestions: [],
  };
}
