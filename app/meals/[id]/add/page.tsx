import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { addRecipesToMeal } from "@/app/meals/actions";

export const dynamic = "force-dynamic";

type MealAddRecipesProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ q?: string }>;
};

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

export default async function MealAddRecipesPage({
  params,
  searchParams,
}: MealAddRecipesProps) {
  const { id } = await params;
  const resolved = (await searchParams) ?? {};
  const q = resolved.q?.toString().trim() ?? "";
  const meal = await prisma.meal.findUnique({
    where: { id },
    include: { recipes: true },
  });

  if (!meal) {
    notFound();
  }

  const mealRecipeIds = meal.recipes.map((item) => item.recipeId);
  const recipes = await prisma.recipe.findMany({
    where: {
      id: { notIn: mealRecipeIds },
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { ingredientsText: { contains: q, mode: "insensitive" } },
              { instructionsText: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { title: "asc" },
  });
  const availableRecipes = recipes;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          action={`/meals/${meal.id}/add`}
          method="get"
          className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end"
        >
          <input
            className="w-full rounded-full border border-stone-200 bg-white px-4 py-2 text-sm sm:w-64"
            type="search"
            name="q"
            placeholder="Search recipes..."
            defaultValue={q}
          />
          {q ? (
            <Link
              className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
              href={`/meals/${meal.id}/add`}
            >
              Clear
            </Link>
          ) : null}
        </form>
      </div>

      <form
        action={addRecipesToMeal.bind(null, meal.id)}
        className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm"
      >
        {availableRecipes.length === 0 ? (
          <p className="text-sm text-stone-500">
            {q
              ? "No recipes match that search."
              : "All saved recipes are already in this meal."}
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
                    {describeRecipe(recipe.title, recipe.ingredientsText)}
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
