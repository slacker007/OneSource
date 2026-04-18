type SourceConnectorAuthType =
  | "API_KEY"
  | "OAUTH"
  | "SESSION"
  | "NONE"
  | "FILE_IMPORT";

export type SourceSearchConnectorSummary = {
  authType: SourceConnectorAuthType;
  connectorVersion: string | null;
  id: string;
  isEnabled: boolean;
  sourceDisplayName: string;
  sourceSystemKey: string;
  supportsResultPreview: boolean;
  supportsSearch: boolean;
  supportsScheduledSync: boolean;
};

export type SourceSearchFormValues = {
  ccode: string;
  keywords: string;
  limit: string;
  ncode: string;
  noticeid: string;
  offset: string;
  organizationCode: string;
  organizationName: string;
  postedFrom: string;
  postedTo: string;
  ptype: string[];
  rdlfrom: string;
  rdlto: string;
  solnum: string;
  source: string;
  state: string;
  status: string;
  typeOfSetAside: string;
  typeOfSetAsideDescription: string;
  zip: string;
};

export type CanonicalSourceSearchQuery = {
  classificationCode: string | null;
  keywords: string | null;
  naicsCode: string | null;
  noticeId: string | null;
  organizationCode: string | null;
  organizationName: string | null;
  pageOffset: number;
  pageSize: number;
  placeOfPerformanceState: string | null;
  placeOfPerformanceZip: string | null;
  postedDateFrom: string;
  postedDateTo: string;
  procurementTypes: string[];
  responseDeadlineFrom: string | null;
  responseDeadlineTo: string | null;
  setAsideCode: string | null;
  setAsideDescription: string | null;
  solicitationNumber: string | null;
  sourceSystem: string;
  status: string | null;
};

export type SamGovOutboundRequest = {
  endpoint: string;
  queryParams: {
    ccode?: string;
    limit: number;
    ncode?: string;
    noticeid?: string;
    offset: number;
    organizationCode?: string;
    organizationName?: string;
    postedFrom: string;
    postedTo: string;
    "ptype[]"?: string[];
    rdlfrom?: string;
    rdlto?: string;
    solnum?: string;
    state?: string;
    status?: string;
    title?: string;
    typeOfSetAside?: string;
    typeOfSetAsideDescription?: string;
    zip?: string;
  };
};

export type SourceSearchResultSummary = {
  id: string;
  noticeId: string;
  organizationCode: string | null;
  organizationName: string;
  placeOfPerformanceState: string | null;
  placeOfPerformanceZip: string | null;
  postedDate: string;
  procurementTypeCode: string;
  procurementTypeLabel: string;
  responseDeadline: string | null;
  setAsideDescription: string | null;
  solicitationNumber: string | null;
  sourceSystem: string;
  status: string;
  summary: string;
  title: string;
  uiLink: string;
};

export type SourceSearchCapability = {
  pageSizeOptions: number[];
  procurementTypes: Array<{
    description: string;
    label: string;
    value: string;
  }>;
  statusOptions: Array<{
    label: string;
    value: string;
  }>;
  supportedFilterLabels: string[];
};

export type SourceSearchRequestState = {
  formValues: SourceSearchFormValues;
  query: CanonicalSourceSearchQuery | null;
  validationErrors: string[];
};

export type SourceSearchSnapshot = {
  activeCapability: SourceSearchCapability;
  activeConnector: SourceSearchConnectorSummary | null;
  connectors: SourceSearchConnectorSummary[];
  executedAt: string | null;
  executionMessage: string;
  executionMode: "invalid_query" | "mocked_sam_gov" | "unsupported_connector";
  formValues: SourceSearchFormValues;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  outboundRequest: SamGovOutboundRequest | null;
  pageResultCount: number;
  query: CanonicalSourceSearchQuery | null;
  resultCountLabel: string;
  results: SourceSearchResultSummary[];
  totalCount: number;
  validationErrors: string[];
};

const DEFAULT_ORGANIZATION_SLUG = "default-org";
const DEFAULT_POSTED_FROM = "2026-03-01";
const DEFAULT_POSTED_TO = "2026-04-30";
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_PAGE_OFFSET = 0;
const SAM_GOV_SEARCH_ENDPOINT = "https://api.sam.gov/opportunities/v2/search";

