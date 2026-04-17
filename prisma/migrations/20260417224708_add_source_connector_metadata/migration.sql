-- CreateEnum
CREATE TYPE "SourceConnectorCategory" AS ENUM ('FEDERAL', 'STATE_LOCAL', 'FORECAST', 'INTERNAL', 'PARTNER', 'OTHER');

-- CreateEnum
CREATE TYPE "SourceConnectorAuthType" AS ENUM ('API_KEY', 'OAUTH', 'SESSION', 'NONE', 'FILE_IMPORT');

-- CreateEnum
CREATE TYPE "SourceConnectorValidationStatus" AS ENUM ('UNKNOWN', 'VALID', 'INVALID');

-- CreateEnum
CREATE TYPE "SourceImportDecisionMode" AS ENUM ('CREATE_OPPORTUNITY', 'LINK_TO_EXISTING', 'SKIP_IMPORT');

-- CreateEnum
CREATE TYPE "SourceImportDecisionStatus" AS ENUM ('PENDING', 'APPLIED', 'REJECTED');

-- AlterTable
ALTER TABLE "source_records" ADD COLUMN     "source_connector_config_id" TEXT;

-- AlterTable
ALTER TABLE "source_saved_searches" ADD COLUMN     "source_connector_config_id" TEXT;

-- AlterTable
ALTER TABLE "source_search_executions" ADD COLUMN     "source_connector_config_id" TEXT;

-- AlterTable
ALTER TABLE "source_sync_runs" ADD COLUMN     "source_connector_config_id" TEXT;

