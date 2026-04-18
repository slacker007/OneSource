import { z } from "zod";

export const CSV_IMPORT_SOURCE_SYSTEM = "csv_upload";
export const CSV_IMPORT_MAX_FILE_BYTES = 256_000;
export const CSV_IMPORT_MAX_ROW_COUNT = 100;

export const CSV_IMPORT_FIELD_DEFINITIONS = [
  {
    key: "title",
    label: "Opportunity title",
    description: "Required. Mapped into the tracked opportunity title.",
    required: true,
  },
  {
    key: "description",
    label: "Description",
    description: "Optional. Stored as the tracked opportunity description.",
    required: false,
  },
  {
    key: "agency",
    label: "Lead agency",
    description:
      "Optional. Matches an existing agency by code or exact name when possible.",
    required: false,
  },
  {
    key: "responseDeadlineAt",
    label: "Response deadline",
    description:
      "Optional. Accepts `YYYY-MM-DD`, `MM/DD/YYYY`, or `M/D/YYYY` values.",
    required: false,
  },
  {
    key: "solicitationNumber",
    label: "Solicitation number",
    description:
      "Optional. Used for conservative duplicate detection against tracked opportunities.",
    required: false,
  },
  {
    key: "naicsCode",
    label: "NAICS code",
    description: "Optional. Must contain 2 to 6 digits when present.",
    required: false,
  },
] as const;

export type CsvImportFieldKey =
  (typeof CSV_IMPORT_FIELD_DEFINITIONS)[number]["key"];

export type CsvImportColumnMapping = Record<CsvImportFieldKey, string | null>;

export type CsvImportWorkspaceSnapshot = {
  agencies: CsvImportAgencyOption[];
  connector: {
    id: string;
    isEnabled: boolean;
    sourceDisplayName: string;
    sourceSystemKey: string;
  } | null;
  opportunities: CsvImportExistingOpportunity[];
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

export type CsvImportAgencyOption = {
  id: string;
  label: string;
  name: string;
  organizationCode: string | null;
};

export type CsvImportExistingOpportunity = {
  currentStageLabel: string | null;
  externalNoticeId: string | null;
  id: string;
  leadAgencyName: string | null;
  leadAgencyOrganizationCode: string | null;
  naicsCode: string | null;
  responseDeadlineAt: string | null;
  solicitationNumber: string | null;
  title: string;
};

export type CsvImportWorkspaceRepositoryClient = {
  organization: {
    findUnique(args: {
      where: {
        id: string;
      };
    } & typeof csvImportWorkspaceArgs): Promise<CsvImportWorkspaceRecord | null>;
  };
};

const csvImportWorkspaceArgs = {
  select: {
    id: true,
    name: true,
    slug: true,
    agencies: {
      orderBy: [{ name: "asc" }, { organizationCode: "asc" }],
      select: {
        id: true,
        name: true,
        organizationCode: true,
      },
    },
    opportunities: {
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        solicitationNumber: true,
        externalNoticeId: true,
        naicsCode: true,
        responseDeadlineAt: true,
        currentStageLabel: true,
        leadAgency: {
          select: {
            name: true,
            organizationCode: true,
          },
        },
      },
    },
    sourceConnectorConfigs: {
      where: {
        sourceSystemKey: CSV_IMPORT_SOURCE_SYSTEM,
      },
      select: {
        id: true,
        isEnabled: true,
        sourceDisplayName: true,
        sourceSystemKey: true,
      },
      take: 1,
    },
  },
} as const;

type CsvImportWorkspaceRecord = {
  id: string;
  name: string;
  slug: string;
  agencies: CsvImportAgencyOption[];
  opportunities: Array<{
    currentStageLabel: string | null;
    externalNoticeId: string | null;
    id: string;
    naicsCode: string | null;
    responseDeadlineAt: Date | null;
    solicitationNumber: string | null;
    title: string;
    leadAgency: {
      name: string;
      organizationCode: string | null;
    } | null;
  }>;
  sourceConnectorConfigs: Array<{
    id: string;
    isEnabled: boolean;
    sourceDisplayName: string;
    sourceSystemKey: string;
  }>;
};

export type CsvImportDraft = {
  csvText: string;
  delimiter: "," | ";" | "\t";
  fileName: string;
  fileSize: number;
  headers: string[];
  rows: CsvImportRawRow[];
};

