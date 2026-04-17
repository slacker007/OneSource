-- CreateEnum
CREATE TYPE "ConnectorRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SourceExecutionActorType" AS ENUM ('USER', 'SYSTEM_JOB', 'BACKFILL');

-- CreateEnum
CREATE TYPE "SourceSyncTriggerType" AS ENUM ('MANUAL', 'SCHEDULED', 'BACKFILL');

-- CreateEnum
CREATE TYPE "SourceImportMethod" AS ENUM ('MANUAL_PULL', 'SCHEDULED_SYNC', 'BACKFILL');

-- CreateEnum
CREATE TYPE "SourceSyncRecordAction" AS ENUM ('DISCOVERED', 'UPDATED', 'IMPORTED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "OpportunityCompetitorRole" AS ENUM ('INCUMBENT', 'KNOWN_COMPETITOR', 'POTENTIAL_COMPETITOR');

-- CreateTable
CREATE TABLE "agencies" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization_code" TEXT,
    "path_name" TEXT,
    "path_code" TEXT,
    "department_name" TEXT,
    "subtier_name" TEXT,
    "office_name" TEXT,
    "office_city" TEXT,
    "office_state" TEXT,
    "office_postal_code" TEXT,
    "office_country_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_vehicles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vehicle_type" TEXT,
    "awarding_agency" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "lead_agency_id" TEXT,
    "imported_from_source_record_id" TEXT,
    "origin_source_system" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "external_notice_id" TEXT,
    "solicitation_number" TEXT,
    "source_summary_text" TEXT,
    "source_summary_url" TEXT,
    "posted_at" TIMESTAMP(3),
    "posted_date_raw" TEXT,
    "response_deadline_at" TIMESTAMP(3),
    "response_deadline_raw" TEXT,
    "procurement_type_label" TEXT,
    "procurement_base_type_label" TEXT,
    "archive_type" TEXT,
    "archived_at" TIMESTAMP(3),
    "archive_date_raw" TEXT,
    "source_status" TEXT,
    "is_active_source_record" BOOLEAN NOT NULL DEFAULT true,
    "is_archived_source_record" BOOLEAN NOT NULL DEFAULT false,
    "set_aside_code" TEXT,
    "set_aside_description" TEXT,
    "naics_code" TEXT,
    "classification_code" TEXT,
    "organization_type" TEXT,
    "office_city" TEXT,
    "office_state" TEXT,
    "office_postal_code" TEXT,
    "office_country_code" TEXT,
    "place_of_performance_street_1" TEXT,
    "place_of_performance_street_2" TEXT,
    "place_of_performance_city_code" TEXT,
    "place_of_performance_city_name" TEXT,
    "place_of_performance_state_code" TEXT,
    "place_of_performance_state_name" TEXT,
    "place_of_performance_postal_code" TEXT,
    "place_of_performance_country_code" TEXT,
    "additional_info_url" TEXT,
    "ui_link" TEXT,
    "api_self_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_vehicles" (
    "opportunity_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_vehicles_pkey" PRIMARY KEY ("opportunity_id","vehicle_id")
);

-- CreateTable
CREATE TABLE "competitors" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_competitors" (
    "opportunity_id" TEXT NOT NULL,
    "competitor_id" TEXT NOT NULL,
    "role" "OpportunityCompetitorRole" NOT NULL DEFAULT 'KNOWN_COMPETITOR',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_competitors_pkey" PRIMARY KEY ("opportunity_id","competitor_id")
);