const SAM_GOV_PROCUREMENT_TYPE_OPTIONS = [
  { value: "u", label: "Justification (J&A)", description: "Justification and approval notices." },
  { value: "p", label: "Pre-solicitation", description: "Pre-solicitation market notices." },
  { value: "a", label: "Award Notice", description: "Awarded procurement notices." },
  { value: "r", label: "Sources Sought", description: "Early market research and capability requests." },
  { value: "s", label: "Special Notice", description: "Special procurement or informational notices." },
  { value: "o", label: "Solicitation", description: "Solicitation opportunities open for response." },
  { value: "g", label: "Sale of Surplus Property", description: "Government surplus property sales." },
  { value: "k", label: "Combined Synopsis/Solicitation", description: "Combined synopsis and solicitation notices." },
  { value: "i", label: "Intent to Bundle Requirements", description: "DoD-funded bundling intent notices." },
] as const;

const SAM_GOV_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
  { value: "cancelled", label: "Cancelled" },
  { value: "deleted", label: "Deleted" },
] as const;

const SAM_GOV_CAPABILITY: SourceSearchCapability = {
  pageSizeOptions: [10, 25, 50, 100],
  procurementTypes: [...SAM_GOV_PROCUREMENT_TYPE_OPTIONS],
  statusOptions: [...SAM_GOV_STATUS_OPTIONS],
  supportedFilterLabels: [
    "posted date range",
    "response deadline range",
    "notice ID",
    "solicitation number",
    "procurement type",
    "organization name and code",
    "NAICS and classification code",
    "set-aside",
    "place of performance",
    "status",
    "page size and offset",
  ],
};

export type SourceSearchRepositoryClient = {
  organization: {
    findUnique(args: {
      where: {
        slug: string;
      };
    } & typeof organizationSourceSearchArgs): Promise<OrganizationSourceSearchRecord | null>;
  };
};

const organizationSourceSearchArgs = {
  select: {
    id: true,
    name: true,
    slug: true,
    sourceConnectorConfigs: {
      orderBy: {
        sourceDisplayName: "asc",
      },
      select: {
        id: true,
        sourceSystemKey: true,
        sourceDisplayName: true,
        authType: true,
        isEnabled: true,
        supportsSearch: true,
        supportsScheduledSync: true,
        supportsResultPreview: true,
        connectorVersion: true,
      },
    },
  },
};

type OrganizationSourceSearchRecord = {
  id: string;
  name: string;
  slug: string;
  sourceConnectorConfigs: SourceSearchConnectorSummary[];
};

type MockSamGovSearchResult = SourceSearchResultSummary & {
  classificationCode: string | null;
  naicsCode: string | null;
  setAsideCode: string | null;
};