export type CsvImportRawRow = {
  rawValues: Record<string, string>;
  rowNumber: number;
};

export type CsvImportPreview = {
  globalErrors: string[];
  hasBlockingErrors: boolean;
  headers: string[];
  importableRows: CsvImportPreviewRow[];
  mapping: CsvImportColumnMapping;
  mappingErrors: string[];
  rowCount: number;
  rows: CsvImportPreviewRow[];
  summary: {
    duplicateRows: number;
    invalidRows: number;
    readyRows: number;
    reviewRows: number;
    totalRows: number;
  };
};

export type CsvImportPreviewRow = {
  duplicateCandidates: CsvImportDuplicateCandidate[];
  fieldErrors: Partial<Record<CsvImportFieldKey | "mapping", string>>;
  mappedValues: CsvImportMappedRow;
  rowNumber: number;
  status: "duplicate" | "invalid" | "ready" | "review";
  statusMessage: string;
  warnings: string[];
};

export type CsvImportMappedRow = {
  agencyLabel: string | null;
  csvAgencyValue: string | null;
  description: string | null;
  leadAgencyId: string | null;
  naicsCode: string | null;
  responseDeadlineAt: string | null;
  solicitationNumber: string | null;
  title: string | null;
};

export type CsvImportDuplicateCandidate = {
  currentStageLabel: string | null;
  matchKind: "exact" | "review";
  matchReasons: string[];
  opportunityId: string;
  title: string;
};

const csvImportMappingSchema = z.object({
  agency: z.string().nullable(),
  description: z.string().nullable(),
  naicsCode: z.string().nullable(),
  responseDeadlineAt: z.string().nullable(),
  solicitationNumber: z.string().nullable(),
  title: z.string().nullable(),
});

export async function getCsvImportWorkspaceSnapshot({
  db,
  organizationId,
}: {
  db: CsvImportWorkspaceRepositoryClient;
  organizationId: string;
}): Promise<CsvImportWorkspaceSnapshot | null> {
  const organization = await db.organization.findUnique({
    where: {
      id: organizationId,
    },
    ...csvImportWorkspaceArgs,
  });

  if (!organization) {
    return null;
  }

  return {
    agencies: organization.agencies.map((agency) => ({
      id: agency.id,
      label:
        agency.organizationCode != null
          ? `${agency.name} (${agency.organizationCode})`
          : agency.name,
      name: agency.name,
      organizationCode: agency.organizationCode,
    })),
    connector: organization.sourceConnectorConfigs[0] ?? null,
    opportunities: organization.opportunities.map((opportunity) => ({
      currentStageLabel: opportunity.currentStageLabel,
      externalNoticeId: opportunity.externalNoticeId,
      id: opportunity.id,
      leadAgencyName: opportunity.leadAgency?.name ?? null,
      leadAgencyOrganizationCode:
        opportunity.leadAgency?.organizationCode ?? null,
      naicsCode: opportunity.naicsCode,
      responseDeadlineAt: opportunity.responseDeadlineAt?.toISOString() ?? null,
      solicitationNumber: opportunity.solicitationNumber,
      title: opportunity.title,
    })),
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    },
  };
}

export function createCsvImportDraft({
  csvText,
  fileName,
  fileSize,
}: {
  csvText: string;
  fileName: string;
  fileSize: number;
}):
  | {
      draft: CsvImportDraft;
      errors: string[];
    }
  | {
      draft: null;
      errors: string[];
    } {
  const errors: string[] = [];
  const trimmedFileName = fileName.trim();

  if (trimmedFileName.length === 0) {
    errors.push("Select a CSV file before building an import preview.");
  } else if (!trimmedFileName.toLowerCase().endsWith(".csv")) {
    errors.push("Upload a file with the `.csv` extension.");
  }

  if (fileSize > CSV_IMPORT_MAX_FILE_BYTES) {
    errors.push(
      `CSV uploads are currently limited to ${formatByteLimit(CSV_IMPORT_MAX_FILE_BYTES)}.`,
    );
  }

  const parsed = parseCsvText(csvText);
  errors.push(...parsed.errors);

  if (parsed.rows.length === 0) {
    errors.push("The CSV file does not contain any data rows to preview.");
  }

  if (parsed.rows.length > CSV_IMPORT_MAX_ROW_COUNT) {
    errors.push(
      `CSV preview is currently limited to ${CSV_IMPORT_MAX_ROW_COUNT} rows per upload.`,
    );
  }

  if (errors.length > 0 && (parsed.headers.length === 0 || parsed.rows.length === 0)) {
    return {
      draft: null,
      errors,
    };
  }

  return {
    draft: {
      csvText,
      delimiter: parsed.delimiter,
      fileName: trimmedFileName,
      fileSize,
      headers: parsed.headers,
      rows: parsed.rows,
    },
    errors,
  };
}