-- CreateTable
CREATE TABLE "source_connector_configs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "source_system_key" TEXT NOT NULL,
    "source_display_name" TEXT NOT NULL,
    "source_category" "SourceConnectorCategory" NOT NULL,
    "auth_type" "SourceConnectorAuthType" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "supports_search" BOOLEAN NOT NULL DEFAULT false,
    "supports_scheduled_sync" BOOLEAN NOT NULL DEFAULT false,
    "supports_detail_fetch" BOOLEAN NOT NULL DEFAULT false,
    "supports_document_fetch" BOOLEAN NOT NULL DEFAULT false,
    "supports_result_preview" BOOLEAN NOT NULL DEFAULT false,
    "supports_saved_searches" BOOLEAN NOT NULL DEFAULT false,
    "supports_incremental_sync" BOOLEAN NOT NULL DEFAULT false,
    "supports_webhooks" BOOLEAN NOT NULL DEFAULT false,
    "supports_attachments" BOOLEAN NOT NULL DEFAULT false,
    "supports_award_data" BOOLEAN NOT NULL DEFAULT false,
    "default_page_size" INTEGER,
    "max_page_size" INTEGER,
    "rate_limit_profile" JSONB,
    "credential_reference" TEXT,
    "config_data" JSONB,
    "connector_version" TEXT,
    "validation_status" "SourceConnectorValidationStatus" NOT NULL DEFAULT 'UNKNOWN',
    "last_validated_at" TIMESTAMP(3),
    "last_validation_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_connector_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_record_attachments" (
    "id" TEXT NOT NULL,
    "source_record_id" TEXT NOT NULL,
    "external_id" TEXT,
    "url" TEXT NOT NULL,
    "link_type" TEXT NOT NULL,
    "display_label" TEXT,
    "mime_type" TEXT,
    "source_file_name" TEXT,
    "file_size_bytes" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_record_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_record_contacts" (
    "id" TEXT NOT NULL,
    "source_record_id" TEXT NOT NULL,
    "contact_type" TEXT,
    "full_name" TEXT,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "additional_info_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_record_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_record_awards" (
    "id" TEXT NOT NULL,
    "source_record_id" TEXT NOT NULL,
    "award_number" TEXT,
    "award_amount" DECIMAL(18,2),
    "award_date" TIMESTAMP(3),
    "awardee_name" TEXT,
    "awardee_uei" TEXT,
    "awardee_street_1" TEXT,
    "awardee_street_2" TEXT,
    "awardee_city_code" TEXT,
    "awardee_city_name" TEXT,
    "awardee_state_code" TEXT,
    "awardee_state_name" TEXT,
    "awardee_postal_code" TEXT,
    "awardee_country_code" TEXT,
    "awardee_country_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_record_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_import_decisions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "source_connector_config_id" TEXT,
    "source_record_id" TEXT NOT NULL,
    "target_opportunity_id" TEXT,
    "requested_by_user_id" TEXT,
    "decided_by_user_id" TEXT,
    "requested_by_actor_type" "SourceExecutionActorType" NOT NULL DEFAULT 'USER',
    "mode" "SourceImportDecisionMode" NOT NULL,
    "status" "SourceImportDecisionStatus" NOT NULL DEFAULT 'PENDING',
    "rationale" TEXT,
    "decision_metadata" JSONB,
    "import_preview_payload" JSONB,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_import_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "source_connector_configs_organization_id_source_category_idx" ON "source_connector_configs"("organization_id", "source_category");

-- CreateIndex
CREATE UNIQUE INDEX "source_connector_configs_organization_id_source_system_key_key" ON "source_connector_configs"("organization_id", "source_system_key");

-- CreateIndex
CREATE INDEX "source_record_attachments_source_record_id_sort_order_idx" ON "source_record_attachments"("source_record_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "source_record_attachments_source_record_id_url_key" ON "source_record_attachments"("source_record_id", "url");

-- CreateIndex
CREATE INDEX "source_record_contacts_source_record_id_sort_order_idx" ON "source_record_contacts"("source_record_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "source_record_awards_source_record_id_key" ON "source_record_awards"("source_record_id");

-- CreateIndex
CREATE INDEX "source_import_decisions_organization_id_requested_at_idx" ON "source_import_decisions"("organization_id", "requested_at");

-- CreateIndex
CREATE INDEX "source_import_decisions_source_connector_config_id_idx" ON "source_import_decisions"("source_connector_config_id");

-- CreateIndex
CREATE INDEX "source_import_decisions_source_record_id_idx" ON "source_import_decisions"("source_record_id");

-- CreateIndex
CREATE INDEX "source_import_decisions_target_opportunity_id_idx" ON "source_import_decisions"("target_opportunity_id");

-- CreateIndex
CREATE INDEX "source_import_decisions_requested_by_user_id_idx" ON "source_import_decisions"("requested_by_user_id");

-- CreateIndex
CREATE INDEX "source_import_decisions_decided_by_user_id_idx" ON "source_import_decisions"("decided_by_user_id");

-- CreateIndex
CREATE INDEX "source_records_source_connector_config_id_idx" ON "source_records"("source_connector_config_id");

-- CreateIndex
CREATE INDEX "source_saved_searches_source_connector_config_id_idx" ON "source_saved_searches"("source_connector_config_id");

-- CreateIndex
CREATE INDEX "source_search_executions_source_connector_config_id_idx" ON "source_search_executions"("source_connector_config_id");

-- CreateIndex
CREATE INDEX "source_sync_runs_source_connector_config_id_idx" ON "source_sync_runs"("source_connector_config_id");

-- AddForeignKey
ALTER TABLE "source_connector_configs" ADD CONSTRAINT "source_connector_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_saved_searches" ADD CONSTRAINT "source_saved_searches_source_connector_config_id_fkey" FOREIGN KEY ("source_connector_config_id") REFERENCES "source_connector_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_search_executions" ADD CONSTRAINT "source_search_executions_source_connector_config_id_fkey" FOREIGN KEY ("source_connector_config_id") REFERENCES "source_connector_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_sync_runs" ADD CONSTRAINT "source_sync_runs_source_connector_config_id_fkey" FOREIGN KEY ("source_connector_config_id") REFERENCES "source_connector_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_records" ADD CONSTRAINT "source_records_source_connector_config_id_fkey" FOREIGN KEY ("source_connector_config_id") REFERENCES "source_connector_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_record_attachments" ADD CONSTRAINT "source_record_attachments_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "source_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_record_contacts" ADD CONSTRAINT "source_record_contacts_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "source_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_record_awards" ADD CONSTRAINT "source_record_awards_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "source_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_import_decisions" ADD CONSTRAINT "source_import_decisions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_import_decisions" ADD CONSTRAINT "source_import_decisions_source_connector_config_id_fkey" FOREIGN KEY ("source_connector_config_id") REFERENCES "source_connector_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_import_decisions" ADD CONSTRAINT "source_import_decisions_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "source_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_import_decisions" ADD CONSTRAINT "source_import_decisions_target_opportunity_id_fkey" FOREIGN KEY ("target_opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_import_decisions" ADD CONSTRAINT "source_import_decisions_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_import_decisions" ADD CONSTRAINT "source_import_decisions_decided_by_user_id_fkey" FOREIGN KEY ("decided_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
