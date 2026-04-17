import { describe, expect, it } from "vitest";

import { buildOpportunitySeedScenario } from "../../../prisma/opportunity-seed-scenarios.mjs";

describe("buildOpportunitySeedScenario", () => {
  it("provides source-agnostic connector metadata for sam.gov, USAspending, and GSA eBuy", () => {
    const scenario = buildOpportunitySeedScenario();

    expect(scenario.connectorConfigs).toHaveLength(3);
    expect(scenario.teamMembers).toHaveLength(6);

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

    expect(scenario.agencies).toHaveLength(5);
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

  it("provides a realistic persisted workspace with execution records, score factors, and a bid decision", () => {
    const scenario = buildOpportunitySeedScenario();

    expect(scenario.importedOpportunity.currentStageKey).toBe("capture_active");
    expect(scenario.workspace.tasks).toHaveLength(3);
    expect(scenario.workspace.milestones).toHaveLength(3);
    expect(scenario.workspace.notes).toHaveLength(2);
    expect(scenario.workspace.documents).toHaveLength(2);
    expect(scenario.workspace.stageTransitions).toHaveLength(3);
    expect(scenario.workspace.activityEvents.length).toBeGreaterThanOrEqual(6);

    expect(scenario.workspace.scorecard).toMatchObject({
      scoringModelKey: "default_capture_v1",
      totalScore: "79.50",
      recommendationOutcome: "GO",
    });
    expect(scenario.workspace.scorecard.factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "capability_fit",
          score: "24.00",
        }),
        expect.objectContaining({
          key: "vehicle_access",
          maximumScore: "15.00",
        }),
      ]),
    );

    expect(scenario.workspace.bidDecision).toMatchObject({
      decisionTypeKey: "initial_pursuit",
      recommendationOutcome: "GO",
      finalOutcome: "GO",
    });

    expect(scenario.workspace.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "pws-source-doc",
          sourceType: "SOURCE_ATTACHMENT",
          extractionStatus: "SUCCEEDED",
        }),
        expect.objectContaining({
          key: "capture-plan",
          sourceType: "MANUAL_UPLOAD",
        }),
      ]),
    );

    expect(scenario.workspace.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "incumbent-analysis",
          assigneeUserKey: "taylor-reed",
        }),
        expect.objectContaining({
          key: "customer-questions",
          assigneeUserKey: "morgan-patel",
        }),
      ]),
    );
  });

  it("provides a broader manual portfolio with multiple agencies, stages, and decision outcomes", () => {
    const scenario = buildOpportunitySeedScenario();
    const manualOpportunities = scenario.manualOpportunities;

    expect(manualOpportunities).toHaveLength(4);
    expect(manualOpportunities.map((item) => item.opportunity.agencyKey)).toEqual(
      expect.arrayContaining([
        "army-peo-eis",
        "va-technology-acquisition-center",
        "dhs-cisa-ocpo",
        "navwar-pacific",
      ]),
    );
    expect(manualOpportunities.map((item) => item.opportunity.currentStageKey)).toEqual(
      expect.arrayContaining([
        "qualified",
        "proposal_in_development",
        "submitted",
        "no_bid",
      ]),
    );
    expect(manualOpportunities.map((item) => item.workspace.scorecard.recommendationOutcome)).toEqual(
      expect.arrayContaining(["DEFER", "GO", "NO_GO"]),
    );
    expect(manualOpportunities.flatMap((item) => item.workspace.tasks)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "army-staffing-gap",
          status: "BLOCKED",
          priority: "CRITICAL",
          assigneeUserKey: "taylor-reed",
        }),
        expect.objectContaining({
          key: "va-win-themes",
          status: "IN_PROGRESS",
          assigneeUserKey: "morgan-patel",
        }),
        expect.objectContaining({
          key: "dhs-orals-prep",
          status: "IN_PROGRESS",
          assigneeUserKey: "casey-brooks",
        }),
      ]),
    );
  });
});
