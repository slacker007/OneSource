import { Prisma } from "@prisma/client";

import { getServerEnv } from "@/lib/env";
import {
  executeSamGovSearch,
  SamGovConnectorError,
  type SamGovSourceRecordMaterialized,
} from "@/modules/source-integrations/sam-gov.connector";
import type { CanonicalSourceSearchQuery } from "@/modules/source-integrations/source-search.service";

export const SOURCE_SYNC_WORKER_IDENTIFIER = "scheduled-source-sync-worker";

type SourceSyncSavedSearchRecord = {
  id: string;
  organizationId: string;
  sourceSystem: string;
  name: string;
  canonicalFilters: Prisma.JsonValue;
  lastSyncedAt: Date | null;
  connectorConfig: {
    id: string;
    sourceSystemKey: string;
    sourceDisplayName: string;
    isEnabled: boolean;
    supportsScheduledSync: boolean;
    credentialReference: string | null;
    connectorVersion: string | null;
  } | null;
};

type SourceSyncRunRecordSummary = {
  syncAction: "DISCOVERED" | "UPDATED";
    sourceRecordId: string;
};

type SourceSyncTransactionClient = {
  sourceRecord: {
    findUnique(args: {
      where: {
        organizationId_sourceSystem_sourceRecordId: {
          organizationId: string;
          sourceRecordId: string;
          sourceSystem: string;
        };
      };
      select: {
        id: true;
      };
    }): Promise<{ id: string } | null>;
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
  sourceSyncRunRecord: {
    createMany(args: {
      data: Prisma.SourceSyncRunRecordCreateManyInput[];
    }): Promise<unknown>;
  };
  sourceSavedSearch: {
    update(args: {
      where: {
        id: string;
      };
      data: Prisma.SourceSavedSearchUncheckedUpdateInput;
    }): Promise<unknown>;
  };
};

export type SourceSyncJobClient = {
  sourceSavedSearch: {
    findMany(args: {
      where: Prisma.SourceSavedSearchWhereInput;
      orderBy: Prisma.SourceSavedSearchOrderByWithRelationInput[];
      select: {
        id: true;
        organizationId: true;
        sourceSystem: true;
        name: true;
        canonicalFilters: true;
        lastSyncedAt: true;
        connectorConfig: {
          select: {
            id: true;
            sourceSystemKey: true;
            sourceDisplayName: true;
            isEnabled: true;
            supportsScheduledSync: true;
            credentialReference: true;
            connectorVersion: true;
          };
        };
      };
      take: number;
    }): Promise<SourceSyncSavedSearchRecord[]>;
  };
  sourceSyncRun: {
    create(args: {
      data: Prisma.SourceSyncRunUncheckedCreateInput;
      select: {
        id: true;
      };
    }): Promise<{
      id: string;
    }>;
    update(args: {
      where: {
        id: string;
      };
      data: Prisma.SourceSyncRunUncheckedUpdateInput;
    }): Promise<unknown>;
  };
  $transaction<T>(
    callback: (tx: SourceSyncTransactionClient) => Promise<T>,
  ): Promise<T>;
};

export type SourceSyncSweepResult = {
  failedRuns: number;
  processedRuns: number;
  queuedSavedSearches: number;
  succeededRuns: number;
};

export async function runScheduledSourceSyncSweep({
  db,
  log,
  maxRuns = getServerEnv().SOURCE_SYNC_BATCH_SIZE,
  minIntervalMinutes = getServerEnv().SOURCE_SYNC_INTERVAL_MINUTES,
  now = new Date(),
}: {
  db: SourceSyncJobClient;
  log?: JobLogger;
  maxRuns?: number;
  minIntervalMinutes?: number;
  now?: Date;
}): Promise<SourceSyncSweepResult> {
  const dueSavedSearches = await db.sourceSavedSearch.findMany({
    where: {
      connectorConfig: {
        is: {
          isEnabled: true,
          supportsScheduledSync: true,
        },
      },
      OR: [
        {
          lastSyncedAt: null,
        },
        {
          lastSyncedAt: {
            lte: new Date(now.getTime() - minIntervalMinutes * 60 * 1000),
          },
        },
      ],
    },
    orderBy: [{ lastSyncedAt: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      organizationId: true,
      sourceSystem: true,
      name: true,
      canonicalFilters: true,
      lastSyncedAt: true,
      connectorConfig: {
        select: {
          id: true,
          sourceSystemKey: true,
          sourceDisplayName: true,
          isEnabled: true,
          supportsScheduledSync: true,
          credentialReference: true,
          connectorVersion: true,
        },
      },
    },
    take: maxRuns,
  });

  let succeededRuns = 0;
  let failedRuns = 0;

  for (const savedSearch of dueSavedSearches) {
    const runResult = await runScheduledSourceSync({
      db,
      log,
      now,
      savedSearch,
    });

    if (runResult.status === "SUCCEEDED") {
      succeededRuns += 1;
    } else {
      failedRuns += 1;
    }
  }

  return {
    failedRuns,
    processedRuns: dueSavedSearches.length,
    queuedSavedSearches: dueSavedSearches.length,
    succeededRuns,
  };
}

async function runScheduledSourceSync({
  db,
  log,
  now,
  savedSearch,
}: {
  db: SourceSyncJobClient;
  log?: JobLogger;
  now: Date;
  savedSearch: SourceSyncSavedSearchRecord;
}) {
  const syncRun = await db.sourceSyncRun.create({
    data: {
      connectorVersion: savedSearch.connectorConfig?.connectorVersion ?? null,
      organizationId: savedSearch.organizationId,
      requestedAt: now,
      requestedByActorType: "SYSTEM_JOB",
      searchExecutionId: null,
      sourceConnectorConfigId: savedSearch.connectorConfig?.id ?? null,
      sourceSystem: savedSearch.sourceSystem,
      startedAt: now,
      status: "RUNNING",
      triggerType: "SCHEDULED",
      savedSearchId: savedSearch.id,
    },
    select: {
      id: true,
    },
  });

  if (!savedSearch.connectorConfig || savedSearch.sourceSystem !== "sam_gov") {
    const errorMessage =
      "Scheduled source sync currently executes only the reusable sam.gov connector boundary.";
    await db.sourceSyncRun.update({
      where: {
        id: syncRun.id,
      },
      data: {
        completedAt: new Date(),
        errorCode: "unsupported_connector",
        errorMessage,
        status: "FAILED",
      },
    });

    log?.({
      detail: {
        savedSearchId: savedSearch.id,
        syncRunId: syncRun.id,
      },
      level: "warn",
      message: errorMessage,
    });

    return {
      status: "FAILED" as const,
    };
  }

  const query = parseScheduledSyncQuery(savedSearch.canonicalFilters);

  if (!query) {
    const errorMessage =
      "Scheduled source sync skipped because the saved canonical filters no longer satisfy the typed connector contract.";
    await db.sourceSyncRun.update({
      where: {
        id: syncRun.id,
      },
      data: {
        completedAt: new Date(),
        errorCode: "invalid_saved_search",
        errorMessage,
        status: "FAILED",
      },
    });

    log?.({
      detail: {
        savedSearchId: savedSearch.id,
        syncRunId: syncRun.id,
      },
      level: "warn",
      message: errorMessage,
    });

    return {
      status: "FAILED" as const,
    };
  }

  const env = getServerEnv();
  const useFixtures = env.SAM_GOV_USE_FIXTURES || env.NODE_ENV === "test";

  try {
    const execution = await executeSamGovSearch({
      apiKey: env.SAM_GOV_API_KEY ?? null,
      config: {
        connectorVersion: savedSearch.connectorConfig.connectorVersion,
        credentialReference: savedSearch.connectorConfig.credentialReference,
        searchEndpoint: env.SAM_GOV_SEARCH_ENDPOINT,
      },
      query,
      timeoutMs: env.SAM_GOV_TIMEOUT_MS,
      useFixtures,
    });

    const persistedExecution = await db.$transaction(async (tx) => {
      const searchExecution = await tx.sourceSearchExecution.create({
        data: {
          canonicalFilters: asJsonValue(query),
          completedAt: new Date(),
          connectorVersion: savedSearch.connectorConfig?.connectorVersion,
          httpStatus: execution.httpStatus,
          organizationId: savedSearch.organizationId,
          outboundRequest: asJsonValue({
            credentialReference: savedSearch.connectorConfig?.credentialReference ?? null,
            endpoint: execution.outboundRequest.endpoint,
            queryParams: execution.outboundRequest.queryParams,
          }),
          requestedAt: now,
          requestedByActorType: "SYSTEM_JOB",
          resultCount: execution.materializedRecords.length,
          savedSearchId: savedSearch.id,
          sourceConnectorConfigId: savedSearch.connectorConfig?.id ?? null,
          sourceSystem: savedSearch.sourceSystem,
          status: "SUCCEEDED",
          totalRecords: execution.totalRecords,
          responseLatencyMs: execution.responseLatencyMs,
        },
        select: {
          id: true,
          requestedAt: true,
        },
      });

      const searchResultLinks: Array<{
        resultRank: number;
        searchExecutionId: string;
        sourceRecordId: string;
      }> = [];
      const syncRunRecords: SourceSyncRunRecordSummary[] = [];

      for (const [index, materialized] of execution.materializedRecords.entries()) {
        const existingSourceRecord = await tx.sourceRecord.findUnique({
          where: {
            organizationId_sourceSystem_sourceRecordId: {
              organizationId: savedSearch.organizationId,
              sourceRecordId: materialized.sourceRecordId,
              sourceSystem: savedSearch.sourceSystem,
            },
          },
          select: {
            id: true,
          },
        });

        const sourceRecord = await tx.sourceRecord.upsert({
          where: {
            organizationId_sourceSystem_sourceRecordId: {
              organizationId: savedSearch.organizationId,
              sourceRecordId: materialized.sourceRecordId,
              sourceSystem: savedSearch.sourceSystem,
            },
          },
          create: {
            organizationId: savedSearch.organizationId,
            sourceConnectorConfigId: savedSearch.connectorConfig?.id ?? null,
            sourceSystem: savedSearch.sourceSystem,
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
            sourceNormalizationVersion:
              readString(materialized.normalizedPayload.normalizationVersion) ??
              savedSearch.connectorConfig?.connectorVersion ??
              "sam-gov.search",
            sourceNormalizationAppliedAt: new Date(),
            sourceRawPostedDate: readString(materialized.rawPayload.postedDate),
            sourceRawResponseDeadline: readString(
              materialized.rawPayload.responseDeadLine,
            ),
            sourceRawArchiveDate: readString(materialized.rawPayload.archiveDate),
            sourceStatusRaw: materialized.summary.status,
            sourceImportMethod: "SCHEDULED_SYNC",
            sourceImportActorType: "SYSTEM_JOB",
            sourceImportActorIdentifier: SOURCE_SYNC_WORKER_IDENTIFIER,
            sourceHashFingerprint: materialized.sourceHashFingerprint,
          },
          update: {
            sourceConnectorConfigId: savedSearch.connectorConfig?.id ?? null,
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
            sourceNormalizationVersion:
              readString(materialized.normalizedPayload.normalizationVersion) ??
              savedSearch.connectorConfig?.connectorVersion ??
              "sam-gov.search",
            sourceNormalizationAppliedAt: new Date(),
            sourceRawPostedDate: readString(materialized.rawPayload.postedDate),
            sourceRawResponseDeadline: readString(
              materialized.rawPayload.responseDeadLine,
            ),
            sourceRawArchiveDate: readString(materialized.rawPayload.archiveDate),
            sourceStatusRaw: materialized.summary.status,
            sourceImportMethod: "SCHEDULED_SYNC",
            sourceImportActorType: "SYSTEM_JOB",
            sourceImportActorIdentifier: SOURCE_SYNC_WORKER_IDENTIFIER,
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

        searchResultLinks.push({
          resultRank: index + 1,
          searchExecutionId: searchExecution.id,
          sourceRecordId: sourceRecord.id,
        });
        syncRunRecords.push({
          sourceRecordId: sourceRecord.id,
          syncAction: existingSourceRecord ? "UPDATED" : "DISCOVERED",
        });
      }

      if (searchResultLinks.length > 0) {
        await tx.sourceSearchResult.createMany({
          data: searchResultLinks,
        });
      }

      if (syncRunRecords.length > 0) {
        await tx.sourceSyncRunRecord.createMany({
          data: syncRunRecords.map((record) => ({
            sourceRecordId: record.sourceRecordId,
            syncAction: record.syncAction,
            syncRunId: syncRun.id,
          })),
        });
      }

      await tx.sourceSavedSearch.update({
        where: {
          id: savedSearch.id,
        },
        data: {
          lastExecutedAt: searchExecution.requestedAt,
          lastSyncedAt: new Date(),
        },
      });

      return {
        recordsFetched: execution.materializedRecords.length,
        searchExecutionId: searchExecution.id,
      };
    });

    await db.sourceSyncRun.update({
      where: {
        id: syncRun.id,
      },
      data: {
        completedAt: new Date(),
        recordsFetched: persistedExecution.recordsFetched,
        recordsImported: 0,
        recordsFailed: 0,
        searchExecutionId: persistedExecution.searchExecutionId,
        status: "SUCCEEDED",
      },
    });

    log?.({
      detail: {
        recordsFetched: persistedExecution.recordsFetched,
        savedSearchId: savedSearch.id,
        syncRunId: syncRun.id,
      },
      level: "info",
      message: `Scheduled sync finished for ${savedSearch.name}.`,
    });

    return {
      status: "SUCCEEDED" as const,
    };
  } catch (error) {
    if (error instanceof SamGovConnectorError) {
      await db.$transaction(async (tx) => {
        const searchExecution = await tx.sourceSearchExecution.create({
          data: {
            canonicalFilters: asJsonValue(query),
            completedAt: new Date(),
            connectorVersion: savedSearch.connectorConfig?.connectorVersion,
            errorCode: error.code,
            errorMessage: error.message,
            httpStatus: error.httpStatus,
            organizationId: savedSearch.organizationId,
            outboundRequest: asJsonValue({
              credentialReference: savedSearch.connectorConfig?.credentialReference ?? null,
              endpoint: error.outboundRequest.endpoint,
              queryParams: error.outboundRequest.queryParams,
            }),
            requestedAt: now,
            requestedByActorType: "SYSTEM_JOB",
            resultCount: 0,
            savedSearchId: savedSearch.id,
            sourceConnectorConfigId: savedSearch.connectorConfig?.id ?? null,
            sourceSystem: savedSearch.sourceSystem,
            status: "FAILED",
            totalRecords: 0,
            responseLatencyMs: error.responseLatencyMs,
          },
          select: {
            id: true,
            requestedAt: true,
          },
        });

        await tx.sourceSavedSearch.update({
          where: {
            id: savedSearch.id,
          },
          data: {
            lastExecutedAt: searchExecution.requestedAt,
          },
        });
      });

      await db.sourceSyncRun.update({
        where: {
          id: syncRun.id,
        },
        data: {
          completedAt: new Date(),
          errorCode: error.code,
          errorMessage: error.message,
          recordsFailed: 1,
          status: "FAILED",
        },
      });

      log?.({
        detail: {
          message: error.message,
          savedSearchId: savedSearch.id,
          syncRunId: syncRun.id,
        },
        level: "error",
        message: `Scheduled sync failed for ${savedSearch.name}.`,
      });

      return {
        status: "FAILED" as const,
      };
    }

    throw error;
  }
}

async function syncSourceRecordChildren({
  materialized,
  sourceRecordId,
  tx,
}: {
  materialized: SamGovSourceRecordMaterialized;
  sourceRecordId: string;
  tx: SourceSyncTransactionClient;
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

function parseScheduledSyncQuery(
  value: Prisma.JsonValue,
): CanonicalSourceSearchQuery | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const postedDateFrom = readString(record.postedDateFrom);
  const postedDateTo = readString(record.postedDateTo);
  const sourceSystem = readString(record.sourceSystem);
  const pageSize = readNumber(record.pageSize);
  const pageOffset = readNumber(record.pageOffset);

  if (
    !postedDateFrom ||
    !postedDateTo ||
    !sourceSystem ||
    pageSize === null ||
    pageOffset === null
  ) {
    return null;
  }

  return {
    classificationCode: readString(record.classificationCode),
    keywords: readString(record.keywords),
    naicsCode: readString(record.naicsCode),
    noticeId: readString(record.noticeId),
    organizationCode: readString(record.organizationCode),
    organizationName: readString(record.organizationName),
    pageOffset,
    pageSize,
    placeOfPerformanceState: readString(record.placeOfPerformanceState),
    placeOfPerformanceZip: readString(record.placeOfPerformanceZip),
    postedDateFrom,
    postedDateTo,
    procurementTypes: readStringArray(record.procurementTypes),
    responseDeadlineFrom: readString(record.responseDeadlineFrom),
    responseDeadlineTo: readString(record.responseDeadlineTo),
    setAsideCode: readString(record.setAsideCode),
    setAsideDescription: readString(record.setAsideDescription),
    solicitationNumber: readString(record.solicitationNumber),
    sourceSystem,
    status: readString(record.status),
  };
}

function asJsonValue(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function normalizeAwardAmount(value: string | number | null) {
  if (value === null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = value.replace(/[$,]/g, "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const normalized = readString(item);
    return normalized ? [normalized] : [];
  });
}

type JobLogger = (entry: {
  detail?: Record<string, unknown>;
  level: "error" | "info" | "warn";
  message: string;
}) => void;
