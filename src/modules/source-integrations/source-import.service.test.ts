import { AuditActorType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  applyMockSourceImport,
  buildSourceImportPreviewSnapshot,
  type SourceImportRepositoryClient,
} from "./source-import.service";

const organizationRecord = {
  id: "org_123",
  name: "Default Organization",
  slug: "default-org",
  sourceConnectorConfigs: [
    {
      id: "connector_sam",
      sourceSystemKey: "sam_gov",
      sourceDisplayName: "SAM.gov",
      isEnabled: true,
      supportsResultPreview: true,
    },
  ],
  opportunities: [
    {
      id: "opp_imported",
      title: "Enterprise Knowledge Management Support Services",
      currentStageKey: "capture_active",
      currentStageLabel: "Capture Active",
      externalNoticeId: "FA4861-26-R-0001",
      solicitationNumber: "FA4861-26-R-0001",
      naicsCode: "541511",
      originSourceSystem: "sam_gov",
      responseDeadlineAt: new Date("2026-05-04T21:00:00.000Z"),
      leadAgency: {
        name: "99th Contracting Squadron",
        organizationCode: "FA4861",
      },
    },
    {
      id: "opp_army",
      title: "Army Cloud Operations Recompete",
      currentStageKey: "qualified",
      currentStageLabel: "Qualified",
      externalNoticeId: null,
      solicitationNumber: "W91QUZ-26-R-0042",
      naicsCode: "541512",
      originSourceSystem: "manual_entry",
      responseDeadlineAt: new Date("2026-05-08T21:00:00.000Z"),
      leadAgency: {
        name: "PEO Enterprise Information Systems",
        organizationCode: "W91QUZ",
      },
    },
  ],
  sourceRecords: [
    {
      id: "source_imported",
      sourceSystem: "sam_gov",
      sourceRecordId: "FA4861-26-R-0001",
      opportunityId: "opp_imported",
      opportunity: {
        id: "opp_imported",
        title: "Enterprise Knowledge Management Support Services",
        currentStageKey: "capture_active",
        currentStageLabel: "Capture Active",
      },
    },
  ],
};

const actor = {
  type: AuditActorType.USER,
  userId: "user_123",
  identifier: "alex.morgan@onesource.local",
  organizationId: "org_123",
};

describe("source-import.service preview", () => {
  it("flags exact source matches as already tracked", () => {
    const preview = buildSourceImportPreviewSnapshot({
      organization: organizationRecord,
      resultId: "sam_result_1",
    });

    expect(preview?.alreadyTrackedOpportunity).toMatchObject({
      id: "opp_imported",
      title: "Enterprise Knowledge Management Support Services",
    });
    expect(preview?.duplicateCandidates[0]).toMatchObject({
      matchKind: "exact_source",
      opportunityId: "opp_imported",
    });
  });

  it("ranks manual opportunities as strong duplicate candidates", () => {
    const preview = buildSourceImportPreviewSnapshot({
      organization: organizationRecord,
      resultId: "sam_result_2",
    });

    expect(preview?.alreadyTrackedOpportunity).toBeNull();
    expect(preview?.duplicateCandidates[0]).toMatchObject({
      matchKind: "strong_candidate",
      opportunityId: "opp_army",
      title: "Army Cloud Operations Recompete",
    });
    expect(preview?.duplicateCandidates[0].matchScore).toBeGreaterThanOrEqual(80);
  });
});