export function buildInitialCsvImportMapping(
  headers: string[],
): CsvImportColumnMapping {
  const headerLookup = new Map(
    headers.map((header) => [normalizeIdentifier(header), header]),
  );

  return {
    agency: findMappedHeader(headerLookup, [
      "agency",
      "lead agency",
      "organization",
      "organization name",
      "customer",
      "office",
    ]),
    description: findMappedHeader(headerLookup, [
      "description",
      "summary",
      "details",
      "opportunity description",
      "scope",
    ]),
    naicsCode: findMappedHeader(headerLookup, ["naics", "naics code"]),
    responseDeadlineAt: findMappedHeader(headerLookup, [
      "deadline",
      "response deadline",
      "due date",
      "proposal due date",
      "response due",
    ]),
    solicitationNumber: findMappedHeader(headerLookup, [
      "solicitation number",
      "solicitation",
      "sol number",
      "notice id",
      "notice",
    ]),
    title: findMappedHeader(headerLookup, [
      "opportunity title",
      "opportunity name",
      "title",
      "name",
      "project title",
    ]),
  };
}

export function parseCsvImportMapping(
  value: string | null | undefined,
  headers: string[],
): CsvImportColumnMapping | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = csvImportMappingSchema.parse(JSON.parse(value));

    for (const selectedHeader of Object.values(parsed)) {
      if (selectedHeader && !headers.includes(selectedHeader)) {
        return null;
      }
    }

    return parsed;
  } catch {
    return null;
  }
}

export function buildCsvImportPreview({
  draft,
  errors = [],
  mapping,
  workspace,
}: {
  draft: CsvImportDraft;
  errors?: string[];
  mapping: CsvImportColumnMapping;
  workspace: CsvImportWorkspaceSnapshot;
}): CsvImportPreview {
  const mappingErrors = validateCsvImportMapping({
    headers: draft.headers,
    mapping,
  });
  const seenDuplicateKeys = new Map<string, number>();
  const rows = draft.rows.map((row) =>
    buildCsvImportPreviewRow({
      row,
      mapping,
      workspace,
      seenDuplicateKeys,
    }),
  );

  return {
    globalErrors: [...errors],
    hasBlockingErrors: errors.length > 0 || mappingErrors.length > 0,
    headers: draft.headers,
    importableRows: rows.filter((row) => row.status === "ready"),
    mapping,
    mappingErrors,
    rowCount: rows.length,
    rows,
    summary: {
      duplicateRows: rows.filter((row) => row.status === "duplicate").length,
      invalidRows: rows.filter((row) => row.status === "invalid").length,
      readyRows: rows.filter((row) => row.status === "ready").length,
      reviewRows: rows.filter((row) => row.status === "review").length,
      totalRows: rows.length,
    },
  };
}

