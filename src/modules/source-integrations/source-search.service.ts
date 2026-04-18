import { Prisma } from "@prisma/client";

import { getServerEnv } from "@/lib/env";

import {
  buildSamGovOutboundRequest,
  executeSamGovSearch,
  SAM_GOV_CAPABILITY,
  SAM_GOV_PROCUREMENT_TYPE_OPTIONS,
  SAM_GOV_STATUS_OPTIONS,
  SamGovConnectorError,
  type SamGovOutboundRequest,
} from "./sam-gov.connector";

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

type SourceSearchConnectorRecord = SourceSearchConnectorSummary & {
  credentialReference: string | null;
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

export type SourceSearchResultSummary = {
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
  executionMode:
    | "invalid_query"
    | "unsupported_connector"
    | "connector_unavailable"
    | "connector_error"
    | "fixture_connector"
    | "live_connector";
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
  searchExecutionId: string | null;
  totalCount: number;
  validationErrors: string[];
};

export type SourceSearchRepositoryClient = {
  organization: {
    findUnique(args: {
      where: {
        slug: string;
      };
    } & typeof organizationSourceSearchArgs): Promise<OrganizationSourceSearchRecord | null>;
  };
  $transaction<T>(
    callback: (tx: SourceSearchTransactionClient) => Promise<T>,
  ): Promise<T>;
};

type SourceSearchTransactionClient = {
  sourceRecord: {
    upsert(args: {
      where: {
        organizationId_sourceSystem_sourceRecordId: {
          organizationId: string;
          sourceRecordId: string;
          sourceSystem: string;
        };
      };
      create: Prisma.SourceRecordUncheckedCreateInput;
      update: Prisma.SourceRecordUncheckedUpdateInput;
      select: {
        id: true;
      };
    }): Promise<{ id: string }>;
  };
  sourceRecordAttachment: {
    createMany(args: {
      data: Prisma.SourceRecordAttachmentCreateManyInput[];
    }): Promise<unknown>;
    deleteMany(args: {
      where: {
        sourceRecordId: string;
      };
    }): Promise<unknown>;
  };
  sourceRecordAward: {
    deleteMany(args: {
      where: {
        sourceRecordId: string;
      };
    }): Promise<unknown>;
    upsert(args: {
      where: {
        sourceRecordId: string;
      };
      create: Prisma.SourceRecordAwardUncheckedCreateInput;
      update: Prisma.SourceRecordAwardUncheckedUpdateInput;
    }): Promise<unknown>;
  };
  sourceRecordContact: {
    createMany(args: {
      data: Prisma.SourceRecordContactCreateManyInput[];
    }): Promise<unknown>;
    deleteMany(args: {
      where: {
        sourceRecordId: string;
      };
    }): Promise<unknown>;
  };
  sourceSearchExecution: {
    create(args: {
      data: Prisma.SourceSearchExecutionUncheckedCreateInput;
      select: {
        id: true;
        requestedAt: true;
      };
    }): Promise<{
      id: string;
      requestedAt: Date;
    }>;
  };
  sourceSearchResult: {
    createMany(args: {
      data: Array<{
        searchExecutionId: string;
        sourceRecordId: string;
        resultRank: number;
      }>;
    }): Promise<unknown>;
  };
};

const DEFAULT_ORGANIZATION_SLUG = "default-org";
const DEFAULT_POSTED_FROM = "2026-03-01";
const DEFAULT_POSTED_TO = "2026-04-30";
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_PAGE_OFFSET = 0;

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
        credentialReference: true,
      },
    },
  },
} as const;

type OrganizationSourceSearchRecord = {
  id: string;
  name: string;
  slug: string;
  sourceConnectorConfigs: SourceSearchConnectorRecord[];
};

type SearchActorContext = {
  email: string | null;
  organizationId: string;
  userId: string | null;
};

export { buildSamGovOutboundRequest };

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

