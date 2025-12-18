import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { defaultDurationMin } from "@/app/lib/cookTimeline";

function parseDurationMin(text: string) {
  const lower = text.toLowerCase();
  const hourMatch = lower.match(/(\d+)\s*(hours|hour|hr)\b/);
  if (hourMatch) return Number(hourMatch[1]) * 60;
  const minMatch = lower.match(/(\d+)\s*(minutes|minute|min)\b/);
  if (minMatch) return Number(minMatch[1]);
  return null;
}

function detectActiveType(text: string) {
  const lower = text.toLowerCase();
  if (/\brest\b|\blet sit\b/.test(lower)) return "rest" as const;
  if (
    /\bbake\b|\broast\b|\bsimmer\b|\bboil\b|\bbring to a boil\b|\bpreheat\b/.test(
      lower,
    )
  ) {
    return "passive" as const;
  }
  return "active" as const;
}

function estimateRecipeDuration(instructionsText: string) {
  const steps = instructionsText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return steps.reduce((sum, instruction) => {
    const durationMin = parseDurationMin(instruction);
    const activeType = detectActiveType(instruction);
    return sum + (durationMin ?? defaultDurationMin(activeType));
  }, 0);
}

type MealWithRecipes = Awaited<ReturnType<typeof prisma.meal.findMany>>[number] & {
  recipes: { recipe: { instructionsText: string } }[];
};

function estimateMealDuration(meal: MealWithRecipes) {
  const recipeDurations = meal.recipes?.map((item) =>
    estimateRecipeDuration(item.recipe.instructionsText),
  );
  const maxDuration = recipeDurations?.length
    ? recipeDurations.reduce((a, b) => Math.max(a, b), 0)
    : 0;
  return Math.round(maxDuration / 5) * 5;
}

export const dynamic = "force-dynamic";

export default async function MealsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const resolved = (await searchParams) ?? {};
  const q = resolved.q?.toString().trim() ?? "";
  const meals = await prisma.meal.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            {
              recipes: {
                some: {
                  recipe: { title: { contains: q, mode: "insensitive" } },
                },
              },
            },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { recipes: true } },
      recipes: {
        include: {
          recipe: {
            select: { title: true, instructionsText: true },
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
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
              href="/meals/new"
            >
              New meal
            </Link>
          </div>
          <form
            action="/meals"
            method="get"
            className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end"
          >
            <input
              className="w-full rounded-full border border-stone-200 bg-white px-4 py-2 text-sm sm:w-64"
              type="search"
              name="q"
              placeholder="Search meals..."
              defaultValue={q}
            />
            {q ? (
              <Link
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
                href="/meals"
              >
                Clear
              </Link>
            ) : null}
          </form>
        </div>
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
            const totalMinutes = estimateMealDuration(meal);

            return (
              <div
                key={meal.id}
                className="flex flex-col gap-3 rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-stone-900">
                    {meal.title}
                  </h3>
                  <p className="text-sm text-stone-500">
                    {summary} • ~{totalMinutes} min
                  </p>
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
                  <Link
                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white !text-white hover:!text-white focus-visible:!text-white visited:!text-white"
                    href={`/meals/${meal.id}/cook-timeline`}
                  >
                    Start cooking
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
