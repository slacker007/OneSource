import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getServerEnv } from "@/lib/env";

export const OPPORTUNITY_DOCUMENT_UPLOAD_MAX_FILE_BYTES =
  10 * 1024 * 1024;

const TEXTUAL_MIME_PREFIXES = ["text/"] as const;
const TEXTUAL_MIME_TYPES = new Set([
  "application/csv",
  "application/json",
  "application/ld+json",
  "application/rtf",
  "application/xml",
  "application/x-yaml",
  "application/yaml",
]);
const TEXTUAL_EXTENSIONS = new Set([
  ".csv",
  ".htm",
  ".html",
  ".json",
  ".log",
  ".markdown",
  ".md",
  ".rtf",
  ".text",
  ".tsv",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);

export type PersistedOpportunityDocumentUpload = {
  checksumSha256: string;
  extractedAt: Date | null;
  extractedText: string | null;
  extractionStatus: "SUCCEEDED" | "NOT_REQUESTED";
  fileSizeBytes: number;
  mimeType: string | null;
  metadata: Record<string, string | null>;
  originalFileName: string;
  storagePath: string;
};

export async function persistOpportunityDocumentUpload({
  file,
  opportunityId,
  storageRoot,
}: {
  file: File;
  opportunityId: string;
  storageRoot?: string;
}): Promise<PersistedOpportunityDocumentUpload> {
  if (file.size <= 0) {
    throw new Error("The selected file is empty.");
  }

  if (file.size > OPPORTUNITY_DOCUMENT_UPLOAD_MAX_FILE_BYTES) {
    throw new Error(
      `Document uploads are currently limited to ${formatByteLimit(OPPORTUNITY_DOCUMENT_UPLOAD_MAX_FILE_BYTES)}.`,
    );
  }

  const originalFileName = normalizeOriginalFileName(file.name);
  const extension = path.extname(originalFileName).toLowerCase();
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const checksumSha256 = createHash("sha256").update(fileBuffer).digest("hex");
  const baseName = path.basename(originalFileName, extension);
  const relativeStoragePath = path.posix.join(
    "opportunities",
    opportunityId,
    `${slugifyFileStem(baseName)}-${randomUUID()}${extension}`,
  );
  const resolvedRoot = resolveStorageRoot(storageRoot);
  const absoluteStoragePath = resolveStoragePath(relativeStoragePath, resolvedRoot);

  await mkdir(path.dirname(absoluteStoragePath), { recursive: true });
  await writeFile(absoluteStoragePath, fileBuffer);

  const extraction = extractPlainTextFromUpload({
    fileBuffer,
    fileName: originalFileName,
    mimeType: normalizeMimeType(file.type),
  });

  return {
    checksumSha256,
    extractedAt: extraction.extractedText ? new Date() : null,
    extractedText: extraction.extractedText,
    extractionStatus: extraction.status,
    fileSizeBytes: file.size,
    metadata: {
      fileExtension: extension || null,
      fileNameStem: baseName,
      extractionMethod: extraction.method,
      extractionReason: extraction.reason,
    },
    mimeType: normalizeMimeType(file.type),
    originalFileName,
    storagePath: relativeStoragePath,
  };
}

export function buildOpportunityDocumentDownloadPath(documentId: string) {
  return `/api/opportunities/documents/${documentId}/download`;
}

export function resolveOpportunityDocumentAbsolutePath(
  relativeStoragePath: string,
  storageRoot?: string,
) {
  return resolveStoragePath(relativeStoragePath, resolveStorageRoot(storageRoot));
}

export async function readStoredOpportunityDocument(
  relativeStoragePath: string,
  storageRoot?: string,
) {
  return readFile(resolveOpportunityDocumentAbsolutePath(relativeStoragePath, storageRoot));
}

function extractPlainTextFromUpload({
  fileBuffer,
  fileName,
  mimeType,
}: {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string | null;
}) {
  if (!canExtractText({ fileName, mimeType })) {
    return {
      extractedText: null,
      method: "unsupported_binary_format",
      reason:
        "Stored the uploaded file and metadata, but synchronous extraction currently runs only for UTF-8 text-like formats.",
      status: "NOT_REQUESTED" as const,
    };
  }

  const decodedText = new TextDecoder("utf-8", { fatal: false }).decode(fileBuffer);
  const normalizedText = normalizeExtractedText(decodedText);

  return {
    extractedText: normalizedText,
    method: "utf8_text_decode",
    reason: normalizedText
      ? "Plain text was extracted directly from the uploaded UTF-8 content."
      : "The uploaded text-like file did not contain extractable text after normalization.",
    status: "SUCCEEDED" as const,
  };
}

function canExtractText({
  fileName,
  mimeType,
}: {
  fileName: string;
  mimeType: string | null;
}) {
  if (mimeType) {
    if (TEXTUAL_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))) {
      return true;
    }

    if (TEXTUAL_MIME_TYPES.has(mimeType)) {
      return true;
    }
  }

  return TEXTUAL_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function normalizeExtractedText(value: string) {
  const normalized = value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .trim();

  return normalized.length > 0 ? normalized : null;
}

function normalizeOriginalFileName(fileName: string) {
  const trimmed = fileName.trim();

  return trimmed.length > 0 ? trimmed.replace(/[\\/]/g, "-") : "uploaded-document";
}

function normalizeMimeType(mimeType: string) {
  const normalized = mimeType.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function slugifyFileStem(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : "document";
}

function resolveStorageRoot(storageRoot?: string) {
  const configuredRoot = storageRoot ?? getServerEnv().DOCUMENT_UPLOAD_DIR;
  return path.resolve(configuredRoot);
}

function resolveStoragePath(relativeStoragePath: string, resolvedRoot: string) {
  const normalizedRelativePath = relativeStoragePath.replace(/^\/+/, "");
  const absolutePath = path.resolve(resolvedRoot, normalizedRelativePath);
  const normalizedRootPrefix = `${resolvedRoot}${path.sep}`;

  if (absolutePath !== resolvedRoot && !absolutePath.startsWith(normalizedRootPrefix)) {
    throw new Error("The requested document path resolves outside the configured storage root.");
  }

  return absolutePath;
}

function formatByteLimit(value: number) {
  if (value >= 1024 * 1024) {
    return `${Math.round((value / (1024 * 1024)) * 10) / 10} MB`;
  }

  if (value >= 1024) {
    return `${Math.round((value / 1024) * 10) / 10} KB`;
  }

  return `${value} bytes`;
}
