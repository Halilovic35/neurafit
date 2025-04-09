/*
  Warnings:

  - Added the required column `bmi` to the `WorkoutPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bmiCategory` to the `WorkoutPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `daysPerWeek` to the `WorkoutPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fitnessLevel` to the `WorkoutPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `goal` to the `WorkoutPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WorkoutPlan" ADD COLUMN     "bmi" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "bmiCategory" TEXT NOT NULL,
ADD COLUMN     "daysPerWeek" INTEGER NOT NULL,
ADD COLUMN     "fitnessLevel" TEXT NOT NULL,
ADD COLUMN     "goal" TEXT NOT NULL;
