import Link from "next/link";
import { notFound } from "next/navigation";
import Checklist from "@/app/meals/[id]/ingredients/Checklist";
import { prisma } from "@/app/lib/prisma";
import { splitLines } from "@/app/lib/recipes";

export const dynamic = "force-dynamic";

type MealIngredientsProps = {
  params: Promise<{ id: string }>;
};

export default async function MealIngredientsPage({
  params,
}: MealIngredientsProps) {
  const { id } = await params;
  const meal = await prisma.meal.findUnique({
    where: { id },
    include: {
      recipes: {
        include: { recipe: true },
      },
    },
  });

  if (!meal) {
    notFound();
  }

  const ingredientSet = new Map<string, string>();
  meal.recipes.forEach((item) => {
    const lines = splitLines(item.recipe.ingredientsText);
    lines.forEach((line) => {
      const key = line.toLowerCase();
      if (!ingredientSet.has(key)) {
        ingredientSet.set(key, line);
      }
    });
  });
  const ingredients = Array.from(ingredientSet.values());

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          className="text-sm font-semibold text-stone-600"
          href={`/meals/${meal.id}`}
        >
          ← Back to meal
        </Link>
        <h2 className="font-display text-2xl text-stone-900">
          Ingredients list
        </h2>
        <p className="text-sm text-stone-600">
          Combined ingredients across recipes in this meal. Check off what you
          need to buy.
        </p>
      </div>

      <Checklist items={ingredients} mealId={meal.id} />
    </section>
  );
}
