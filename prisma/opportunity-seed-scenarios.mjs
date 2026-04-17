const AIR_FORCE_AGENCY = {
  key: "air-force-acc-99-cons",
  name: "99th Contracting Squadron",
  organizationCode: "FA4861",
  pathName:
    "Department of the Air Force / Air Combat Command / 99th Contracting Squadron",
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
    notes:
      "Primary unrestricted services vehicle used for federal IT services pursuits.",
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
    notes:
      "Often shows up as the incumbent on Air Force data modernization work.",
  },
  {
    key: "apex-defense",
    name: "Apex Defense Systems",
    websiteUrl: "https://apex-defense.example",
    notes: "Frequent competitor on enterprise knowledge management pursuits.",
  },
];

const SOURCE_CONNECTOR_CONFIGS = [
  {
    sourceSystemKey: "sam_gov",
    sourceDisplayName: "SAM.gov",
    sourceCategory: "FEDERAL",
    authType: "API_KEY",
    isEnabled: true,
    supportsSearch: true,
    supportsScheduledSync: true,
    supportsDetailFetch: true,
    supportsDocumentFetch: false,
    supportsResultPreview: true,
    supportsSavedSearches: true,
    supportsIncrementalSync: true,
    supportsWebhooks: false,
    supportsAttachments: true,
    supportsAwardData: true,
    defaultPageSize: 100,
    maxPageSize: 1000,
    rateLimitProfile: {
      strategy: "bounded_api_key",
      notes: "postedFrom/postedTo required; limit capped at 1000.",
    },
    credentialReference: "secret://sam-gov/public-api-key",
    configData: {
      apiBaseUrl: "https://api.sam.gov/opportunities/v2",
      uiBaseUrl: "https://sam.gov",
    },
    connectorVersion: "sam-gov.v1",
    validationStatus: "VALID",
    lastValidatedAt: "2026-04-12T14:04:55.000Z",
    lastValidationMessage: "Public API key verified for opportunity search.",
  },
  {
    sourceSystemKey: "usaspending_api",
    sourceDisplayName: "USAspending API",
    sourceCategory: "FEDERAL",
    authType: "NONE",
    isEnabled: true,
    supportsSearch: true,
    supportsScheduledSync: true,
    supportsDetailFetch: true,
    supportsDocumentFetch: false,
    supportsResultPreview: true,
    supportsSavedSearches: true,
    supportsIncrementalSync: true,
    supportsWebhooks: false,
    supportsAttachments: false,
    supportsAwardData: true,
    defaultPageSize: 50,
    maxPageSize: 100,
    rateLimitProfile: {
      strategy: "public_post_api",
      notes:
        "Award intelligence requests are body-based rather than query-only.",
    },
    credentialReference: null,
    configData: {
      apiBaseUrl: "https://api.usaspending.gov/api/v2",
      uiBaseUrl: "https://www.usaspending.gov",
      primaryUseCase: "award_enrichment",
    },
    connectorVersion: "usaspending.v1",
    validationStatus: "VALID",
    lastValidatedAt: "2026-04-12T15:18:45.000Z",
    lastValidationMessage:
      "Public award-search endpoint validated without stored credentials.",
  },
  {
    sourceSystemKey: "gsa_ebuy",
    sourceDisplayName: "GSA eBuy",
    sourceCategory: "FEDERAL",
    authType: "SESSION",
    isEnabled: false,
    supportsSearch: true,
    supportsScheduledSync: false,
    supportsDetailFetch: true,
    supportsDocumentFetch: true,
    supportsResultPreview: true,
    supportsSavedSearches: true,
    supportsIncrementalSync: false,
    supportsWebhooks: false,
    supportsAttachments: true,
    supportsAwardData: false,
    defaultPageSize: 25,
    maxPageSize: 100,
    rateLimitProfile: {
      strategy: "session_bootstrap",
      notes: "Requires an operator-managed authenticated session profile.",
    },
    credentialReference: "secret://gsa-ebuy/session-profile",
    configData: {
      loginUrl: "https://www.ebuy.gsa.gov/ebuyopen/",
      sessionMode: "operator_managed",
    },
    connectorVersion: "gsa-ebuy.v1-prototype",
    validationStatus: "UNKNOWN",
    lastValidatedAt: null,
    lastValidationMessage:
      "Session-backed connector prepared for future validation workflow.",
  },
];

