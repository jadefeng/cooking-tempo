import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { deleteMeal, removeRecipeFromMeal } from "@/app/meals/actions";

type MealDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function MealDetailPage({ params }: MealDetailProps) {
  const { id } = await params;
  const meal = await prisma.meal.findUnique({
    where: { id },
    include: {
      recipes: {
        include: {
          recipe: true,
        },
      },
    },
  });

  if (!meal) {
    notFound();
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link className="text-sm font-semibold text-stone-600" href="/meals">
          ← Back to meals
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-3xl text-stone-900">
              {meal.title}
            </h2>
            <p className="text-sm text-stone-600">
              {meal.recipes.length} recipe
              {meal.recipes.length === 1 ? "" : "s"} in this meal.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 sm:items-end">
            <Link
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
              href={`/meals/${meal.id}/add`}
            >
              Add recipes
            </Link>
            <Link
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
              href={`/meals/${meal.id}/edit`}
            >
              Edit
            </Link>
            <form action={deleteMeal.bind(null, meal.id)}>
              <button
                className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                type="submit"
              >
                Delete meal
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xl text-stone-900">
              Ingredients list
            </h3>
            <p className="text-sm text-stone-600">
              See a combined checklist of ingredients across this meal.
            </p>
          </div>
          <Link
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
            href={`/meals/${meal.id}/ingredients`}
          >
            Open checklist
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xl text-stone-900">Cook Now</h3>
            <p className="text-sm text-stone-600">
              Follow one unified timeline of steps across every recipe.
            </p>
          </div>
          <Link
            className="rounded-full bg-[var(--cocoa)] px-4 py-2 text-sm font-semibold text-white"
            href={`/meals/${meal.id}/cook-timeline`}
          >
            Cook timeline
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="h-px w-full bg-stone-200" />
        <h3 className="font-display text-xl text-stone-900">Recipes</h3>
      </div>

      <div className="grid gap-4">
        {meal.recipes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-600">
            This meal is empty. Add recipes from the recipes list and create a
            new meal.
          </div>
        ) : (
          meal.recipes.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold text-stone-900">
                  {item.recipe.title}
                </h3>
                <p className="text-sm text-stone-500">
                  {item.recipe.sourceUrl ?? "No source link"}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
                  href={`/recipes/${item.recipe.id}`}
                >
                  View recipe
                </Link>
                <form
                  action={removeRecipeFromMeal.bind(
                    null,
                    meal.id,
                    item.recipeId,
                  )}
                >
                  <button
                    className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800"
                    type="submit"
                  >
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