export async function getSourceSearchSnapshot({
  actor,
  db,
  organizationSlug = DEFAULT_ORGANIZATION_SLUG,
  searchParams,
}: {
  actor: SearchActorContext;
  db: SourceSearchRepositoryClient;
  organizationSlug?: string;
  searchParams?: Record<string, string | string[] | undefined>;
}): Promise<SourceSearchSnapshot | null> {
  const organization = await db.organization.findUnique({
    where: {
      slug: organizationSlug,
    },
    ...organizationSourceSearchArgs,
  });

  if (!organization) {
    return null;
  }

  const requestState = parseSourceSearchParams(searchParams);
  const activeConnector =
    organization.sourceConnectorConfigs.find(
      (connector) => connector.sourceSystemKey === requestState.formValues.source,
    ) ?? null;

  if (requestState.validationErrors.length > 0) {
    return buildBaseSnapshot({
      activeConnector,
      connectors: organization.sourceConnectorConfigs,
      executionMessage:
        "Search execution is blocked until the current filter values satisfy the typed sam.gov contract.",
      executionMode: "invalid_query",
      formValues: requestState.formValues,
      organization,
      outboundRequest: null,
      query: null,
      results: [],
      searchExecutionId: null,
      totalCount: 0,
      validationErrors: requestState.validationErrors,
    });
  }

  if (
    requestState.query?.sourceSystem !== "sam_gov" ||
    !activeConnector?.supportsSearch ||
    !activeConnector.isEnabled
  ) {
    return buildBaseSnapshot({
      activeConnector,
      connectors: organization.sourceConnectorConfigs,
      executionMessage:
        "This workspace only has an executable connector for sam.gov in the current slice. Other configured connectors remain visible so the shared connector interface can expand without rewriting the page.",
      executionMode: "unsupported_connector",
      formValues: requestState.formValues,
      organization,
      outboundRequest: null,
      query: requestState.query,
      results: [],
      searchExecutionId: null,
      totalCount: 0,
      validationErrors: [],
    });
  }

  const env = getServerEnv();
  const useFixtures = env.SAM_GOV_USE_FIXTURES || env.NODE_ENV === "test";

  try {
    const execution = await executeSamGovSearch({
      apiKey: env.SAM_GOV_API_KEY ?? null,
      config: {
        connectorVersion: activeConnector.connectorVersion,
        credentialReference: activeConnector.credentialReference,
        searchEndpoint: env.SAM_GOV_SEARCH_ENDPOINT,
      },
      query: requestState.query,
      timeoutMs: env.SAM_GOV_TIMEOUT_MS,
      useFixtures,
    });

    const persistedExecution = await persistSuccessfulSearchExecution({
      actor,
      connector: activeConnector,
      db,
      execution,
      organization,
      query: requestState.query,
    });

    return buildBaseSnapshot({
      activeConnector,
      connectors: organization.sourceConnectorConfigs,
      executedAt: persistedExecution.executedAt,
      executionMessage:
        execution.executionMode === "live_connector"
          ? "The SAM.gov connector translated the canonical query, executed the live upstream search, persisted the execution envelope, and materialized normalized source records for preview and import."
          : "The SAM.gov connector executed against deterministic fixture payloads so tests and offline development can exercise the same reusable connector and persistence flow without a live API dependency.",
      executionMode: execution.executionMode,
      formValues: requestState.formValues,
      organization,
      outboundRequest: execution.outboundRequest,
      query: requestState.query,
      results: persistedExecution.results,
      searchExecutionId: persistedExecution.searchExecutionId,
      totalCount: execution.totalRecords,
      validationErrors: [],
    });
  } catch (error) {
    if (
      error instanceof SamGovConnectorError &&
      error.code === "connector_not_configured"
    ) {
      return buildBaseSnapshot({
        activeConnector,
        connectors: organization.sourceConnectorConfigs,
        executionMessage: error.message,
        executionMode: "connector_unavailable",
        formValues: requestState.formValues,
        organization,
        outboundRequest: error.outboundRequest,
        query: requestState.query,
        results: [],
        searchExecutionId: null,
        totalCount: 0,
        validationErrors: [],
      });
    }

    if (error instanceof SamGovConnectorError) {
      const failedExecution = await persistFailedSearchExecution({
        actor,
        connector: activeConnector,
        db,
        error,
        organization,
        query: requestState.query,
      });

      return buildBaseSnapshot({
        activeConnector,
        connectors: organization.sourceConnectorConfigs,
        executedAt: failedExecution.executedAt,
        executionMessage: error.message,
        executionMode: "connector_error",
        formValues: requestState.formValues,
        organization,
        outboundRequest: error.outboundRequest,
        query: requestState.query,
        results: [],
        searchExecutionId: failedExecution.searchExecutionId,
        totalCount: 0,
        validationErrors: [],
      });
    }

    throw error;
  }
}

