import { createKnowledgeAssetAction } from "../actions";

import { KnowledgeForm } from "@/components/knowledge/knowledge-form";
import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import {
  getKnowledgeAssetFormSnapshot,
  type KnowledgeRepositoryClient,
} from "@/modules/knowledge/knowledge.repository";

export const dynamic = "force-dynamic";

export default async function NewKnowledgeAssetPage() {
  const { session } = await requireAppPermission("manage_pipeline");
  const snapshot = await getKnowledgeAssetFormSnapshot({
    db: prisma as unknown as KnowledgeRepositoryClient,
    organizationId: session.user.organizationId,
  });

  if (!snapshot) {
    return <KnowledgeForm action={createKnowledgeAssetAction} feedback={null} snapshot={{
      assetId: null,
      initialValues: {
        assetType: "PAST_PERFORMANCE_SNIPPET",
        title: "",
        summary: "",
        body: "",
        tags: "",
        opportunityIds: [],
      },
      mode: "create",
      opportunityOptions: [],
      organization: {
        id: session.user.organizationId,
        name: "Knowledge workspace",
        slug: "workspace",
      },
      updatedAt: null,
    }} />;
  }

  return (
    <KnowledgeForm
      action={createKnowledgeAssetAction}
      feedback={null}
      snapshot={snapshot}
    />
  );
}
