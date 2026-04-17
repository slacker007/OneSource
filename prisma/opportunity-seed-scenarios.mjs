const AIR_FORCE_AGENCY = {
  key: "air-force-acc-99-cons",
  name: "99th Contracting Squadron",
  organizationCode: "FA4861",
  pathName: "Department of the Air Force / Air Combat Command / 99th Contracting Squadron",
  pathCode: "9700:FA4861",
  departmentName: "Department of the Air Force",
  subtierName: "Air Combat Command",
  officeName: "99th Contracting Squadron",
  officeCity: "Nellis AFB",
  officeState: "NV",
  officePostalCode: "89191",
  officeCountryCode: "USA",
};

const CONTRACT_VEHICLES = [
  {
    key: "oasis-plus-unrestricted",
    code: "OASIS-PLUS-UNR",
    name: "OASIS+ Unrestricted",
    vehicleType: "IDIQ",
    awardingAgency: "General Services Administration",
    notes: "Primary unrestricted services vehicle used for federal IT services pursuits.",
  },
  {
    key: "gsa-mas-it",
    code: "MAS-IT-70",
    name: "GSA Multiple Award Schedule IT",
    vehicleType: "Schedule",
    awardingAgency: "General Services Administration",
    notes: "Schedule baseline for IT and professional support work.",
  },
];

const COMPETITORS = [
  {
    key: "vector-analytics",
    name: "Vector Analytics LLC",
    websiteUrl: "https://vector-analytics.example",
    notes: "Often shows up as the incumbent on Air Force data modernization work.",
  },
  {
    key: "apex-defense",
    name: "Apex Defense Systems",
    websiteUrl: "https://apex-defense.example",
    notes: "Frequent competitor on enterprise knowledge management pursuits.",
  },
];

const SOURCE_SEARCH = {
  sourceSystem: "sam_gov",
  name: "Active Air Force Knowledge Management",
  description:
    "Structured federal search for active Air Force IT and knowledge-management opportunities.",
  canonicalFilters: {
    sourceSystem: "sam_gov",
    keywords: "knowledge management support",
    postedDateFrom: "2026-03-01",
    postedDateTo: "2026-04-15",
    responseDeadlineFrom: "2026-04-01",
    responseDeadlineTo: "2026-05-31",
    procurementTypes: ["o", "k"],
    noticeId: null,
    solicitationNumber: null,
    organizationName: "Air Combat Command",
    organizationCode: "FA4861",
    naicsCode: "541511",
    classificationCode: "D302",
    setAsideCode: null,
    setAsideDescription: null,
    placeOfPerformanceState: "NV",
    placeOfPerformanceZip: "89191",
    status: "active",
    pageSize: 25,
    pageOffset: 0,
    sortBy: "postedDate",
    sortDirection: "desc",
  },
  sourceSpecificFilters: {
    samApiVersion: "v2",
  },
};

const SOURCE_SEARCH_EXECUTION = {
  requestedAt: "2026-04-12T14:05:00.000Z",
  completedAt: "2026-04-12T14:05:02.000Z",
  status: "SUCCEEDED",
  requestedByActorType: "USER",
  responseLatencyMs: 842,
  resultCount: 1,
  totalRecords: 1,
  httpStatus: 200,
  connectorVersion: "sam-gov-search.v1",
  outboundRequest: {
    endpoint: "https://api.sam.gov/opportunities/v2/search",
    queryParams: {
      postedFrom: "03/01/2026",
      postedTo: "04/15/2026",
      limit: 25,
      offset: 0,
      ptype: ["o", "k"],
      title: "knowledge management support",
      organizationName: "Air Combat Command",
      organizationCode: "FA4861",
      state: "NV",
      zip: "89191",
      ncode: "541511",
      ccode: "D302",
      rdlfrom: "04/01/2026",
      rdlto: "05/31/2026",
      status: "active",
    },
    credentialReference: "secret://sam-gov/public-api-key",
  },
};

const SOURCE_SYNC_RUN = {
  requestedAt: "2026-04-12T14:07:00.000Z",
  startedAt: "2026-04-12T14:07:03.000Z",
  completedAt: "2026-04-12T14:07:15.000Z",
  status: "SUCCEEDED",
  triggerType: "MANUAL",
  requestedByActorType: "USER",
  connectorVersion: "sam-gov-sync.v1",
  recordsFetched: 1,
  recordsImported: 1,
  recordsFailed: 0,
};

