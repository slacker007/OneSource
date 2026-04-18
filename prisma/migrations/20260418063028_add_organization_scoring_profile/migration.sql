-- CreateTable
CREATE TABLE "organization_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "overview" TEXT,
    "strategic_focus" TEXT,
    "target_naics_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority_agency_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relationship_agency_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active_scoring_model_key" TEXT NOT NULL,
    "active_scoring_model_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_capabilities" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "organization_profile_id" TEXT NOT NULL,
    "capability_key" TEXT NOT NULL,
    "capability_label" TEXT NOT NULL,
    "capability_category" TEXT,
    "capability_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_certifications" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "organization_profile_id" TEXT NOT NULL,
    "certification_key" TEXT NOT NULL,
    "certification_label" TEXT NOT NULL,
    "certification_code" TEXT,
    "issuing_body" TEXT,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_profile_vehicles" (
    "organization_profile_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "usage_notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_profile_vehicles_pkey" PRIMARY KEY ("organization_profile_id","vehicle_id")
);

-- CreateTable
CREATE TABLE "organization_scoring_criteria" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "organization_profile_id" TEXT NOT NULL,
    "factor_key" TEXT NOT NULL,
    "factor_label" TEXT NOT NULL,
    "description" TEXT,
    "weight" DECIMAL(5,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_scoring_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_profiles_organization_id_key" ON "organization_profiles"("organization_id");

-- CreateIndex
CREATE INDEX "org_capabilities_org_id_is_active_idx" ON "organization_capabilities"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "org_capabilities_profile_id_sort_order_idx" ON "organization_capabilities"("organization_profile_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "org_capabilities_profile_id_capability_key_key" ON "organization_capabilities"("organization_profile_id", "capability_key");

-- CreateIndex
CREATE INDEX "org_certifications_org_id_is_active_idx" ON "organization_certifications"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "org_certifications_profile_id_sort_order_idx" ON "organization_certifications"("organization_profile_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "org_certifications_profile_id_certification_key_key" ON "organization_certifications"("organization_profile_id", "certification_key");

-- CreateIndex
CREATE INDEX "org_profile_vehicles_org_id_vehicle_id_idx" ON "organization_profile_vehicles"("organization_id", "vehicle_id");

-- CreateIndex
CREATE INDEX "org_profile_vehicles_profile_id_sort_order_idx" ON "organization_profile_vehicles"("organization_profile_id", "sort_order");

-- CreateIndex
CREATE INDEX "org_scoring_criteria_org_id_is_active_idx" ON "organization_scoring_criteria"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "org_scoring_criteria_profile_id_sort_order_idx" ON "organization_scoring_criteria"("organization_profile_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "org_scoring_criteria_profile_id_factor_key_key" ON "organization_scoring_criteria"("organization_profile_id", "factor_key");

-- AddForeignKey
ALTER TABLE "organization_profiles" ADD CONSTRAINT "organization_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_capabilities" ADD CONSTRAINT "organization_capabilities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_capabilities" ADD CONSTRAINT "organization_capabilities_organization_profile_id_fkey" FOREIGN KEY ("organization_profile_id") REFERENCES "organization_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_certifications" ADD CONSTRAINT "organization_certifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_certifications" ADD CONSTRAINT "organization_certifications_organization_profile_id_fkey" FOREIGN KEY ("organization_profile_id") REFERENCES "organization_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_profile_vehicles" ADD CONSTRAINT "organization_profile_vehicles_organization_profile_id_fkey" FOREIGN KEY ("organization_profile_id") REFERENCES "organization_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_profile_vehicles" ADD CONSTRAINT "organization_profile_vehicles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_profile_vehicles" ADD CONSTRAINT "organization_profile_vehicles_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "contract_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_scoring_criteria" ADD CONSTRAINT "organization_scoring_criteria_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_scoring_criteria" ADD CONSTRAINT "organization_scoring_criteria_organization_profile_id_fkey" FOREIGN KEY ("organization_profile_id") REFERENCES "organization_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
