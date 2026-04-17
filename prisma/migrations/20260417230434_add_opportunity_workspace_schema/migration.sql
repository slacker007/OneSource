-- CreateEnum
CREATE TYPE "OpportunityTaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OpportunityTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "OpportunityMilestoneStatus" AS ENUM ('PLANNED', 'AT_RISK', 'COMPLETED', 'MISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OpportunityDocumentSourceType" AS ENUM ('MANUAL_UPLOAD', 'SOURCE_ATTACHMENT', 'GENERATED', 'EXTERNAL_LINK');

-- CreateEnum
CREATE TYPE "OpportunityDocumentExtractionStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "OpportunityStageTransitionTrigger" AS ENUM ('MANUAL', 'SYSTEM', 'IMPORT');

-- CreateEnum
CREATE TYPE "BidDecisionOutcome" AS ENUM ('GO', 'NO_GO', 'DEFER');

-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "current_stage_changed_at" TIMESTAMP(3),
ADD COLUMN     "current_stage_key" TEXT,
ADD COLUMN     "current_stage_label" TEXT;

-- CreateTable
CREATE TABLE "opportunity_tasks" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "created_by_user_id" TEXT,
    "assignee_user_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "OpportunityTaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "priority" "OpportunityTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "due_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_milestones" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "created_by_user_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "milestone_type_key" TEXT,
    "status" "OpportunityMilestoneStatus" NOT NULL DEFAULT 'PLANNED',
    "target_date" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_notes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "author_user_id" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "content_format" TEXT NOT NULL DEFAULT 'markdown',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_activity_events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "actor_type" "AuditActorType" NOT NULL DEFAULT 'USER',
    "actor_identifier" TEXT,
    "event_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "related_entity_type" TEXT,
    "related_entity_id" TEXT,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_documents" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "source_record_id" TEXT,
    "uploaded_by_user_id" TEXT,
    "title" TEXT NOT NULL,
    "document_type" TEXT,
    "source_type" "OpportunityDocumentSourceType" NOT NULL DEFAULT 'MANUAL_UPLOAD',
    "source_url" TEXT,
    "original_file_name" TEXT,
    "storage_provider" TEXT,
    "storage_path" TEXT,
    "mime_type" TEXT,
    "file_size_bytes" INTEGER,
    "checksum_sha256" TEXT,
    "extracted_text" TEXT,
    "extraction_status" "OpportunityDocumentExtractionStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
    "extracted_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_stage_transitions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "trigger_type" "OpportunityStageTransitionTrigger" NOT NULL DEFAULT 'MANUAL',
    "from_stage_key" TEXT,
    "from_stage_label" TEXT,
    "to_stage_key" TEXT NOT NULL,
    "to_stage_label" TEXT,
    "rationale" TEXT,
    "required_fields_snapshot" JSONB,
    "metadata" JSONB,
    "transitioned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_stage_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_scorecards" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "calculated_by_user_id" TEXT,
    "scoring_model_key" TEXT,
    "scoring_model_version" TEXT,
    "total_score" DECIMAL(7,2),
    "maximum_score" DECIMAL(7,2),
    "score_percent" DECIMAL(5,2),
    "recommendation_outcome" "BidDecisionOutcome",
    "recommendation_summary" TEXT,
    "summary" TEXT,
    "input_snapshot" JSONB,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_scorecards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_score_factors" (
    "id" TEXT NOT NULL,
    "scorecard_id" TEXT NOT NULL,
    "factor_key" TEXT NOT NULL,
    "factor_label" TEXT NOT NULL,
    "weight" DECIMAL(5,2),
    "score" DECIMAL(7,2),
    "maximum_score" DECIMAL(7,2),
    "explanation" TEXT,
    "factor_metadata" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_score_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_decisions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "scorecard_id" TEXT,
    "recommended_by_user_id" TEXT,
    "decided_by_user_id" TEXT,
    "decision_type_key" TEXT,
    "recommendation_outcome" "BidDecisionOutcome",
    "recommendation_summary" TEXT,
    "recommendation_metadata" JSONB,
    "recommended_by_actor_type" "AuditActorType" NOT NULL DEFAULT 'SYSTEM',
    "recommended_by_identifier" TEXT,
    "recommended_at" TIMESTAMP(3),
    "final_outcome" "BidDecisionOutcome",
    "final_rationale" TEXT,
    "decision_metadata" JSONB,
    "decided_at" TIMESTAMP(3),
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opportunity_tasks_org_status_due_at_idx" ON "opportunity_tasks"("organization_id", "status", "due_at");

