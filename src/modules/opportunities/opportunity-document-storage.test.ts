import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  OPPORTUNITY_DOCUMENT_UPLOAD_MAX_FILE_BYTES,
  buildOpportunityDocumentDownloadPath,
  persistOpportunityDocumentUpload,
  resolveOpportunityDocumentAbsolutePath,
} from "./opportunity-document-storage";

const createdDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    createdDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  );
});

describe("opportunity-document-storage", () => {
  it("stores uploaded files on disk and extracts plain text for text-like formats", async () => {
    const storageRoot = await createTempStorageRoot();

    const upload = await persistOpportunityDocumentUpload({
      file: new File(
        ["Mission scope\nDeliver modernization and analytics support."],
        "capture-plan.txt",
        {
          type: "text/plain",
        },
      ),
      opportunityId: "opp_123",
      storageRoot,
    });

    expect(upload.originalFileName).toBe("capture-plan.txt");
    expect(upload.mimeType).toBe("text/plain");
    expect(upload.extractionStatus).toBe("SUCCEEDED");
    expect(upload.extractedText).toMatch(/deliver modernization and analytics support/i);
    expect(upload.storagePath).toMatch(/^opportunities\/opp_123\/capture-plan-/);
    expect(upload.checksumSha256).toMatch(/^[a-f0-9]{64}$/);

    const absoluteStoragePath = resolveOpportunityDocumentAbsolutePath(
      upload.storagePath,
      storageRoot,
    );
    const storedContents = await readFile(absoluteStoragePath, "utf8");

    expect(storedContents).toContain("Mission scope");
  });

  it("stores binary uploads while leaving extraction pending for later work", async () => {
    const storageRoot = await createTempStorageRoot();

    const upload = await persistOpportunityDocumentUpload({
      file: new File([new Uint8Array([0, 1, 2, 3])], "capture-plan.pdf", {
        type: "application/pdf",
      }),
      opportunityId: "opp_123",
      storageRoot,
    });

    expect(upload.extractionStatus).toBe("NOT_REQUESTED");
    expect(upload.extractedText).toBeNull();
    expect(upload.metadata).toMatchObject({
      extractionMethod: "unsupported_binary_format",
    });
  });

  it("rejects uploads that exceed the current size limit", async () => {
    const storageRoot = await createTempStorageRoot();
    const oversizePayload = "a".repeat(OPPORTUNITY_DOCUMENT_UPLOAD_MAX_FILE_BYTES + 1);

    await expect(
      persistOpportunityDocumentUpload({
        file: new File([oversizePayload], "too-large.txt", {
          type: "text/plain",
        }),
        opportunityId: "opp_123",
        storageRoot,
      }),
    ).rejects.toThrow(/currently limited to/i);
  });

  it("builds a stable guarded download path", () => {
    expect(buildOpportunityDocumentDownloadPath("doc_123")).toBe(
      "/api/opportunities/documents/doc_123/download",
    );
  });
});

async function createTempStorageRoot() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "onesource-documents-"));
  createdDirectories.push(directory);
  return directory;
}