const IMPORTED_OPPORTUNITY = {
  title: "Enterprise Knowledge Management Support Services",
  description:
    "Capture-ready record normalized from a SAM.gov solicitation for enterprise knowledge management support at Nellis AFB.",
  originSourceSystem: "sam_gov",
  externalNoticeId: "FA4861-26-R-0001",
  solicitationNumber: "FA4861-26-R-0001",
  sourceSummaryText:
    "Provide enterprise knowledge management, workflow modernization, and analytics support for operational planning teams.",
  sourceSummaryUrl: "https://sam.gov/opp/FA4861-26-R-0001/view",
  postedAt: "2026-03-15T00:00:00.000Z",
  postedDateRaw: "03/15/2026",
  responseDeadlineAt: "2026-05-01T17:00:00.000Z",
  responseDeadlineRaw: "05/01/2026 05:00 PM EDT",
  procurementTypeLabel: "Solicitation",
  procurementBaseTypeLabel: "Solicitation",
  archiveType: null,
  archivedAt: null,
  archiveDateRaw: null,
  sourceStatus: "active",
  isActiveSourceRecord: true,
  isArchivedSourceRecord: false,
  setAsideCode: "SBA",
  setAsideDescription: "Small Business Set-Aside",
  naicsCode: "541511",
  classificationCode: "D302",
  organizationType: "OFFICE",
  officeCity: "Nellis AFB",
  officeState: "NV",
  officePostalCode: "89191",
  officeCountryCode: "USA",
  placeOfPerformanceStreet1: "4700 Grissom Ave",
  placeOfPerformanceStreet2: "Suite 100",
  placeOfPerformanceCityCode: "53100",
  placeOfPerformanceCityName: "Las Vegas",
  placeOfPerformanceStateCode: "NV",
  placeOfPerformanceStateName: "Nevada",
  placeOfPerformancePostalCode: "89191",
  placeOfPerformanceCountryCode: "USA",
  additionalInfoUrl: "https://sam.gov/opp/FA4861-26-R-0001/resources",
  uiLink: "https://sam.gov/opp/FA4861-26-R-0001/view",
  apiSelfLink: "https://api.sam.gov/opportunities/v2/search?noticeid=FA4861-26-R-0001",
};

const SOURCE_RECORD = {
  sourceSystem: "sam_gov",
  sourceRecordId: "FA4861-26-R-0001",
  sourceApiEndpoint: "https://api.sam.gov/opportunities/v2/search",
  sourceUiUrl: "https://sam.gov/opp/FA4861-26-R-0001/view",
  sourceDetailUrl:
    "https://api.sam.gov/prod/opportunities/v2/FA4861-26-R-0001",
  sourceDescriptionUrl: "https://sam.gov/opp/FA4861-26-R-0001/view",
  sourceFetchedAt: "2026-04-12T14:05:02.000Z",
  sourceSearchExecutedAt: SOURCE_SEARCH_EXECUTION.completedAt,
  sourceNormalizationVersion: "sam-gov.v1",
  sourceNormalizationAppliedAt: "2026-04-12T14:05:03.000Z",
  sourceRawPostedDate: "03/15/2026",
  sourceRawResponseDeadline: "05/01/2026 05:00 PM EDT",
  sourceRawArchiveDate: null,
  sourceStatusRaw: "active",
  sourceImportMethod: "MANUAL_PULL",
  sourceImportActorType: "USER",
  sourceHashFingerprint:
    "sam_gov:FA4861-26-R-0001:2026-03-15:541511:99th-contracting-squadron",
};

