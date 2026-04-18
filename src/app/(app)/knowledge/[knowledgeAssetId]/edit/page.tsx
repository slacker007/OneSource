import { notFound } from "next/navigation";

import {
  deleteKnowledgeAssetAction,
  updateKnowledgeAssetAction,
} from "../../actions";

import { KnowledgeForm } from "@/components/knowledge/knowledge-form";
import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import {
  getKnowledgeAssetFormSnapshot,
  type KnowledgeRepositoryClient,
} from "@/modules/knowledge/knowledge.repository";

export const dynamic = "force-dynamic";

type EditKnowledgeAssetPageProps = {
  params: Promise<{
    knowledgeAssetId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditKnowledgeAssetPage({
  params,
  searchParams,
}: EditKnowledgeAssetPageProps) {
  const { session } = await requireAppPermission("manage_pipeline");
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const snapshot = await getKnowledgeAssetFormSnapshot({
    assetId: resolvedParams.knowledgeAssetId,
    db: prisma as unknown as KnowledgeRepositoryClient,
    organizationId: session.user.organizationId,
  });

  if (!snapshot) {
    notFound();
  }

  const status = readSingleSearchParam(resolvedSearchParams?.created)
    ? {
        title: "Knowledge asset created",
        message:
          "The asset is now stored in the library and ready for further edits or linking.",
        tone: "accent" as const,
      }
    : readSingleSearchParam(resolvedSearchParams?.updated)
      ? {
          title: "Knowledge asset saved",
          message:
            "The latest content, tags, and opportunity links are now persisted in the library.",
          tone: "accent" as const,
        }
      : null;

  return (
    <KnowledgeForm
      action={updateKnowledgeAssetAction}
      deleteAction={deleteKnowledgeAssetAction}
      feedback={status}
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
