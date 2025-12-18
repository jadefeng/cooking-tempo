"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import {
  mealAddRecipesSchema,
  mealInputSchema,
  mealTitleSchema,
} from "@/app/lib/validation";

export type MealFormState = {
  message?: string;
};

function getString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export async function createMeal(
  _prevState: MealFormState,
  formData: FormData,
): Promise<MealFormState> {
  const recipeIds = formData
    .getAll("recipeIds")
    .filter((value): value is string => typeof value === "string");

  const parsed = mealInputSchema.safeParse({
    title: getString(formData.get("title")),
    recipeIds,
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const created = await prisma.meal.create({
    data: {
      title: parsed.data.title,
      recipes: {
        create: parsed.data.recipeIds?.map((recipeId) => ({ recipeId })) ?? [],
      },
    },
    select: { id: true },
  });

  revalidatePath(`/meals/${created.id}`);
  revalidatePath("/meals");
  redirect(`/meals/${created.id}`);
}

export async function updateMealTitle(mealId: string, formData: FormData) {
  const parsed = mealTitleSchema.safeParse({
    title: getString(formData.get("title")),
  });

  if (!parsed.success) {
    return;
  }

  await prisma.meal.update({
    where: { id: mealId },
    data: { title: parsed.data.title },
  });

  revalidatePath(`/meals/${mealId}`);
  revalidatePath("/meals");
  redirect(`/meals/${mealId}`);
}

export async function addRecipesToMeal(mealId: string, formData: FormData) {
  const recipeIds = formData
    .getAll("recipeIds")
    .filter((value): value is string => typeof value === "string");

  const parsed = mealAddRecipesSchema.safeParse({ recipeIds });
  if (!parsed.success) {
    return;
  }

  const existing = await prisma.mealRecipe.findMany({
    where: { mealId, recipeId: { in: parsed.data.recipeIds } },
    select: { recipeId: true },
  });
  const existingIds = new Set(existing.map((item) => item.recipeId));
  const newIds = parsed.data.recipeIds.filter(
    (recipeId) => !existingIds.has(recipeId),
  );

  if (newIds.length === 0) {
    revalidatePath("/meals");
    revalidatePath(`/meals/${mealId}`);
    redirect(`/meals/${mealId}`);
  }

  await prisma.mealRecipe.createMany({
    data: newIds.map((recipeId) => ({
      mealId,
      recipeId,
    })),
  });

  revalidatePath("/meals");
  revalidatePath(`/meals/${mealId}`);
  redirect(`/meals/${mealId}`);
}

export async function deleteMeal(mealId: string) {
  await prisma.meal.delete({ where: { id: mealId } });
  revalidatePath("/meals");
  redirect("/meals");
}

export async function removeRecipeFromMeal(mealId: string, recipeId: string) {
  await prisma.mealRecipe.deleteMany({
    where: { mealId, recipeId },
  });
  revalidatePath(`/meals/${mealId}`);
  revalidatePath("/meals");
}
