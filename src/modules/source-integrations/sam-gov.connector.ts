import { ProxyAgent, type Dispatcher } from "undici";

const DEFAULT_SAM_GOV_SEARCH_ENDPOINT =
  "https://api.sam.gov/prod/opportunities/v2/search";
const SAM_GOV_NORMALIZATION_VERSION = "sam-gov.v1";
const proxyAgentsByUrl = new Map<string, ProxyAgent>();

type CanonicalSourceSearchQueryShape = {
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

type SourceSearchResultSummaryShape = {
  id: string;
  naicsCode: string | null;
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

export type SamGovSourceRecordMaterialized = {
  attachments: Array<{
    displayLabel: string | null;
    externalId: string | null;
    fileSizeBytes: number | null;
    linkType: string;
    metadata: Record<string, unknown> | null;
    mimeType: string | null;
    sortOrder: number;
    sourceFileName: string | null;
    url: string;
  }>;
  award: {
    awardAmount: string | number | null;
    awardDate: string | null;
    awardNumber: string | null;
    awardeeCityCode: string | null;
    awardeeCityName: string | null;
    awardeeCountryCode: string | null;
    awardeeCountryName: string | null;
    awardeeName: string | null;
    awardeePostalCode: string | null;
    awardeeStateCode: string | null;
    awardeeStateName: string | null;
    awardeeStreet1: string | null;
    awardeeStreet2: string | null;
    awardeeUEI: string | null;
  } | null;
  contacts: Array<{
    additionalInfoText: string | null;
    contactType: string | null;
    email: string | null;
    fax: string | null;
    fullName: string | null;
    phone: string | null;
    sortOrder: number;
    title: string | null;
  }>;
  importPreviewPayload: Record<string, unknown>;
  normalizedPayload: Record<string, unknown>;
  rawPayload: Record<string, unknown>;
  sourceDescriptionUrl: string | null;
  sourceDetailUrl: string | null;
  sourceHashFingerprint: string;
  sourceRecordId: string;
  sourceUiUrl: string | null;
  summary: SourceSearchResultSummaryShape;
  warnings: string[];
};

export type SamGovSearchExecutionResult = {
  executionMode: "fixture_connector" | "live_connector";
  httpStatus: number;
  materializedRecords: SamGovSourceRecordMaterialized[];
  outboundRequest: SamGovOutboundRequest;
  responseLatencyMs: number;
  totalRecords: number;
};

export type SamGovConnectorConfig = {
  connectorVersion: string | null;
  credentialReference: string | null;
  searchEndpoint: string;
};

export class SamGovConnectorError extends Error {
  code: string;
  httpStatus: number | null;
  outboundRequest: SamGovOutboundRequest;
  responseLatencyMs: number;

  constructor({
    code,
    httpStatus,
    message,
    outboundRequest,
    responseLatencyMs,
  }: {
    code: string;
    httpStatus: number | null;
    message: string;
    outboundRequest: SamGovOutboundRequest;
    responseLatencyMs: number;
  }) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.outboundRequest = outboundRequest;
    this.responseLatencyMs = responseLatencyMs;
  }
}

export const SAM_GOV_PROCUREMENT_TYPE_OPTIONS = [
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

export const SAM_GOV_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
  { value: "cancelled", label: "Cancelled" },
  { value: "deleted", label: "Deleted" },
] as const;

export const SAM_GOV_CAPABILITY = {
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
} as const;

type SamGovRequestInit = RequestInit & {
  dispatcher?: Dispatcher;
};

type HttpClient = (
  input: string | URL | Request,
  init?: SamGovRequestInit,
) => Promise<Response>;

type SamGovFixtureRecord = Record<string, unknown>;

const SAM_GOV_FIXTURE_RECORDS: SamGovFixtureRecord[] = [
  {
    active: "Yes",
    additionalInfoLink: "https://sam.gov/opp/FA4861-26-R-0001/resources",
    archiveDate: null,
    archiveType: null,
    baseType: "Solicitation",
    classificationCode: "R408",
    department: "Department of the Air Force",
    description:
      "Knowledge management, workflow modernization, and capture-support services for Air Force contracting operations.",
    fullParentPathCode: "FA4861",
    fullParentPathName:
      "Department of the Air Force > Air Combat Command > 99th Contracting Squadron",
    links: {
      self: {
        href: "https://api.sam.gov/prod/opportunities/v2/FA4861-26-R-0001",
      },
    },
    naicsCode: "541511",
    noticeId: "FA4861-26-R-0001",
    office: "99th Contracting Squadron",
    officeAddress: {
      city: "Nellis AFB",
      countryCode: "USA",
      state: "NV",
      zip: "89191",
    },
    organizationCode: "FA4861",
    organizationName: "99th Contracting Squadron",
    organizationType: "OFFICE",
    placeOfPerformance: {
      city: { code: null, name: "Nellis AFB" },
      country: { code: "USA" },
      state: { code: "NV", name: "Nevada" },
      streetAddress: "4700 Grissom Ave",
      streetAddress2: "Suite 100",
      zip: "89191",
    },
    pointOfContact: [
      {
        additionalInfo: {
          content:
            "Use the public opportunity page for amendments and procurement updates.",
        },
        email: "fa4861@agency.example.gov",
        fullName: "99th Contracting Lead",
        phone: "555-010-0001",
        title: "Contracting Officer",
        type: "primary",
      },
    ],
    postedDate: "04/12/2026",
    procurementTypeCode: "o",
    resourceLinks: [
      "https://sam.gov/opp/FA4861-26-R-0001/documents/performance-work-statement.pdf",
      "https://sam.gov/opp/FA4861-26-R-0001/documents/questions-and-answers.xlsx",
    ],
    responseDeadLine: "05/04/2026",
    solicitationNumber: "FA4861-26-R-0001",
    status: "active",
    subTier: "Air Combat Command",
    title: "Enterprise Knowledge Management Support Services",
    type: "Solicitation",
    typeOfSetAside: "SBA",
    typeOfSetAsideDescription: "Total Small Business Set-Aside",
    uiLink: "https://sam.gov/opp/FA4861-26-R-0001/view",
  },
  {
    active: "Yes",
    additionalInfoLink: "https://sam.gov/opp/W91QUZ-26-R-1042/resources",
    archiveDate: null,
    archiveType: null,
    baseType: "Sources Sought",
    classificationCode: "D302",
    department: "Department of the Army",
    description:
      "Cloud operations, sustainment, and platform engineering support for Army enterprise systems.",
    fullParentPathCode: "W91QUZ",
    fullParentPathName:
      "Department of the Army > PEO Enterprise Information Systems > PEO Enterprise Information Systems",
    links: {
      self: {
        href: "https://api.sam.gov/prod/opportunities/v2/W91QUZ-26-R-1042",
      },
    },
    naicsCode: "541512",
    noticeId: "W91QUZ-26-R-1042",
    office: "Army Contracting Command",
    officeAddress: {
      city: "Fort Belvoir",
      countryCode: "USA",
      state: "VA",
      zip: "22350",
    },
    organizationCode: "W91QUZ",
    organizationName: "PEO Enterprise Information Systems",
    organizationType: "OFFICE",
    placeOfPerformance: {
      city: { code: null, name: "Fort Belvoir" },
      country: { code: "USA" },
      state: { code: "VA", name: "Virginia" },
      streetAddress: "9800 Savage Road",
      streetAddress2: null,
      zip: "22350",
    },
    pointOfContact: [
      {
        additionalInfo: {
          content:
            "Use the public opportunity page for amendments and procurement updates.",
        },
        email: "w91quz@agency.example.gov",
        fullName: "PEO Contracting Lead",
        phone: "555-010-1042",
        title: "Contracting Officer",
        type: "primary",
      },
    ],
    postedDate: "04/08/2026",
    procurementTypeCode: "r",
    resourceLinks: [
      "https://sam.gov/opp/W91QUZ-26-R-1042/documents/draft-pws.pdf",
    ],
    responseDeadLine: "05/20/2026",
    solicitationNumber: "W91QUZ-26-R-1042",
    status: "active",
    subTier: "PEO Enterprise Information Systems",
    title: "Army Cloud Operations Recompete",
    type: "Sources Sought",
    typeOfSetAside: null,
    typeOfSetAsideDescription: null,
    uiLink: "https://sam.gov/opp/W91QUZ-26-R-1042/view",
  },
  {
    active: "Yes",
    additionalInfoLink: "https://sam.gov/opp/36C10B26Q0142/resources",
    archiveDate: null,
    archiveType: null,
    baseType: "Combined Synopsis/Solicitation",
    classificationCode: "R499",
    department: "Department of Veterans Affairs",
    description:
      "Claims-intake automation and analytics support for a nationwide modernization effort.",
    fullParentPathCode: "36C10B",
    fullParentPathName:
      "Department of Veterans Affairs > Technology Acquisition Center > Department of Veterans Affairs",
    links: {
      self: {
        href: "https://api.sam.gov/prod/opportunities/v2/36C10B26Q0142",
      },
    },
    naicsCode: "541519",
    noticeId: "36C10B26Q0142",
    office: "Department of Veterans Affairs",
    officeAddress: {
      city: "Austin",
      countryCode: "USA",
      state: "TX",
      zip: "78758",
    },
    organizationCode: "36C10B",
    organizationName: "Department of Veterans Affairs",
    organizationType: "OFFICE",
    placeOfPerformance: {
      city: { code: null, name: "Austin" },
      country: { code: "USA" },
      state: { code: "TX", name: "Texas" },
      streetAddress: "6801 Metropolis Drive",
      streetAddress2: null,
      zip: "78758",
    },
    pointOfContact: [
      {
        additionalInfo: {
          content:
            "Use the public opportunity page for amendments and procurement updates.",
        },
        email: "36c10b@agency.example.gov",
        fullName: "Department Contracting Lead",
        phone: "555-010-0142",
        title: "Contracting Officer",
        type: "primary",
      },
    ],
    postedDate: "03/29/2026",
    procurementTypeCode: "k",
    resourceLinks: [
      "https://sam.gov/opp/36C10B26Q0142/documents/performance-workbook.pdf",
    ],
    responseDeadLine: "04/26/2026",
    solicitationNumber: "36C10B26Q0142",
    status: "active",
    subTier: "Technology Acquisition Center",
    title: "VA Claims Intake Automation BPA",
    type: "Combined Synopsis/Solicitation",
    typeOfSetAside: "SDVOSB",
    typeOfSetAsideDescription:
      "Service-Disabled Veteran-Owned Small Business Set-Aside",
    uiLink: "https://sam.gov/opp/36C10B26Q0142/view",
  },
  {
    active: "No",
    additionalInfoLink: "https://sam.gov/opp/N00189-26-R-0088/resources",
    archiveDate: "02/17/2026",
    archiveType: "Archived Opportunity",
    baseType: "Special Notice",
    classificationCode: "R706",
    department: "Department of the Navy",
    description:
      "Bridge support for logistics data quality, reporting, and inventory visibility.",
    fullParentPathCode: "N00189",
    fullParentPathName:
      "Department of the Navy > NAVSUP > NAVSUP Fleet Logistics Center Norfolk",
    links: {
      self: {
        href: "https://api.sam.gov/prod/opportunities/v2/N00189-26-R-0088",
      },
    },
    naicsCode: "541614",
    noticeId: "N00189-26-R-0088",
    office: "NAVSUP Fleet Logistics Center Norfolk",
    officeAddress: {
      city: "Norfolk",
      countryCode: "USA",
      state: "VA",
      zip: "23511",
    },
    organizationCode: "N00189",
    organizationName: "NAVSUP Fleet Logistics Center Norfolk",
    organizationType: "OFFICE",
    placeOfPerformance: {
      city: { code: null, name: "Norfolk" },
      country: { code: "USA" },
      state: { code: "VA", name: "Virginia" },
      streetAddress: "1968 Gilbert Street",
      streetAddress2: null,
      zip: "23511",
    },
    pointOfContact: [
      {
        additionalInfo: {
          content:
            "Use the public opportunity page for amendments and procurement updates.",
        },
        email: "n00189@agency.example.gov",
        fullName: "NAVSUP Contracting Lead",
        phone: "555-010-0088",
        title: "Contracting Officer",
        type: "primary",
      },
    ],
    postedDate: "02/17/2026",
    procurementTypeCode: "s",
    resourceLinks: [
      "https://sam.gov/opp/N00189-26-R-0088/documents/bridge-overview.pdf",
    ],
    responseDeadLine: "03/19/2026",
    solicitationNumber: "N00189-26-R-0088",
    status: "archived",
    subTier: "NAVSUP",
    title: "Navy Logistics Data Support Bridge",
    type: "Special Notice",
    typeOfSetAside: null,
    typeOfSetAsideDescription: null,
    uiLink: "https://sam.gov/opp/N00189-26-R-0088/view",
  },
];

export function buildSamGovOutboundRequest(
  query: CanonicalSourceSearchQueryShape,
  endpoint = DEFAULT_SAM_GOV_SEARCH_ENDPOINT,
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
    endpoint,
    queryParams,
  };
}