async function persistSuccessfulSearchExecution({
  actor,
  connector,
  db,
  execution,
  organization,
  query,
}: {
  actor: SearchActorContext;
  connector: SourceSearchConnectorRecord;
  db: SourceSearchRepositoryClient;
  execution: Awaited<ReturnType<typeof executeSamGovSearch>>;
  organization: OrganizationSourceSearchRecord;
  query: CanonicalSourceSearchQuery;
}) {
  return db.$transaction(async (tx) => {
    const searchExecution = await tx.sourceSearchExecution.create({
      data: {
        canonicalFilters: asJsonValue(query),
        completedAt: new Date(),
        connectorVersion: connector.connectorVersion,
        httpStatus: execution.httpStatus,
        organizationId: organization.id,
        outboundRequest: asJsonValue({
          credentialReference: connector.credentialReference,
          endpoint: execution.outboundRequest.endpoint,
          queryParams: execution.outboundRequest.queryParams,
        }),
        requestedAt: new Date(),
        requestedByActorType: "USER",
        requestedByUserId: actor.userId,
        responseLatencyMs: execution.responseLatencyMs,
        resultCount: execution.materializedRecords.length,
        sourceConnectorConfigId: connector.id,
        sourceSystem: "sam_gov",
        status: "SUCCEEDED",
        totalRecords: execution.totalRecords,
      },
      select: {
        id: true,
        requestedAt: true,
      },
    });

    const persistedResults: SourceSearchResultSummary[] = [];
    const linkRows: Array<{
      resultRank: number;
      searchExecutionId: string;
      sourceRecordId: string;
    }> = [];

    for (const [index, materialized] of execution.materializedRecords.entries()) {
      const sourceRecord = await tx.sourceRecord.upsert({
        where: {
          organizationId_sourceSystem_sourceRecordId: {
            organizationId: organization.id,
            sourceRecordId: materialized.sourceRecordId,
            sourceSystem: "sam_gov",
          },
        },
        create: {
          organizationId: organization.id,
          sourceConnectorConfigId: connector.id,
          sourceSystem: "sam_gov",
          sourceRecordId: materialized.sourceRecordId,
          sourceApiEndpoint: execution.outboundRequest.endpoint,
          sourceUiUrl: materialized.sourceUiUrl,
          sourceDetailUrl: materialized.sourceDetailUrl,
          sourceDescriptionUrl: materialized.sourceDescriptionUrl,
          sourceFetchedAt: new Date(),
          sourceSearchExecutedAt: searchExecution.requestedAt,
          sourceSearchQuery: asJsonValue(query),
          sourceRawPayload: asJsonValue(materialized.rawPayload),
          sourceNormalizedPayload: asJsonValue(materialized.normalizedPayload),
          sourceImportPreviewPayload: asJsonValue(materialized.importPreviewPayload),
          sourceNormalizationVersion: readString(
            materialized.normalizedPayload.normalizationVersion,
          ) ?? connector.connectorVersion ?? "sam-gov.search",
          sourceNormalizationAppliedAt: new Date(),
          sourceRawPostedDate: readString(materialized.rawPayload.postedDate),
          sourceRawResponseDeadline: readString(
            materialized.rawPayload.responseDeadLine,
          ),
          sourceRawArchiveDate: readString(materialized.rawPayload.archiveDate),
          sourceStatusRaw: materialized.summary.status,
          sourceImportMethod: "MANUAL_PULL",
          sourceImportActorType: "USER",
          sourceImportActorIdentifier: actor.email,
          sourceImportActorUserId: actor.userId,
          sourceHashFingerprint: materialized.sourceHashFingerprint,
        },
        update: {
          sourceConnectorConfigId: connector.id,
          sourceApiEndpoint: execution.outboundRequest.endpoint,
          sourceUiUrl: materialized.sourceUiUrl,
          sourceDetailUrl: materialized.sourceDetailUrl,
          sourceDescriptionUrl: materialized.sourceDescriptionUrl,
          sourceFetchedAt: new Date(),
          sourceSearchExecutedAt: searchExecution.requestedAt,
          sourceSearchQuery: asJsonValue(query),
          sourceRawPayload: asJsonValue(materialized.rawPayload),
          sourceNormalizedPayload: asJsonValue(materialized.normalizedPayload),
          sourceImportPreviewPayload: asJsonValue(materialized.importPreviewPayload),
          sourceNormalizationVersion: readString(
            materialized.normalizedPayload.normalizationVersion,
          ) ?? connector.connectorVersion ?? "sam-gov.search",
          sourceNormalizationAppliedAt: new Date(),
          sourceRawPostedDate: readString(materialized.rawPayload.postedDate),
          sourceRawResponseDeadline: readString(
            materialized.rawPayload.responseDeadLine,
          ),
          sourceRawArchiveDate: readString(materialized.rawPayload.archiveDate),
          sourceStatusRaw: materialized.summary.status,
          sourceImportMethod: "MANUAL_PULL",
          sourceImportActorType: "USER",
          sourceImportActorIdentifier: actor.email,
          sourceImportActorUserId: actor.userId,
          sourceHashFingerprint: materialized.sourceHashFingerprint,
        },
        select: {
          id: true,
        },
      });

      await syncSourceRecordChildren({
        materialized,
        sourceRecordId: sourceRecord.id,
        tx,
      });

      persistedResults.push({
        ...materialized.summary,
        id: sourceRecord.id,
      });
      linkRows.push({
        resultRank: index + 1,
        searchExecutionId: searchExecution.id,
        sourceRecordId: sourceRecord.id,
      });
    }

    if (linkRows.length > 0) {
      await tx.sourceSearchResult.createMany({
        data: linkRows,
      });
    }

    return {
      executedAt: searchExecution.requestedAt.toISOString(),
      results: persistedResults,
      searchExecutionId: searchExecution.id,
    };
  });
}

