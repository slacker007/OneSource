import { describe, expect, it } from "vitest";

import { buildOpportunitySeedScenario } from "../../../prisma/opportunity-seed-scenarios.mjs";

describe("buildOpportunitySeedScenario", () => {
  it("provides one imported opportunity with agency, vehicle, competitor, search, and sync lineage", () => {
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
  });

  it("retains raw, normalized, and import-preview payloads for the seeded source record", () => {
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
  });
});