const SAM_GOV_SOURCE_SEARCH = {
  connectorKey: "sam_gov",
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

const SAM_GOV_SOURCE_SEARCH_EXECUTION = {
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

const SAM_GOV_SOURCE_SYNC_RUN = {
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
  apiSelfLink:
    "https://api.sam.gov/opportunities/v2/search?noticeid=FA4861-26-R-0001",
};

const SAM_GOV_SOURCE_RECORD = {
  connectorKey: "sam_gov",
  sourceSystem: "sam_gov",
  sourceRecordId: "FA4861-26-R-0001",
  sourceApiEndpoint: "https://api.sam.gov/opportunities/v2/search",
  sourceUiUrl: "https://sam.gov/opp/FA4861-26-R-0001/view",
  sourceDetailUrl: "https://api.sam.gov/prod/opportunities/v2/FA4861-26-R-0001",
  sourceDescriptionUrl: "https://sam.gov/opp/FA4861-26-R-0001/view",
  sourceFetchedAt: "2026-04-12T14:05:02.000Z",
  sourceSearchExecutedAt: SAM_GOV_SOURCE_SEARCH_EXECUTION.completedAt,
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

const SAM_GOV_SOURCE_RECORD_CONTACTS = [
  {
    contactType: "primary",
    fullName: "Capt. Elena Vargas",
    title: "Contracting Officer",
    email: "elena.vargas.1@us.af.mil",
    phone: "702-555-0134",
    fax: null,
    additionalInfoText:
      "Use the public opportunity page for amendments and Q&A updates.",
    sortOrder: 0,
  },
  {
    contactType: "secondary",
    fullName: "Marcus Reed",
    title: "Contract Specialist",
    email: "marcus.reed.7@us.af.mil",
    phone: "702-555-0158",
    fax: null,
    additionalInfoText: null,
    sortOrder: 1,
  },
];

const SAM_GOV_SOURCE_RECORD_ATTACHMENTS = [
  {
    externalId: "resource-1",
    url: "https://sam.gov/opp/FA4861-26-R-0001/documents/performance-work-statement.pdf",
    linkType: "resource_link",
    displayLabel: "Performance Work Statement",
    mimeType: "application/pdf",
    sourceFileName: "performance-work-statement.pdf",
    fileSizeBytes: 245760,
    sortOrder: 0,
    metadata: {
      sourceCollection: "resourceLinks",
    },
  },
  {
    externalId: "resource-2",
    url: "https://sam.gov/opp/FA4861-26-R-0001/documents/questions-and-answers.xlsx",
    linkType: "resource_link",
    displayLabel: "Questions and Answers",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    sourceFileName: "questions-and-answers.xlsx",
    fileSizeBytes: 32768,
    sortOrder: 1,
    metadata: {
      sourceCollection: "resourceLinks",
    },
  },
];

const SAM_GOV_SOURCE_RAW_PAYLOAD = {
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
  pointOfContact: SAM_GOV_SOURCE_RECORD_CONTACTS.map((contact) => ({
    type: contact.contactType,
    fullName: contact.fullName,
    title: contact.title,
    email: contact.email,
    phone: contact.phone,
    fax: contact.fax,
    additionalInfo: contact.additionalInfoText
      ? {
          content: contact.additionalInfoText,
        }
      : null,
  })),
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
  resourceLinks: SAM_GOV_SOURCE_RECORD_ATTACHMENTS.map(
    (attachment) => attachment.url,
  ),
};

const SAM_GOV_SOURCE_NORMALIZED_PAYLOAD = {
  normalizationVersion: SAM_GOV_SOURCE_RECORD.sourceNormalizationVersion,
  normalizedAt: SAM_GOV_SOURCE_RECORD.sourceNormalizationAppliedAt,
  sourceSystem: SAM_GOV_SOURCE_RECORD.sourceSystem,
  sourceRecordId: SAM_GOV_SOURCE_RECORD.sourceRecordId,
  canonicalFingerprint: SAM_GOV_SOURCE_RECORD.sourceHashFingerprint,
  rawPayload: SAM_GOV_SOURCE_RAW_PAYLOAD,
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
    placeOfPerformanceStreet1: IMPORTED_OPPORTUNITY.placeOfPerformanceStreet1,
    placeOfPerformanceStreet2: IMPORTED_OPPORTUNITY.placeOfPerformanceStreet2,
    placeOfPerformanceCityCode: IMPORTED_OPPORTUNITY.placeOfPerformanceCityCode,
    placeOfPerformanceCityName: IMPORTED_OPPORTUNITY.placeOfPerformanceCityName,
    placeOfPerformanceStateCode:
      IMPORTED_OPPORTUNITY.placeOfPerformanceStateCode,
    placeOfPerformanceStateName:
      IMPORTED_OPPORTUNITY.placeOfPerformanceStateName,
    placeOfPerformancePostalCode:
      IMPORTED_OPPORTUNITY.placeOfPerformancePostalCode,
    placeOfPerformanceCountryCode:
      IMPORTED_OPPORTUNITY.placeOfPerformanceCountryCode,
    contacts: SAM_GOV_SOURCE_RECORD_CONTACTS,
    resourceLinks: SAM_GOV_SOURCE_RECORD_ATTACHMENTS.map(
      (attachment) => attachment.url,
    ),
  },
  importPreviewPayload: {
    source: {
      noticeId: SAM_GOV_SOURCE_RAW_PAYLOAD.noticeId,
      title: SAM_GOV_SOURCE_RAW_PAYLOAD.title,
      organization: SAM_GOV_SOURCE_RAW_PAYLOAD.fullParentPathName,
      postedDate: SAM_GOV_SOURCE_RAW_PAYLOAD.postedDate,
      responseDeadline: SAM_GOV_SOURCE_RAW_PAYLOAD.responseDeadLine,
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
    notes:
      "Referenced by the BD team as the likely incumbent based on prior task-order history.",
  },
  {
    competitorKey: "apex-defense",
    role: "KNOWN_COMPETITOR",
    notes:
      "Frequently competes on Air Force digital services and workflow modernization opportunities.",
  },
];

const SAM_GOV_IMPORT_DECISION = {
  connectorKey: "sam_gov",
  requestedAt: "2026-04-12T14:05:10.000Z",
  decidedAt: "2026-04-12T14:05:30.000Z",
  requestedByActorType: "USER",
  mode: "CREATE_OPPORTUNITY",
  status: "APPLIED",
  rationale:
    "Promoted the solicitation into the tracked pipeline because no duplicate canonical opportunity existed.",
  decisionMetadata: {
    duplicateCandidateCount: 0,
    promotionSource: "search_result",
  },
  importPreviewPayload: SAM_GOV_SOURCE_NORMALIZED_PAYLOAD.importPreviewPayload,
};

const USA_SPENDING_SOURCE_SEARCH = {
  connectorKey: "usaspending_api",
  sourceSystem: "usaspending_api",
  name: "Incumbent Award Context For KM Support",
  description:
    "Award-centric enrichment search used to capture incumbent context for the seeded solicitation.",
  canonicalFilters: {
    sourceSystem: "usaspending_api",
    keywords: "knowledge management modernization",
    postedDateFrom: null,
    postedDateTo: null,
    responseDeadlineFrom: null,
    responseDeadlineTo: null,
    procurementTypes: [],
    noticeId: null,
    solicitationNumber: "FA4861-26-R-0001",
    organizationName: "Department of the Air Force",
    organizationCode: null,
    naicsCode: "541511",
    classificationCode: null,
    setAsideCode: null,
    setAsideDescription: null,
    placeOfPerformanceState: "NV",
    placeOfPerformanceZip: "89191",
    status: null,
    pageSize: 10,
    pageOffset: 0,
    sortBy: "awardDate",
    sortDirection: "desc",
  },
  sourceSpecificFilters: {
    awardDateFrom: "2023-01-01",
    awardDateTo: "2026-04-15",
    recipientSearchText: ["Vector Analytics LLC"],
    awardTypeCodes: ["A", "B"],
    fiscalYears: ["2024", "2025"],
  },
};

const USA_SPENDING_SOURCE_SEARCH_EXECUTION = {
  requestedAt: "2026-04-12T15:20:00.000Z",
  completedAt: "2026-04-12T15:20:02.000Z",
  status: "SUCCEEDED",
  requestedByActorType: "USER",
  responseLatencyMs: 611,
  resultCount: 1,
  totalRecords: 1,
  httpStatus: 200,
  connectorVersion: "usaspending-award-search.v1",
  outboundRequest: {
    endpoint: "https://api.usaspending.gov/api/v2/search/spending_by_award/",
    body: {
      filters: USA_SPENDING_SOURCE_SEARCH.sourceSpecificFilters,
      page: 1,
      limit: 10,
    },
  },
};

const USA_SPENDING_SOURCE_SYNC_RUN = {
  requestedAt: "2026-04-12T15:21:00.000Z",
  startedAt: "2026-04-12T15:21:03.000Z",
  completedAt: "2026-04-12T15:21:08.000Z",
  status: "SUCCEEDED",
  triggerType: "MANUAL",
  requestedByActorType: "USER",
  connectorVersion: "usaspending-award-sync.v1",
  recordsFetched: 1,
  recordsImported: 1,
  recordsFailed: 0,
};

const USA_SPENDING_SOURCE_RECORD = {
  connectorKey: "usaspending_api",
  agencyKey: AIR_FORCE_AGENCY.key,
  sourceSystem: "usaspending_api",
  sourceRecordId: "CONT_AWD_FA486126F0009_9700_-NONE-_-NONE-",
  sourceApiEndpoint:
    "https://api.usaspending.gov/api/v2/search/spending_by_award/",
  sourceUiUrl:
    "https://www.usaspending.gov/award/CONT_AWD_FA486126F0009_9700_-NONE-_-NONE-",
  sourceDetailUrl:
    "https://api.usaspending.gov/api/v2/awards/CONT_AWD_FA486126F0009_9700_-NONE-_-NONE-/",
  sourceDescriptionUrl: null,
  sourceFetchedAt: "2026-04-12T15:20:02.000Z",
  sourceSearchExecutedAt: USA_SPENDING_SOURCE_SEARCH_EXECUTION.completedAt,
  sourceNormalizationVersion: "usaspending-award.v1",
  sourceNormalizationAppliedAt: "2026-04-12T15:20:03.000Z",
  sourceRawPostedDate: null,
  sourceRawResponseDeadline: null,
  sourceRawArchiveDate: null,
  sourceStatusRaw: "historical_award",
  sourceImportMethod: "MANUAL_PULL",
  sourceImportActorType: "USER",
  sourceHashFingerprint:
    "usaspending_api:CONT_AWD_FA486126F0009_9700_-NONE-_-NONE-:2024-10-15:541511:vector-analytics-llc",
};

const USA_SPENDING_SOURCE_RAW_PAYLOAD = {
  generated_unique_award_id: "CONT_AWD_FA486126F0009_9700_-NONE-_-NONE-",
  piid: "FA486126F0009",
  award_amount: 1842500,
  action_date: "2024-10-15",
  recipient_name: "Vector Analytics LLC",
  recipient_uei: "ABCD1234EFGH5",
  awarding_agency_name: "Department of the Air Force",
  funding_agency_name: "Department of the Air Force",
  naics_code: "541511",
  description:
    "Knowledge management modernization support for operational planning teams.",
  period_of_performance_start_date: "2024-11-01",
  period_of_performance_current_end_date: "2025-10-31",
  place_of_performance_city_name: "Las Vegas",
  place_of_performance_state_code: "NV",
  place_of_performance_zip4a_code: "89191",
};

const USA_SPENDING_SOURCE_NORMALIZED_PAYLOAD = {
  normalizationVersion: USA_SPENDING_SOURCE_RECORD.sourceNormalizationVersion,
  normalizedAt: USA_SPENDING_SOURCE_RECORD.sourceNormalizationAppliedAt,
  sourceSystem: USA_SPENDING_SOURCE_RECORD.sourceSystem,
  sourceRecordId: USA_SPENDING_SOURCE_RECORD.sourceRecordId,
  canonicalFingerprint: USA_SPENDING_SOURCE_RECORD.sourceHashFingerprint,
  rawPayload: USA_SPENDING_SOURCE_RAW_PAYLOAD,
  normalizedPayload: {
    awardIdentifier: USA_SPENDING_SOURCE_RAW_PAYLOAD.generated_unique_award_id,
    awardNumber: USA_SPENDING_SOURCE_RAW_PAYLOAD.piid,
    awardAmount: USA_SPENDING_SOURCE_RAW_PAYLOAD.award_amount,
    awardDate: "2024-10-15T00:00:00.000Z",
    awardeeName: USA_SPENDING_SOURCE_RAW_PAYLOAD.recipient_name,
    awardeeUEI: USA_SPENDING_SOURCE_RAW_PAYLOAD.recipient_uei,
    awardingAgencyName: USA_SPENDING_SOURCE_RAW_PAYLOAD.awarding_agency_name,
    fundingAgencyName: USA_SPENDING_SOURCE_RAW_PAYLOAD.funding_agency_name,
    naicsCode: USA_SPENDING_SOURCE_RAW_PAYLOAD.naics_code,
    placeOfPerformanceStateCode:
      USA_SPENDING_SOURCE_RAW_PAYLOAD.place_of_performance_state_code,
    placeOfPerformancePostalCode:
      USA_SPENDING_SOURCE_RAW_PAYLOAD.place_of_performance_zip4a_code,
  },
  importPreviewPayload: {
    source: {
      awardNumber: USA_SPENDING_SOURCE_RAW_PAYLOAD.piid,
      recipientName: USA_SPENDING_SOURCE_RAW_PAYLOAD.recipient_name,
      awardAmount: USA_SPENDING_SOURCE_RAW_PAYLOAD.award_amount,
    },
    normalized: {
      enrichmentType: "award_context",
      suggestedOpportunityNoticeId: IMPORTED_OPPORTUNITY.externalNoticeId,
      incumbentName: USA_SPENDING_SOURCE_RAW_PAYLOAD.recipient_name,
    },
  },
  warnings: [
    "Award-centric source linked as enrichment; it does not replace the canonical solicitation record.",
  ],
};

const USA_SPENDING_SOURCE_AWARD = {
  awardNumber: "FA486126F0009",
  awardAmount: "1842500.00",
  awardDate: "2024-10-15T00:00:00.000Z",
  awardeeName: "Vector Analytics LLC",
  awardeeUEI: "ABCD1234EFGH5",
  awardeeStreet1: "100 Example Plaza",
  awardeeStreet2: "Suite 400",
  awardeeCityCode: null,
  awardeeCityName: "Arlington",
  awardeeStateCode: "VA",
  awardeeStateName: "Virginia",
  awardeePostalCode: "22201",
  awardeeCountryCode: "USA",
  awardeeCountryName: "United States",
};

const USA_SPENDING_IMPORT_DECISION = {
  connectorKey: "usaspending_api",
  requestedAt: "2026-04-12T15:21:12.000Z",
  decidedAt: "2026-04-12T15:21:32.000Z",
  requestedByActorType: "USER",
  mode: "LINK_TO_EXISTING",
  status: "APPLIED",
  rationale:
    "Linked historical award data to the solicitation as enrichment instead of creating a second canonical opportunity.",
  decisionMetadata: {
    enrichmentType: "incumbent_award_context",
    matchedOn: ["solicitationNumber", "agency", "naicsCode"],
    duplicateCandidateCount: 1,
  },
  importPreviewPayload:
    USA_SPENDING_SOURCE_NORMALIZED_PAYLOAD.importPreviewPayload,
};

export function buildOpportunitySeedScenario() {
  return {
    connectorConfigs: SOURCE_CONNECTOR_CONFIGS,
    agencies: [AIR_FORCE_AGENCY],
    vehicles: CONTRACT_VEHICLES,
    competitors: COMPETITORS,
    sourceSavedSearch: SAM_GOV_SOURCE_SEARCH,
    sourceSearchExecution: {
      ...SAM_GOV_SOURCE_SEARCH_EXECUTION,
      canonicalFilters: SAM_GOV_SOURCE_SEARCH.canonicalFilters,
      sourceSpecificFilters: SAM_GOV_SOURCE_SEARCH.sourceSpecificFilters,
    },
    sourceSyncRun: SAM_GOV_SOURCE_SYNC_RUN,
    importedOpportunity: {
      ...IMPORTED_OPPORTUNITY,
      agencyKey: AIR_FORCE_AGENCY.key,
      vehicleKeys: CONTRACT_VEHICLES.map((vehicle) => vehicle.key),
      competitorLinks: OPPORTUNITY_COMPETITORS,
    },
    sourceRecord: {
      ...SAM_GOV_SOURCE_RECORD,
      agencyKey: AIR_FORCE_AGENCY.key,
      sourceSearchQuery: {
        sourceSystem: SAM_GOV_SOURCE_SEARCH.sourceSystem,
        canonicalFilters: SAM_GOV_SOURCE_SEARCH.canonicalFilters,
        sourceSpecificFilters: SAM_GOV_SOURCE_SEARCH.sourceSpecificFilters,
      },
      sourceRawPayload: SAM_GOV_SOURCE_RAW_PAYLOAD,
      sourceNormalizedPayload: SAM_GOV_SOURCE_NORMALIZED_PAYLOAD,
      sourceImportPreviewPayload:
        SAM_GOV_SOURCE_NORMALIZED_PAYLOAD.importPreviewPayload,
      contacts: SAM_GOV_SOURCE_RECORD_CONTACTS,
      attachments: SAM_GOV_SOURCE_RECORD_ATTACHMENTS,
      searchResult: {
        resultRank: 1,
      },
      syncRecord: {
        syncAction: "IMPORTED",
      },
    },
    sourceImportDecision: SAM_GOV_IMPORT_DECISION,
    secondarySourceScenario: {
      sourceSavedSearch: USA_SPENDING_SOURCE_SEARCH,
      sourceSearchExecution: {
        ...USA_SPENDING_SOURCE_SEARCH_EXECUTION,
        canonicalFilters: USA_SPENDING_SOURCE_SEARCH.canonicalFilters,
        sourceSpecificFilters: USA_SPENDING_SOURCE_SEARCH.sourceSpecificFilters,
      },
      sourceSyncRun: USA_SPENDING_SOURCE_SYNC_RUN,
      sourceRecord: {
        ...USA_SPENDING_SOURCE_RECORD,
        sourceSearchQuery: {
          sourceSystem: USA_SPENDING_SOURCE_SEARCH.sourceSystem,
          canonicalFilters: USA_SPENDING_SOURCE_SEARCH.canonicalFilters,
          sourceSpecificFilters:
            USA_SPENDING_SOURCE_SEARCH.sourceSpecificFilters,
        },
        sourceRawPayload: USA_SPENDING_SOURCE_RAW_PAYLOAD,
        sourceNormalizedPayload: USA_SPENDING_SOURCE_NORMALIZED_PAYLOAD,
        sourceImportPreviewPayload:
          USA_SPENDING_SOURCE_NORMALIZED_PAYLOAD.importPreviewPayload,
        contacts: [],
        attachments: [],
        award: USA_SPENDING_SOURCE_AWARD,
        searchResult: {
          resultRank: 1,
        },
        syncRecord: {
          syncAction: "IMPORTED",
        },
      },
      sourceImportDecision: USA_SPENDING_IMPORT_DECISION,
    },
  };
}
