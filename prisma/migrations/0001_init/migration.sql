-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Recipe table
CREATE TABLE "Recipe" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "title" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "ingredientsText" TEXT NOT NULL,
  "instructionsText" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- Meal table
CREATE TABLE "Meal" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- MealRecipe join table
CREATE TABLE "MealRecipe" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "mealId" UUID NOT NULL,
  "recipeId" UUID NOT NULL,
  CONSTRAINT "MealRecipe_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MealRecipe_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MealRecipe_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Unique constraint for meal/recipe pairs
CREATE UNIQUE INDEX "MealRecipe_mealId_recipeId_key" ON "MealRecipe"("mealId", "recipeId");