-- CreateIndex
CREATE INDEX "opportunity_tasks_opportunity_id_due_at_idx" ON "opportunity_tasks"("opportunity_id", "due_at");

-- CreateIndex
CREATE INDEX "opportunity_tasks_assignee_user_id_idx" ON "opportunity_tasks"("assignee_user_id");

-- CreateIndex
CREATE INDEX "opportunity_tasks_created_by_user_id_idx" ON "opportunity_tasks"("created_by_user_id");

-- CreateIndex
CREATE INDEX "opportunity_milestones_org_target_date_idx" ON "opportunity_milestones"("organization_id", "target_date");

-- CreateIndex
CREATE INDEX "opportunity_milestones_opportunity_id_target_date_idx" ON "opportunity_milestones"("opportunity_id", "target_date");

-- CreateIndex
CREATE INDEX "opportunity_milestones_created_by_user_id_idx" ON "opportunity_milestones"("created_by_user_id");

-- CreateIndex
CREATE INDEX "opportunity_notes_org_created_at_idx" ON "opportunity_notes"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "opportunity_notes_opportunity_id_created_at_idx" ON "opportunity_notes"("opportunity_id", "created_at");

-- CreateIndex
CREATE INDEX "opportunity_notes_author_user_id_idx" ON "opportunity_notes"("author_user_id");

-- CreateIndex
CREATE INDEX "opportunity_activity_org_occurred_at_idx" ON "opportunity_activity_events"("organization_id", "occurred_at");

-- CreateIndex
CREATE INDEX "opportunity_activity_opportunity_id_occurred_at_idx" ON "opportunity_activity_events"("opportunity_id", "occurred_at");

-- CreateIndex
CREATE INDEX "opportunity_activity_actor_user_id_idx" ON "opportunity_activity_events"("actor_user_id");

-- CreateIndex
CREATE INDEX "opportunity_activity_related_entity_idx" ON "opportunity_activity_events"("related_entity_type", "related_entity_id");

-- CreateIndex
CREATE INDEX "opportunity_documents_org_created_at_idx" ON "opportunity_documents"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "opportunity_documents_opportunity_id_created_at_idx" ON "opportunity_documents"("opportunity_id", "created_at");

-- CreateIndex
CREATE INDEX "opportunity_documents_source_record_id_idx" ON "opportunity_documents"("source_record_id");

-- CreateIndex
CREATE INDEX "opportunity_documents_uploaded_by_user_id_idx" ON "opportunity_documents"("uploaded_by_user_id");

-- CreateIndex
CREATE INDEX "opportunity_stage_transitions_org_transitioned_at_idx" ON "opportunity_stage_transitions"("organization_id", "transitioned_at");

-- CreateIndex
CREATE INDEX "oppty_stage_transitions_opportunity_id_transitioned_at_idx" ON "opportunity_stage_transitions"("opportunity_id", "transitioned_at");

-- CreateIndex
CREATE INDEX "opportunity_stage_transitions_actor_user_id_idx" ON "opportunity_stage_transitions"("actor_user_id");

-- CreateIndex
CREATE INDEX "opportunity_scorecards_org_calculated_at_idx" ON "opportunity_scorecards"("organization_id", "calculated_at");

-- CreateIndex
CREATE INDEX "opportunity_scorecards_opportunity_id_calculated_at_idx" ON "opportunity_scorecards"("opportunity_id", "calculated_at");

-- CreateIndex
CREATE INDEX "opportunity_scorecards_calculated_by_user_id_idx" ON "opportunity_scorecards"("calculated_by_user_id");

