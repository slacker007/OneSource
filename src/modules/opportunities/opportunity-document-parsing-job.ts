import { AuditActorType, Prisma } from "@prisma/client";

import { AUDIT_ACTIONS, recordAuditEvent } from "@/modules/audit/audit.service";
import {
  extractPlainTextFromOpportunityDocument,
  readStoredOpportunityDocument,
} from "@/modules/opportunities/opportunity-document-storage";

export const DOCUMENT_PARSING_WORKER_IDENTIFIER = "document-parsing-worker";

type OpportunityDocumentParsingRecord = {
  id: string;
  organizationId: string;
  opportunityId: string;
  title: string;
  originalFileName: string | null;
  storagePath: string | null;
  mimeType: string | null;
  extractionStatus: "PENDING" | "FAILED" | "NOT_REQUESTED" | "SUCCEEDED";
  metadata: Prisma.JsonValue | null;
  opportunity: {
    title: string;
  };
};

type OpportunityDocumentParsingClient = {
  opportunityDocument: {
    findMany(args: {
      where: Prisma.OpportunityDocumentWhereInput;
      orderBy: Prisma.OpportunityDocumentOrderByWithRelationInput[];
      select: {
        id: true;
        organizationId: true;
        opportunityId: true;
        title: true;
        originalFileName: true;
        storagePath: true;
        mimeType: true;
        extractionStatus: true;
        metadata: true;
        opportunity: {
          select: {
            title: true;
          };
        };
      };
      take: number;
    }): Promise<OpportunityDocumentParsingRecord[]>;
    update(args: {
      where: {
        id: string;
      };
      data: Prisma.OpportunityDocumentUncheckedUpdateInput;
    }): Promise<unknown>;
  };
  opportunityActivityEvent: {
    create(args: {
      data: Prisma.OpportunityActivityEventUncheckedCreateInput;
    }): Promise<unknown>;
  };
  auditLog: {
    create(args: {
      data: Prisma.AuditLogUncheckedCreateInput;
    }): Promise<unknown>;
  };
};

export type OpportunityDocumentParsingSweepResult = {
  failedDocuments: number;
  processedDocuments: number;
  succeededDocuments: number;
};