function buildCsvImportPreviewRow({
  row,
  mapping,
  workspace,
  seenDuplicateKeys,
}: {
  row: CsvImportRawRow;
  mapping: CsvImportColumnMapping;
  workspace: CsvImportWorkspaceSnapshot;
  seenDuplicateKeys: Map<string, number>;
}): CsvImportPreviewRow {
  const fieldErrors: CsvImportPreviewRow["fieldErrors"] = {};
  const warnings: string[] = [];
  const title = normalizeOptionalText(readMappedValue(row, mapping.title));
  const description = normalizeOptionalText(readMappedValue(row, mapping.description));
  const solicitationNumber = normalizeOptionalText(
    readMappedValue(row, mapping.solicitationNumber),
  );
  const naicsCode = normalizeOptionalText(readMappedValue(row, mapping.naicsCode));
  const agencyValue = normalizeOptionalText(readMappedValue(row, mapping.agency));
  const deadlineValue = normalizeOptionalText(
    readMappedValue(row, mapping.responseDeadlineAt),
  );

  if (!title || title.length < 3) {
    fieldErrors.title = "Provide a title with at least 3 characters.";
  } else if (title.length > 160) {
    fieldErrors.title = "Keep the title to 160 characters or fewer.";
  }

  if (description && description.length > 4000) {
    fieldErrors.description = "Keep the description to 4000 characters or fewer.";
  }

  if (solicitationNumber && solicitationNumber.length > 80) {
    fieldErrors.solicitationNumber =
      "Keep the solicitation number to 80 characters or fewer.";
  }

  if (naicsCode && !/^\d{2,6}$/.test(naicsCode)) {
    fieldErrors.naicsCode = "NAICS codes must contain 2 to 6 digits.";
  }

  const parsedResponseDeadline = parseFlexibleDate(deadlineValue);

  if (deadlineValue && !parsedResponseDeadline) {
    fieldErrors.responseDeadlineAt =
      "Enter the response deadline as YYYY-MM-DD or MM/DD/YYYY.";
  }

  const matchedAgency = findMatchingAgency(agencyValue, workspace.agencies);

  if (agencyValue && !matchedAgency) {
    warnings.push(
      "No exact agency match was found. The row will import without a linked agency.",
    );
  }

  const mappedValues: CsvImportMappedRow = {
    agencyLabel: matchedAgency?.label ?? null,
    csvAgencyValue: agencyValue,
    description,
    leadAgencyId: matchedAgency?.id ?? null,
    naicsCode,
    responseDeadlineAt: parsedResponseDeadline,
    solicitationNumber,
    title,
  };

  const duplicateCandidates = findCsvImportDuplicateCandidates({
    row: mappedValues,
    workspace,
  });
  const exactDuplicate = duplicateCandidates.find(
    (candidate) => candidate.matchKind === "exact",
  );
  const reviewDuplicate = duplicateCandidates.find(
    (candidate) => candidate.matchKind === "review",
  );
  const duplicateKey = buildInFileDuplicateKey(mappedValues);
  let inFileDuplicateRowNumber: number | null = null;

  if (duplicateKey) {
    const existingRowNumber = seenDuplicateKeys.get(duplicateKey) ?? null;

    if (existingRowNumber) {
      inFileDuplicateRowNumber = existingRowNumber;
    } else {
      seenDuplicateKeys.set(duplicateKey, row.rowNumber);
    }
  }

  if (inFileDuplicateRowNumber) {
    warnings.push(`This row duplicates row ${inFileDuplicateRowNumber} in the same file.`);
  }

  let status: CsvImportPreviewRow["status"] = "ready";
  let statusMessage = "Ready to import as a new tracked opportunity.";

  if (Object.keys(fieldErrors).length > 0) {
    status = "invalid";
    statusMessage = "Correct the highlighted fields before importing this row.";
  } else if (exactDuplicate || inFileDuplicateRowNumber) {
    status = "duplicate";
    statusMessage =
      "This row matches an existing tracked opportunity and will be skipped.";
  } else if (reviewDuplicate) {
    status = "review";
    statusMessage =
      "This row likely overlaps existing pipeline work and requires manual review.";
  }

  return {
    duplicateCandidates,
    fieldErrors,
    mappedValues,
    rowNumber: row.rowNumber,
    status,
    statusMessage,
    warnings,
  };
}