const SAM_GOV_MOCK_RESULTS: MockSamGovSearchResult[] = [
  {
    id: "sam_result_1",
    sourceSystem: "sam_gov",
    noticeId: "FA4861-26-R-0001",
    title: "Enterprise Knowledge Management Support Services",
    solicitationNumber: "FA4861-26-R-0001",
    organizationName: "99th Contracting Squadron",
    organizationCode: "FA4861",
    postedDate: "2026-04-12",
    responseDeadline: "2026-05-04",
    procurementTypeCode: "o",
    procurementTypeLabel: "Solicitation",
    status: "active",
    naicsCode: "541511",
    classificationCode: "R408",
    setAsideCode: "SBA",
    setAsideDescription: "Total Small Business Set-Aside",
    placeOfPerformanceState: "NV",
    placeOfPerformanceZip: "89191",
    summary:
      "Knowledge management, workflow modernization, and capture-support services for Air Force contracting operations.",
    uiLink: "https://sam.gov/opp/FA4861-26-R-0001/view",
  },
  {
    id: "sam_result_2",
    sourceSystem: "sam_gov",
    noticeId: "W91QUZ-26-R-1042",
    title: "Army Cloud Operations Recompete",
    solicitationNumber: "W91QUZ-26-R-1042",
    organizationName: "PEO Enterprise Information Systems",
    organizationCode: "W91QUZ",
    postedDate: "2026-04-08",
    responseDeadline: "2026-05-20",
    procurementTypeCode: "r",
    procurementTypeLabel: "Sources Sought",
    status: "active",
    naicsCode: "541512",
    classificationCode: "D302",
    setAsideCode: null,
    setAsideDescription: null,
    placeOfPerformanceState: "VA",
    placeOfPerformanceZip: "22350",
    summary:
      "Cloud operations, sustainment, and platform engineering support for Army enterprise systems.",
    uiLink: "https://sam.gov/opp/W91QUZ-26-R-1042/view",
  },
  {
    id: "sam_result_3",
    sourceSystem: "sam_gov",
    noticeId: "36C10B26Q0142",
    title: "VA Claims Intake Automation BPA",
    solicitationNumber: "36C10B26Q0142",
    organizationName: "Department of Veterans Affairs",
    organizationCode: "36C10B",
    postedDate: "2026-03-29",
    responseDeadline: "2026-04-26",
    procurementTypeCode: "k",
    procurementTypeLabel: "Combined Synopsis/Solicitation",
    status: "active",
    naicsCode: "541519",
    classificationCode: "R499",
    setAsideCode: "SDVOSB",
    setAsideDescription: "Service-Disabled Veteran-Owned Small Business Set-Aside",
    placeOfPerformanceState: "TX",
    placeOfPerformanceZip: "78758",
    summary:
      "Claims-intake automation and analytics support for a nationwide modernization effort.",
    uiLink: "https://sam.gov/opp/36C10B26Q0142/view",
  },
  {
    id: "sam_result_4",
    sourceSystem: "sam_gov",
    noticeId: "N00189-26-R-0088",
    title: "Navy Logistics Data Support Bridge",
    solicitationNumber: "N00189-26-R-0088",
    organizationName: "NAVSUP Fleet Logistics Center Norfolk",
    organizationCode: "N00189",
    postedDate: "2026-02-17",
    responseDeadline: "2026-03-19",
    procurementTypeCode: "s",
    procurementTypeLabel: "Special Notice",
    status: "archived",
    naicsCode: "541614",
    classificationCode: "R706",
    setAsideCode: null,
    setAsideDescription: null,
    placeOfPerformanceState: "VA",
    placeOfPerformanceZip: "23511",
    summary:
      "Bridge support for logistics data quality, reporting, and inventory visibility.",
    uiLink: "https://sam.gov/opp/N00189-26-R-0088/view",
  },
];

