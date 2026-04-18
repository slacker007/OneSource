-- AlterTable
ALTER TABLE "organization_profiles" ADD COLUMN     "defer_recommendation_threshold" DECIMAL(5,2) NOT NULL DEFAULT 45.00,
ADD COLUMN     "go_recommendation_threshold" DECIMAL(5,2) NOT NULL DEFAULT 70.00,
ADD COLUMN     "minimum_risk_score_percent" DECIMAL(5,2) NOT NULL DEFAULT 50.00;
