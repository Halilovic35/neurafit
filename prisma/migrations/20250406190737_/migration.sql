/*
  Warnings:

  - Added the required column `goal` to the `MealPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mealsPerDay` to the `MealPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MealPlan" ADD COLUMN     "dietaryRestrictions" TEXT[] DEFAULT '{}',
ADD COLUMN     "goal" TEXT NOT NULL DEFAULT 'MAINTAIN',
ADD COLUMN     "mealsPerDay" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "imageUrl" TEXT;