export function parseSourceSearchParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): SourceSearchRequestState {
  const validationErrors: string[] = [];
  const procurementTypes = normalizeProcurementTypes(
    getSearchParamValues(searchParams?.ptype),
    validationErrors,
  );

  const source = normalizeOptionalString(getFirstSearchParamValue(searchParams?.source)) ?? "sam_gov";
  const keywords = normalizeOptionalString(getFirstSearchParamValue(searchParams?.keywords)) ?? "";
  const noticeid = normalizeOptionalString(getFirstSearchParamValue(searchParams?.noticeid)) ?? "";
  const solnum = normalizeOptionalString(getFirstSearchParamValue(searchParams?.solnum)) ?? "";
  const organizationName =
    normalizeOptionalString(getFirstSearchParamValue(searchParams?.organizationName)) ?? "";
  const organizationCode =
    normalizeOptionalString(getFirstSearchParamValue(searchParams?.organizationCode)) ?? "";
  const ncode = normalizeOptionalString(getFirstSearchParamValue(searchParams?.ncode)) ?? "";
  const ccode = normalizeOptionalString(getFirstSearchParamValue(searchParams?.ccode)) ?? "";
  const typeOfSetAside =
    normalizeOptionalString(getFirstSearchParamValue(searchParams?.typeOfSetAside)) ?? "";
  const typeOfSetAsideDescription =
    normalizeOptionalString(
      getFirstSearchParamValue(searchParams?.typeOfSetAsideDescription),
    ) ?? "";
  const state = normalizeUppercaseOptionalString(getFirstSearchParamValue(searchParams?.state)) ?? "";
  const zip = normalizeOptionalString(getFirstSearchParamValue(searchParams?.zip)) ?? "";
  const status =
    normalizeOptionalString(getFirstSearchParamValue(searchParams?.status)) ?? "active";

  const postedFrom = normalizeRequiredDateSearchParam({
    defaultValue: DEFAULT_POSTED_FROM,
    fieldLabel: "Posted from",
    rawValue: getFirstSearchParamValue(searchParams?.postedFrom),
    validationErrors,
  });
  const postedTo = normalizeRequiredDateSearchParam({
    defaultValue: DEFAULT_POSTED_TO,
    fieldLabel: "Posted to",
    rawValue: getFirstSearchParamValue(searchParams?.postedTo),
    validationErrors,
  });
  const responseDeadlineFrom = normalizeOptionalDateSearchParam({
    fieldLabel: "Response deadline from",
    rawValue: getFirstSearchParamValue(searchParams?.rdlfrom),
    validationErrors,
  });
  const responseDeadlineTo = normalizeOptionalDateSearchParam({
    fieldLabel: "Response deadline to",
    rawValue: getFirstSearchParamValue(searchParams?.rdlto),
    validationErrors,
  });
  const limit = normalizeNumberSearchParam({
    defaultValue: DEFAULT_PAGE_SIZE,
    fieldLabel: "Page size",
    minimum: 1,
    rawValue: getFirstSearchParamValue(searchParams?.limit),
    validationErrors,
  });
  const offset = normalizeNumberSearchParam({
    defaultValue: DEFAULT_PAGE_OFFSET,
    fieldLabel: "Offset",
    minimum: 0,
    rawValue: getFirstSearchParamValue(searchParams?.offset),
    validationErrors,
  });

  if (!SAM_GOV_STATUS_OPTIONS.some((option) => option.value === status)) {
    validationErrors.push(
      "Status must be one of: active, inactive, archived, cancelled, deleted, or blank for all statuses.",
    );
  }

  validateDateRange({
    fieldLabel: "Posted date range",
    fromIsoDate: postedFrom.isoDate,
    toIsoDate: postedTo.isoDate,
    validationErrors,
  });
  validateDateRange({
    fieldLabel: "Response deadline range",
    fromIsoDate: responseDeadlineFrom.isoDate,
    toIsoDate: responseDeadlineTo.isoDate,
    validationErrors,
  });

  if (limit.value > 1000) {
    validationErrors.push("Page size cannot exceed 1000 for sam.gov searches.");
  }

  const formValues: SourceSearchFormValues = {
    source,
    keywords,
    postedFrom: postedFrom.formValue,
    postedTo: postedTo.formValue,
    rdlfrom: responseDeadlineFrom.formValue,
    rdlto: responseDeadlineTo.formValue,
    ptype: procurementTypes,
    noticeid,
    solnum,
    organizationName,
    organizationCode,
    ncode,
    ccode,
    typeOfSetAside,
    typeOfSetAsideDescription,
    state,
    zip,
    status,
    limit: String(limit.value),
    offset: String(offset.value),
  };

  if (validationErrors.length > 0) {
    return {
      formValues,
      query: null,
      validationErrors,
    };
  }

  return {
    formValues,
    query: {
      sourceSystem: source,
      keywords: emptyStringToNull(keywords),
      postedDateFrom: postedFrom.isoDate as string,
      postedDateTo: postedTo.isoDate as string,
      responseDeadlineFrom: responseDeadlineFrom.isoDate,
      responseDeadlineTo: responseDeadlineTo.isoDate,
      procurementTypes,
      noticeId: emptyStringToNull(noticeid),
      solicitationNumber: emptyStringToNull(solnum),
      organizationName: emptyStringToNull(organizationName),
      organizationCode: emptyStringToNull(organizationCode),
      naicsCode: emptyStringToNull(ncode),
      classificationCode: emptyStringToNull(ccode),
      setAsideCode: emptyStringToNull(typeOfSetAside),
      setAsideDescription: emptyStringToNull(typeOfSetAsideDescription),
      placeOfPerformanceState: emptyStringToNull(state),
      placeOfPerformanceZip: emptyStringToNull(zip),
      status: emptyStringToNull(status),
      pageSize: limit.value,
      pageOffset: offset.value,
    },
    validationErrors: [],
  };
}

