-- CreateEnum
CREATE TYPE "DeadlineReminderState" AS ENUM ('NONE', 'UPCOMING', 'OVERDUE');

-- AlterTable
ALTER TABLE "opportunity_milestones" ADD COLUMN     "deadline_reminder_state" "DeadlineReminderState" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "deadline_reminder_updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "opportunity_tasks" ADD COLUMN     "deadline_reminder_state" "DeadlineReminderState" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "deadline_reminder_updated_at" TIMESTAMP(3);
