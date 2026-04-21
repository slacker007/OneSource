import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CsvImportWorkspace } from "./csv-import-workspace";
import type { CsvImportWorkspaceSnapshot } from "@/modules/source-integrations/csv-import.service";

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

const sampleCsv = `Opportunity Title,Agency,Solicitation Number,Response Deadline,NAICS Code,Description
Zero Trust Boundary Engineering Bridge,Department of Homeland Security,DHS-CISA-26-001,2026-07-15,541512,Security engineering support.
Enterprise Knowledge Management Support Services,99th Contracting Squadron,FA4861-26-R-0001,2026-05-04,541511,Existing pursuit.
Cloud Intake Pilot,Department of Veterans Affairs,13/45/2026,13/45/2026,5415X,Malformed row.
Army Cloud Operations Recompete,PEO Enterprise Information Systems,,2026-05-20,541512,Needs review.`;

describe("CsvImportWorkspace", () => {
  it(
    "builds a preview after a CSV upload and enables import for clean rows",
    async () => {
      const user = userEvent.setup();

    render(
      <CsvImportWorkspace
        action={vi.fn(async () => undefined)}
        feedback={{
          error: null,
          importedCount: null,
          skippedCount: null,
          status: null,
        }}
        workspaceSnapshot={workspaceSnapshot}
      />,
    );

    await user.upload(
      screen.getByLabelText(/upload csv file/i),
      new File([sampleCsv], "opportunity-import-sample.csv", {
        type: "text/csv",
      }),
    );

      await waitFor(() => {
        expect(
          screen.getByRole("table", { name: /csv import preview rows/i }),
        ).toBeInTheDocument();
      }, { timeout: 8_000 });

      expect(screen.getByText(/zero trust boundary engineering bridge/i)).toBeVisible();
      expect(screen.getByRole("button", { name: /import 1 clean row/i })).toBeEnabled();
      expect(screen.getByText(/exact duplicate/i)).toBeVisible();
      expect(screen.getByText(/needs review/i)).toBeVisible();
    },
    10_000,
  );
});