export function buildSamGovOutboundRequest(
  query: CanonicalSourceSearchQuery,
): SamGovOutboundRequest {
  const queryParams: SamGovOutboundRequest["queryParams"] = {
    postedFrom: formatDateForSamGov(query.postedDateFrom),
    postedTo: formatDateForSamGov(query.postedDateTo),
    limit: query.pageSize,
    offset: query.pageOffset,
  };

  assignIfPresent(queryParams, "title", query.keywords);
  assignIfPresent(queryParams, "noticeid", query.noticeId);
  assignIfPresent(queryParams, "solnum", query.solicitationNumber);
  assignIfPresent(queryParams, "organizationName", query.organizationName);
  assignIfPresent(queryParams, "organizationCode", query.organizationCode);
  assignIfPresent(queryParams, "ncode", query.naicsCode);
  assignIfPresent(queryParams, "ccode", query.classificationCode);
  assignIfPresent(queryParams, "typeOfSetAside", query.setAsideCode);
  assignIfPresent(
    queryParams,
    "typeOfSetAsideDescription",
    query.setAsideDescription,
  );
  assignIfPresent(queryParams, "state", query.placeOfPerformanceState);
  assignIfPresent(queryParams, "zip", query.placeOfPerformanceZip);
  assignIfPresent(queryParams, "status", query.status);

  if (query.procurementTypes.length > 0) {
    queryParams["ptype[]"] = query.procurementTypes;
  }

  if (query.responseDeadlineFrom) {
    queryParams.rdlfrom = formatDateForSamGov(query.responseDeadlineFrom);
  }

  if (query.responseDeadlineTo) {
    queryParams.rdlto = formatDateForSamGov(query.responseDeadlineTo);
  }

  return {
    endpoint: SAM_GOV_SEARCH_ENDPOINT,
    queryParams,
  };
}

export function executeMockSamGovSearch(query: CanonicalSourceSearchQuery) {
  const outboundRequest = buildSamGovOutboundRequest(query);
  const filteredResults = SAM_GOV_MOCK_RESULTS.filter((result) =>
    matchesMockSamGovResult(result, query),
  ).sort(compareMockSearchResults);
  const pagedResults = filteredResults.slice(
    query.pageOffset,
    query.pageOffset + query.pageSize,
  );

  return {
    outboundRequest,
    results: pagedResults,
    totalCount: filteredResults.length,
  };
}

export async function getSourceSearchSnapshot({
  db,
  organizationSlug = DEFAULT_ORGANIZATION_SLUG,
  searchParams,
}: {
  db: SourceSearchRepositoryClient;
  organizationSlug?: string;
  searchParams?: Record<string, string | string[] | undefined>;
}): Promise<SourceSearchSnapshot | null> {
  const organization = (await db.organization.findUnique({
    where: {
      slug: organizationSlug,
    },
    ...organizationSourceSearchArgs,
  })) as OrganizationSourceSearchRecord | null;

  if (!organization) {
    return null;
  }

  const requestState = parseSourceSearchParams(searchParams);
  const activeConnector =
    organization.sourceConnectorConfigs.find(
      (connector) => connector.sourceSystemKey === requestState.formValues.source,
    ) ?? null;

  if (requestState.validationErrors.length > 0) {
    return {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      connectors: organization.sourceConnectorConfigs,
      activeConnector,
      activeCapability: SAM_GOV_CAPABILITY,
      formValues: requestState.formValues,
      query: null,
      validationErrors: requestState.validationErrors,
      results: [],
      totalCount: 0,
      pageResultCount: 0,
      executedAt: null,
      executionMode: "invalid_query",
      executionMessage:
        "Search execution is blocked until the current filter values satisfy the typed sam.gov contract.",
      outboundRequest: null,
      resultCountLabel: "Search not executed",
    };
  }

  if (
    requestState.query?.sourceSystem !== "sam_gov" ||
    !activeConnector?.supportsSearch ||
    !activeConnector?.isEnabled
  ) {
    return {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      connectors: organization.sourceConnectorConfigs,
      activeConnector,
      activeCapability: SAM_GOV_CAPABILITY,
      formValues: requestState.formValues,
      query: requestState.query,
      validationErrors: [],
      results: [],
      totalCount: 0,
      pageResultCount: 0,
      executedAt: null,
      executionMode: "unsupported_connector",
      executionMessage:
        "This slice only ships mocked sam.gov search responses. Other configured connectors remain visible so the page can grow into the broader connector framework later.",
      outboundRequest: null,
      resultCountLabel: "Connector not yet implemented",
    };
  }

  const executedAt = new Date().toISOString();
  const execution = executeMockSamGovSearch(requestState.query);
  const pageStart =
    execution.totalCount === 0 ? 0 : requestState.query.pageOffset + 1;
  const pageEnd =
    execution.totalCount === 0
      ? 0
      : requestState.query.pageOffset + execution.results.length;

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    },
    connectors: organization.sourceConnectorConfigs,
    activeConnector,
    activeCapability: SAM_GOV_CAPABILITY,
    formValues: requestState.formValues,
    query: requestState.query,
    validationErrors: [],
    results: execution.results,
    totalCount: execution.totalCount,
    pageResultCount: execution.results.length,
    executedAt,
    executionMode: "mocked_sam_gov",
    executionMessage:
      "The page translated the canonical query into sam.gov search parameters and executed a deterministic mocked response set so UI work can land before the live connector.",
    outboundRequest: execution.outboundRequest,
    resultCountLabel: `Showing ${pageStart}-${pageEnd} of ${execution.totalCount} mocked external results`,
  };
}

