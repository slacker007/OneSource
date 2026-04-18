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

const ARMY_AGENCY = {
  key: "army-peo-eis",
  name: "PEO Enterprise Information Systems",
  organizationCode: "W91QUZ",
  pathName:
    "Department of the Army / PEO Enterprise Information Systems / Army Contracting Command",
  pathCode: "2100:W91QUZ",
  departmentName: "Department of the Army",
  subtierName: "PEO Enterprise Information Systems",
  officeName: "Army Contracting Command",
  officeCity: "Fort Belvoir",
  officeState: "VA",
  officePostalCode: "22060",
  officeCountryCode: "USA",
};

const VETERANS_AFFAIRS_AGENCY = {
  key: "va-technology-acquisition-center",
  name: "Technology Acquisition Center",
  organizationCode: "36C10B",
  pathName:
    "Department of Veterans Affairs / Office of Information and Technology / Technology Acquisition Center",
  pathCode: "3600:36C10B",
  departmentName: "Department of Veterans Affairs",
  subtierName: "Office of Information and Technology",
  officeName: "Technology Acquisition Center",
  officeCity: "Eatontown",
  officeState: "NJ",
  officePostalCode: "07724",
  officeCountryCode: "USA",
};

const DHS_AGENCY = {
  key: "dhs-cisa-ocpo",
  name: "CISA OCPO",
  organizationCode: "70RCSJ",
  pathName:
    "Department of Homeland Security / Cybersecurity and Infrastructure Security Agency / Office of the Chief Procurement Officer",
  pathCode: "7000:70RCSJ",
  departmentName: "Department of Homeland Security",
  subtierName: "Cybersecurity and Infrastructure Security Agency",
  officeName: "Office of the Chief Procurement Officer",
  officeCity: "Arlington",
  officeState: "VA",
  officePostalCode: "22209",
  officeCountryCode: "USA",
};

const NAVY_AGENCY = {
  key: "navwar-pacific",
  name: "NAVWAR Pacific",
  organizationCode: "N66001",
  pathName:
    "Department of the Navy / Naval Information Warfare Systems Command / NAVWAR Pacific",
  pathCode: "1700:N66001",
  departmentName: "Department of the Navy",
  subtierName: "Naval Information Warfare Systems Command",
  officeName: "NAVWAR Pacific",
  officeCity: "San Diego",
  officeState: "CA",
  officePostalCode: "92152",
  officeCountryCode: "USA",
};

const TEAM_MEMBERS = [
  {
    key: "alex-morgan",
    email: "admin@onesource.local",
    name: "Alex Morgan",
    roleKeys: ["admin"],
  },
  {
    key: "jamie-chen",
    email: "jamie.chen@onesource.local",
    name: "Jamie Chen",
    roleKeys: ["business_development"],
  },
  {
    key: "taylor-reed",
    email: "taylor.reed@onesource.local",
    name: "Taylor Reed",
    roleKeys: ["capture_manager"],
  },
  {
    key: "morgan-patel",
    email: "morgan.patel@onesource.local",
    name: "Morgan Patel",
    roleKeys: ["proposal_manager"],
  },
  {
    key: "sam-rivera",
    email: "sam.rivera@onesource.local",
    name: "Sam Rivera",
    roleKeys: ["executive"],
  },
  {
    key: "casey-brooks",
    email: "casey.brooks@onesource.local",
    name: "Casey Brooks",
    roleKeys: ["contributor"],
  },
  {
    key: "avery-stone",
    email: "avery.stone@onesource.local",
    name: "Avery Stone",
    roleKeys: ["viewer"],
  },
];

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
  {
    key: "stars-iii",
    code: "STARS-III",
    name: "8(a) STARS III",
    vehicleType: "GWAC",
    awardingAgency: "General Services Administration",
    notes: "Small-business GWAC for agile IT and cloud work.",
  },
  {
    key: "cio-sp3-small-business",
    code: "CIO-SP3-SB",
    name: "CIO-SP3 Small Business",
    vehicleType: "GWAC",
    awardingAgency: "National Institutes of Health",
    notes:
      "Vehicle often used for health IT and digital modernization pursuits.",
  },
  {
    key: "seaport-nxg",
    code: "SEAPORT-NXG",
    name: "SeaPort NxG",
    vehicleType: "IDIQ",
    awardingAgency: "Department of the Navy",
    notes: "Primary Navy professional-services contract vehicle.",
  },
];