async function persistFailedSearchExecution({
  actor,
  connector,
  db,
  error,
  organization,
  query,
}: {
  actor: SearchActorContext;
  connector: SourceSearchConnectorRecord;
  db: SourceSearchRepositoryClient;
  error: SamGovConnectorError;
  organization: OrganizationSourceSearchRecord;
  query: CanonicalSourceSearchQuery;
}) {
  const searchExecution = await db.$transaction((tx) =>
    tx.sourceSearchExecution.create({
      data: {
        canonicalFilters: asJsonValue(query),
        completedAt: new Date(),
        connectorVersion: connector.connectorVersion,
        errorCode: error.code,
        errorMessage: error.message,
        httpStatus: error.httpStatus,
        organizationId: organization.id,
        outboundRequest: asJsonValue({
          credentialReference: connector.credentialReference,
          endpoint: error.outboundRequest.endpoint,
          queryParams: error.outboundRequest.queryParams,
        }),
        requestedAt: new Date(),
        requestedByActorType: "USER",
        requestedByUserId: actor.userId,
        responseLatencyMs: error.responseLatencyMs,
        resultCount: 0,
        sourceConnectorConfigId: connector.id,
        sourceSystem: "sam_gov",
        status: "FAILED",
        totalRecords: 0,
      },
      select: {
        id: true,
        requestedAt: true,
      },
    }),
  );

  return {
    executedAt: searchExecution.requestedAt.toISOString(),
    searchExecutionId: searchExecution.id,
  };
}

