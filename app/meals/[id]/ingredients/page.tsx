import Link from "next/link";
import { notFound } from "next/navigation";
import Checklist from "@/app/meals/[id]/ingredients/Checklist";
import { prisma } from "@/app/lib/prisma";
import { splitLines } from "@/app/lib/recipes";

export const dynamic = "force-dynamic";

type MealIngredientsProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ q?: string }>;
};

export default async function MealIngredientsPage({
  params,
  searchParams,
}: MealIngredientsProps) {
  const { id } = await params;
  const resolved = (await searchParams) ?? {};
  const q = resolved.q?.toString().trim() ?? "";
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
  const ingredients = Array.from(ingredientSet.values()).filter((item) =>
    q ? item.toLowerCase().includes(q.toLowerCase()) : true,
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

        <form
          action={`/meals/${meal.id}/ingredients`}
          method="get"
          className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end"
        >
          <input
            className="w-full rounded-full border border-stone-200 bg-white px-4 py-2 text-sm sm:w-64"
            type="search"
            name="q"
            placeholder="Search ingredients..."
            defaultValue={q}
          />
          {q ? (
            <Link
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
              href={`/meals/${meal.id}/ingredients`}
            >
              Clear
            </Link>
          ) : null}
        </form>
      </div>

      {ingredients.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-600">
          {q
            ? "No ingredients match that search."
            : "No ingredients yet for this meal."}
        </div>
      ) : (
        <Checklist items={ingredients} mealId={meal.id} />
      )}
    </section>
  );
}
