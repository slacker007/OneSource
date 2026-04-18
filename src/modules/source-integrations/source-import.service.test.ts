import { AuditActorType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  applySourceImport,
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
      responseDeadlineAt: new Date("2026-05-20T21:00:00.000Z"),
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

const sourceRecordArmy = {
  id: "source_army",
  organizationId: "org_123",
  opportunityId: null,
  sourceConnectorConfigId: "connector_sam",
  sourceSystem: "sam_gov",
  sourceRecordId: "W91QUZ-26-R-1042",
  sourceRawPayload: {
    noticeId: "W91QUZ-26-R-1042",
    title: "Army Cloud Operations Recompete",
    postedDate: "04/08/2026",
    responseDeadLine: "05/20/2026",
    organizationName: "PEO Enterprise Information Systems",
    organizationCode: "W91QUZ",
    description:
      "Cloud operations, sustainment, and platform engineering support for Army enterprise systems.",
    solicitationNumber: "W91QUZ-26-R-1042",
    naicsCode: "541512",
    procurementTypeCode: "r",
    type: "Sources Sought",
    status: "active",
    uiLink: "https://sam.gov/opp/W91QUZ-26-R-1042/view",
    placeOfPerformance: {
      state: {
        code: "VA",
      },
      zip: "22350",
    },
  },
  sourceNormalizedPayload: {
    externalNoticeId: "W91QUZ-26-R-1042",
    title: "Army Cloud Operations Recompete",
    sourceStatus: "active",
    sourceSummaryText:
      "Cloud operations, sustainment, and platform engineering support for Army enterprise systems.",
    sourceSystem: "sam_gov",
    solicitationNumber: "W91QUZ-26-R-1042",
    naicsCode: "541512",
    placeOfPerformanceStateCode: "VA",
    placeOfPerformancePostalCode: "22350",
    procurementTypeLabel: "Sources Sought",
    uiLink: "https://sam.gov/opp/W91QUZ-26-R-1042/view",
  },
  sourceImportPreviewPayload: {
    canonicalOpportunity: {
      title: "Army Cloud Operations Recompete",
    },
    warnings: [],
  },
  sourceNormalizationVersion: "sam-gov.v1",
  sourceUiUrl: "https://sam.gov/opp/W91QUZ-26-R-1042/view",
  sourceDetailUrl: "https://api.sam.gov/prod/opportunities/v2/W91QUZ-26-R-1042",
  sourceDescriptionUrl: "https://sam.gov/opp/W91QUZ-26-R-1042/view",
  sourceHashFingerprint:
    "sam_gov:W91QUZ-26-R-1042:2026-04-08:541512:peo-enterprise-information-systems",
  opportunity: null,
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
      sourceRecord: {
        ...sourceRecordArmy,
        id: "source_imported",
        sourceRecordId: "FA4861-26-R-0001",
        opportunity: {
          id: "opp_imported",
          title: "Enterprise Knowledge Management Support Services",
          currentStageKey: "capture_active",
          currentStageLabel: "Capture Active",
        },
        sourceRawPayload: {
          ...sourceRecordArmy.sourceRawPayload,
          noticeId: "FA4861-26-R-0001",
          title: "Enterprise Knowledge Management Support Services",
          solicitationNumber: "FA4861-26-R-0001",
          organizationCode: "FA4861",
          organizationName: "99th Contracting Squadron",
          naicsCode: "541511",
          postedDate: "04/12/2026",
          responseDeadLine: "05/04/2026",
        },
        sourceNormalizedPayload: {
          ...sourceRecordArmy.sourceNormalizedPayload,
          externalNoticeId: "FA4861-26-R-0001",
          title: "Enterprise Knowledge Management Support Services",
          solicitationNumber: "FA4861-26-R-0001",
          naicsCode: "541511",
        },
      },
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
      sourceRecord: sourceRecordArmy,
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
    const db = createMockImportClient({
      previewSourceRecord: {
        ...sourceRecordArmy,
        id: "source_navy",
        sourceRecordId: "N00189-26-R-0088",
        sourceRawPayload: {
          ...sourceRecordArmy.sourceRawPayload,
          noticeId: "N00189-26-R-0088",
          title: "Navy Logistics Data Support Bridge",
          organizationName: "NAVSUP Fleet Logistics Center Norfolk",
          organizationCode: "N00189",
          postedDate: "02/17/2026",
          responseDeadLine: "03/19/2026",
          solicitationNumber: "N00189-26-R-0088",
          naicsCode: "541614",
          status: "archived",
          type: "Special Notice",
          procurementTypeCode: "s",
          placeOfPerformance: {
            state: {
              code: "VA",
            },
            zip: "23511",
          },
        },
        sourceNormalizedPayload: {
          ...sourceRecordArmy.sourceNormalizedPayload,
          externalNoticeId: "N00189-26-R-0088",
          title: "Navy Logistics Data Support Bridge",
          sourceStatus: "archived",
          solicitationNumber: "N00189-26-R-0088",
          naicsCode: "541614",
          procurementTypeLabel: "Special Notice",
          placeOfPerformancePostalCode: "23511",
        },
      },
    });

    vi.mocked(db.__tx.sourceConnectorConfig.findFirst).mockResolvedValue({
      id: "connector_sam",
      sourceDisplayName: "SAM.gov",
    });
    vi.mocked(db.__tx.agency.findFirst).mockResolvedValue(null);
    vi.mocked(db.__tx.agency.create).mockResolvedValue({
      id: "agency_123",
    });
    vi.mocked(db.__tx.sourceRecord.findFirst).mockResolvedValue({
      id: "source_navy",
      opportunityId: null,
    });
    vi.mocked(db.__tx.sourceRecord.update).mockResolvedValue({
      id: "source_navy",
      opportunityId: "opp_new",
    });
    vi.mocked(db.__tx.opportunity.create).mockResolvedValue({
      id: "opp_new",
      title: "Navy Logistics Data Support Bridge",
    });
    vi.mocked(db.__tx.sourceImportDecision.create).mockResolvedValue({
      id: "decision_123",
    });

    const result = await applySourceImport({
      db,
      input: {
        actor,
        mode: "CREATE_OPPORTUNITY",
        sourceRecordId: "source_navy",
      },
    });

    expect(result).toMatchObject({
      action: "created",
      targetOpportunityId: "opp_new",
      targetOpportunityTitle: "Navy Logistics Data Support Bridge",
    });
    expect(db.__tx.opportunity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentStageKey: "identified",
          externalNoticeId: "N00189-26-R-0088",
          importedFromSourceRecordId: "source_navy",
          title: "Navy Logistics Data Support Bridge",
        }),
      }),
    );
    expect(db.__tx.sourceImportDecision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mode: "CREATE_OPPORTUNITY",
          status: "APPLIED",
          sourceRecordId: "source_navy",
          targetOpportunityId: "opp_new",
        }),
      }),
    );
    expect(db.__tx.auditLog.create).toHaveBeenCalledTimes(2);
  });

  it("links a persisted source result to an existing opportunity", async () => {
    const db = createMockImportClient({
      previewSourceRecord: sourceRecordArmy,
    });

    vi.mocked(db.__tx.sourceConnectorConfig.findFirst).mockResolvedValue({
      id: "connector_sam",
      sourceDisplayName: "SAM.gov",
    });
    vi.mocked(db.__tx.agency.findFirst).mockResolvedValue({
      id: "agency_army",
    });
    vi.mocked(db.__tx.sourceRecord.findFirst).mockResolvedValue({
      id: "source_army",
      opportunityId: null,
    });
    vi.mocked(db.__tx.sourceRecord.update).mockResolvedValue({
      id: "source_army",
      opportunityId: "opp_army",
    });
    vi.mocked(db.__tx.opportunity.findFirst).mockResolvedValue({
      id: "opp_army",
      title: "Army Cloud Operations Recompete",
    });
    vi.mocked(db.__tx.sourceImportDecision.create).mockResolvedValue({
      id: "decision_army",
    });

    const result = await applySourceImport({
      db,
      input: {
        actor,
        mode: "LINK_TO_EXISTING",
        sourceRecordId: "source_army",
        targetOpportunityId: "opp_army",
      },
    });

    expect(result).toMatchObject({
      action: "linked",
      targetOpportunityId: "opp_army",
      targetOpportunityTitle: "Army Cloud Operations Recompete",
    });
    expect(db.__tx.opportunity.create).not.toHaveBeenCalled();
    expect(db.__tx.sourceRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          opportunityId: "opp_army",
        }),
      }),
    );
    expect(db.__tx.sourceImportDecision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mode: "LINK_TO_EXISTING",
          targetOpportunityId: "opp_army",
        }),
      }),
    );
  });
});

function createMockImportClient({
  previewSourceRecord,
}: {
  previewSourceRecord: typeof sourceRecordArmy;
}) {
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
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  } as unknown as SourceImportRepositoryClient;

  vi.mocked(tx.opportunityActivityEvent.create).mockResolvedValue(undefined);
  vi.mocked(tx.auditLog.create).mockResolvedValue(undefined);

  const db = {
    organization: {
      findUnique: vi.fn().mockResolvedValue(organizationRecord),
    },
    ...tx,
    sourceRecord: {
      ...tx.sourceRecord,
      findFirst: vi.fn().mockResolvedValue(previewSourceRecord),
    },
    $transaction: vi.fn(async (callback) => callback(tx)),
    __tx: tx,
  } as unknown as SourceImportRepositoryClient & {
    __tx: typeof tx;
  };

  return db;
}