function findCsvImportDuplicateCandidates({
  row,
  workspace,
}: {
  row: CsvImportMappedRow;
  workspace: CsvImportWorkspaceSnapshot;
}): CsvImportDuplicateCandidate[] {
  const titleKey = normalizeIdentifier(row.title);
  const solicitationKey = normalizeIdentifier(row.solicitationNumber);
  const deadlineKey = row.responseDeadlineAt ?? null;
  const agencyKey = normalizeIdentifier(row.csvAgencyValue);
  const naicsKey = normalizeIdentifier(row.naicsCode);
  const candidates: CsvImportDuplicateCandidate[] = [];

  for (const opportunity of workspace.opportunities) {
    const matchReasons: string[] = [];
    let matchKind: CsvImportDuplicateCandidate["matchKind"] | null = null;

    if (
      solicitationKey &&
      (normalizeIdentifier(opportunity.solicitationNumber) === solicitationKey ||
        normalizeIdentifier(opportunity.externalNoticeId) === solicitationKey)
    ) {
      matchKind = "exact";
      matchReasons.push("Solicitation or notice identifier matches exactly.");
    } else if (
      titleKey &&
      normalizeIdentifier(opportunity.title) === titleKey &&
      ((deadlineKey &&
        normalizeNullableIsoDate(opportunity.responseDeadlineAt) === deadlineKey) ||
        (agencyKey &&
          (normalizeIdentifier(opportunity.leadAgencyName) === agencyKey ||
            normalizeIdentifier(opportunity.leadAgencyOrganizationCode) ===
              agencyKey)))
    ) {
      matchKind = "review";
      matchReasons.push("Opportunity title matches and another key field aligns.");
    }

    if (
      matchKind === "review" &&
      naicsKey &&
      normalizeIdentifier(opportunity.naicsCode) === naicsKey
    ) {
      matchReasons.push("NAICS code also matches.");
    }

    if (matchKind) {
      candidates.push({
        currentStageLabel: opportunity.currentStageLabel,
        matchKind,
        matchReasons,
        opportunityId: opportunity.id,
        title: opportunity.title,
      });
    }
  }

  return candidates.sort((left, right) => {
    if (left.matchKind !== right.matchKind) {
      return left.matchKind === "exact" ? -1 : 1;
    }

    return left.title.localeCompare(right.title);
  });
}

function validateCsvImportMapping({
  headers,
  mapping,
}: {
  headers: string[];
  mapping: CsvImportColumnMapping;
}) {
  const errors: string[] = [];
  const selectedHeaders = new Map<string, CsvImportFieldKey>();

  if (!mapping.title) {
    errors.push("Map one CSV column to Opportunity title before importing.");
  }

  for (const [fieldKey, header] of Object.entries(mapping) as Array<
    [CsvImportFieldKey, string | null]
  >) {
    if (!header) {
      continue;
    }

    if (!headers.includes(header)) {
      errors.push(`Mapped column "${header}" could not be found in the uploaded CSV.`);
      continue;
    }

    const existingField = selectedHeaders.get(header);

    if (existingField) {
      errors.push(
        `Column "${header}" cannot map to both ${humanizeFieldKey(existingField)} and ${humanizeFieldKey(fieldKey)}.`,
      );
    } else {
      selectedHeaders.set(header, fieldKey);
    }
  }

  return errors;
}

export function parseCsvText(csvText: string): {
  delimiter: "," | ";" | "\t";
  errors: string[];
  headers: string[];
  rows: CsvImportRawRow[];
} {
  const errors: string[] = [];
  const normalizedText = csvText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  if (normalizedText.trim().length === 0) {
    return {
      delimiter: ",",
      errors: ["The uploaded CSV file is empty."],
      headers: [],
      rows: [],
    };
  }

  const delimiter = detectCsvDelimiter(normalizedText);
  const parsedRows = parseDelimitedRows(normalizedText, delimiter);

  if (parsedRows.error) {
    return {
      delimiter,
      errors: [parsedRows.error],
      headers: [],
      rows: [],
    };
  }

  const nonEmptyRows = parsedRows.rows.filter((row) =>
    row.some((cell) => cell.trim().length > 0),
  );

  if (nonEmptyRows.length === 0) {
    return {
      delimiter,
      errors: ["The uploaded CSV file is empty."],
      headers: [],
      rows: [],
    };
  }

  const headers = normalizeCsvHeaders(nonEmptyRows[0]);
  const rows = nonEmptyRows.slice(1).map((cells, index) => ({
    rawValues: buildRowRecord(headers, cells),
    rowNumber: index + 2,
  }));

  return {
    delimiter,
    errors,
    headers,
    rows,
  };
}

function detectCsvDelimiter(csvText: string): "," | ";" | "\t" {
  const firstLine = csvText.split("\n", 1)[0] ?? "";
  const delimiterCounts: Array<["," | ";" | "\t", number]> = [
    [",", (firstLine.match(/,/g) ?? []).length],
    [";", (firstLine.match(/;/g) ?? []).length],
    ["\t", (firstLine.match(/\t/g) ?? []).length],
  ];

  delimiterCounts.sort((left, right) => right[1] - left[1]);
  return delimiterCounts[0]?.[1] ? delimiterCounts[0][0] : ",";
}

