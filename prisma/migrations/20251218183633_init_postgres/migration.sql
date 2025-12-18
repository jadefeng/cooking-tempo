/*
  Warnings:

  - The primary key for the `Meal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `MealRecipe` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Recipe` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "MealRecipe" DROP CONSTRAINT "MealRecipe_mealId_fkey";

-- DropForeignKey
ALTER TABLE "MealRecipe" DROP CONSTRAINT "MealRecipe_recipeId_fkey";

-- AlterTable
ALTER TABLE "Meal" DROP CONSTRAINT "Meal_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "Meal_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "MealRecipe" DROP CONSTRAINT "MealRecipe_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "mealId" SET DATA TYPE TEXT,
ALTER COLUMN "recipeId" SET DATA TYPE TEXT,
ADD CONSTRAINT "MealRecipe_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "MealRecipe" ADD CONSTRAINT "MealRecipe_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealRecipe" ADD CONSTRAINT "MealRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