-- CreateTable
CREATE TABLE "source_saved_searches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "created_by_user_id" TEXT,
    "source_system" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "canonical_filters" JSONB NOT NULL,
    "source_specific_filters" JSONB,
    "last_executed_at" TIMESTAMP(3),
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_search_executions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "saved_search_id" TEXT,
    "requested_by_user_id" TEXT,
    "requested_by_actor_type" "SourceExecutionActorType" NOT NULL DEFAULT 'USER',
    "source_system" TEXT NOT NULL,
    "status" "ConnectorRunStatus" NOT NULL DEFAULT 'SUCCEEDED',
    "canonical_filters" JSONB NOT NULL,
    "source_specific_filters" JSONB,
    "outbound_request" JSONB,
    "http_status" INTEGER,
    "response_latency_ms" INTEGER,
    "result_count" INTEGER,
    "total_records" INTEGER,
    "connector_version" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "source_search_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_sync_runs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "saved_search_id" TEXT,
    "search_execution_id" TEXT,
    "requested_by_user_id" TEXT,
    "requested_by_actor_type" "SourceExecutionActorType" NOT NULL DEFAULT 'USER',
    "source_system" TEXT NOT NULL,
    "trigger_type" "SourceSyncTriggerType" NOT NULL DEFAULT 'MANUAL',
    "status" "ConnectorRunStatus" NOT NULL DEFAULT 'QUEUED',
    "records_fetched" INTEGER NOT NULL DEFAULT 0,
    "records_imported" INTEGER NOT NULL DEFAULT 0,
    "records_failed" INTEGER NOT NULL DEFAULT 0,
    "connector_version" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "source_sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_records" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "opportunity_id" TEXT,
    "agency_id" TEXT,
    "source_import_actor_user_id" TEXT,
    "source_system" TEXT NOT NULL,
    "source_record_id" TEXT NOT NULL,
    "source_api_endpoint" TEXT,
    "source_ui_url" TEXT,
    "source_detail_url" TEXT,
    "source_description_url" TEXT,
    "source_fetched_at" TIMESTAMP(3) NOT NULL,
    "source_search_executed_at" TIMESTAMP(3),
    "source_search_query" JSONB,
    "source_raw_payload" JSONB NOT NULL,
    "source_normalized_payload" JSONB NOT NULL,
    "source_import_preview_payload" JSONB,
    "source_normalization_version" TEXT NOT NULL,
    "source_normalization_applied_at" TIMESTAMP(3) NOT NULL,
    "source_raw_posted_date" TEXT,
    "source_raw_response_deadline" TEXT,
    "source_raw_archive_date" TEXT,
    "source_status_raw" TEXT,
    "source_import_method" "SourceImportMethod" NOT NULL,
    "source_import_actor_type" "SourceExecutionActorType" NOT NULL DEFAULT 'USER',
    "source_import_actor_identifier" TEXT,
    "source_hash_fingerprint" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_search_results" (
    "search_execution_id" TEXT NOT NULL,
    "source_record_id" TEXT NOT NULL,
    "result_rank" INTEGER,
    "observed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_search_results_pkey" PRIMARY KEY ("search_execution_id","source_record_id")
);

-- CreateTable
CREATE TABLE "source_sync_run_records" (
    "sync_run_id" TEXT NOT NULL,
    "source_record_id" TEXT NOT NULL,
    "sync_action" "SourceSyncRecordAction" NOT NULL DEFAULT 'DISCOVERED',
    "observed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error_message" TEXT,

    CONSTRAINT "source_sync_run_records_pkey" PRIMARY KEY ("sync_run_id","source_record_id")
);

-- CreateIndex
CREATE INDEX "agencies_organization_id_name_idx" ON "agencies"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "agencies_organization_id_path_code_key" ON "agencies"("organization_id", "path_code");

-- CreateIndex
CREATE INDEX "contract_vehicles_organization_id_name_idx" ON "contract_vehicles"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "contract_vehicles_organization_id_code_key" ON "contract_vehicles"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_imported_from_source_record_id_key" ON "opportunities"("imported_from_source_record_id");

-- CreateIndex
CREATE INDEX "opportunities_organization_id_title_idx" ON "opportunities"("organization_id", "title");

-- CreateIndex
CREATE INDEX "opportunities_organization_id_lead_agency_id_idx" ON "opportunities"("organization_id", "lead_agency_id");

-- CreateIndex
CREATE INDEX "opportunities_organization_id_origin_source_system_idx" ON "opportunities"("organization_id", "origin_source_system");

-- CreateIndex
CREATE INDEX "opportunities_organization_id_response_deadline_at_idx" ON "opportunities"("organization_id", "response_deadline_at");

-- CreateIndex
CREATE INDEX "opportunities_organization_id_naics_code_idx" ON "opportunities"("organization_id", "naics_code");

-- CreateIndex
CREATE INDEX "opportunity_vehicles_vehicle_id_idx" ON "opportunity_vehicles"("vehicle_id");

-- CreateIndex
CREATE INDEX "competitors_organization_id_idx" ON "competitors"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "competitors_organization_id_name_key" ON "competitors"("organization_id", "name");

-- CreateIndex
CREATE INDEX "opportunity_competitors_competitor_id_idx" ON "opportunity_competitors"("competitor_id");

-- CreateIndex
CREATE INDEX "source_saved_searches_organization_id_source_system_idx" ON "source_saved_searches"("organization_id", "source_system");