-- CreateIndex
CREATE INDEX "opportunity_scorecards_opportunity_id_is_current_idx" ON "opportunity_scorecards"("opportunity_id", "is_current");

-- CreateIndex
CREATE INDEX "opportunity_score_factors_scorecard_id_sort_order_idx" ON "opportunity_score_factors"("scorecard_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_score_factors_scorecard_id_factor_key_key" ON "opportunity_score_factors"("scorecard_id", "factor_key");

-- CreateIndex
CREATE INDEX "bid_decisions_org_decided_at_idx" ON "bid_decisions"("organization_id", "decided_at");

-- CreateIndex
CREATE INDEX "bid_decisions_opportunity_id_decided_at_idx" ON "bid_decisions"("opportunity_id", "decided_at");

-- CreateIndex
CREATE INDEX "bid_decisions_opportunity_id_is_current_idx" ON "bid_decisions"("opportunity_id", "is_current");

-- CreateIndex
CREATE INDEX "bid_decisions_scorecard_id_idx" ON "bid_decisions"("scorecard_id");

-- CreateIndex
CREATE INDEX "bid_decisions_recommended_by_user_id_idx" ON "bid_decisions"("recommended_by_user_id");

-- CreateIndex
CREATE INDEX "bid_decisions_decided_by_user_id_idx" ON "bid_decisions"("decided_by_user_id");

-- CreateIndex
CREATE INDEX "opportunities_organization_id_current_stage_key_idx" ON "opportunities"("organization_id", "current_stage_key");

-- AddForeignKey
ALTER TABLE "opportunity_tasks" ADD CONSTRAINT "opportunity_tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_tasks" ADD CONSTRAINT "opportunity_tasks_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_tasks" ADD CONSTRAINT "opportunity_tasks_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_tasks" ADD CONSTRAINT "opportunity_tasks_assignee_user_id_fkey" FOREIGN KEY ("assignee_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_milestones" ADD CONSTRAINT "opportunity_milestones_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_milestones" ADD CONSTRAINT "opportunity_milestones_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_milestones" ADD CONSTRAINT "opportunity_milestones_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_notes" ADD CONSTRAINT "opportunity_notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_notes" ADD CONSTRAINT "opportunity_notes_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_notes" ADD CONSTRAINT "opportunity_notes_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_activity_events" ADD CONSTRAINT "opportunity_activity_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_activity_events" ADD CONSTRAINT "opportunity_activity_events_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_activity_events" ADD CONSTRAINT "opportunity_activity_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_documents" ADD CONSTRAINT "opportunity_documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_documents" ADD CONSTRAINT "opportunity_documents_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_documents" ADD CONSTRAINT "opportunity_documents_source_record_id_fkey" FOREIGN KEY ("source_record_id") REFERENCES "source_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_documents" ADD CONSTRAINT "opportunity_documents_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_stage_transitions" ADD CONSTRAINT "opportunity_stage_transitions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_stage_transitions" ADD CONSTRAINT "opportunity_stage_transitions_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_stage_transitions" ADD CONSTRAINT "opportunity_stage_transitions_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_scorecards" ADD CONSTRAINT "opportunity_scorecards_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_scorecards" ADD CONSTRAINT "opportunity_scorecards_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_scorecards" ADD CONSTRAINT "opportunity_scorecards_calculated_by_user_id_fkey" FOREIGN KEY ("calculated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_score_factors" ADD CONSTRAINT "opportunity_score_factors_scorecard_id_fkey" FOREIGN KEY ("scorecard_id") REFERENCES "opportunity_scorecards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_decisions" ADD CONSTRAINT "bid_decisions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_decisions" ADD CONSTRAINT "bid_decisions_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_decisions" ADD CONSTRAINT "bid_decisions_scorecard_id_fkey" FOREIGN KEY ("scorecard_id") REFERENCES "opportunity_scorecards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_decisions" ADD CONSTRAINT "bid_decisions_recommended_by_user_id_fkey" FOREIGN KEY ("recommended_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_decisions" ADD CONSTRAINT "bid_decisions_decided_by_user_id_fkey" FOREIGN KEY ("decided_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
