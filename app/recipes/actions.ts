"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeMultiline } from "@/app/lib/recipes";
import { prisma } from "@/app/lib/prisma";
import { recipeInputSchema } from "@/app/lib/validation";

export type RecipeFormState = {
  message?: string;
};

function getString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export async function createRecipe(
  _prevState: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const parsed = recipeInputSchema.safeParse({
    title: getString(formData.get("title")),
    sourceUrl: getString(formData.get("sourceUrl")),
    ingredientsText: getString(formData.get("ingredientsText")),
    instructionsText: getString(formData.get("instructionsText")),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const ingredientsText = normalizeMultiline(parsed.data.ingredientsText);
  const instructionsText = normalizeMultiline(parsed.data.instructionsText);

  await prisma.recipe.create({
    data: {
      title: parsed.data.title,
      sourceUrl: parsed.data.sourceUrl || null,
      ingredientsText,
      instructionsText,
    },
  });

  revalidatePath("/recipes");
  redirect("/recipes");
}

export async function updateRecipe(
  id: string,
  _prevState: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const parsed = recipeInputSchema.safeParse({
    title: getString(formData.get("title")),
    sourceUrl: getString(formData.get("sourceUrl")),
    ingredientsText: getString(formData.get("ingredientsText")),
    instructionsText: getString(formData.get("instructionsText")),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const ingredientsText = normalizeMultiline(parsed.data.ingredientsText);
  const instructionsText = normalizeMultiline(parsed.data.instructionsText);

  await prisma.recipe.update({
    where: { id },
    data: {
      title: parsed.data.title,
      sourceUrl: parsed.data.sourceUrl || null,
      ingredientsText,
      instructionsText,
    },
  });

  revalidatePath(`/recipes/${id}`);
  revalidatePath("/recipes");
  redirect(`/recipes/${id}`);
}

export async function deleteRecipe(id: string) {
  await prisma.recipe.delete({ where: { id } });
  revalidatePath("/recipes");
  redirect("/recipes");
}
