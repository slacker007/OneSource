import { KnowledgeLibrary } from "@/components/knowledge/knowledge-library";
import { requireAuthenticatedAppSession } from "@/lib/auth/authorization";
import { hasAppPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import {
  getKnowledgeLibrarySnapshot,
  type KnowledgeRepositoryClient,
} from "@/modules/knowledge/knowledge.repository";

export const dynamic = "force-dynamic";

type KnowledgePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function KnowledgePage({
  searchParams,
}: KnowledgePageProps) {
  const session = await requireAuthenticatedAppSession();
  const resolvedSearchParams = await searchParams;
  const snapshot = await getKnowledgeLibrarySnapshot({
    db: prisma as unknown as KnowledgeRepositoryClient,
    organizationId: session.user.organizationId,
    searchParams: resolvedSearchParams,
  });

  return (
    <KnowledgeLibrary
      allowManageKnowledge={hasAppPermission(
        session.user.roleKeys,
        "manage_pipeline",
      )}
      notice={
        readSingleSearchParam(resolvedSearchParams?.deleted) === "1"
          ? {
              title: "Knowledge asset deleted",
              message:
                "The knowledge asset was removed from the library and its opportunity links were cleared.",
              tone: "warning",
            }
          : null
      }
      snapshot={snapshot}
    />
  );
}

function readSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === "string" ? value : null;
}
