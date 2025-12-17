import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { addRecipesToMeal } from "@/app/meals/actions";

type MealAddRecipesProps = {
  params: Promise<{ id: string }>;
};

export default async function MealAddRecipesPage({
  params,
}: MealAddRecipesProps) {
  const { id } = await params;
  const meal = await prisma.meal.findUnique({
    where: { id },
    include: { recipes: true },
  });

  if (!meal) {
    notFound();
  }

  const mealRecipeIds = new Set(meal.recipes.map((item) => item.recipeId));
  const recipes = await prisma.recipe.findMany({
    orderBy: { title: "asc" },
  });
  const availableRecipes = recipes.filter(
    (recipe) => !mealRecipeIds.has(recipe.id),
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link className="text-sm font-semibold text-stone-600" href="/meals">
          ← Back to meals
        </Link>
        <h2 className="font-display text-2xl text-stone-900">
          Add recipes to {meal.title}
        </h2>
        <p className="text-sm text-stone-600">
          Select recipes to add, then save to return to the meals list.
        </p>
      </div>

      <form
        action={addRecipesToMeal.bind(null, meal.id)}
        className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm"
      >
        {availableRecipes.length === 0 ? (
          <p className="text-sm text-stone-500">
            All saved recipes are already in this meal.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {availableRecipes.map((recipe) => (
              <label
                key={recipe.id}
                className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
              >
                <input
                  className="mt-1 h-4 w-4 accent-[var(--cocoa)]"
                  type="checkbox"
                  name="recipeIds"
                  value={recipe.id}
                />
                <span>
                  <span className="block font-semibold">{recipe.title}</span>
                  <span className="text-xs text-stone-500">
                    {recipe.sourceUrl ?? "No source link"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
        <button
          className="w-full rounded-2xl bg-[var(--cocoa)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
          type="submit"
          disabled={availableRecipes.length === 0}
        >
          Add selected recipes
        </button>
      </form>
    </section>
  );
}
