import Link from "next/link";
import { prisma } from "@/app/lib/prisma";

export default async function MealsPage() {
  const meals = await prisma.meal.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { recipes: true } },
      recipes: {
        include: {
          recipe: {
            select: { title: true },
          },
        },
      },
    },
  });

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-stone-900">Meals</h2>
          <p className="text-sm text-stone-600">
            Combine recipes into fast repeatable meal plans.
          </p>
        </div>
        <Link
          className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
          href="/meals/new"
        >
          New meal
        </Link>
      </div>
      <div className="grid gap-4">
        {meals.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-600">
            No meals yet. Build one from your saved recipes.
          </div>
        ) : (
          meals.map((meal) => {
            const recipeNames = meal.recipes.map((item) => item.recipe.title);
            const summary =
              recipeNames.length === 0
                ? "No recipes yet — add some to build this meal."
                : recipeNames.length === 1
                  ? `Includes ${recipeNames[0]}.`
                  : recipeNames.length === 2
                    ? `Includes ${recipeNames[0]} and ${recipeNames[1]}.`
                    : `Includes ${recipeNames[0]}, ${recipeNames[1]}, and ${
                        recipeNames.length - 2
                      } more.`;

            return (
              <div
                key={meal.id}
                className="flex flex-col gap-3 rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-stone-900">
                    {meal.title}
                  </h3>
                  <p className="text-sm text-stone-500">{summary}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
                    href={`/meals/${meal.id}`}
                  >
                    View meal
                  </Link>
                  <Link
                    className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
                    href={`/meals/${meal.id}/ingredients`}
                  >
                    Ingredients list
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