function matchesMockSamGovResult(
  result: MockSamGovSearchResult,
  query: CanonicalSourceSearchQuery,
) {
  if (result.postedDate < query.postedDateFrom || result.postedDate > query.postedDateTo) {
    return false;
  }

  if (query.responseDeadlineFrom || query.responseDeadlineTo) {
    if (!result.responseDeadline) {
      return false;
    }

    if (
      query.responseDeadlineFrom &&
      result.responseDeadline < query.responseDeadlineFrom
    ) {
      return false;
    }

    if (query.responseDeadlineTo && result.responseDeadline > query.responseDeadlineTo) {
      return false;
    }
  }

  if (
    query.procurementTypes.length > 0 &&
    !query.procurementTypes.includes(result.procurementTypeCode)
  ) {
    return false;
  }

  if (
    query.keywords &&
    !matchesCaseInsensitive(result.title, query.keywords) &&
    !matchesCaseInsensitive(result.summary, query.keywords) &&
    !matchesCaseInsensitive(result.organizationName, query.keywords)
  ) {
    return false;
  }

  if (query.noticeId && result.noticeId.toUpperCase() !== query.noticeId.toUpperCase()) {
    return false;
  }

  if (
    query.solicitationNumber &&
    !matchesCaseInsensitive(result.solicitationNumber, query.solicitationNumber)
  ) {
    return false;
  }

  if (
    query.organizationName &&
    !matchesCaseInsensitive(result.organizationName, query.organizationName)
  ) {
    return false;
  }

  if (
    query.organizationCode &&
    !matchesCaseInsensitive(result.organizationCode, query.organizationCode)
  ) {
    return false;
  }

  if (query.naicsCode && !matchesCaseInsensitive(result.naicsCode, query.naicsCode)) {
    return false;
  }

  if (
    query.classificationCode &&
    !matchesCaseInsensitive(result.classificationCode, query.classificationCode)
  ) {
    return false;
  }

  if (
    query.setAsideCode &&
    !matchesCaseInsensitive(result.setAsideCode, query.setAsideCode)
  ) {
    return false;
  }

  if (
    query.setAsideDescription &&
    !matchesCaseInsensitive(result.setAsideDescription, query.setAsideDescription)
  ) {
    return false;
  }

  if (
    query.placeOfPerformanceState &&
    !matchesCaseInsensitive(
      result.placeOfPerformanceState,
      query.placeOfPerformanceState,
    )
  ) {
    return false;
  }

  if (
    query.placeOfPerformanceZip &&
    !matchesCaseInsensitive(result.placeOfPerformanceZip, query.placeOfPerformanceZip)
  ) {
    return false;
  }

  if (query.status && result.status !== query.status) {
    return false;
  }

  return true;
}

function compareMockSearchResults(
  left: MockSamGovSearchResult,
  right: MockSamGovSearchResult,
) {
  if (left.postedDate !== right.postedDate) {
    return right.postedDate.localeCompare(left.postedDate);
  }

  return left.title.localeCompare(right.title);
}

