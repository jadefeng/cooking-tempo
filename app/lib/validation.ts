import { z } from "zod";

export const recipeInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  sourceUrl: z
    .string()
    .trim()
    .url("Source URL must be a valid URL.")
    .optional()
    .or(z.literal("")),
  ingredientsText: z.string().optional().default(""),
  instructionsText: z.string().optional().default(""),
});

export const mealInputSchema = z.object({
  title: z.string().trim().min(1, "Meal title is required."),
  recipeIds: z.array(z.string()).optional(),
});

export const mealTitleSchema = z.object({
  title: z.string().trim().min(1, "Meal title is required."),
});

export const mealAddRecipesSchema = z.object({
  recipeIds: z.array(z.string()).min(1, "Select at least one recipe."),
});

export const recipeImportSchema = z.object({
  url: z.string().trim().url("Please enter a valid recipe URL."),
});
