import { describe, expect, it } from "vitest";

import { buildOpportunitySeedScenario } from "../../../prisma/opportunity-seed-scenarios.mjs";

describe("buildOpportunitySeedScenario", () => {
  it("provides source-agnostic connector metadata for sam.gov, USAspending, and GSA eBuy", () => {
    const scenario = buildOpportunitySeedScenario();

    expect(scenario.connectorConfigs).toHaveLength(3);

    expect(scenario.connectorConfigs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceSystemKey: "sam_gov",
          authType: "API_KEY",
          supportsSearch: true,
          supportsSavedSearches: true,
        }),
        expect.objectContaining({
          sourceSystemKey: "usaspending_api",
          authType: "NONE",
          supportsAwardData: true,
        }),
        expect.objectContaining({
          sourceSystemKey: "gsa_ebuy",
          authType: "SESSION",
          supportsDocumentFetch: true,
        }),
      ]),
    );
  });

  it("provides one imported opportunity with agency, vehicle, competitor, search, sync, and promotion lineage", () => {
    const scenario = buildOpportunitySeedScenario();

    expect(scenario.agencies).toHaveLength(1);
    expect(scenario.vehicles.length).toBeGreaterThan(0);
    expect(scenario.competitors.length).toBeGreaterThan(0);

    expect(scenario.importedOpportunity.agencyKey).toBe(
      scenario.sourceRecord.agencyKey,
    );
    expect(scenario.importedOpportunity.vehicleKeys).toHaveLength(2);
    expect(scenario.importedOpportunity.competitorLinks).toHaveLength(2);

    expect(scenario.sourceSavedSearch.sourceSystem).toBe("sam_gov");
    expect(scenario.sourceSearchExecution.canonicalFilters).toEqual(
      scenario.sourceSavedSearch.canonicalFilters,
    );
    expect(scenario.sourceSyncRun.recordsImported).toBe(1);
    expect(scenario.sourceRecord.searchResult.resultRank).toBe(1);
    expect(scenario.sourceRecord.syncRecord.syncAction).toBe("IMPORTED");
    expect(scenario.sourceImportDecision.mode).toBe("CREATE_OPPORTUNITY");
    expect(scenario.sourceImportDecision.status).toBe("APPLIED");
  });

  it("retains raw, normalized, contacts, attachments, and import-preview payloads for the seeded sam.gov source record", () => {
    const scenario = buildOpportunitySeedScenario();

    expect(scenario.sourceRecord.sourceRawPayload).toMatchObject({
      noticeId: scenario.sourceRecord.sourceRecordId,
      title: scenario.importedOpportunity.title,
      fullParentPathName: scenario.agencies[0].pathName,
    });

    expect(scenario.sourceRecord.sourceNormalizedPayload).toMatchObject({
      sourceSystem: scenario.sourceRecord.sourceSystem,
      sourceRecordId: scenario.sourceRecord.sourceRecordId,
      normalizedPayload: {
        externalNoticeId: scenario.importedOpportunity.externalNoticeId,
        solicitationNumber: scenario.importedOpportunity.solicitationNumber,
      },
    });

    expect(scenario.sourceRecord.sourceImportPreviewPayload).toMatchObject({
      source: {
        noticeId: scenario.sourceRecord.sourceRecordId,
      },
      normalized: {
        leadAgency: scenario.agencies[0].name,
        vehicleCodes: ["OASIS-PLUS-UNR", "MAS-IT-70"],
      },
    });

    expect(scenario.sourceRecord.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fullName: "Capt. Elena Vargas",
          email: "elena.vargas.1@us.af.mil",
        }),
      ]),
    );

    expect(scenario.sourceRecord.attachments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          displayLabel: "Performance Work Statement",
          linkType: "resource_link",
        }),
      ]),
    );
  });

  it("provides a second-source USAspending scenario that links enrichment data to the same opportunity model", () => {
    const scenario = buildOpportunitySeedScenario();

    expect(
      scenario.secondarySourceScenario.sourceSavedSearch.sourceSystem,
    ).toBe("usaspending_api");
    expect(
      scenario.secondarySourceScenario.sourceSearchExecution.canonicalFilters,
    ).toEqual(
      scenario.secondarySourceScenario.sourceSavedSearch.canonicalFilters,
    );
    expect(
      scenario.secondarySourceScenario.sourceRecord.sourceNormalizedPayload,
    ).toMatchObject({
      sourceSystem: "usaspending_api",
      normalizedPayload: {
        awardNumber: "FA486126F0009",
        awardeeName: "Vector Analytics LLC",
      },
    });
    expect(scenario.secondarySourceScenario.sourceRecord.award).toMatchObject({
      awardNumber: "FA486126F0009",
      awardAmount: "1842500.00",
    });
    expect(scenario.secondarySourceScenario.sourceImportDecision.mode).toBe(
      "LINK_TO_EXISTING",
    );
    expect(scenario.secondarySourceScenario.sourceImportDecision.status).toBe(
      "APPLIED",
    );
  });
});