function parseDelimitedRows(
  csvText: string,
  delimiter: "," | ";" | "\t",
): {
  error: string | null;
  rows: string[][];
} {
  const rows: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (inQuotes) {
      if (character === "\"") {
        if (nextCharacter === "\"") {
          currentCell += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += character;
      }

      continue;
    }

    if (character === "\"") {
      inQuotes = true;
      continue;
    }

    if (character === delimiter) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if (character === "\n") {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += character;
  }

  if (inQuotes) {
    return {
      error: "The CSV file contains an unmatched quoted value.",
      rows: [],
    };
  }

  currentRow.push(currentCell);
  rows.push(currentRow);

  return {
    error: null,
    rows,
  };
}

function normalizeCsvHeaders(rawHeaders: string[]) {
  const seenHeaders = new Map<string, number>();

  return rawHeaders.map((rawHeader, index) => {
    const trimmedHeader = rawHeader.trim() || `Column ${index + 1}`;
    const normalizedHeader = trimmedHeader.replace(/\s+/g, " ");
    const nextCount = (seenHeaders.get(normalizedHeader) ?? 0) + 1;
    seenHeaders.set(normalizedHeader, nextCount);

    return nextCount === 1
      ? normalizedHeader
      : `${normalizedHeader} (${nextCount})`;
  });
}

function buildRowRecord(headers: string[], rawCells: string[]) {
  const record: Record<string, string> = {};

  for (let index = 0; index < headers.length; index += 1) {
    record[headers[index]] = rawCells[index] ?? "";
  }

  return record;
}

function readMappedValue(
  row: CsvImportRawRow,
  header: string | null,
) {
  if (!header) {
    return null;
  }

  return row.rawValues[header] ?? null;
}

function findMatchingAgency(
  csvValue: string | null,
  agencies: CsvImportAgencyOption[],
) {
  if (!csvValue) {
    return null;
  }

  const normalizedValue = normalizeIdentifier(csvValue);

  return (
    agencies.find(
      (agency) =>
        normalizeIdentifier(agency.name) === normalizedValue ||
        normalizeIdentifier(agency.organizationCode) === normalizedValue,
    ) ?? null
  );
}

function parseFlexibleDate(value: string | null) {
  if (!value) {
    return null;
  }

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    return normalizeIsoDateParts(isoMatch[1], isoMatch[2], isoMatch[3]);
  }

  const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashMatch) {
    return normalizeIsoDateParts(slashMatch[3], slashMatch[1], slashMatch[2]);
  }

  return null;
}

function normalizeIsoDateParts(
  yearString: string,
  monthString: string,
  dayString: string,
) {
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const parsedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return null;
  }

  return parsedDate.toISOString().slice(0, 10);
}

function buildInFileDuplicateKey(row: CsvImportMappedRow) {
  const solicitationKey = normalizeIdentifier(row.solicitationNumber);

  if (solicitationKey) {
    return `sol:${solicitationKey}`;
  }

  const titleKey = normalizeIdentifier(row.title);
  const deadlineKey = row.responseDeadlineAt;

  if (titleKey && deadlineKey) {
    return `title:${titleKey}:${deadlineKey}`;
  }

  return null;
}

function normalizeNullableIsoDate(value: string | null) {
  if (!value) {
    return null;
  }

  return value.slice(0, 10);
}

function findMappedHeader(
  headerLookup: Map<string, string>,
  aliases: string[],
) {
  for (const alias of aliases) {
    const header = headerLookup.get(normalizeIdentifier(alias));

    if (header) {
      return header;
    }
  }

  return null;
}

function normalizeOptionalText(value: string | null | undefined) {
  if (value == null) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeIdentifier(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function humanizeFieldKey(fieldKey: CsvImportFieldKey) {
  return (
    CSV_IMPORT_FIELD_DEFINITIONS.find((definition) => definition.key === fieldKey)
      ?.label ?? fieldKey
  );
}

function formatByteLimit(value: number) {
  return `${Math.round(value / 1024)} KB`;
}