const SOURCE_RAW_PAYLOAD = {
  noticeId: "FA4861-26-R-0001",
  title: IMPORTED_OPPORTUNITY.title,
  solicitationNumber: IMPORTED_OPPORTUNITY.solicitationNumber,
  description: IMPORTED_OPPORTUNITY.sourceSummaryText,
  postedDate: "03/15/2026",
  responseDeadLine: "05/01/2026 05:00 PM EDT",
  type: "Solicitation",
  baseType: "Solicitation",
  archiveType: null,
  archiveDate: null,
  active: "Yes",
  status: "active",
  typeOfSetAside: "SBA",
  typeOfSetAsideDescription: "Small Business Set-Aside",
  naicsCode: "541511",
  classificationCode: "D302",
  organizationType: "OFFICE",
  fullParentPathName: AIR_FORCE_AGENCY.pathName,
  fullParentPathCode: AIR_FORCE_AGENCY.pathCode,
  department: AIR_FORCE_AGENCY.departmentName,
  subTier: AIR_FORCE_AGENCY.subtierName,
  office: AIR_FORCE_AGENCY.officeName,
  officeAddress: {
    city: AIR_FORCE_AGENCY.officeCity,
    state: AIR_FORCE_AGENCY.officeState,
    zip: AIR_FORCE_AGENCY.officePostalCode,
    countryCode: AIR_FORCE_AGENCY.officeCountryCode,
  },
  placeOfPerformance: {
    streetAddress: IMPORTED_OPPORTUNITY.placeOfPerformanceStreet1,
    streetAddress2: IMPORTED_OPPORTUNITY.placeOfPerformanceStreet2,
    city: {
      code: IMPORTED_OPPORTUNITY.placeOfPerformanceCityCode,
      name: IMPORTED_OPPORTUNITY.placeOfPerformanceCityName,
    },
    state: {
      code: IMPORTED_OPPORTUNITY.placeOfPerformanceStateCode,
      name: IMPORTED_OPPORTUNITY.placeOfPerformanceStateName,
    },
    zip: IMPORTED_OPPORTUNITY.placeOfPerformancePostalCode,
    country: {
      code: IMPORTED_OPPORTUNITY.placeOfPerformanceCountryCode,
    },
  },
  additionalInfoLink: IMPORTED_OPPORTUNITY.additionalInfoUrl,
  uiLink: IMPORTED_OPPORTUNITY.uiLink,
  links: {
    self: {
      href: IMPORTED_OPPORTUNITY.apiSelfLink,
    },
  },
  resourceLinks: [
    "https://sam.gov/opp/FA4861-26-R-0001/documents/performance-work-statement.pdf",
    "https://sam.gov/opp/FA4861-26-R-0001/documents/questions-and-answers.xlsx",
  ],
};

const SOURCE_NORMALIZED_PAYLOAD = {
  normalizationVersion: SOURCE_RECORD.sourceNormalizationVersion,
  normalizedAt: SOURCE_RECORD.sourceNormalizationAppliedAt,
  sourceSystem: SOURCE_RECORD.sourceSystem,
  sourceRecordId: SOURCE_RECORD.sourceRecordId,
  canonicalFingerprint: SOURCE_RECORD.sourceHashFingerprint,
  rawPayload: SOURCE_RAW_PAYLOAD,
  normalizedPayload: {
    externalNoticeId: IMPORTED_OPPORTUNITY.externalNoticeId,
    title: IMPORTED_OPPORTUNITY.title,
    solicitationNumber: IMPORTED_OPPORTUNITY.solicitationNumber,
    sourceSummaryText: IMPORTED_OPPORTUNITY.sourceSummaryText,
    sourceSummaryUrl: IMPORTED_OPPORTUNITY.sourceSummaryUrl,
    postedAt: IMPORTED_OPPORTUNITY.postedAt,
    responseDeadlineAt: IMPORTED_OPPORTUNITY.responseDeadlineAt,
    procurementTypeLabel: IMPORTED_OPPORTUNITY.procurementTypeLabel,
    procurementBaseTypeLabel: IMPORTED_OPPORTUNITY.procurementBaseTypeLabel,
    sourceStatus: IMPORTED_OPPORTUNITY.sourceStatus,
    setAsideCode: IMPORTED_OPPORTUNITY.setAsideCode,
    setAsideDescription: IMPORTED_OPPORTUNITY.setAsideDescription,
    naicsCode: IMPORTED_OPPORTUNITY.naicsCode,
    classificationCode: IMPORTED_OPPORTUNITY.classificationCode,
    agencyPathName: AIR_FORCE_AGENCY.pathName,
    agencyPathCode: AIR_FORCE_AGENCY.pathCode,
    agencyDepartmentName: AIR_FORCE_AGENCY.departmentName,
    agencySubtierName: AIR_FORCE_AGENCY.subtierName,
    agencyOfficeName: AIR_FORCE_AGENCY.officeName,
    officeCity: AIR_FORCE_AGENCY.officeCity,
    officeState: AIR_FORCE_AGENCY.officeState,
    officePostalCode: AIR_FORCE_AGENCY.officePostalCode,
    officeCountryCode: AIR_FORCE_AGENCY.officeCountryCode,
    placeOfPerformanceStreet1:
      IMPORTED_OPPORTUNITY.placeOfPerformanceStreet1,
    placeOfPerformanceStreet2:
      IMPORTED_OPPORTUNITY.placeOfPerformanceStreet2,
    placeOfPerformanceCityCode:
      IMPORTED_OPPORTUNITY.placeOfPerformanceCityCode,
    placeOfPerformanceCityName:
      IMPORTED_OPPORTUNITY.placeOfPerformanceCityName,
    placeOfPerformanceStateCode:
      IMPORTED_OPPORTUNITY.placeOfPerformanceStateCode,
    placeOfPerformanceStateName:
      IMPORTED_OPPORTUNITY.placeOfPerformanceStateName,
    placeOfPerformancePostalCode:
      IMPORTED_OPPORTUNITY.placeOfPerformancePostalCode,
    placeOfPerformanceCountryCode:
      IMPORTED_OPPORTUNITY.placeOfPerformanceCountryCode,
    resourceLinks: SOURCE_RAW_PAYLOAD.resourceLinks,
  },
  importPreviewPayload: {
    source: {
      noticeId: SOURCE_RAW_PAYLOAD.noticeId,
      title: SOURCE_RAW_PAYLOAD.title,
      organization: SOURCE_RAW_PAYLOAD.fullParentPathName,
      postedDate: SOURCE_RAW_PAYLOAD.postedDate,
      responseDeadline: SOURCE_RAW_PAYLOAD.responseDeadLine,
    },
    normalized: {
      title: IMPORTED_OPPORTUNITY.title,
      solicitationNumber: IMPORTED_OPPORTUNITY.solicitationNumber,
      leadAgency: AIR_FORCE_AGENCY.name,
      vehicleCodes: CONTRACT_VEHICLES.map((vehicle) => vehicle.code),
    },
  },
  warnings: [],
};

