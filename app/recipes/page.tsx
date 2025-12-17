import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { deleteRecipe } from "@/app/recipes/actions";

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: "desc" },
  });

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

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-stone-900">Recipes</h2>
          <p className="text-sm text-stone-600">
            Keep your favorites close, edit fast, and cook with confidence.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
            href="/recipes/new"
          >
            Add recipe
          </Link>
          <Link
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
            href="/recipes/import"
          >
            Import from link
          </Link>
        </div>
      </div>
      <div className="grid gap-4">
        {recipes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-600">
            No recipes yet. Add one manually or import a link to get started.
          </div>
        ) : (
          recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-stone-900">
                  {recipe.title}
                </h3>
                <p className="text-sm text-stone-500">
                  {describeRecipe(recipe.title, recipe.ingredientsText)}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
                  href={`/recipes/${recipe.id}`}
                >
                  View
                </Link>
                <form action={deleteRecipe.bind(null, recipe.id)}>
                  <button
                    className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                    type="submit"
                  >
                    Delete
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
