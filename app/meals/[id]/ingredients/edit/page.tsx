import Link from "next/link";
import { notFound } from "next/navigation";
import { EditIngredients } from "@/app/meals/[id]/ingredients/EditIngredients";
import { prisma } from "@/app/lib/prisma";
import { splitLines } from "@/app/lib/recipes";

export const dynamic = "force-dynamic";

type EditIngredientsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditIngredientsPage({
  params,
}: EditIngredientsPageProps) {
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
          href={`/meals/${meal.id}/ingredients`}
        >
          ← Back to ingredients list
        </Link>
        <h2 className="font-display text-2xl text-stone-900">
          Edit ingredients
        </h2>
        <p className="text-sm text-stone-600">
          Add extra items or remove ones you don’t need for this meal.
        </p>
      </div>

      <EditIngredients mealId={meal.id} baseItems={ingredients} />
    </section>
  );
}