const ORGANIZATION_SCORING_PROFILE = {
  overview:
    "Mid-sized federal integrator focused on cloud modernization, cyber operations, data platforms, and workflow automation for defense and civilian mission owners.",
  strategicFocus:
    "Prioritize Air Force, Army, and VA digital-transformation pursuits where incumbent risk is manageable, contract-vehicle access already exists, and the team can shape requirements before proposal release.",
  targetNaicsCodes: ["541512", "541519", "518210", "541611"],
  priorityAgencyKeys: [
    "air-force-acc-99-cons",
    "army-peo-eis",
    "va-technology-acquisition-center",
  ],
  relationshipAgencyKeys: [
    "army-peo-eis",
    "va-technology-acquisition-center",
  ],
  activeScoringModelKey: "default_capture_v1",
  activeScoringModelVersion: "2026-04-18",
  goRecommendationThreshold: "70.00",
  deferRecommendationThreshold: "45.00",
  minimumRiskScorePercent: "50.00",
  capabilities: [
    {
      key: "cloud-platform-engineering",
      label: "Cloud platform engineering",
      category: "cloud_operations",
      keywords: [
        "cloud operations",
        "platform engineering",
        "aws",
        "azure",
        "container platform",
      ],
      description:
        "Design, migration, and operations support for secure federal cloud environments.",
    },
    {
      key: "data-ai-modernization",
      label: "Data and AI modernization",
      category: "data_ai",
      keywords: [
        "data platform",
        "knowledge management",
        "analytics",
        "automation",
        "artificial intelligence",
      ],
      description:
        "Mission data pipelines, search, analytics, and workflow automation across legacy environments.",
    },
    {
      key: "zero-trust-cyber-operations",
      label: "Zero-trust cyber operations",
      category: "cybersecurity",
      keywords: [
        "zero trust",
        "security operations",
        "identity",
        "compliance",
        "continuous monitoring",
      ],
      description:
        "Cyber defense, identity modernization, and continuous-monitoring support for regulated programs.",
    },
    {
      key: "enterprise-service-delivery",
      label: "Enterprise service delivery",
      category: "service_management",
      keywords: [
        "service desk",
        "it service management",
        "workflow automation",
        "process improvement",
      ],
      description:
        "Operational transition, service management, and delivery-governance support for enterprise programs.",
    },
  ],
  certifications: [
    {
      key: "iso-27001",
      label: "ISO/IEC 27001",
      code: "ISO-27001",
      issuingBody: "International Organization for Standardization",
      description:
        "Information-security management baseline used in customer trust and risk reviews.",
    },
    {
      key: "iso-20000",
      label: "ISO/IEC 20000",
      code: "ISO-20000",
      issuingBody: "International Organization for Standardization",
      description:
        "Service-management certification aligned to managed operations and transition work.",
    },
    {
      key: "cmmi-svc-level-3",
      label: "CMMI Services Level 3",
      code: "CMMI-SVC-3",
      issuingBody: "ISACA",
      description:
        "Process-maturity evidence used in proposal qualification and execution-risk reviews.",
    },
  ],
  selectedVehicleKeys: [
    "oasis-plus-unrestricted",
    "gsa-mas-it",
    "seaport-nxg",
  ],
  scoringCriteria: [
    {
      key: "capability_fit",
      label: "Capability fit",
      weight: "30.00",
      description:
        "Measures how closely the opportunity scope matches the organization capability inventory.",
    },
    {
      key: "strategic_alignment",
      label: "Strategic alignment",
      weight: "20.00",
      description:
        "Rewards opportunities aligned to target agencies, NAICS codes, and stated growth priorities.",
    },
    {
      key: "vehicle_access",
      label: "Vehicle access",
      weight: "15.00",
      description:
        "Scores the ability to pursue on an existing preferred vehicle without a partner dependency.",
    },
    {
      key: "relationship_strength",
      label: "Relationship strength",
      weight: "15.00",
      description:
        "Reflects current account familiarity and seeded customer relationship coverage for the agency.",
    },
    {
      key: "schedule_realism",
      label: "Schedule realism",
      weight: "10.00",
      description:
        "Assesses whether the timeline supports a credible capture and proposal response path.",
    },
    {
      key: "risk",
      label: "Risk",
      weight: "10.00",
      description:
        "Represents risk posture after considering incumbent pressure, ambiguity, and delivery complexity.",
    },
  ],
};

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
  {
    key: "northstar-digital",
    name: "Northstar Digital Group",
    websiteUrl: "https://northstar-digital.example",
    notes:
      "Known for Army cloud operations and platform engineering bids.",
  },
  {
    key: "sentinel-cyber",
    name: "Sentinel Cyber Operations",
    websiteUrl: "https://sentinel-cyber.example",
    notes: "Shows up regularly on DHS cyber operations opportunities.",
  },
  {
    key: "harbor-mission-tech",
    name: "Harbor Mission Technologies",
    websiteUrl: "https://harbor-mission-tech.example",
    notes: "Incumbent-adjacent competitor on Navy digital engineering work.",
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
  {
    sourceSystemKey: "csv_upload",
    sourceDisplayName: "CSV Upload",
    sourceCategory: "INTERNAL",
    authType: "FILE_IMPORT",
    isEnabled: true,
    supportsSearch: false,
    supportsScheduledSync: false,
    supportsDetailFetch: false,
    supportsDocumentFetch: false,
    supportsResultPreview: true,
    supportsSavedSearches: false,
    supportsIncrementalSync: false,
    supportsWebhooks: false,
    supportsAttachments: false,
    supportsAwardData: false,
    defaultPageSize: null,
    maxPageSize: null,
    rateLimitProfile: {
      strategy: "browser_local_file",
      notes: "Manual CSV upload with preview, mapping, validation, and dedupe.",
    },
    credentialReference: null,
    configData: {
      acceptedExtensions: [".csv"],
      importMode: "manual_file_upload",
    },
    connectorVersion: "csv-upload.v1",
    validationStatus: "VALID",
    lastValidatedAt: "2026-04-18T08:00:00.000Z",
    lastValidationMessage:
      "Manual file-import connector enabled for guarded CSV opportunity intake.",
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

const SAM_GOV_RATE_LIMIT_SEARCH_EXECUTION = {
  requestedAt: "2026-04-18T08:15:00.000Z",
  completedAt: "2026-04-18T08:15:05.000Z",
  status: "FAILED",
  requestedByActorType: "SYSTEM_JOB",
  responseLatencyMs: 913,
  resultCount: 0,
  totalRecords: 0,
  httpStatus: 429,
  connectorVersion: "sam-gov-search.v1",
  errorCode: "sam_gov_http_429",
  errorMessage: "SAM.gov returned HTTP 429: Too many requests.",
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

const SAM_GOV_RATE_LIMIT_SYNC_RUN = {
  requestedAt: "2026-04-18T08:15:00.000Z",
  startedAt: "2026-04-18T08:15:02.000Z",
  completedAt: "2026-04-18T08:15:06.000Z",
  status: "FAILED",
  triggerType: "SCHEDULED",
  requestedByActorType: "SYSTEM_JOB",
  connectorVersion: "sam-gov-sync.v1",
  recordsFetched: 0,
  recordsImported: 0,
  recordsFailed: 1,
  errorCode: "sam_gov_http_429",
  errorMessage: "SAM.gov returned HTTP 429: Too many requests.",
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
  currentStageKey: "capture_active",
  currentStageLabel: "Capture Active",
  currentStageChangedAt: "2026-04-15T16:05:00.000Z",
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
      vehicleCodes: ["OASIS-PLUS-UNR", "MAS-IT-70"],
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

const SAM_GOV_REJECTED_IMPORT_DECISION = {
  connectorKey: "sam_gov",
  requestedAt: "2026-04-18T08:17:00.000Z",
  decidedAt: "2026-04-18T08:18:00.000Z",
  requestedByActorType: "USER",
  mode: "CREATE_OPPORTUNITY",
  status: "REJECTED",
  rationale:
    "Rejected because the notice was already canonicalized into the tracked pipeline and did not need a second opportunity record.",
  decisionMetadata: {
    duplicateCandidateCount: 1,
    reviewDisposition: "duplicate_rejected",
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

const OPPORTUNITY_WORKSPACE = {
  tasks: [
    {
      key: "incumbent-analysis",
      title: "Complete incumbent analysis brief",
      description:
        "Summarize incumbent strengths, likely discriminators, and contract history before the internal capture stand-up.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueAt: "2026-04-16T17:00:00.000Z",
      startedAt: "2026-04-16T14:00:00.000Z",
      completedAt: null,
      sortOrder: 0,
      assigneeUserKey: "taylor-reed",
      metadata: {
        ownerDiscipline: "capture",
        linkedCompetitorKeys: ["vector-analytics", "apex-defense"],
      },
    },
    {
      key: "customer-questions",
      title: "Draft customer questions for Q&A window",
      description:
        "Prepare clarification questions around data access, legacy-system constraints, and incumbent transition expectations.",
      status: "NOT_STARTED",
      priority: "MEDIUM",
      dueAt: "2026-04-18T18:00:00.000Z",
      startedAt: null,
      completedAt: null,
      sortOrder: 1,
      assigneeUserKey: "morgan-patel",
      metadata: {
        ownerDiscipline: "proposal",
        dependsOnMilestoneKey: "questions-window",
      },
    },
    {
      key: "staffing-approach",
      title: "Confirm OASIS+ staffing approach",
      description:
        "Validate labor-category mapping and incumbent backfill assumptions with the delivery lead.",
      status: "COMPLETED",
      priority: "HIGH",
      dueAt: "2026-04-14T21:00:00.000Z",
      startedAt: "2026-04-14T15:00:00.000Z",
      completedAt: "2026-04-14T19:30:00.000Z",
      sortOrder: 2,
      assigneeUserKey: "casey-brooks",
      metadata: {
        ownerDiscipline: "delivery",
        vehicleCode: "OASIS-PLUS-UNR",
      },
    },
  ],
  milestones: [
    {
      key: "bid-review",
      title: "Internal bid review",
      description:
        "Executive and capture review of fit score, incumbent position, and required staffing assumptions.",
      milestoneTypeKey: "bid_decision",
      status: "COMPLETED",
      targetDate: "2026-04-13T16:00:00.000Z",
      completedAt: "2026-04-13T16:20:00.000Z",
      sortOrder: 0,
      metadata: {
        meetingType: "go-no-go",
      },
    },
    {
      key: "questions-window",
      title: "Customer questions due",
      description:
        "Submit clarifications before the public Q&A period closes.",
      milestoneTypeKey: "question_deadline",
      status: "PLANNED",
      targetDate: "2026-04-18T23:59:00.000Z",
      completedAt: null,
      sortOrder: 1,
      metadata: {
        external: true,
      },
    },
    {
      key: "proposal-deadline",
      title: "Proposal submission deadline",
      description:
        "Final proposal due to the customer via the official submission channel.",
      milestoneTypeKey: "proposal_due",
      status: "PLANNED",
      targetDate: "2026-05-01T21:00:00.000Z",
      completedAt: null,
      sortOrder: 2,
      metadata: {
        external: true,
        submissionTimezone: "America/New_York",
      },
    },
  ],
  notes: [
    {
      key: "capture-summary",
      title: "Capture summary",
      body: [
        "## Capture Summary",
        "",
        "- Air Force mission fit is strong because the team has existing workflow-modernization past performance.",
        "- Incumbent risk remains moderate until USAspending evidence and partner intel are reconciled.",
        "- Vehicle access is confirmed through OASIS+ and MAS IT paths.",
      ].join("\n"),
      contentFormat: "markdown",
      isPinned: true,
    },
    {
      key: "partner-follow-up",
      title: "Partner follow-up",
      body: [
        "Need partner confirmation on cleared data architects before the next capture review.",
        "",
        "Follow up with staffing lead if resumes are not ready by Monday.",
      ].join("\n"),
      contentFormat: "markdown",
      isPinned: false,
    },
  ],
  documents: [
    {
      key: "pws-source-doc",
      title: "Performance Work Statement",
      documentType: "statement_of_work",
      sourceType: "SOURCE_ATTACHMENT",
      sourceRecordRef: "primary-source-record",
      sourceUrl:
        "https://sam.gov/opp/FA4861-26-R-0001/documents/performance-work-statement.pdf",
      originalFileName: "performance-work-statement.pdf",
      storageProvider: "source_url",
      storagePath: null,
      mimeType: "application/pdf",
      fileSizeBytes: 245760,
      checksumSha256:
        "3d7f5c9b9373f54d5d2af1d643e1a5570d4f1abf83adf18f5b7247b74b68f45d",
      extractedText:
        "Performance work statement summary: provide enterprise knowledge management, workflow modernization, analytics support, and transition planning.",
      extractionStatus: "SUCCEEDED",
      extractedAt: "2026-04-12T14:06:10.000Z",
      metadata: {
        sourceAttachmentLabel: "Performance Work Statement",
      },
    },
    {
      key: "capture-plan",
      title: "Capture Plan v1",
      documentType: "capture_plan",
      sourceType: "MANUAL_UPLOAD",
      sourceRecordRef: null,
      sourceUrl: null,
      originalFileName: "capture-plan-v1.docx",
      storageProvider: "local_disk",
      storagePath:
        "documents/opportunities/fa4861-26-r-0001/capture-plan-v1.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSizeBytes: 98304,
      checksumSha256:
        "7f102b444572c302c95759f6a95ce76e4a9bc4be19da7c6794a6cb3ab8bfa1ef",
      extractedText:
        "Capture plan highlights: confirm incumbency, validate staffing, refine win themes, and prepare customer questions before proposal kickoff.",
      extractionStatus: "SUCCEEDED",
      extractedAt: "2026-04-15T09:15:00.000Z",
      metadata: {
        uploadedByRole: "capture_manager",
      },
    },
  ],
  stageTransitions: [
    {
      key: "identified-to-qualified",
      triggerType: "IMPORT",
      fromStageKey: "identified",
      fromStageLabel: "Identified",
      toStageKey: "qualified",
      toStageLabel: "Qualified",
      rationale:
        "Qualified immediately after import because the opportunity matched target NAICS, set-aside posture, and active vehicle access.",
      requiredFieldsSnapshot: {
        leadAgency: true,
        responseDeadline: true,
        vehicleCoverage: true,
      },
      metadata: {
        sourceSystem: "sam_gov",
      },
      transitionedAt: "2026-04-12T14:05:30.000Z",
    },
    {
      key: "qualified-to-pursuit-approved",
      triggerType: "MANUAL",
      fromStageKey: "qualified",
      fromStageLabel: "Qualified",
      toStageKey: "pursuit_approved",
      toStageLabel: "Pursuit Approved",
      rationale:
        "Leadership approved pursuit after the initial review confirmed mission fit and viable staffing paths.",
      requiredFieldsSnapshot: {
        scorecardComplete: true,
        incumbentReviewComplete: false,
        executiveReviewComplete: true,
      },
      metadata: {
        meetingName: "weekly bid review",
      },
      transitionedAt: "2026-04-13T16:20:00.000Z",
    },
    {
      key: "pursuit-approved-to-capture-active",
      triggerType: "MANUAL",
      fromStageKey: "pursuit_approved",
      fromStageLabel: "Pursuit Approved",
      toStageKey: "capture_active",
      toStageLabel: "Capture Active",
      rationale:
        "Capture activities started after the first scorecard and bid decision were recorded.",
      requiredFieldsSnapshot: {
        bidDecisionRecorded: true,
        kickoffScheduled: true,
      },
      metadata: {
        kickoffOwner: "OneSource Admin",
      },
      transitionedAt: "2026-04-15T16:05:00.000Z",
    },
  ],
  scorecard: {
    scoringModelKey: "default_capture_v1",
    scoringModelVersion: "2026-04-01",
    totalScore: "79.50",
    maximumScore: "100.00",
    scorePercent: "79.50",
    recommendationOutcome: "GO",
    recommendationSummary:
      "Vehicle access and capability fit support pursuit, but relationship strength still needs customer-intel follow-up.",
    summary:
      "The seeded opportunity scores as a strong pursuit candidate with manageable incumbent and relationship risk.",
    inputSnapshot: {
      agencyPriority: "tier_1_air_force",
      naicsCode: "541511",
      vehicleCoverage: ["OASIS-PLUS-UNR", "MAS-IT-70"],
      incumbentSignals: ["usaspending_award_context"],
    },
    calculatedAt: "2026-04-15T16:30:00.000Z",
    factors: [
      {
        key: "capability_fit",
        label: "Capability Fit",
        weight: "30.00",
        score: "24.00",
        maximumScore: "30.00",
        explanation:
          "Past performance and service offerings align well with enterprise knowledge management support.",
        factorMetadata: {
          evidence: ["workflow modernization", "analytics support"],
        },
        sortOrder: 0,
      },
      {
        key: "strategic_alignment",
        label: "Strategic Alignment",
        weight: "20.00",
        score: "16.00",
        maximumScore: "20.00",
        explanation:
          "Air Force digital operations are a priority growth segment for the organization.",
        factorMetadata: {
          growthSegment: "air_force_digital_operations",
        },
        sortOrder: 1,
      },
      {
        key: "vehicle_access",
        label: "Vehicle Access",
        weight: "15.00",
        score: "15.00",
        maximumScore: "15.00",
        explanation:
          "Primary and secondary contract vehicles are both already available to the team.",
        factorMetadata: {
          vehicleCodes: ["OASIS-PLUS-UNR", "MAS-IT-70"],
        },
        sortOrder: 2,
      },
      {
        key: "relationship_strength",
        label: "Relationship Strength",
        weight: "15.00",
        score: "8.50",
        maximumScore: "15.00",
        explanation:
          "The account is known, but stakeholder coverage is incomplete and incumbent access remains limited.",
        factorMetadata: {
          openActions: ["confirm stakeholders", "validate incumbent intel"],
        },
        sortOrder: 3,
      },
      {
        key: "schedule_realism",
        label: "Schedule Realism",
        weight: "10.00",
        score: "9.00",
        maximumScore: "10.00",
        explanation:
          "The current response window is workable if capture tasks stay on schedule.",
        factorMetadata: {
          daysUntilDeadline: 16,
        },
        sortOrder: 4,
      },
      {
        key: "risk_profile",
        label: "Risk Profile",
        weight: "10.00",
        score: "7.00",
        maximumScore: "10.00",
        explanation:
          "Incumbent risk and customer intimacy are the main watch items, but neither blocks pursuit yet.",
        factorMetadata: {
          incumbentRisk: "moderate",
          customerAccess: "developing",
        },
        sortOrder: 5,
      },
    ],
  },
  bidDecision: {
    decisionTypeKey: "initial_pursuit",
    recommendationOutcome: "GO",
    recommendationSummary:
      "Proceed with capture because the opportunity fits strategic priorities and scores above the default pursuit threshold.",
    recommendationMetadata: {
      threshold: 70,
      scorePercent: 79.5,
    },
    recommendedByActorType: "SYSTEM",
    recommendedByIdentifier: "rule_engine:default_capture_v1",
    recommendedAt: "2026-04-15T16:31:00.000Z",
    finalOutcome: "GO",
    finalRationale:
      "Leadership approved pursuit because the account is strategic and vehicle access is already cleared.",
    decisionMetadata: {
      approvingForum: "weekly bid review",
      followUpTaskKey: "incumbent-analysis",
    },
    decidedAt: "2026-04-16T14:10:00.000Z",
  },
  activityEvents: [
    {
      eventType: "source_import_applied",
      title: "Source import created the canonical opportunity",
      description:
        "The `sam.gov` source record was promoted into the pipeline and linked as the primary source lineage record.",
      actorType: "SYSTEM",
      actorIdentifier: "connector:sam_gov",
      relatedEntityType: "source_import_decision",
      relatedEntityRef: "primary-import-decision",
      occurredAt: "2026-04-12T14:05:30.000Z",
      metadata: {
        sourceSystem: "sam_gov",
      },
    },
    {
      eventType: "stage_transition",
      title: "Opportunity advanced to Capture Active",
      description:
        "Capture work started after the first scorecard and bid decision were recorded.",
      actorType: "USER",
      actorIdentifier: "admin@onesource.local",
      relatedEntityType: "stage_transition",
      relatedEntityRef: "pursuit-approved-to-capture-active",
      occurredAt: "2026-04-15T16:05:00.000Z",
      metadata: {
        toStageKey: "capture_active",
      },
    },
    {
      eventType: "scorecard_calculated",
      title: "Scorecard recorded a GO recommendation",
      description:
        "The deterministic scorecard landed above the default pursuit threshold.",
      actorType: "USER",
      actorIdentifier: "admin@onesource.local",
      relatedEntityType: "scorecard",
      relatedEntityRef: "primary-scorecard",
      occurredAt: "2026-04-15T16:30:00.000Z",
      metadata: {
        totalScore: 79.5,
      },
    },
    {
      eventType: "bid_decision_recorded",
      title: "Bid decision recorded as GO",
      description:
        "Leadership approved pursuit and documented the rationale in the workspace.",
      actorType: "USER",
      actorIdentifier: "admin@onesource.local",
      relatedEntityType: "bid_decision",
      relatedEntityRef: "initial-pursuit-decision",
      occurredAt: "2026-04-16T14:10:00.000Z",
      metadata: {
        finalOutcome: "GO",
      },
    },
    {
      eventType: "task_progressed",
      title: "Incumbent analysis task moved into progress",
      description:
        "Capture team started the incumbent analysis workstream.",
      actorType: "USER",
      actorIdentifier: "admin@onesource.local",
      relatedEntityType: "task",
      relatedEntityRef: "incumbent-analysis",
      occurredAt: "2026-04-16T14:00:00.000Z",
      metadata: {
        taskStatus: "IN_PROGRESS",
      },
    },
    {
      eventType: "note_added",
      title: "Pinned capture summary note added",
      description:
        "The opportunity workspace now includes the initial capture summary and assumptions.",
      actorType: "USER",
      actorIdentifier: "admin@onesource.local",
      relatedEntityType: "note",
      relatedEntityRef: "capture-summary",
      occurredAt: "2026-04-15T09:30:00.000Z",
      metadata: {
        pinned: true,
      },
    },
    {
      eventType: "document_linked",
      title: "Performance Work Statement linked into the workspace",
      description:
        "The primary statement of work document is available with extracted text.",
      actorType: "USER",
      actorIdentifier: "admin@onesource.local",
      relatedEntityType: "document",
      relatedEntityRef: "pws-source-doc",
      occurredAt: "2026-04-12T14:06:10.000Z",
      metadata: {
        sourceType: "SOURCE_ATTACHMENT",
      },
    },
  ],
};

const MANUAL_PORTFOLIO_OPPORTUNITIES = [
  {
    key: "army-cloud-ops",
    opportunity: {
      title: "Army Cloud Operations Recompete",
      description:
        "Manual pipeline entry for an Army cloud-operations recompete with strong technical fit but unresolved staffing and relationship risk.",
      originSourceSystem: "manual_entry",
      externalNoticeId: null,
      solicitationNumber: "W91QUZ-26-R-0042",
      sourceSummaryText:
        "Hybrid cloud operations, DevSecOps sustainment, and platform reliability support for Army enterprise systems.",
      sourceSummaryUrl: null,
      postedAt: "2026-04-04T00:00:00.000Z",
      postedDateRaw: "04/04/2026",
      responseDeadlineAt: "2026-05-08T21:00:00.000Z",
      responseDeadlineRaw: "05/08/2026 05:00 PM EDT",
      procurementTypeLabel: "Solicitation",
      procurementBaseTypeLabel: "Solicitation",
      archiveType: null,
      archivedAt: null,
      archiveDateRaw: null,
      sourceStatus: "qualified_manual",
      isActiveSourceRecord: true,
      isArchivedSourceRecord: false,
      setAsideCode: null,
      setAsideDescription: null,
      naicsCode: "541512",
      classificationCode: "D310",
      organizationType: "OFFICE",
      officeCity: ARMY_AGENCY.officeCity,
      officeState: ARMY_AGENCY.officeState,
      officePostalCode: ARMY_AGENCY.officePostalCode,
      officeCountryCode: ARMY_AGENCY.officeCountryCode,
      placeOfPerformanceStreet1: "9800 Savage Road",
      placeOfPerformanceStreet2: null,
      placeOfPerformanceCityCode: null,
      placeOfPerformanceCityName: "Fort Belvoir",
      placeOfPerformanceStateCode: "VA",
      placeOfPerformanceStateName: "Virginia",
      placeOfPerformancePostalCode: "22060",
      placeOfPerformanceCountryCode: "USA",
      additionalInfoUrl: null,
      uiLink: null,
      apiSelfLink: null,
      currentStageKey: "qualified",
      currentStageLabel: "Qualified",
      currentStageChangedAt: "2026-04-14T18:00:00.000Z",
      agencyKey: ARMY_AGENCY.key,
      vehicleKeys: ["oasis-plus-unrestricted", "stars-iii"],
      competitorLinks: [
        {
          competitorKey: "northstar-digital",
          role: "INCUMBENT",
          notes:
            "Current platform-operations incumbent with deep Army cloud footprint.",
        },
        {
          competitorKey: "apex-defense",
          role: "KNOWN_COMPETITOR",
          notes: "Frequently competes on Army enterprise cloud recompetes.",
        },
      ],
    },
    workspace: {
      tasks: [
        {
          key: "army-staffing-gap",
          title: "Close cleared SRE staffing gap",
          description:
            "Confirm whether the current bench or partners can cover the required cleared SRE roles.",
          status: "BLOCKED",
          priority: "CRITICAL",
          dueAt: "2026-04-22T17:00:00.000Z",
          startedAt: "2026-04-17T13:00:00.000Z",
          completedAt: null,
          sortOrder: 0,
          assigneeUserKey: "taylor-reed",
          metadata: {
            blocker: "cleared_talent_shortage",
          },
        },
        {
          key: "army-customer-map",
          title: "Build Army stakeholder map",
          description:
            "Document program, contracting, and technical stakeholders before the pursuit recommendation changes.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueAt: "2026-04-24T16:00:00.000Z",
          startedAt: "2026-04-16T15:00:00.000Z",
          completedAt: null,
          sortOrder: 1,
          assigneeUserKey: "jamie-chen",
          metadata: {
            customerCoverage: "partial",
          },
        },
      ],
      milestones: [
        {
          key: "army-gate-review",
          title: "Gate review refresh",
          description:
            "Revisit defer-versus-pursue after staffing and customer access updates land.",
          milestoneTypeKey: "decision_checkpoint",
          status: "AT_RISK",
          targetDate: "2026-04-25T19:00:00.000Z",
          completedAt: null,
          sortOrder: 0,
          metadata: {
            reviewForum: "executive_gate",
          },
        },
        {
          key: "army-solution-outline",
          title: "Solution outline due",
          description:
            "Draft the cloud-operations approach only if staffing coverage is confirmed.",
          milestoneTypeKey: "solution_outline",
          status: "PLANNED",
          targetDate: "2026-04-29T21:00:00.000Z",
          completedAt: null,
          sortOrder: 1,
          metadata: null,
        },
      ],
      notes: [
        {
          key: "army-risk-note",
          title: "Qualification watch items",
          body: [
            "- Technical fit is strong.",
            "- Staffing and customer intimacy are below the default pursuit bar.",
            "- Keep the opportunity warm but do not commit proposal resources yet.",
          ].join("\n"),
          contentFormat: "markdown",
          isPinned: true,
        },
      ],
      documents: [
        {
          key: "army-qual-brief",
          title: "Army Qualification Brief",
          documentType: "qualification_brief",
          sourceType: "MANUAL_UPLOAD",
          sourceRecordRef: null,
          sourceUrl: null,
          originalFileName: "army-cloud-qualification-brief.docx",
          storageProvider: "local_disk",
          storagePath:
            "documents/opportunities/army-cloud-ops/qualification-brief.docx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          fileSizeBytes: 65536,
          checksumSha256:
            "11e8021f22a2ff3b88a7c5376168d24a68e9910f1d95a092f73a0d346ec35d51",
          extractedText:
            "Qualification brief highlights staffing gaps, customer access gaps, and the current defer recommendation.",
          extractionStatus: "SUCCEEDED",
          extractedAt: "2026-04-17T17:45:00.000Z",
          metadata: {
            audience: "executive_gate",
          },
        },
      ],
      stageTransitions: [
        {
          key: "army-identified-to-qualified",
          triggerType: "MANUAL",
          fromStageKey: "identified",
          fromStageLabel: "Identified",
          toStageKey: "qualified",
          toStageLabel: "Qualified",
          rationale:
            "Qualified after initial intake because NAICS fit and vehicle coverage were credible.",
          requiredFieldsSnapshot: {
            leadAgency: true,
            responseDeadline: true,
          },
          metadata: {
            source: "manual_capture_review",
          },
          transitionedAt: "2026-04-14T18:00:00.000Z",
        },
      ],
      scorecard: {
        scoringModelKey: "default_capture_v1",
        scoringModelVersion: "2026-04-01",
        totalScore: "66.00",
        maximumScore: "100.00",
        scorePercent: "66.00",
        recommendationOutcome: "DEFER",
        recommendationSummary:
          "Technical alignment is good, but staffing and relationship coverage do not yet justify full pursuit.",
        summary:
          "The Army recompete stays in the queue pending staffing and customer-intel closure.",
        inputSnapshot: {
          vehicleCoverage: ["OASIS-PLUS-UNR", "STARS-III"],
          incumbent: "Northstar Digital Group",
        },
        calculatedAt: "2026-04-17T18:15:00.000Z",
        factors: [
          {
            key: "capability_fit",
            label: "Capability Fit",
            weight: "30.00",
            score: "23.00",
            maximumScore: "30.00",
            explanation: "Cloud-ops capabilities match the scope well.",
            factorMetadata: null,
            sortOrder: 0,
          },
          {
            key: "vehicle_access",
            label: "Vehicle Access",
            weight: "15.00",
            score: "13.00",
            maximumScore: "15.00",
            explanation: "Vehicle coverage is credible but not yet customer-preferred.",
            factorMetadata: null,
            sortOrder: 1,
          },
          {
            key: "relationship_strength",
            label: "Relationship Strength",
            weight: "25.00",
            score: "11.00",
            maximumScore: "25.00",
            explanation: "Stakeholder coverage is shallow.",
            factorMetadata: {
              gap: "customer_access",
            },
            sortOrder: 2,
          },
          {
            key: "delivery_readiness",
            label: "Delivery Readiness",
            weight: "30.00",
            score: "19.00",
            maximumScore: "30.00",
            explanation: "Staffing risk keeps the opportunity below the go threshold.",
            factorMetadata: {
              staffingGap: true,
            },
            sortOrder: 3,
          },
        ],
      },
      bidDecision: {
        decisionTypeKey: "qualification_review",
        recommendationOutcome: "DEFER",
        recommendationSummary:
          "Defer full pursuit until the cleared staffing model and stakeholder map are stronger.",
        recommendationMetadata: {
          threshold: 70,
          scorePercent: 66,
        },
        recommendedByActorType: "SYSTEM",
        recommendedByIdentifier: "rule_engine:default_capture_v1",
        recommendedAt: "2026-04-17T18:16:00.000Z",
        finalOutcome: "DEFER",
        finalRationale:
          "Leadership kept the opportunity in qualification rather than funding full capture immediately.",
        decisionMetadata: {
          nextReviewAt: "2026-04-25T19:00:00.000Z",
        },
        decidedAt: "2026-04-17T18:30:00.000Z",
      },
      activityEvents: [
        {
          eventType: "scorecard_calculated",
          title: "Qualification scorecard recorded a DEFER recommendation",
          description:
            "The opportunity remains viable, but the current evidence does not support immediate pursuit.",
          actorType: "USER",
          actorIdentifier: "sam.rivera@onesource.local",
          relatedEntityType: "scorecard",
          relatedEntityRef: "primary-scorecard",
          occurredAt: "2026-04-17T18:15:00.000Z",
          metadata: {
            outcome: "DEFER",
          },
        },
        {
          eventType: "bid_decision_recorded",
          title: "Leadership deferred the pursuit decision",
          description:
            "The Army recompete will be revisited after staffing and customer-intel follow-up.",
          actorType: "USER",
          actorIdentifier: "sam.rivera@onesource.local",
          relatedEntityType: "bid_decision",
          relatedEntityRef: "initial-pursuit-decision",
          occurredAt: "2026-04-17T18:30:00.000Z",
          metadata: {
            finalOutcome: "DEFER",
          },
        },
      ],
    },
  },
  {
    key: "va-claims-automation",
    opportunity: {
      title: "VA Claims Intake Automation BPA",
      description:
        "Manual pursuit for a Veterans Affairs intake-automation BPA already in proposal development.",
      originSourceSystem: "manual_entry",
      externalNoticeId: null,
      solicitationNumber: "36C10B-26-Q-0117",
      sourceSummaryText:
        "Claims-intake automation, workflow orchestration, and human-centered modernization support.",
      sourceSummaryUrl: null,
      postedAt: "2026-03-28T00:00:00.000Z",
      postedDateRaw: "03/28/2026",
      responseDeadlineAt: "2026-04-30T20:00:00.000Z",
      responseDeadlineRaw: "04/30/2026 04:00 PM EDT",
      procurementTypeLabel: "Combined Synopsis/Solicitation",
      procurementBaseTypeLabel: "Solicitation",
      archiveType: null,
      archivedAt: null,
      archiveDateRaw: null,
      sourceStatus: "proposal_active",
      isActiveSourceRecord: true,
      isArchivedSourceRecord: false,
      setAsideCode: "SDVOSB",
      setAsideDescription: "Service-Disabled Veteran-Owned Small Business",
      naicsCode: "541511",
      classificationCode: "R499",
      organizationType: "OFFICE",
      officeCity: VETERANS_AFFAIRS_AGENCY.officeCity,
      officeState: VETERANS_AFFAIRS_AGENCY.officeState,
      officePostalCode: VETERANS_AFFAIRS_AGENCY.officePostalCode,
      officeCountryCode: VETERANS_AFFAIRS_AGENCY.officeCountryCode,
      placeOfPerformanceStreet1: "23 Christopher Way",
      placeOfPerformanceStreet2: null,
      placeOfPerformanceCityCode: null,
      placeOfPerformanceCityName: "Eatontown",
      placeOfPerformanceStateCode: "NJ",
      placeOfPerformanceStateName: "New Jersey",
      placeOfPerformancePostalCode: "07724",
      placeOfPerformanceCountryCode: "USA",
      additionalInfoUrl: null,
      uiLink: null,
      apiSelfLink: null,
      currentStageKey: "proposal_in_development",
      currentStageLabel: "Proposal In Development",
      currentStageChangedAt: "2026-04-11T14:30:00.000Z",
      agencyKey: VETERANS_AFFAIRS_AGENCY.key,
      vehicleKeys: ["gsa-mas-it", "cio-sp3-small-business"],
      competitorLinks: [
        {
          competitorKey: "vector-analytics",
          role: "KNOWN_COMPETITOR",
          notes: "Known competitor on benefits and workflow modernization work.",
        },
      ],
    },
    workspace: {
      tasks: [
        {
          key: "va-win-themes",
          title: "Refine win themes for intake modernization",
          description:
            "Lock final differentiators around workflow design, CX, and claims throughput improvement.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueAt: "2026-04-21T19:00:00.000Z",
          startedAt: "2026-04-16T14:00:00.000Z",
          completedAt: null,
          sortOrder: 0,
          assigneeUserKey: "morgan-patel",
          metadata: {
            sectionOwner: "proposal",
          },
        },
        {
          key: "va-pricing-inputs",
          title: "Finalize pricing assumptions",
          description:
            "Validate labor mix and BPA call-volume assumptions before the red team.",
          status: "NOT_STARTED",
          priority: "MEDIUM",
          dueAt: "2026-04-23T20:00:00.000Z",
          startedAt: null,
          completedAt: null,
          sortOrder: 1,
          assigneeUserKey: "casey-brooks",
          metadata: {
            dependency: "solution_narrative",
          },
        },
      ],
      milestones: [
        {
          key: "va-red-team",
          title: "Red team review",
          description: "Run the proposal red team and disposition findings.",
          milestoneTypeKey: "review",
          status: "PLANNED",
          targetDate: "2026-04-24T19:00:00.000Z",
          completedAt: null,
          sortOrder: 0,
          metadata: null,
        },
        {
          key: "va-submission",
          title: "Submission deadline",
          description: "Submit the BPA quotation package.",
          milestoneTypeKey: "proposal_due",
          status: "PLANNED",
          targetDate: "2026-04-30T20:00:00.000Z",
          completedAt: null,
          sortOrder: 1,
          metadata: null,
        },
      ],
      notes: [
        {
          key: "va-theme-note",
          title: "Proposal focus",
          body:
            "Emphasize intake speed, veteran experience, and measurable backlog reduction.",
          contentFormat: "markdown",
          isPinned: true,
        },
      ],
      documents: [
        {
          key: "va-storyboard",
          title: "Storyboard v2",
          documentType: "proposal_storyboard",
          sourceType: "MANUAL_UPLOAD",
          sourceRecordRef: null,
          sourceUrl: null,
          originalFileName: "va-storyboard-v2.pptx",
          storageProvider: "local_disk",
          storagePath:
            "documents/opportunities/va-claims-automation/storyboard-v2.pptx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          fileSizeBytes: 131072,
          checksumSha256:
            "e8a62a6f6ad1125282f8ec5dbe18010e2cc4e652073cf0c4a8645dbfc985ae6c",
          extractedText:
            "Storyboard emphasizes claims-intake automation, human-centered design, and measurable throughput gains.",
          extractionStatus: "SUCCEEDED",
          extractedAt: "2026-04-16T10:00:00.000Z",
          metadata: {
            reviewStatus: "in_progress",
          },
        },
      ],
      stageTransitions: [
        {
          key: "va-qualified-to-approved",
          triggerType: "MANUAL",
          fromStageKey: "qualified",
          fromStageLabel: "Qualified",
          toStageKey: "pursuit_approved",
          toStageLabel: "Pursuit Approved",
          rationale:
            "Approved because the work is strategic and a strong vehicle path is available.",
          requiredFieldsSnapshot: {
            scorecardComplete: true,
            pricingLeadAssigned: true,
          },
          metadata: null,
          transitionedAt: "2026-04-08T15:00:00.000Z",
        },
        {
          key: "va-approved-to-proposal",
          triggerType: "MANUAL",
          fromStageKey: "pursuit_approved",
          fromStageLabel: "Pursuit Approved",
          toStageKey: "proposal_in_development",
          toStageLabel: "Proposal In Development",
          rationale:
            "Proposal team stood up after leadership approved pursuit and early solution themes.",
          requiredFieldsSnapshot: {
            proposalLeadAssigned: true,
            kickoffScheduled: true,
          },
          metadata: null,
          transitionedAt: "2026-04-11T14:30:00.000Z",
        },
      ],
      scorecard: {
        scoringModelKey: "default_capture_v1",
        scoringModelVersion: "2026-04-01",
        totalScore: "88.00",
        maximumScore: "100.00",
        scorePercent: "88.00",
        recommendationOutcome: "GO",
        recommendationSummary:
          "The VA BPA is a strong pursuit with good customer fit, clear differentiators, and manageable delivery risk.",
        summary:
          "Proposal development is active because the opportunity is aligned, winnable, and resourced.",
        inputSnapshot: {
          strategicAccount: "va-oit",
          vehicleCoverage: ["MAS-IT-70", "CIO-SP3-SB"],
        },
        calculatedAt: "2026-04-10T17:30:00.000Z",
        factors: [
          {
            key: "capability_fit",
            label: "Capability Fit",
            weight: "30.00",
            score: "27.00",
            maximumScore: "30.00",
            explanation: "Automation and workflow experience match directly.",
            factorMetadata: null,
            sortOrder: 0,
          },
          {
            key: "vehicle_access",
            label: "Vehicle Access",
            weight: "20.00",
            score: "18.00",
            maximumScore: "20.00",
            explanation: "The team has two viable contract paths.",
            factorMetadata: null,
            sortOrder: 1,
          },
          {
            key: "customer_alignment",
            label: "Customer Alignment",
            weight: "25.00",
            score: "21.00",
            maximumScore: "25.00",
            explanation: "The customer mission aligns with existing VA past performance.",
            factorMetadata: null,
            sortOrder: 2,
          },
          {
            key: "delivery_readiness",
            label: "Delivery Readiness",
            weight: "25.00",
            score: "22.00",
            maximumScore: "25.00",
            explanation: "Proposal, pricing, and solution resources are already committed.",
            factorMetadata: null,
            sortOrder: 3,
          },
        ],
      },
      bidDecision: {
        decisionTypeKey: "proposal_authorization",
        recommendationOutcome: "GO",
        recommendationSummary:
          "Continue proposal development and preserve current resource allocation.",
        recommendationMetadata: {
          threshold: 70,
          scorePercent: 88,
        },
        recommendedByActorType: "SYSTEM",
        recommendedByIdentifier: "rule_engine:default_capture_v1",
        recommendedAt: "2026-04-10T17:31:00.000Z",
        finalOutcome: "GO",
        finalRationale:
          "The team is already positioned well enough to invest full proposal effort.",
        decisionMetadata: {
          approvedBy: "capture_board",
        },
        decidedAt: "2026-04-10T18:00:00.000Z",
      },
      activityEvents: [
        {
          eventType: "stage_transition",
          title: "Opportunity moved into proposal development",
          description:
            "Proposal leadership took ownership after pursuit approval.",
          actorType: "USER",
          actorIdentifier: "morgan.patel@onesource.local",
          relatedEntityType: "stage_transition",
          relatedEntityRef: "va-approved-to-proposal",
          occurredAt: "2026-04-11T14:30:00.000Z",
          metadata: {
            toStageKey: "proposal_in_development",
          },
        },
      ],
    },
  },
  {
    key: "dhs-zero-trust",
    opportunity: {
      title: "DHS Zero Trust Assessment Support",
      description:
        "Late-stage DHS pursuit already submitted with strong cyber and mission alignment.",
      originSourceSystem: "manual_entry",
      externalNoticeId: null,
      solicitationNumber: "70RCSJ-26-R-0021",
      sourceSummaryText:
        "Zero-trust readiness assessments, remediation planning, and executive reporting support.",
      sourceSummaryUrl: null,
      postedAt: "2026-03-20T00:00:00.000Z",
      postedDateRaw: "03/20/2026",
      responseDeadlineAt: "2026-04-18T21:00:00.000Z",
      responseDeadlineRaw: "04/18/2026 05:00 PM EDT",
      procurementTypeLabel: "Solicitation",
      procurementBaseTypeLabel: "Solicitation",
      archiveType: null,
      archivedAt: null,
      archiveDateRaw: null,
      sourceStatus: "submitted",
      isActiveSourceRecord: true,
      isArchivedSourceRecord: false,
      setAsideCode: null,
      setAsideDescription: null,
      naicsCode: "541519",
      classificationCode: "D399",
      organizationType: "OFFICE",
      officeCity: DHS_AGENCY.officeCity,
      officeState: DHS_AGENCY.officeState,
      officePostalCode: DHS_AGENCY.officePostalCode,
      officeCountryCode: DHS_AGENCY.officeCountryCode,
      placeOfPerformanceStreet1: "245 Murray Lane SW",
      placeOfPerformanceStreet2: null,
      placeOfPerformanceCityCode: null,
      placeOfPerformanceCityName: "Washington",
      placeOfPerformanceStateCode: "DC",
      placeOfPerformanceStateName: "District of Columbia",
      placeOfPerformancePostalCode: "20528",
      placeOfPerformanceCountryCode: "USA",
      additionalInfoUrl: null,
      uiLink: null,
      apiSelfLink: null,
      currentStageKey: "submitted",
      currentStageLabel: "Submitted",
      currentStageChangedAt: "2026-04-18T20:15:00.000Z",
      agencyKey: DHS_AGENCY.key,
      vehicleKeys: ["oasis-plus-unrestricted"],
      competitorLinks: [
        {
          competitorKey: "sentinel-cyber",
          role: "KNOWN_COMPETITOR",
          notes: "Cyber incumbent-adjacent competitor with strong DHS presence.",
        },
      ],
    },
    workspace: {
      tasks: [
        {
          key: "dhs-orals-prep",
          title: "Prepare oral presentation backup deck",
          description:
            "Have oral-response material ready in case the customer requests discussions.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueAt: "2026-04-22T18:00:00.000Z",
          startedAt: "2026-04-18T21:00:00.000Z",
          completedAt: null,
          sortOrder: 0,
          assigneeUserKey: "casey-brooks",
          metadata: {
            contingent: true,
          },
        },
      ],
      milestones: [
        {
          key: "dhs-submitted",
          title: "Proposal submitted",
          description: "Proposal package delivered through the official portal.",
          milestoneTypeKey: "submission",
          status: "COMPLETED",
          targetDate: "2026-04-18T21:00:00.000Z",
          completedAt: "2026-04-18T20:15:00.000Z",
          sortOrder: 0,
          metadata: null,
        },
      ],
      notes: [
        {
          key: "dhs-post-submit",
          title: "Post-submit watch list",
          body:
            "Monitor for discussions, OCI follow-up, and clarification requests during evaluation.",
          contentFormat: "markdown",
          isPinned: false,
        },
      ],
      documents: [
        {
          key: "dhs-final-proposal",
          title: "Final Proposal Package",
          documentType: "proposal_submission",
          sourceType: "MANUAL_UPLOAD",
          sourceRecordRef: null,
          sourceUrl: null,
          originalFileName: "dhs-zero-trust-final.zip",
          storageProvider: "local_disk",
          storagePath:
            "documents/opportunities/dhs-zero-trust/final-proposal.zip",
          mimeType: "application/zip",
          fileSizeBytes: 5242880,
          checksumSha256:
            "3225e8d54f7610a19d32216a56fd77c0ea4f4816cab0fbeadf8573b4fce5ec87",
          extractedText: null,
          extractionStatus: "NOT_REQUESTED",
          extractedAt: null,
          metadata: {
            submissionMethod: "portal",
          },
        },
      ],
      stageTransitions: [
        {
          key: "dhs-capture-to-proposal",
          triggerType: "MANUAL",
          fromStageKey: "capture_active",
          fromStageLabel: "Capture Active",
          toStageKey: "proposal_in_development",
          toStageLabel: "Proposal In Development",
          rationale:
            "Proposal work started once the customer released the final solicitation package.",
          requiredFieldsSnapshot: {
            proposalLeadAssigned: true,
          },
          metadata: null,
          transitionedAt: "2026-04-02T14:00:00.000Z",
        },
        {
          key: "dhs-proposal-to-submitted",
          triggerType: "MANUAL",
          fromStageKey: "proposal_in_development",
          fromStageLabel: "Proposal In Development",
          toStageKey: "submitted",
          toStageLabel: "Submitted",
          rationale:
            "The team submitted a compliant package before the deadline.",
          requiredFieldsSnapshot: {
            complianceChecklistComplete: true,
            pricingFinalized: true,
          },
          metadata: null,
          transitionedAt: "2026-04-18T20:15:00.000Z",
        },
      ],
      scorecard: {
        scoringModelKey: "default_capture_v1",
        scoringModelVersion: "2026-04-01",
        totalScore: "91.00",
        maximumScore: "100.00",
        scorePercent: "91.00",
        recommendationOutcome: "GO",
        recommendationSummary:
          "The cyber fit and capture posture justify an aggressive submit posture.",
        summary:
          "This DHS opportunity is one of the strongest active pursuits in the seeded portfolio.",
        inputSnapshot: {
          mission: "zero_trust",
        },
        calculatedAt: "2026-04-05T15:00:00.000Z",
        factors: [
          {
            key: "capability_fit",
            label: "Capability Fit",
            weight: "35.00",
            score: "32.00",
            maximumScore: "35.00",
            explanation: "Strong cyber and assessment fit.",
            factorMetadata: null,
            sortOrder: 0,
          },
          {
            key: "customer_alignment",
            label: "Customer Alignment",
            weight: "25.00",
            score: "22.00",
            maximumScore: "25.00",
            explanation: "The team has relevant DHS delivery history.",
            factorMetadata: null,
            sortOrder: 1,
          },
          {
            key: "delivery_readiness",
            label: "Delivery Readiness",
            weight: "20.00",
            score: "19.00",
            maximumScore: "20.00",
            explanation: "Proposal and staffing were ready on time.",
            factorMetadata: null,
            sortOrder: 2,
          },
          {
            key: "competitive_position",
            label: "Competitive Position",
            weight: "20.00",
            score: "18.00",
            maximumScore: "20.00",
            explanation: "The team entered with a clear discriminator set.",
            factorMetadata: null,
            sortOrder: 3,
          },
        ],
      },
      bidDecision: {
        decisionTypeKey: "submit_authorization",
        recommendationOutcome: "GO",
        recommendationSummary:
          "Proceed to submission and prepare for potential discussions.",
        recommendationMetadata: {
          scorePercent: 91,
        },
        recommendedByActorType: "SYSTEM",
        recommendedByIdentifier: "rule_engine:default_capture_v1",
        recommendedAt: "2026-04-05T15:01:00.000Z",
        finalOutcome: "GO",
        finalRationale:
          "The opportunity remained a top pursuit through final proposal submission.",
        decisionMetadata: {
          submitted: true,
        },
        decidedAt: "2026-04-18T20:15:00.000Z",
      },
      activityEvents: [
        {
          eventType: "stage_transition",
          title: "Opportunity moved to Submitted",
          description:
            "The proposal package was submitted successfully.",
          actorType: "USER",
          actorIdentifier: "morgan.patel@onesource.local",
          relatedEntityType: "stage_transition",
          relatedEntityRef: "dhs-proposal-to-submitted",
          occurredAt: "2026-04-18T20:15:00.000Z",
          metadata: {
            toStageKey: "submitted",
          },
        },
      ],
    },
  },
  {
    key: "navy-range-modernization",
    opportunity: {
      title: "Navy Training Range Modernization Support",
      description:
        "Early-stage Navy pursuit ultimately moved to no-bid after vehicle and relationship analysis.",
      originSourceSystem: "manual_entry",
      externalNoticeId: null,
      solicitationNumber: "N66001-26-R-9033",
      sourceSummaryText:
        "Training range modernization, data-engineering, and mission-rehearsal systems support.",
      sourceSummaryUrl: null,
      postedAt: "2026-04-01T00:00:00.000Z",
      postedDateRaw: "04/01/2026",
      responseDeadlineAt: "2026-05-20T23:00:00.000Z",
      responseDeadlineRaw: "05/20/2026 04:00 PM PDT",
      procurementTypeLabel: "Sources Sought",
      procurementBaseTypeLabel: "Sources Sought",
      archiveType: null,
      archivedAt: null,
      archiveDateRaw: null,
      sourceStatus: "no_bid",
      isActiveSourceRecord: true,
      isArchivedSourceRecord: false,
      setAsideCode: null,
      setAsideDescription: null,
      naicsCode: "541330",
      classificationCode: "AC13",
      organizationType: "OFFICE",
      officeCity: NAVY_AGENCY.officeCity,
      officeState: NAVY_AGENCY.officeState,
      officePostalCode: NAVY_AGENCY.officePostalCode,
      officeCountryCode: NAVY_AGENCY.officeCountryCode,
      placeOfPerformanceStreet1: "53560 Hull Street",
      placeOfPerformanceStreet2: null,
      placeOfPerformanceCityCode: null,
      placeOfPerformanceCityName: "San Diego",
      placeOfPerformanceStateCode: "CA",
      placeOfPerformanceStateName: "California",
      placeOfPerformancePostalCode: "92152",
      placeOfPerformanceCountryCode: "USA",
      additionalInfoUrl: null,
      uiLink: null,
      apiSelfLink: null,
      currentStageKey: "no_bid",
      currentStageLabel: "No Bid",
      currentStageChangedAt: "2026-04-12T18:20:00.000Z",
      agencyKey: NAVY_AGENCY.key,
      vehicleKeys: ["seaport-nxg"],
      competitorLinks: [
        {
          competitorKey: "harbor-mission-tech",
          role: "INCUMBENT",
          notes: "Strong incumbent position and local mission relationships.",
        },
      ],
    },
    workspace: {
      tasks: [
        {
          key: "navy-no-bid-memo",
          title: "Document no-bid rationale",
          description:
            "Capture the vehicle and relationship gaps so the team can revisit if conditions change.",
          status: "COMPLETED",
          priority: "MEDIUM",
          dueAt: "2026-04-13T18:00:00.000Z",
          startedAt: "2026-04-12T17:00:00.000Z",
          completedAt: "2026-04-12T18:30:00.000Z",
          sortOrder: 0,
          assigneeUserKey: "sam-rivera",
          metadata: null,
        },
      ],
      milestones: [
        {
          key: "navy-bid-review",
          title: "Bid review",
          description: "Executive review of whether to keep the pursuit alive.",
          milestoneTypeKey: "bid_decision",
          status: "COMPLETED",
          targetDate: "2026-04-12T18:00:00.000Z",
          completedAt: "2026-04-12T18:20:00.000Z",
          sortOrder: 0,
          metadata: null,
        },
      ],
      notes: [
        {
          key: "navy-no-bid-note",
          title: "Why we passed",
          body:
            "The team lacked the required relationship depth and did not have a compelling non-incumbent wedge.",
          contentFormat: "markdown",
          isPinned: true,
        },
      ],
      documents: [],
      stageTransitions: [
        {
          key: "navy-identified-to-no-bid",
          triggerType: "MANUAL",
          fromStageKey: "identified",
          fromStageLabel: "Identified",
          toStageKey: "no_bid",
          toStageLabel: "No Bid",
          rationale:
            "The opportunity was closed after the review found weak customer positioning and low win probability.",
          requiredFieldsSnapshot: {
            executiveReviewComplete: true,
          },
          metadata: null,
          transitionedAt: "2026-04-12T18:20:00.000Z",
        },
      ],
      scorecard: {
        scoringModelKey: "default_capture_v1",
        scoringModelVersion: "2026-04-01",
        totalScore: "48.00",
        maximumScore: "100.00",
        scorePercent: "48.00",
        recommendationOutcome: "NO_GO",
        recommendationSummary:
          "The opportunity does not justify pursuit because competitive position and customer access are weak.",
        summary:
          "This seeded no-bid record provides a negative scoring case for future analytics and dashboards.",
        inputSnapshot: {
          incumbent: "Harbor Mission Technologies",
        },
        calculatedAt: "2026-04-12T17:45:00.000Z",
        factors: [
          {
            key: "capability_fit",
            label: "Capability Fit",
            weight: "30.00",
            score: "18.00",
            maximumScore: "30.00",
            explanation: "The work is adjacent but not core.",
            factorMetadata: null,
            sortOrder: 0,
          },
          {
            key: "relationship_strength",
            label: "Relationship Strength",
            weight: "35.00",
            score: "9.00",
            maximumScore: "35.00",
            explanation: "The team has little current Navy relationship depth here.",
            factorMetadata: null,
            sortOrder: 1,
          },
          {
            key: "competitive_position",
            label: "Competitive Position",
            weight: "35.00",
            score: "21.00",
            maximumScore: "35.00",
            explanation: "Incumbent advantage is significant.",
            factorMetadata: null,
            sortOrder: 2,
          },
        ],
      },
      bidDecision: {
        decisionTypeKey: "initial_pursuit",
        recommendationOutcome: "NO_GO",
        recommendationSummary:
          "Pass on this pursuit and preserve resources for stronger targets.",
        recommendationMetadata: {
          scorePercent: 48,
        },
        recommendedByActorType: "SYSTEM",
        recommendedByIdentifier: "rule_engine:default_capture_v1",
        recommendedAt: "2026-04-12T17:46:00.000Z",
        finalOutcome: "NO_GO",
        finalRationale:
          "Leadership declined pursuit because customer access and win probability were too low.",
        decisionMetadata: null,
        decidedAt: "2026-04-12T18:20:00.000Z",
      },
      activityEvents: [
        {
          eventType: "bid_decision_recorded",
          title: "Opportunity closed as No Bid",
          description:
            "The team explicitly documented why it did not pursue the Navy opportunity.",
          actorType: "USER",
          actorIdentifier: "sam.rivera@onesource.local",
          relatedEntityType: "bid_decision",
          relatedEntityRef: "initial-pursuit-decision",
          occurredAt: "2026-04-12T18:20:00.000Z",
          metadata: {
            finalOutcome: "NO_GO",
          },
        },
      ],
    },
  },
];

export function buildOpportunitySeedScenario() {
  return {
    teamMembers: TEAM_MEMBERS,
    connectorConfigs: SOURCE_CONNECTOR_CONFIGS,
    agencies: [
      AIR_FORCE_AGENCY,
      ARMY_AGENCY,
      VETERANS_AFFAIRS_AGENCY,
      DHS_AGENCY,
      NAVY_AGENCY,
    ],
    vehicles: CONTRACT_VEHICLES,
    organizationScoringProfile: ORGANIZATION_SCORING_PROFILE,
    competitors: COMPETITORS,
    sourceSavedSearch: SAM_GOV_SOURCE_SEARCH,
    sourceSearchExecution: {
      ...SAM_GOV_SOURCE_SEARCH_EXECUTION,
      canonicalFilters: SAM_GOV_SOURCE_SEARCH.canonicalFilters,
      sourceSpecificFilters: SAM_GOV_SOURCE_SEARCH.sourceSpecificFilters,
    },
    failedSourceSearchExecution: {
      ...SAM_GOV_RATE_LIMIT_SEARCH_EXECUTION,
      canonicalFilters: SAM_GOV_SOURCE_SEARCH.canonicalFilters,
      sourceSpecificFilters: SAM_GOV_SOURCE_SEARCH.sourceSpecificFilters,
    },
    sourceSyncRun: SAM_GOV_SOURCE_SYNC_RUN,
    failedSourceSyncRun: SAM_GOV_RATE_LIMIT_SYNC_RUN,
    importedOpportunity: {
      ...IMPORTED_OPPORTUNITY,
      agencyKey: AIR_FORCE_AGENCY.key,
      vehicleKeys: ["oasis-plus-unrestricted", "gsa-mas-it"],
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
    rejectedSourceImportDecision: SAM_GOV_REJECTED_IMPORT_DECISION,
    workspace: OPPORTUNITY_WORKSPACE,
    manualOpportunities: MANUAL_PORTFOLIO_OPPORTUNITIES,
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
