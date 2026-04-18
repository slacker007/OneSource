-- CreateEnum
CREATE TYPE "OpportunityProposalStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'IN_REVIEW', 'SUBMITTED');

-- CreateTable
CREATE TABLE "opportunity_proposals" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "owner_user_id" TEXT,
    "created_by_user_id" TEXT,
    "updated_by_user_id" TEXT,
    "status" "OpportunityProposalStatus" NOT NULL DEFAULT 'PLANNING',
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_proposal_checklist_items" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "checklist_key" TEXT NOT NULL,
    "checklist_label" TEXT NOT NULL,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_proposal_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_proposal_documents" (
    "proposal_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_proposal_documents_pkey" PRIMARY KEY ("proposal_id","document_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_proposals_opportunity_id_key" ON "opportunity_proposals"("opportunity_id");

-- CreateIndex
CREATE INDEX "opportunity_proposals_org_id_status_idx" ON "opportunity_proposals"("organization_id", "status");

-- CreateIndex
CREATE INDEX "opportunity_proposals_owner_user_id_idx" ON "opportunity_proposals"("owner_user_id");

-- CreateIndex
CREATE INDEX "proposal_checklist_items_org_id_proposal_id_idx" ON "opportunity_proposal_checklist_items"("organization_id", "proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_checklist_items_proposal_id_checklist_key_key" ON "opportunity_proposal_checklist_items"("proposal_id", "checklist_key");

-- CreateIndex
CREATE INDEX "proposal_documents_document_id_idx" ON "opportunity_proposal_documents"("document_id");

-- AddForeignKey
ALTER TABLE "opportunity_proposals" ADD CONSTRAINT "opportunity_proposals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_proposals" ADD CONSTRAINT "opportunity_proposals_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_proposals" ADD CONSTRAINT "opportunity_proposals_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_proposals" ADD CONSTRAINT "opportunity_proposals_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_proposals" ADD CONSTRAINT "opportunity_proposals_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_proposal_checklist_items" ADD CONSTRAINT "opportunity_proposal_checklist_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_proposal_checklist_items" ADD CONSTRAINT "opportunity_proposal_checklist_items_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "opportunity_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_proposal_documents" ADD CONSTRAINT "opportunity_proposal_documents_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "opportunity_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_proposal_documents" ADD CONSTRAINT "opportunity_proposal_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "opportunity_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
