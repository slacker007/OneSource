import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth/auth-options";
import { hasAppPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { readStoredOpportunityDocument } from "@/modules/opportunities/opportunity-document-storage";

export const runtime = "nodejs";

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
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 },
    );
  }

  if (!hasAppPermission(session.user.roleKeys, "view_dashboard")) {
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
    } catch {
      return NextResponse.json(
        { error: "The stored file could not be read from local disk." },
        { status: 404 },
      );
    }
  }

  if (document.sourceUrl) {
    return NextResponse.redirect(document.sourceUrl, 307);
  }

  return NextResponse.json(
    { error: "This document does not have a stored file or external source URL." },
    { status: 404 },
  );
}

function buildContentDisposition(fileName: string) {
  const sanitized = fileName.replace(/[\r\n"]/g, "_");
  return `attachment; filename="${sanitized}"`;
}