describe("source-import.service apply", () => {
  it("creates a new tracked opportunity and records the import decision", async () => {
    const db = createMockImportClient();

    vi.mocked(db.sourceConnectorConfig.findFirst).mockResolvedValue({
      id: "connector_sam",
      sourceDisplayName: "SAM.gov",
    });
    vi.mocked(db.agency.findFirst).mockResolvedValue(null);
    vi.mocked(db.agency.create).mockResolvedValue({
      id: "agency_123",
    });
    vi.mocked(db.sourceRecord.findFirst).mockResolvedValue(null);
    vi.mocked(db.sourceRecord.create).mockResolvedValue({
      id: "source_123",
      opportunityId: null,
    });
    vi.mocked(db.sourceRecord.update).mockResolvedValue({
      id: "source_123",
      opportunityId: "opp_new",
    });
    vi.mocked(db.opportunity.create).mockResolvedValue({
      id: "opp_new",
      title: "Navy Logistics Data Support Bridge",
    });
    vi.mocked(db.sourceImportDecision.create).mockResolvedValue({
      id: "decision_123",
    });

    const result = await applyMockSourceImport({
      db,
      input: {
        actor,
        mode: "CREATE_OPPORTUNITY",
        resultId: "sam_result_4",
        searchExecutedAt: "2026-04-18T03:25:00.000Z",
        searchQuery: {
          keywords: "logistics data",
        },
      },
    });

    expect(result).toMatchObject({
      action: "created",
      targetOpportunityId: "opp_new",
      targetOpportunityTitle: "Navy Logistics Data Support Bridge",
    });
    expect(db.opportunity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentStageKey: "identified",
          externalNoticeId: "N00189-26-R-0088",
          importedFromSourceRecordId: "source_123",
          title: "Navy Logistics Data Support Bridge",
        }),
      }),
    );
    expect(db.sourceImportDecision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mode: "CREATE_OPPORTUNITY",
          status: "APPLIED",
          sourceRecordId: "source_123",
          targetOpportunityId: "opp_new",
        }),
      }),
    );
    expect(db.auditLog.create).toHaveBeenCalledTimes(2);
  });

  it("links a previewed source result to an existing opportunity", async () => {
    const db = createMockImportClient();

    vi.mocked(db.sourceConnectorConfig.findFirst).mockResolvedValue({
      id: "connector_sam",
      sourceDisplayName: "SAM.gov",
    });
    vi.mocked(db.agency.findFirst).mockResolvedValue({
      id: "agency_army",
    });
    vi.mocked(db.sourceRecord.findFirst).mockResolvedValue(null);
    vi.mocked(db.sourceRecord.create).mockResolvedValue({
      id: "source_army",
      opportunityId: null,
    });
    vi.mocked(db.sourceRecord.update).mockResolvedValue({
      id: "source_army",
      opportunityId: "opp_army",
    });
    vi.mocked(db.opportunity.findFirst).mockResolvedValue({
      id: "opp_army",
      title: "Army Cloud Operations Recompete",
    });
    vi.mocked(db.sourceImportDecision.create).mockResolvedValue({
      id: "decision_army",
    });

    const result = await applyMockSourceImport({
      db,
      input: {
        actor,
        mode: "LINK_TO_EXISTING",
        resultId: "sam_result_2",
        targetOpportunityId: "opp_army",
      },
    });

    expect(result).toMatchObject({
      action: "linked",
      targetOpportunityId: "opp_army",
      targetOpportunityTitle: "Army Cloud Operations Recompete",
    });
    expect(db.opportunity.create).not.toHaveBeenCalled();
    expect(db.sourceRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          opportunityId: "opp_army",
        }),
      }),
    );
    expect(db.sourceImportDecision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mode: "LINK_TO_EXISTING",
          targetOpportunityId: "opp_army",
        }),
      }),
    );
  });
});

function createMockImportClient() {
  const tx = {
    agency: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    opportunity: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    opportunityActivityEvent: {
      create: vi.fn(),
    },
    sourceConnectorConfig: {
      findFirst: vi.fn(),
    },
    sourceImportDecision: {
      create: vi.fn(),
    },
    sourceRecord: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  } as unknown as SourceImportRepositoryClient;

  vi.mocked(tx.opportunityActivityEvent.create).mockResolvedValue(undefined);
  vi.mocked(tx.auditLog.create).mockResolvedValue(undefined);

  const db = {
    ...tx,
    $transaction: vi.fn(async (callback) => callback(tx)),
  } as unknown as SourceImportRepositoryClient;

  return db;
}
