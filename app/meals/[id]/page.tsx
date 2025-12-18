import Link from "next/link";
import { notFound } from "next/navigation";
import { defaultDurationMin } from "@/app/lib/cookTimeline";
import { prisma } from "@/app/lib/prisma";
import { deleteMeal, removeRecipeFromMeal } from "@/app/meals/actions";

export const dynamic = "force-dynamic";

type MealDetailProps = {
  params: Promise<{ id: string }>;
};

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

function normalizeIngredient(line: string) {
  return line
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\b\d+([./]\d+)?\b/g, "")
    .replace(
      /\b(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ounce|ounces|lb|lbs|pound|pounds|g|gram|grams|kg|ml|l|liter|liters|pinch|clove|cloves|slice|slices|can|cans|package|packages)\b/g,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function getIngredientKeywords(ingredientsText: string) {
  const stop = new Set([
    "and",
    "or",
    "to",
    "taste",
    "for",
    "with",
    "fresh",
    "optional",
    "ground",
    "minced",
    "chopped",
    "diced",
    "sliced",
    "grated",
    "shredded",
    "cooked",
    "uncooked",
    "plus",
    "more",
    "as needed",
    "of",
    "the",
    "a",
    "an",
  ]);

  const lines = ingredientsText
    .split(/\r?\n/)
    .map((line) => normalizeIngredient(line))
    .filter(Boolean);

  const tokens = lines
    .flatMap((line) => line.split(/[,\u2013\u2014\-]/g))
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => token.replace(/^[•\-*]+\s*/, "").trim())
    .filter((token) => token.length > 1 && !stop.has(token));

  return Array.from(new Set(tokens));
}

function describeRecipe(title: string, ingredientsText: string) {
  const lowerTitle = title.toLowerCase();
  const ingredients = getIngredientKeywords(ingredientsText);

  if (!ingredientsText.trim()) {
    return "A tasty dish — add ingredients to generate a better description.";
  }

  const has = (needle: string) =>
    lowerTitle.includes(needle) ||
    ingredients.some((item) => item.includes(needle));

  const base =
    lowerTitle
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .join(" ") || "dish";

  if (has("potato") && has("parmesan")) {
    return "Delicious potatoes crusted with parmesan cheese.";
  }

  if (has("chicken") && has("lemon")) {
    return "Bright, lemony chicken with a fresh, savory finish.";
  }

  if (has("pasta") && has("garlic")) {
    return "Comforting pasta with garlicky, craveable flavor.";
  }

  if (has("crispy") || has("crisp")) {
    const highlight = ingredients.find((item) =>
      ["parmesan", "panko", "cornstarch", "breadcrumbs"].some((key) =>
        item.includes(key),
      ),
    );
    if (highlight) {
      return `Crispy ${base} with a ${highlight} crunch.`;
    }
    return `Crispy ${base} with big flavor.`;
  }

  const firstTwo = ingredients.slice(0, 2);
  if (firstTwo.length === 2) {
    return `A delicious ${base} featuring ${firstTwo[0]} and ${firstTwo[1]}.`;
  }
  if (firstTwo.length === 1) {
    return `A delicious ${base} featuring ${firstTwo[0]}.`;
  }
  return `A delicious ${base} for any day of the week.`;
}

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

  const totalMinutes = (() => {
    const recipeDurations = meal.recipes.map((item) =>
      estimateRecipeDuration(item.recipe.instructionsText),
    );
    const maxDuration = recipeDurations.length
      ? recipeDurations.reduce((a, b) => Math.max(a, b), 0)
      : 0;
    return Math.round(maxDuration / 5) * 5;
  })();

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
            <p className="text-sm font-semibold text-stone-700">
              Total cooking time: ~{totalMinutes} min
            </p>
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
              Follow one unified timeline of steps across every recipe. ~
              {totalMinutes} min
            </p>
          </div>
          <Link
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white !text-white hover:!text-white focus-visible:!text-white visited:!text-white"
            href={`/meals/${meal.id}/cook-timeline`}
          >
            Start Cooking
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
                  {describeRecipe(item.recipe.title, item.recipe.ingredientsText)}
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
