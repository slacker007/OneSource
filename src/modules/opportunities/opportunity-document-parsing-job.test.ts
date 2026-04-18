import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it, vi, afterEach } from "vitest";

import { AUDIT_ACTIONS } from "@/modules/audit/audit.service";

import { runOpportunityDocumentParsingSweep } from "./opportunity-document-parsing-job";

const createdDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    createdDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

describe("opportunity-document-parsing-job", () => {
  it("extracts text from pending local documents and records activity plus audit evidence", async () => {
    const storageRoot = await createTempStorageRoot();
    const storagePath = "opportunities/opp_123/capture-plan.txt";
    await writeStoredFile(
      storageRoot,
      storagePath,
      "Mission scope\nDeliver modernization and analytics support.",
    );
    process.env.DOCUMENT_UPLOAD_DIR = storageRoot;

    const updates: Array<Record<string, unknown>> = [];
    const activityEvents: Array<Record<string, unknown>> = [];
    const auditLogs: Array<Record<string, unknown>> = [];

    const db = {
      opportunityDocument: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "doc_123",
            organizationId: "org_123",
            opportunityId: "opp_123",
            title: "Capture Plan",
            originalFileName: "capture-plan.txt",
            storagePath,
            mimeType: "text/plain",
            extractionStatus: "PENDING",
            metadata: {
              extractionMethod: "background_text_extraction",
            },
            opportunity: {
              title: "Data Platform Operations",
            },
          },
        ]),
        update: vi.fn().mockImplementation((args) => {
          updates.push(args.data);
          return Promise.resolve({ id: "doc_123" });
        }),
      },
      opportunityActivityEvent: {
        create: vi.fn().mockImplementation((args) => {
          activityEvents.push(args.data);
          return Promise.resolve({ id: "activity_123" });
        }),
      },
      auditLog: {
        create: vi.fn().mockImplementation((args) => {
          auditLogs.push(args.data);
          return Promise.resolve({ id: "audit_123" });
        }),
      },
    };

    const result = await runOpportunityDocumentParsingSweep({
      batchSize: 5,
      db: db as never,
      maxAttempts: 3,
      now: new Date("2026-04-18T12:00:00.000Z"),
    });

    expect(result).toEqual({
      failedDocuments: 0,
      processedDocuments: 1,
      succeededDocuments: 1,
    });
    expect(updates[0]).toMatchObject({
      extractionStatus: "SUCCEEDED",
      extractedText: expect.stringMatching(/deliver modernization/i),
    });
    expect(activityEvents[0]).toMatchObject({
      eventType: "document_extraction_succeeded",
      relatedEntityId: "doc_123",
    });
    expect(auditLogs[0]).toMatchObject({
      action: AUDIT_ACTIONS.opportunityDocumentExtraction,
      targetId: "doc_123",
      targetType: "opportunity_document",
    });
  });

  it("records retry metadata when a stored file cannot be read", async () => {
    process.env.DOCUMENT_UPLOAD_DIR = await createTempStorageRoot();

    const updates: Array<Record<string, unknown>> = [];

    const db = {
      opportunityDocument: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "doc_missing",
            organizationId: "org_123",
            opportunityId: "opp_123",
            title: "Missing Capture Plan",
            originalFileName: "missing.txt",
            storagePath: "opportunities/opp_123/missing.txt",
            mimeType: "text/plain",
            extractionStatus: "FAILED",
            metadata: {
              extractionAttemptCount: "1",
            },
            opportunity: {
              title: "Data Platform Operations",
            },
          },
        ]),
        update: vi.fn().mockImplementation((args) => {
          updates.push(args.data);
          return Promise.resolve({ id: "doc_missing" });
        }),
      },
      opportunityActivityEvent: {
        create: vi.fn().mockResolvedValue({ id: "activity_123" }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit_123" }),
      },
    };

    const result = await runOpportunityDocumentParsingSweep({
      batchSize: 5,
      db: db as never,
      maxAttempts: 3,
      now: new Date("2026-04-18T12:00:00.000Z"),
    });

    expect(result).toEqual({
      failedDocuments: 1,
      processedDocuments: 1,
      succeededDocuments: 0,
    });
    expect(updates[0]).toMatchObject({
      extractionStatus: "FAILED",
      metadata: expect.objectContaining({
        extractionAttemptCount: "2",
      }),
    });
  });
});

async function createTempStorageRoot() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "onesource-documents-"));
  createdDirectories.push(directory);
  return directory;
}

async function writeStoredFile(
  storageRoot: string,
  relativePath: string,
  contents: string,
) {
  const absolutePath = path.join(storageRoot, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, contents, { encoding: "utf8" });
}
