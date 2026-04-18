import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildCsvImportPreview,
  buildInitialCsvImportMapping,
  createCsvImportDraft,
  parseCsvImportMapping,
  parseCsvText,
  type CsvImportWorkspaceSnapshot,
} from "./csv-import.service";

const fixturePath = path.resolve(
  process.cwd(),
  "tests/fixtures/opportunity-import-sample.csv",
);
const fixtureCsv = readFileSync(fixturePath, "utf8");

const workspaceSnapshot: CsvImportWorkspaceSnapshot = {
  agencies: [
    {
      id: "agency_af",
      label: "99th Contracting Squadron (FA4861)",
      name: "99th Contracting Squadron",
      organizationCode: "FA4861",
    },
    {
      id: "agency_army",
      label: "PEO Enterprise Information Systems (W91QUZ)",
      name: "PEO Enterprise Information Systems",
      organizationCode: "W91QUZ",
    },
    {
      id: "agency_dhs",
      label: "Department of Homeland Security",
      name: "Department of Homeland Security",
      organizationCode: null,
    },
    {
      id: "agency_va",
      label: "Department of Veterans Affairs (36C10B)",
      name: "Department of Veterans Affairs",
      organizationCode: "36C10B",
    },
  ],
  connector: {
    id: "connector_csv",
    isEnabled: true,
    sourceDisplayName: "CSV Upload",
    sourceSystemKey: "csv_upload",
  },
  opportunities: [
    {
      currentStageLabel: "Capture Active",
      externalNoticeId: "FA4861-26-R-0001",
      id: "opp_imported",
      leadAgencyName: "99th Contracting Squadron",
      leadAgencyOrganizationCode: "FA4861",
      naicsCode: "541511",
      responseDeadlineAt: "2026-05-04T12:00:00.000Z",
      solicitationNumber: "FA4861-26-R-0001",
      title: "Enterprise Knowledge Management Support Services",
    },
    {
      currentStageLabel: "Qualified",
      externalNoticeId: null,
      id: "opp_army",
      leadAgencyName: "PEO Enterprise Information Systems",
      leadAgencyOrganizationCode: "W91QUZ",
      naicsCode: "541512",
      responseDeadlineAt: "2026-05-20T12:00:00.000Z",
      solicitationNumber: "W91QUZ-26-R-0042",
      title: "Army Cloud Operations Recompete",
    },
  ],
  organization: {
    id: "org_123",
    name: "Default Organization",
    slug: "default-org",
  },
};

describe("csv-import.service", () => {
  it("parses a sample fixture into headers and data rows", () => {
    const parsed = parseCsvText(fixtureCsv);

    expect(parsed.errors).toEqual([]);
    expect(parsed.headers).toEqual([
      "Opportunity Title",
      "Agency",
      "Solicitation Number",
      "Response Deadline",
      "NAICS Code",
      "Description",
    ]);
    expect(parsed.rows).toHaveLength(4);
    expect(parsed.rows[0]).toMatchObject({
      rowNumber: 2,
      rawValues: {
        "Opportunity Title": "Zero Trust Boundary Engineering Bridge",
      },
    });
  });

  it("auto-detects common headers and builds row-level preview states", () => {
    const draftResult = createCsvImportDraft({
      csvText: fixtureCsv,
      fileName: "opportunity-import-sample.csv",
      fileSize: Buffer.byteLength(fixtureCsv, "utf8"),
    });

    expect(draftResult.errors).toEqual([]);
    expect(draftResult.draft).not.toBeNull();

    const mapping = buildInitialCsvImportMapping(draftResult.draft!.headers);
    const preview = buildCsvImportPreview({
      draft: draftResult.draft!,
      errors: draftResult.errors,
      mapping,
      workspace: workspaceSnapshot,
    });

    expect(preview.summary).toEqual({
      duplicateRows: 1,
      invalidRows: 1,
      readyRows: 1,
      reviewRows: 1,
      totalRows: 4,
    });
    expect(preview.rows[0]).toMatchObject({
      rowNumber: 2,
      status: "ready",
      mappedValues: {
        leadAgencyId: "agency_dhs",
        responseDeadlineAt: "2026-07-15",
        solicitationNumber: "DHS-CISA-26-001",
        title: "Zero Trust Boundary Engineering Bridge",
      },
    });
    expect(preview.rows[1].duplicateCandidates[0]).toMatchObject({
      matchKind: "exact",
      opportunityId: "opp_imported",
    });
    expect(preview.rows[2]).toMatchObject({
      status: "invalid",
      fieldErrors: {
        naicsCode: "NAICS codes must contain 2 to 6 digits.",
        responseDeadlineAt:
          "Enter the response deadline as YYYY-MM-DD or MM/DD/YYYY.",
      },
    });
    expect(preview.rows[3].duplicateCandidates[0]).toMatchObject({
      matchKind: "review",
      opportunityId: "opp_army",
    });
  });

  it("rejects malformed mapping payloads", () => {
    expect(
      parseCsvImportMapping('{"title":"Missing Header"}', [
        "Opportunity Title",
      ]),
    ).toBeNull();
  });
});
