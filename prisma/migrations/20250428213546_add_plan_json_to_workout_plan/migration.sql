-- AlterTable
ALTER TABLE "WorkoutPlan" ADD COLUMN     "planJson" JSONB,
ADD COLUMN     "weekNumber" INTEGER NOT NULL DEFAULT 1;
