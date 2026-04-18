-- CreateEnum
CREATE TYPE "KnowledgeAssetTagType" AS ENUM (
    'FREEFORM',
    'AGENCY',
    'CAPABILITY',
    'CONTRACT_TYPE',
    'VEHICLE'
);

-- DropIndex
DROP INDEX "knowledge_asset_tags_asset_id_normalized_label_key";

-- AlterTable
ALTER TABLE "knowledge_asset_tags"
    ADD COLUMN "tag_key" TEXT,
    ADD COLUMN "tag_type" "KnowledgeAssetTagType" NOT NULL DEFAULT 'FREEFORM';

-- Backfill existing freeform tags so the new required structured-key column is safe.
UPDATE "knowledge_asset_tags"
SET "tag_key" = "normalized_label"
WHERE "tag_key" IS NULL;

-- AlterTable
ALTER TABLE "knowledge_asset_tags"
    ALTER COLUMN "tag_key" SET NOT NULL;

-- CreateIndex
CREATE INDEX "knowledge_asset_tags_org_tag_type_tag_key_idx"
ON "knowledge_asset_tags"("organization_id", "tag_type", "tag_key");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_asset_tags_asset_id_tag_type_tag_key_key"
ON "knowledge_asset_tags"("knowledge_asset_id", "tag_type", "tag_key");
