-- CreateEnum
CREATE TYPE "KnowledgeAssetType" AS ENUM ('PAST_PERFORMANCE_SNIPPET', 'BOILERPLATE_CONTENT', 'WIN_THEME');

-- CreateTable
CREATE TABLE "knowledge_assets" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_by_user_id" TEXT,
    "updated_by_user_id" TEXT,
    "asset_type" "KnowledgeAssetType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "content_format" TEXT NOT NULL DEFAULT 'markdown',
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_asset_tags" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "knowledge_asset_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "normalized_label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_asset_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_asset_opportunities" (
    "knowledge_asset_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_asset_opportunities_pkey" PRIMARY KEY ("knowledge_asset_id","opportunity_id")
);

-- CreateIndex
CREATE INDEX "knowledge_assets_org_type_updated_at_idx" ON "knowledge_assets"("organization_id", "asset_type", "updated_at");

-- CreateIndex
CREATE INDEX "knowledge_assets_org_is_archived_idx" ON "knowledge_assets"("organization_id", "is_archived");

-- CreateIndex
CREATE INDEX "knowledge_assets_created_by_user_id_idx" ON "knowledge_assets"("created_by_user_id");

-- CreateIndex
CREATE INDEX "knowledge_assets_updated_by_user_id_idx" ON "knowledge_assets"("updated_by_user_id");

-- CreateIndex
CREATE INDEX "knowledge_asset_tags_org_normalized_label_idx" ON "knowledge_asset_tags"("organization_id", "normalized_label");

-- CreateIndex
CREATE INDEX "knowledge_asset_tags_asset_id_idx" ON "knowledge_asset_tags"("knowledge_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_asset_tags_asset_id_normalized_label_key" ON "knowledge_asset_tags"("knowledge_asset_id", "normalized_label");

-- CreateIndex
CREATE INDEX "knowledge_asset_opportunities_org_opportunity_id_idx" ON "knowledge_asset_opportunities"("organization_id", "opportunity_id");

-- CreateIndex
CREATE INDEX "knowledge_asset_opportunities_opportunity_id_idx" ON "knowledge_asset_opportunities"("opportunity_id");

-- AddForeignKey
ALTER TABLE "knowledge_assets" ADD CONSTRAINT "knowledge_assets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_assets" ADD CONSTRAINT "knowledge_assets_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_assets" ADD CONSTRAINT "knowledge_assets_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_asset_tags" ADD CONSTRAINT "knowledge_asset_tags_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_asset_tags" ADD CONSTRAINT "knowledge_asset_tags_knowledge_asset_id_fkey" FOREIGN KEY ("knowledge_asset_id") REFERENCES "knowledge_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_asset_opportunities" ADD CONSTRAINT "knowledge_asset_opportunities_knowledge_asset_id_fkey" FOREIGN KEY ("knowledge_asset_id") REFERENCES "knowledge_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_asset_opportunities" ADD CONSTRAINT "knowledge_asset_opportunities_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_asset_opportunities" ADD CONSTRAINT "knowledge_asset_opportunities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
