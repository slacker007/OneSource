-- CreateTable
CREATE TABLE "opportunity_closeouts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "competitor_id" TEXT,
    "recorded_by_user_id" TEXT,
    "outcome_stage_key" TEXT NOT NULL,
    "outcome_stage_label" TEXT,
    "outcome_reason" TEXT NOT NULL,
    "lessons_learned" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_closeouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opportunity_closeouts_org_recorded_at_idx" ON "opportunity_closeouts"("organization_id", "recorded_at");

-- CreateIndex
CREATE INDEX "opportunity_closeouts_opportunity_id_recorded_at_idx" ON "opportunity_closeouts"("opportunity_id", "recorded_at");

-- CreateIndex
CREATE INDEX "opportunity_closeouts_opportunity_id_is_current_idx" ON "opportunity_closeouts"("opportunity_id", "is_current");

-- CreateIndex
CREATE INDEX "opportunity_closeouts_competitor_id_idx" ON "opportunity_closeouts"("competitor_id");

-- CreateIndex
CREATE INDEX "opportunity_closeouts_recorded_by_user_id_idx" ON "opportunity_closeouts"("recorded_by_user_id");

-- AddForeignKey
ALTER TABLE "opportunity_closeouts" ADD CONSTRAINT "opportunity_closeouts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_closeouts" ADD CONSTRAINT "opportunity_closeouts_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_closeouts" ADD CONSTRAINT "opportunity_closeouts_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_closeouts" ADD CONSTRAINT "opportunity_closeouts_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