function normalizeProcurementTypes(
  values: string[],
  validationErrors: string[],
) {
  const validValues = new Set<string>(
    SAM_GOV_PROCUREMENT_TYPE_OPTIONS.map((option) => option.value),
  );
  const normalizedValues = Array.from(
    new Set(
      values
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  for (const value of normalizedValues) {
    if (!validValues.has(value)) {
      validationErrors.push(`Unsupported procurement type code: ${value}.`);
    }
  }

  return normalizedValues.filter((value) => validValues.has(value));
}

function normalizeRequiredDateSearchParam({
  defaultValue,
  fieldLabel,
  rawValue,
  validationErrors,
}: {
  defaultValue: string;
  fieldLabel: string;
  rawValue: string | undefined;
  validationErrors: string[];
}) {
  const normalized = normalizeDateInput(rawValue);

  if (!rawValue) {
    return {
      formValue: defaultValue,
      isoDate: defaultValue,
    };
  }

  if (!normalized) {
    validationErrors.push(
      `${fieldLabel} must use YYYY-MM-DD or MM/DD/YYYY formatting.`,
    );

    return {
      formValue: defaultValue,
      isoDate: defaultValue,
    };
  }

  return {
    formValue: normalized,
    isoDate: normalized,
  };
}

function normalizeOptionalDateSearchParam({
  fieldLabel,
  rawValue,
  validationErrors,
}: {
  fieldLabel: string;
  rawValue: string | undefined;
  validationErrors: string[];
}) {
  if (!rawValue) {
    return {
      formValue: "",
      isoDate: null,
    };
  }

  const normalized = normalizeDateInput(rawValue);

  if (!normalized) {
    validationErrors.push(
      `${fieldLabel} must use YYYY-MM-DD or MM/DD/YYYY formatting.`,
    );

    return {
      formValue: "",
      isoDate: null,
    };
  }

  return {
    formValue: normalized,
    isoDate: normalized,
  };
}

function normalizeNumberSearchParam({
  defaultValue,
  fieldLabel,
  minimum,
  rawValue,
  validationErrors,
}: {
  defaultValue: number;
  fieldLabel: string;
  minimum: number;
  rawValue: string | undefined;
  validationErrors: string[];
}) {
  if (!rawValue) {
    return {
      value: defaultValue,
    };
  }

  const parsed = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < minimum) {
    validationErrors.push(`${fieldLabel} must be a whole number of at least ${minimum}.`);

    return {
      value: defaultValue,
    };
  }

  return {
    value: parsed,
  };
}

function validateDateRange({
  fieldLabel,
  fromIsoDate,
  toIsoDate,
  validationErrors,
}: {
  fieldLabel: string;
  fromIsoDate: string | null;
  toIsoDate: string | null;
  validationErrors: string[];
}) {
  if (!fromIsoDate || !toIsoDate) {
    return;
  }

  if (fromIsoDate > toIsoDate) {
    validationErrors.push(`${fieldLabel} cannot end before it starts.`);
    return;
  }

  const fromDate = new Date(`${fromIsoDate}T00:00:00.000Z`);
  const toDate = new Date(`${toIsoDate}T00:00:00.000Z`);
  const oneYearLater = new Date(fromDate.getTime());
  oneYearLater.setUTCFullYear(oneYearLater.getUTCFullYear() + 1);

  if (toDate > oneYearLater) {
    validationErrors.push(`${fieldLabel} cannot exceed one year.`);
  }
}

function normalizeDateInput(value: string | undefined) {
  const trimmed = normalizeOptionalString(value);

  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = new Date(`${trimmed}T00:00:00.000Z`);

    if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(trimmed)) {
      return trimmed;
    }

    return null;
  }

  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, month, day, year] = match;
  const isoDate = `${year}-${month}-${day}`;
  const parsed = new Date(`${isoDate}T00:00:00.000Z`);

  if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(isoDate)) {
    return isoDate;
  }

  return null;
}

function formatDateForSamGov(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year}`;
}

function assignIfPresent<
  Key extends keyof SamGovOutboundRequest["queryParams"],
>(
  queryParams: SamGovOutboundRequest["queryParams"],
  key: Key,
  value: string | null,
) {
  if (value) {
    queryParams[key] = value as SamGovOutboundRequest["queryParams"][Key];
  }
}

function matchesCaseInsensitive(
  haystack: string | null | undefined,
  needle: string,
) {
  if (!haystack) {
    return false;
  }

  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function emptyStringToNull(value: string) {
  return value === "" ? null : value;
}

function normalizeOptionalString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeUppercaseOptionalString(value: string | undefined) {
  const normalized = normalizeOptionalString(value);
  return normalized ? normalized.toUpperCase() : null;
}

function getFirstSearchParamValue(
  value: string | string[] | undefined,
) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getSearchParamValues(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}