async function syncSourceRecordChildren({
  materialized,
  sourceRecordId,
  tx,
}: {
  materialized: Awaited<
    ReturnType<typeof executeSamGovSearch>
  >["materializedRecords"][number];
  sourceRecordId: string;
  tx: SourceSearchTransactionClient;
}) {
  await tx.sourceRecordAttachment.deleteMany({
    where: {
      sourceRecordId,
    },
  });

  if (materialized.attachments.length > 0) {
    await tx.sourceRecordAttachment.createMany({
      data: materialized.attachments.map((attachment) => ({
        displayLabel: attachment.displayLabel,
        externalId: attachment.externalId,
        fileSizeBytes: attachment.fileSizeBytes,
        linkType: attachment.linkType,
        metadata: attachment.metadata
          ? (attachment.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        mimeType: attachment.mimeType,
        sortOrder: attachment.sortOrder,
        sourceFileName: attachment.sourceFileName,
        sourceRecordId,
        url: attachment.url,
      })),
    });
  }

  await tx.sourceRecordContact.deleteMany({
    where: {
      sourceRecordId,
    },
  });

  if (materialized.contacts.length > 0) {
    await tx.sourceRecordContact.createMany({
      data: materialized.contacts.map((contact) => ({
        additionalInfoText: contact.additionalInfoText,
        contactType: contact.contactType,
        email: contact.email,
        fax: contact.fax,
        fullName: contact.fullName,
        phone: contact.phone,
        sortOrder: contact.sortOrder,
        sourceRecordId,
        title: contact.title,
      })),
    });
  }

  if (materialized.award) {
    const awardData = {
      awardAmount: normalizeAwardAmount(materialized.award.awardAmount),
      awardDate: materialized.award.awardDate
        ? new Date(materialized.award.awardDate)
        : null,
      awardNumber: materialized.award.awardNumber,
      awardeeCityCode: materialized.award.awardeeCityCode,
      awardeeCityName: materialized.award.awardeeCityName,
      awardeeCountryCode: materialized.award.awardeeCountryCode,
      awardeeCountryName: materialized.award.awardeeCountryName,
      awardeeName: materialized.award.awardeeName,
      awardeePostalCode: materialized.award.awardeePostalCode,
      awardeeStateCode: materialized.award.awardeeStateCode,
      awardeeStateName: materialized.award.awardeeStateName,
      awardeeStreet1: materialized.award.awardeeStreet1,
      awardeeStreet2: materialized.award.awardeeStreet2,
      awardeeUEI: materialized.award.awardeeUEI,
    } satisfies Omit<
      Prisma.SourceRecordAwardUncheckedCreateInput,
      "sourceRecordId"
    >;

    await tx.sourceRecordAward.upsert({
      where: {
        sourceRecordId,
      },
      create: {
        ...awardData,
        sourceRecordId,
      },
      update: awardData,
    });
    return;
  }

  await tx.sourceRecordAward.deleteMany({
    where: {
      sourceRecordId,
    },
  });
}

function buildBaseSnapshot({
  activeConnector,
  connectors,
  executedAt = null,
  executionMessage,
  executionMode,
  formValues,
  organization,
  outboundRequest,
  query,
  results,
  searchExecutionId,
  totalCount,
  validationErrors,
}: {
  activeConnector: SourceSearchConnectorSummary | null;
  connectors: SourceSearchConnectorSummary[];
  executedAt?: string | null;
  executionMessage: string;
  executionMode: SourceSearchSnapshot["executionMode"];
  formValues: SourceSearchFormValues;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  outboundRequest: SamGovOutboundRequest | null;
  query: CanonicalSourceSearchQuery | null;
  results: SourceSearchResultSummary[];
  searchExecutionId: string | null;
  totalCount: number;
  validationErrors: string[];
}) {
  const pageStart =
    totalCount === 0 || results.length === 0
      ? 0
      : (query?.pageOffset ?? 0) + 1;
  const pageEnd =
    totalCount === 0 || results.length === 0
      ? 0
      : (query?.pageOffset ?? 0) + results.length;
  const resultCountLabel =
    executionMode === "invalid_query"
      ? "Search not executed"
      : totalCount === 0
        ? "No external results returned"
        : `Showing ${pageStart}-${pageEnd} of ${totalCount} external results`;

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    },
    connectors,
    activeConnector,
    activeCapability: {
      pageSizeOptions: [...SAM_GOV_CAPABILITY.pageSizeOptions],
      procurementTypes: [...SAM_GOV_PROCUREMENT_TYPE_OPTIONS],
      statusOptions: [...SAM_GOV_STATUS_OPTIONS],
      supportedFilterLabels: [...SAM_GOV_CAPABILITY.supportedFilterLabels],
    },
    executedAt,
    executionMessage,
    executionMode,
    formValues,
    outboundRequest,
    pageResultCount: results.length,
    query,
    resultCountLabel,
    results,
    searchExecutionId,
    totalCount,
    validationErrors,
  } satisfies SourceSearchSnapshot;
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

function normalizeOptionalString(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUppercaseOptionalString(value: string | undefined | null) {
  const normalized = normalizeOptionalString(value);
  return normalized ? normalized.toUpperCase() : null;
}

function getFirstSearchParamValue(value: string | string[] | undefined) {
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

function emptyStringToNull(value: string) {
  return value.length > 0 ? value : null;
}

function asJsonValue(value: Record<string, unknown> | CanonicalSourceSearchQuery) {
  return value as Prisma.InputJsonValue;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function normalizeAwardAmount(value: string | number | null) {
  if (typeof value === "number") {
    return new Prisma.Decimal(value);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return new Prisma.Decimal(value);
  }

  return null;
}