-- CreateIndex
CREATE UNIQUE INDEX "source_saved_searches_organization_id_source_system_name_key" ON "source_saved_searches"("organization_id", "source_system", "name");

-- CreateIndex
CREATE INDEX "source_search_executions_org_source_requested_at_idx" ON "source_search_executions"("organization_id", "source_system", "requested_at");

-- CreateIndex
CREATE INDEX "source_search_executions_saved_search_id_idx" ON "source_search_executions"("saved_search_id");

-- CreateIndex
CREATE INDEX "source_search_executions_requested_by_user_id_idx" ON "source_search_executions"("requested_by_user_id");

-- CreateIndex
CREATE INDEX "source_sync_runs_organization_id_source_system_requested_at_idx" ON "source_sync_runs"("organization_id", "source_system", "requested_at");

-- CreateIndex
CREATE INDEX "source_sync_runs_saved_search_id_idx" ON "source_sync_runs"("saved_search_id");

-- CreateIndex
CREATE INDEX "source_sync_runs_search_execution_id_idx" ON "source_sync_runs"("search_execution_id");

-- CreateIndex
CREATE INDEX "source_sync_runs_requested_by_user_id_idx" ON "source_sync_runs"("requested_by_user_id");

-- CreateIndex
CREATE INDEX "source_records_organization_id_source_system_idx" ON "source_records"("organization_id", "source_system");

-- CreateIndex
CREATE INDEX "source_records_opportunity_id_idx" ON "source_records"("opportunity_id");

-- CreateIndex
CREATE INDEX "source_records_agency_id_idx" ON "source_records"("agency_id");

-- CreateIndex
CREATE INDEX "source_records_source_hash_fingerprint_idx" ON "source_records"("source_hash_fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "source_records_org_source_record_key" ON "source_records"("organization_id", "source_system", "source_record_id");

-- CreateIndex
CREATE INDEX "source_search_results_source_record_id_idx" ON "source_search_results"("source_record_id");

-- CreateIndex
CREATE INDEX "source_sync_run_records_source_record_id_idx" ON "source_sync_run_records"("source_record_id");

-- AddForeignKey
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_vehicles" ADD CONSTRAINT "contract_vehicles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_lead_agency_id_fkey" FOREIGN KEY ("lead_agency_id") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_imported_from_source_record_id_fkey" FOREIGN KEY ("imported_from_source_record_id") REFERENCES "source_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_vehicles" ADD CONSTRAINT "opportunity_vehicles_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_vehicles" ADD CONSTRAINT "opportunity_vehicles_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "contract_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_competitors" ADD CONSTRAINT "opportunity_competitors_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_competitors" ADD CONSTRAINT "opportunity_competitors_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_saved_searches" ADD CONSTRAINT "source_saved_searches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_saved_searches" ADD CONSTRAINT "source_saved_searches_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_search_executions" ADD CONSTRAINT "source_search_executions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_search_executions" ADD CONSTRAINT "source_search_executions_saved_search_id_fkey" FOREIGN KEY ("saved_search_id") REFERENCES "source_saved_searches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_search_executions" ADD CONSTRAINT "source_search_executions_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_sync_runs" ADD CONSTRAINT "source_sync_runs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_sync_runs" ADD CONSTRAINT "source_sync_runs_saved_search_id_fkey" FOREIGN KEY ("saved_search_id") REFERENCES "source_saved_searches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_sync_runs" ADD CONSTRAINT "source_sync_runs_search_execution_id_fkey" FOREIGN KEY ("search_execution_id") REFERENCES "source_search_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_sync_runs" ADD CONSTRAINT "source_sync_runs_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_records" ADD CONSTRAINT "source_records_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_records" ADD CONSTRAINT "source_records_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_records" ADD CONSTRAINT "source_records_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_records" ADD CONSTRAINT "source_records_source_import_actor_user_id_fkey" FOREIGN KEY ("source_import_actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_search_results" ADD CONSTRAINT "source_search_results_search_execution_id_fkey" FOREIGN KEY ("search_execution_id") REFERENCES "source_search_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_search_results" ADD CONSTRAINT "source_search_results_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "source_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_sync_run_records" ADD CONSTRAINT "source_sync_run_records_sync_run_id_fkey" FOREIGN KEY ("sync_run_id") REFERENCES "source_sync_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_sync_run_records" ADD CONSTRAINT "source_sync_run_records_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "source_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
