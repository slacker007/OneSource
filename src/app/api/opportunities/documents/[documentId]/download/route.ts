import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth/auth-options";
import { hasAppPermission } from "@/lib/auth/permissions";
import {
  createStructuredLogger,
  serializeError,
} from "@/lib/observability/logger";
import { prisma } from "@/lib/prisma";
import { readStoredOpportunityDocument } from "@/modules/opportunities/opportunity-document-storage";

export const runtime = "nodejs";

const log = createStructuredLogger("web");

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      documentId: string;
    }>;
  },
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    log("warn", "Rejected opportunity document download for anonymous request.");
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 },
    );
  }

  if (!hasAppPermission(session.user.roleKeys, "view_dashboard")) {
    log("warn", "Rejected opportunity document download for unauthorized user.", {
      documentId: (await context.params).documentId,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "You do not have permission to download opportunity documents." },
      { status: 403 },
    );
  }

  const { documentId } = await context.params;
  const document = await prisma.opportunityDocument.findFirst({
    where: {
      id: documentId,
      organizationId: session.user.organizationId,
    },
    select: {
      id: true,
      mimeType: true,
      originalFileName: true,
      sourceUrl: true,
      storagePath: true,
      title: true,
    },
  });

  if (!document) {
    log("warn", "Requested opportunity document was not found in scope.", {
      documentId,
      organizationId: session.user.organizationId,
      userId: session.user.id,
    });
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  if (document.storagePath) {
    try {
      const fileBuffer = await readStoredOpportunityDocument(document.storagePath);

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Disposition": buildContentDisposition(
            document.originalFileName ?? `${document.title}.bin`,
          ),
          "Content-Type": document.mimeType ?? "application/octet-stream",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      log("error", "Stored opportunity document could not be read from disk.", {
        documentId,
        organizationId: session.user.organizationId,
        userId: session.user.id,
        ...serializeError(error),
      });
      return NextResponse.json(
        { error: "The stored file could not be read from local disk." },
        { status: 404 },
      );
    }
  }

  if (document.sourceUrl) {
    return NextResponse.redirect(document.sourceUrl, 307);
  }

  log("warn", "Opportunity document has no downloadable file target.", {
    documentId,
    organizationId: session.user.organizationId,
    userId: session.user.id,
  });

  return NextResponse.json(
    { error: "This document does not have a stored file or external source URL." },
    { status: 404 },
  );
}

function buildContentDisposition(fileName: string) {
  const sanitized = fileName.replace(/[\r\n"]/g, "_");
  return `attachment; filename="${sanitized}"`;
}