const OPPORTUNITY_COMPETITORS = [
  {
    competitorKey: "vector-analytics",
    role: "INCUMBENT",
    notes: "Referenced by the BD team as the likely incumbent based on prior task-order history.",
  },
  {
    competitorKey: "apex-defense",
    role: "KNOWN_COMPETITOR",
    notes: "Frequently competes on Air Force digital services and workflow modernization opportunities.",
  },
];

export function buildOpportunitySeedScenario() {
  return {
    agencies: [AIR_FORCE_AGENCY],
    vehicles: CONTRACT_VEHICLES,
    competitors: COMPETITORS,
    sourceSavedSearch: SOURCE_SEARCH,
    sourceSearchExecution: {
      ...SOURCE_SEARCH_EXECUTION,
      canonicalFilters: SOURCE_SEARCH.canonicalFilters,
      sourceSpecificFilters: SOURCE_SEARCH.sourceSpecificFilters,
    },
    sourceSyncRun: SOURCE_SYNC_RUN,
    importedOpportunity: {
      ...IMPORTED_OPPORTUNITY,
      agencyKey: AIR_FORCE_AGENCY.key,
      vehicleKeys: CONTRACT_VEHICLES.map((vehicle) => vehicle.key),
      competitorLinks: OPPORTUNITY_COMPETITORS,
    },
    sourceRecord: {
      ...SOURCE_RECORD,
      agencyKey: AIR_FORCE_AGENCY.key,
      sourceSearchQuery: {
        sourceSystem: SOURCE_SEARCH.sourceSystem,
        canonicalFilters: SOURCE_SEARCH.canonicalFilters,
        sourceSpecificFilters: SOURCE_SEARCH.sourceSpecificFilters,
      },
      sourceRawPayload: SOURCE_RAW_PAYLOAD,
      sourceNormalizedPayload: SOURCE_NORMALIZED_PAYLOAD,
      sourceImportPreviewPayload: SOURCE_NORMALIZED_PAYLOAD.importPreviewPayload,
      searchResult: {
        resultRank: 1,
      },
      syncRecord: {
        syncAction: "IMPORTED",
      },
    },
  };
}