export async function runOpportunityDocumentParsingSweep({
  db,
  maxAttempts,
  now = new Date(),
  batchSize = 10,
  log,
}: {
  db: OpportunityDocumentParsingClient;
  maxAttempts: number;
  now?: Date;
  batchSize?: number;
  log?: JobLogger;
}): Promise<OpportunityDocumentParsingSweepResult> {
  const pendingDocuments = await db.opportunityDocument.findMany({
    where: {
      extractionStatus: {
        in: ["PENDING", "FAILED"],
      },
      storagePath: {
        not: null,
      },
      storageProvider: "local_disk",
    },
    orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      organizationId: true,
      opportunityId: true,
      title: true,
      originalFileName: true,
      storagePath: true,
      mimeType: true,
      extractionStatus: true,
      metadata: true,
      opportunity: {
        select: {
          title: true,
        },
      },
    },
    take: batchSize,
  });

  let succeededDocuments = 0;
  let failedDocuments = 0;

  for (const document of pendingDocuments) {
    const existingMetadata = readMetadata(document.metadata);
    const attemptCount = readAttemptCount(existingMetadata);

    if (attemptCount >= maxAttempts) {
      continue;
    }

    try {
      const fileBuffer = await readStoredOpportunityDocument(document.storagePath as string);
      const extraction = extractPlainTextFromOpportunityDocument({
        fileBuffer,
        fileName: document.originalFileName ?? document.storagePath ?? document.id,
        mimeType: document.mimeType,
      });

      const nextMetadata = {
        ...existingMetadata,
        extractionAttemptCount: String(attemptCount + 1),
        extractionLastAttemptAt: now.toISOString(),
        extractionMethod: extraction.method,
        extractionReason: extraction.reason,
        extractionLastError: null,
      } satisfies Record<string, string | null>;
      const nextStatus = extraction.status === "SUCCEEDED" ? "SUCCEEDED" : "FAILED";

      await db.opportunityDocument.update({
        where: {
          id: document.id,
        },
        data: {
          extractedAt: nextStatus === "SUCCEEDED" ? now : null,
          extractedText: extraction.extractedText,
          extractionStatus: nextStatus,
          metadata: nextMetadata,
        },
      });

      await db.opportunityActivityEvent.create({
        data: {
          actorIdentifier: DOCUMENT_PARSING_WORKER_IDENTIFIER,
          actorType: AuditActorType.SYSTEM,
          description:
            nextStatus === "SUCCEEDED"
              ? `Background extraction completed for ${document.title}.`
              : `Background extraction failed for ${document.title}.`,
          eventType:
            nextStatus === "SUCCEEDED"
              ? "document_extraction_succeeded"
              : "document_extraction_failed",
          metadata: {
            extractionAttemptCount: attemptCount + 1,
            extractionMethod: extraction.method,
            extractionReason: extraction.reason,
            previousExtractionStatus: document.extractionStatus,
          },
          occurredAt: now,
          opportunityId: document.opportunityId,
          organizationId: document.organizationId,
          relatedEntityId: document.id,
          relatedEntityType: "opportunity_document",
          title:
            nextStatus === "SUCCEEDED"
              ? `Document extraction completed: ${document.title}`
              : `Document extraction failed: ${document.title}`,
        },
      });

      await recordAuditEvent({
        db,
        event: {
          action: AUDIT_ACTIONS.opportunityDocumentExtraction,
          actor: {
            identifier: DOCUMENT_PARSING_WORKER_IDENTIFIER,
            type: AuditActorType.SYSTEM,
          },
          metadata: {
            extractionAttemptCount: attemptCount + 1,
            extractionMethod: extraction.method,
            extractionReason: extraction.reason,
            extractionStatus: nextStatus,
            opportunityId: document.opportunityId,
            opportunityTitle: document.opportunity.title,
          },
          occurredAt: now,
          organizationId: document.organizationId,
          summary:
            nextStatus === "SUCCEEDED"
              ? `Completed background text extraction for ${document.title} on ${document.opportunity.title}.`
              : `Background text extraction failed for ${document.title} on ${document.opportunity.title}.`,
          target: {
            display: document.title,
            id: document.id,
            type: "opportunity_document",
          },
        },
      });

      if (nextStatus === "SUCCEEDED") {
        succeededDocuments += 1;
      } else {
        failedDocuments += 1;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown document parsing failure.";
      const nextMetadata = {
        ...existingMetadata,
        extractionAttemptCount: String(attemptCount + 1),
        extractionLastAttemptAt: now.toISOString(),
        extractionLastError: message,
      } satisfies Record<string, string | null>;

      await db.opportunityDocument.update({
        where: {
          id: document.id,
        },
        data: {
          extractionStatus: "FAILED",
          metadata: nextMetadata,
        },
      });

      await db.opportunityActivityEvent.create({
        data: {
          actorIdentifier: DOCUMENT_PARSING_WORKER_IDENTIFIER,
          actorType: AuditActorType.SYSTEM,
          description: `Background extraction could not read the stored file for ${document.title}.`,
          eventType: "document_extraction_failed",
          metadata: {
            extractionAttemptCount: attemptCount + 1,
            extractionLastError: message,
            previousExtractionStatus: document.extractionStatus,
          },
          occurredAt: now,
          opportunityId: document.opportunityId,
          organizationId: document.organizationId,
          relatedEntityId: document.id,
          relatedEntityType: "opportunity_document",
          title: `Document extraction failed: ${document.title}`,
        },
      });

      await recordAuditEvent({
        db,
        event: {
          action: AUDIT_ACTIONS.opportunityDocumentExtraction,
          actor: {
            identifier: DOCUMENT_PARSING_WORKER_IDENTIFIER,
            type: AuditActorType.SYSTEM,
          },
          metadata: {
            extractionAttemptCount: attemptCount + 1,
            extractionLastError: message,
            extractionStatus: "FAILED",
            opportunityId: document.opportunityId,
            opportunityTitle: document.opportunity.title,
          },
          occurredAt: now,
          organizationId: document.organizationId,
          summary: `Background text extraction failed for ${document.title} on ${document.opportunity.title}.`,
          target: {
            display: document.title,
            id: document.id,
            type: "opportunity_document",
          },
        },
      });

      failedDocuments += 1;
      log?.({
        detail: {
          documentId: document.id,
          message,
          opportunityId: document.opportunityId,
        },
        level: "error",
        message: `Document parsing failed for ${document.title}.`,
      });
    }
  }

  return {
    failedDocuments,
    processedDocuments: succeededDocuments + failedDocuments,
    succeededDocuments,
  };
}

function readAttemptCount(metadata: Record<string, string | null>) {
  const rawValue = metadata.extractionAttemptCount;

  if (!rawValue) {
    return 0;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function readMetadata(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} satisfies Record<string, string | null>;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, candidate]) => [
      key,
      typeof candidate === "string" ? candidate : null,
    ]),
  );
}

type JobLogger = (entry: {
  detail?: Record<string, unknown>;
  level: "error" | "info" | "warn";
  message: string;
}) => void;