export async function executeSamGovSearch({
  apiKey,
  config,
  httpClient = fetch,
  query,
  timeoutMs = 15_000,
  useFixtures,
}: {
  apiKey: string | null;
  config: SamGovConnectorConfig;
  httpClient?: HttpClient;
  query: CanonicalSourceSearchQueryShape;
  timeoutMs?: number;
  useFixtures: boolean;
}): Promise<SamGovSearchExecutionResult> {
  const outboundRequest = buildSamGovOutboundRequest(query, config.searchEndpoint);

  if (useFixtures) {
    const startedAt = Date.now();
    const filteredRecords = filterFixtureRecords(query);
    return {
      executionMode: "fixture_connector",
      httpStatus: 200,
      materializedRecords: filteredRecords.map((record) =>
        materializeSamGovSourceRecord(record),
      ),
      outboundRequest,
      responseLatencyMs: Date.now() - startedAt,
      totalRecords: filteredRecords.length,
    };
  }

  if (!apiKey) {
    throw new SamGovConnectorError({
      code: "connector_not_configured",
      httpStatus: null,
      message:
        "SAM.gov search is configured in the workspace, but SAM_GOV_API_KEY is not set in the server environment.",
      outboundRequest,
      responseLatencyMs: 0,
    });
  }

  const url = new URL(config.searchEndpoint);
  for (const [key, value] of Object.entries(outboundRequest.queryParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, item);
      }
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  url.searchParams.set("api_key", apiKey);

  const startedAt = Date.now();
  let response: Response;

  try {
    response = await httpClient(url, {
      dispatcher: resolveSamGovProxyDispatcher(url),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new SamGovConnectorError({
      code: "sam_gov_transport_error",
      httpStatus: null,
      message:
        "The SAM.gov search request could not reach the upstream endpoint. Check proxy or network connectivity and retry the live search.",
      outboundRequest,
      responseLatencyMs: Date.now() - startedAt,
    });
  }

  const responseLatencyMs = Date.now() - startedAt;
  const rawText = await response.text();
  const body = parseJsonSafely(rawText);

  if (!response.ok) {
    throw new SamGovConnectorError({
      code: `sam_gov_http_${response.status}`,
      httpStatus: response.status,
      message: buildUpstreamErrorMessage(body, response.status),
      outboundRequest,
      responseLatencyMs,
    });
  }

  const records = extractSamGovRecords(body);
  const totalRecords = extractTotalRecords(body, records.length);

  return {
    executionMode: "live_connector",
    httpStatus: response.status,
    materializedRecords: records.map((record) =>
      materializeSamGovSourceRecord(record),
    ),
    outboundRequest,
    responseLatencyMs,
    totalRecords,
  };
}

function resolveSamGovProxyDispatcher(url: URL) {
  const proxyUrl = selectProxyUrlForSamGov(url);

  if (!proxyUrl) {
    return undefined;
  }

  const existingAgent = proxyAgentsByUrl.get(proxyUrl);

  if (existingAgent) {
    return existingAgent;
  }

  const createdAgent = new ProxyAgent(proxyUrl);
  proxyAgentsByUrl.set(proxyUrl, createdAgent);
  return createdAgent;
}

function selectProxyUrlForSamGov(url: URL) {
  if (shouldBypassProxy(url.hostname)) {
    return null;
  }

  if (url.protocol === "https:") {
    return (
      process.env.HTTPS_PROXY ??
      process.env.https_proxy ??
      process.env.HTTP_PROXY ??
      process.env.http_proxy ??
      null
    );
  }

  return process.env.HTTP_PROXY ?? process.env.http_proxy ?? null;
}

function shouldBypassProxy(hostname: string) {
  const noProxy = process.env.NO_PROXY ?? process.env.no_proxy ?? "";

  if (!noProxy.trim()) {
    return false;
  }

  return noProxy
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .some((entry) => {
      if (entry === "*") {
        return true;
      }

      if (entry.startsWith(".")) {
        return hostname.toLowerCase().endsWith(entry);
      }

      return hostname.toLowerCase() === entry;
    });
}

export function materializeSamGovSourceRecord(rawPayload: Record<string, unknown>) {
  const warnings: string[] = [];
  const noticeId = readString(rawPayload.noticeId);

  if (!noticeId) {
    warnings.push("The upstream payload did not include a notice ID.");
  }

  const organizationName =
    readString(rawPayload.organizationName) ?? "Unknown organization";
  const procurementTypeCode = readString(rawPayload.procurementTypeCode) ?? "";
  const procurementTypeLabel =
    readString(rawPayload.type) ?? readString(rawPayload.baseType) ?? "Unknown";
  const title = readString(rawPayload.title) ?? "Untitled SAM.gov record";
  const summary = readString(rawPayload.description) ?? "No summary returned.";
  const postedDateRaw = readString(rawPayload.postedDate);
  const postedDate = normalizeSamGovDate(postedDateRaw);
  if (!postedDate) {
    warnings.push("The upstream payload did not include a parseable posted date.");
  }
  const responseDeadlineRaw = readString(rawPayload.responseDeadLine);
  const responseDeadline = normalizeSamGovDate(responseDeadlineRaw);
  const status =
    readString(rawPayload.status) ??
    deriveSamGovStatus({
      active: readString(rawPayload.active),
      archiveDate: readString(rawPayload.archiveDate),
    });
  const organizationCode =
    readString(rawPayload.organizationCode) ?? readString(rawPayload.fullParentPathCode);
  const uiLink = readString(rawPayload.uiLink);
  const detailLink = readNestedString(rawPayload, ["links", "self", "href"]);
  const sourceDescriptionUrl =
    readString(rawPayload.description) && isLikelyUrl(readString(rawPayload.description))
      ? readString(rawPayload.description)
      : uiLink;
  const officeAddress = readRecord(rawPayload.officeAddress) ?? {};
  const placeOfPerformance = readRecord(rawPayload.placeOfPerformance) ?? {};
  const placeOfPerformanceState =
    readNestedString(placeOfPerformance, ["state", "code"]) ??
    readString(officeAddress.state);
  const placeOfPerformanceZip =
    readString(placeOfPerformance.zip) ?? readString(officeAddress.zip);
  const setAsideCode = readString(rawPayload.typeOfSetAside);
  const setAsideDescription =
    readString(rawPayload.typeOfSetAsideDescription) ?? readString(rawPayload.setAside);
  const fullParentPathName =
    readString(rawPayload.fullParentPathName) ??
    composeAgencyPathName({
      department: readString(rawPayload.department),
      office: readString(rawPayload.office) ?? organizationName,
      subTier:
        readString(rawPayload.subTier) ?? readString(rawPayload.subtier),
    });
  const sourceHashFingerprint = buildFingerprint({
    naicsCode: readString(rawPayload.naicsCode),
    noticeId,
    organizationName,
    postedDate,
  });
  const contacts = readArray(rawPayload.pointOfContact)
    .map((item) => readRecord(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .map((contact, index) => ({
      additionalInfoText: readNestedString(contact, ["additionalInfo", "content"]),
      contactType: readString(contact.type),
      email: readString(contact.email),
      fax: readString(contact.fax),
      fullName:
        readString(contact.fullName) ?? readString(contact.fullname),
      phone: readString(contact.phone),
      sortOrder: index,
      title: readString(contact.title),
    }));
  const award = readRecord(rawPayload.award);
  const normalizedAward = award
    ? {
        awardAmount: normalizeAwardAmountValue(readUnknownNested(award, ["amount"])),
        awardDate: normalizeSamGovDateTime(readString(award.date)),
        awardNumber: readString(award.number),
        awardeeCityCode: readNestedString(award, ["awardee", "location", "city", "code"]),
        awardeeCityName: readNestedString(award, ["awardee", "location", "city", "name"]),
        awardeeCountryCode: readNestedString(
          award,
          ["awardee", "location", "country", "code"],
        ),
        awardeeCountryName: readNestedString(
          award,
          ["awardee", "location", "country", "name"],
        ),
        awardeeName: readNestedString(award, ["awardee", "name"]),
        awardeePostalCode: readNestedString(award, ["awardee", "location", "zip"]),
        awardeeStateCode: readNestedString(
          award,
          ["awardee", "location", "state", "code"],
        ),
        awardeeStateName: readNestedString(
          award,
          ["awardee", "location", "state", "name"],
        ),
        awardeeStreet1: readNestedString(
          award,
          ["awardee", "location", "streetAddress"],
        ),
        awardeeStreet2: readNestedString(
          award,
          ["awardee", "location", "streetAddress2"],
        ),
        awardeeUEI: readNestedString(award, ["awardee", "ueiSAM"]),
      }
    : null;
  const resourceLinks = readArray(rawPayload.resourceLinks)
    .map((item) => readString(item))
    .filter((item): item is string => Boolean(item))
    .map((url, index) => ({
      displayLabel: buildResourceLabel(url),
      externalId: null,
      fileSizeBytes: null,
      linkType: "resource_link",
      metadata: null,
      mimeType: null,
      sortOrder: index,
      sourceFileName: null,
      url,
    }));

  const normalizedPayload = {
    additionalInfoUrl: readString(rawPayload.additionalInfoLink),
    agencyDepartmentName: readString(rawPayload.department),
    agencyOfficeName: readString(rawPayload.office) ?? organizationName,
    agencyPathCode: readString(rawPayload.fullParentPathCode),
    agencyPathName: fullParentPathName,
    agencySubtierName:
      readString(rawPayload.subTier) ?? readString(rawPayload.subtier),
    apiSelfLink: detailLink,
    archiveDateRaw: readString(rawPayload.archiveDate),
    archiveType: readString(rawPayload.archiveType),
    archivedAt: normalizeSamGovDateTime(readString(rawPayload.archiveDate)),
    award: normalizedAward,
    canonicalFingerprint: sourceHashFingerprint,
    classificationCode: readString(rawPayload.classificationCode),
    contacts,
    externalNoticeId: noticeId,
    isActiveSourceRecord: status === "active",
    isArchivedSourceRecord: status === "archived",
    naicsCode: readString(rawPayload.naicsCode),
    normalizationVersion: SAM_GOV_NORMALIZATION_VERSION,
    normalizedAt: new Date().toISOString(),
    officeCity: readString(officeAddress.city),
    officeCountryCode: readString(officeAddress.countryCode),
    officePostalCode: readString(officeAddress.zip) ?? readString(officeAddress.zipcode),
    officeState: readString(officeAddress.state),
    organizationType: readString(rawPayload.organizationType),
    placeOfPerformanceCityCode: readNestedString(placeOfPerformance, ["city", "code"]),
    placeOfPerformanceCityName: readNestedString(placeOfPerformance, ["city", "name"]),
    placeOfPerformanceCountryCode: readNestedString(placeOfPerformance, [
      "country",
      "code",
    ]),
    placeOfPerformancePostalCode: readString(placeOfPerformance.zip),
    placeOfPerformanceStateCode: placeOfPerformanceState,
    placeOfPerformanceStateName:
      readNestedString(placeOfPerformance, ["state", "name"]) ??
      getStateName(placeOfPerformanceState),
    placeOfPerformanceStreet1: readString(placeOfPerformance.streetAddress),
    placeOfPerformanceStreet2: readString(placeOfPerformance.streetAddress2),
    postedAt: normalizeSamGovDateTime(postedDateRaw),
    postedDateRaw,
    procurementBaseTypeLabel: readString(rawPayload.baseType),
    procurementTypeLabel,
    resourceLinks,
    responseDeadlineAt: normalizeSamGovDateTime(responseDeadlineRaw),
    responseDeadlineRaw,
    setAsideCode,
    setAsideDescription,
    solicitationNumber: readString(rawPayload.solicitationNumber),
    sourceRecordId: noticeId,
    sourceStatus: status,
    sourceSummaryText: isLikelyUrl(readString(rawPayload.description))
      ? null
      : summary,
    sourceSummaryUrl: sourceDescriptionUrl,
    sourceSystem: "sam_gov",
    title,
    uiLink,
    warnings,
  } satisfies Record<string, unknown>;

  const summaryRecord = {
    id: noticeId ?? sourceHashFingerprint,
    naicsCode: readString(rawPayload.naicsCode),
    noticeId: noticeId ?? sourceHashFingerprint,
    organizationCode,
    organizationName,
    placeOfPerformanceState,
    placeOfPerformanceZip,
    postedDate: postedDate ?? "1970-01-01",
    procurementTypeCode,
    procurementTypeLabel,
    responseDeadline,
    setAsideDescription,
    solicitationNumber: readString(rawPayload.solicitationNumber),
    sourceSystem: "sam_gov",
    status,
    summary,
    title,
    uiLink: uiLink ?? "#",
  } satisfies SourceSearchResultSummaryShape;

  return {
    attachments: resourceLinks,
    award: normalizedAward,
    contacts,
    importPreviewPayload: {
      canonicalOpportunity: {
        currentStageKey: "identified",
        currentStageLabel: "Identified",
        externalNoticeId: summaryRecord.noticeId,
        leadAgency: organizationName,
        originSourceSystem: "sam_gov",
        title,
      },
      duplicateCheckKey: sourceHashFingerprint,
      normalizedPayload,
      rawPayload,
      warnings,
    },
    normalizedPayload,
    rawPayload,
    sourceDescriptionUrl,
    sourceDetailUrl: detailLink,
    sourceHashFingerprint,
    sourceRecordId: noticeId ?? sourceHashFingerprint,
    sourceUiUrl: uiLink,
    summary: summaryRecord,
    warnings,
  } satisfies SamGovSourceRecordMaterialized;
}

function filterFixtureRecords(query: CanonicalSourceSearchQueryShape) {
  return SAM_GOV_FIXTURE_RECORDS.filter((record) => {
    const summary = materializeSamGovSourceRecord(record).summary;

    if (summary.postedDate < query.postedDateFrom || summary.postedDate > query.postedDateTo) {
      return false;
    }

    if (query.responseDeadlineFrom || query.responseDeadlineTo) {
      if (!summary.responseDeadline) {
        return false;
      }

      if (
        query.responseDeadlineFrom &&
        summary.responseDeadline < query.responseDeadlineFrom
      ) {
        return false;
      }

      if (
        query.responseDeadlineTo &&
        summary.responseDeadline > query.responseDeadlineTo
      ) {
        return false;
      }
    }

    if (
      query.procurementTypes.length > 0 &&
      !query.procurementTypes.includes(summary.procurementTypeCode)
    ) {
      return false;
    }

    if (
      query.keywords &&
      !matchesCaseInsensitive(summary.title, query.keywords) &&
      !matchesCaseInsensitive(summary.summary, query.keywords) &&
      !matchesCaseInsensitive(summary.organizationName, query.keywords)
    ) {
      return false;
    }

    if (
      query.noticeId &&
      summary.noticeId.toUpperCase() !== query.noticeId.toUpperCase()
    ) {
      return false;
    }

    if (
      query.solicitationNumber &&
      !matchesCaseInsensitive(summary.solicitationNumber, query.solicitationNumber)
    ) {
      return false;
    }

    if (
      query.organizationName &&
      !matchesCaseInsensitive(summary.organizationName, query.organizationName)
    ) {
      return false;
    }

    if (
      query.organizationCode &&
      !matchesCaseInsensitive(summary.organizationCode, query.organizationCode)
    ) {
      return false;
    }

    if (
      query.naicsCode &&
      !matchesCaseInsensitive(readString(record.naicsCode), query.naicsCode)
    ) {
      return false;
    }

    if (
      query.classificationCode &&
      !matchesCaseInsensitive(
        readString(record.classificationCode),
        query.classificationCode,
      )
    ) {
      return false;
    }

    if (
      query.setAsideCode &&
      !matchesCaseInsensitive(readString(record.typeOfSetAside), query.setAsideCode)
    ) {
      return false;
    }

    if (
      query.setAsideDescription &&
      !matchesCaseInsensitive(
        readString(record.typeOfSetAsideDescription),
        query.setAsideDescription,
      )
    ) {
      return false;
    }

    if (
      query.placeOfPerformanceState &&
      !matchesCaseInsensitive(
        summary.placeOfPerformanceState,
        query.placeOfPerformanceState,
      )
    ) {
      return false;
    }

    if (
      query.placeOfPerformanceZip &&
      !matchesCaseInsensitive(
        summary.placeOfPerformanceZip,
        query.placeOfPerformanceZip,
      )
    ) {
      return false;
    }

    if (query.status && summary.status !== query.status) {
      return false;
    }

    return true;
  }).sort((left, right) => {
    const leftSummary = materializeSamGovSourceRecord(left).summary;
    const rightSummary = materializeSamGovSourceRecord(right).summary;

    if (leftSummary.postedDate !== rightSummary.postedDate) {
      return rightSummary.postedDate.localeCompare(leftSummary.postedDate);
    }

    return leftSummary.title.localeCompare(rightSummary.title);
  });
}

function extractSamGovRecords(body: unknown) {
  if (Array.isArray(body)) {
    return body.map((record) => readRecord(record)).filter(Boolean) as Record<
      string,
      unknown
    >[];
  }

  const record = readRecord(body);

  if (!record) {
    return [];
  }

  const arrayCandidate = [
    record.opportunitiesData,
    record.opportunityData,
    record.data,
    record.results,
  ].find(Array.isArray);

  if (!Array.isArray(arrayCandidate)) {
    return [];
  }

  return arrayCandidate
    .map((item) => readRecord(item))
    .filter(Boolean) as Record<string, unknown>[];
}

function extractTotalRecords(body: unknown, fallback: number) {
  const record = readRecord(body);

  if (!record) {
    return fallback;
  }

  const candidate = [
    record.totalRecords,
    record.totalrecords,
    record.total,
    record.count,
  ].find((value) => typeof value === "number");

  return typeof candidate === "number" ? candidate : fallback;
}

function buildUpstreamErrorMessage(body: unknown, status: number) {
  const record = readRecord(body);
  const message =
    (record && readString(record.message)) ||
    (record && readString(record.error_description)) ||
    (record && readString(record.error)) ||
    null;

  return message
    ? `SAM.gov returned HTTP ${status}: ${message}`
    : `SAM.gov returned HTTP ${status} for the search request.`;
}

function parseJsonSafely(value: string) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function deriveSamGovStatus({
  active,
  archiveDate,
}: {
  active: string | null;
  archiveDate: string | null;
}) {
  if (archiveDate) {
    return "archived";
  }

  if (active?.toLowerCase() === "yes") {
    return "active";
  }

  return "inactive";
}

function composeAgencyPathName({
  department,
  office,
  subTier,
}: {
  department: string | null;
  office: string | null;
  subTier: string | null;
}) {
  return [department, subTier, office].filter(Boolean).join(" > ") || null;
}

function normalizeSamGovDate(value: string | null) {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, month, day, year] = match;
  return `${year}-${month}-${day}`;
}

function normalizeSamGovDateTime(value: string | null) {
  const isoDate = normalizeSamGovDate(value);
  return isoDate ? `${isoDate}T00:00:00.000Z` : null;
}

function buildFingerprint({
  naicsCode,
  noticeId,
  organizationName,
  postedDate,
}: {
  naicsCode: string | null;
  noticeId: string | null;
  organizationName: string;
  postedDate: string | null;
}) {
  return [
    "sam_gov",
    noticeId ?? "unknown-notice",
    postedDate ?? "unknown-date",
    naicsCode ?? "none",
    organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
  ].join(":");
}

function buildResourceLabel(url: string) {
  const lastSegment = url.split("/").filter(Boolean).at(-1) ?? "resource";
  return lastSegment
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDateForSamGov(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  return `${month}/${day}/${year}`;
}

function assignIfPresent(
  record: SamGovOutboundRequest["queryParams"],
  key: keyof SamGovOutboundRequest["queryParams"],
  value: string | null,
) {
  if (value) {
    (record as Record<string, string | number | string[] | undefined>)[
      key as string
    ] = value;
  }
}

function readRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function normalizeAwardAmountValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readNestedString(
  value: unknown,
  path: string[],
): string | null {
  const nested = readUnknownNested(value, path);
  return readString(nested);
}

function readUnknownNested(value: unknown, path: string[]) {
  let current: unknown = value;

  for (const segment of path) {
    const record = readRecord(current);
    if (!record) {
      return null;
    }
    current = record[segment];
  }

  return current;
}

function matchesCaseInsensitive(candidate: string | null, query: string) {
  return (candidate ?? "").toLowerCase().includes(query.toLowerCase());
}

function isLikelyUrl(value: string | null) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getStateName(stateCode: string | null) {
  if (!stateCode) {
    return null;
  }

  return (
    {
      NV: "Nevada",
      TX: "Texas",
      VA: "Virginia",
    }[stateCode] ?? stateCode
  );
}
