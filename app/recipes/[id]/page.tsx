import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { splitLines } from "@/app/lib/recipes";
import { deleteRecipe } from "@/app/recipes/actions";

export const dynamic = "force-dynamic";

type RecipeDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function RecipeDetailPage({ params }: RecipeDetailProps) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { id } });

  if (!recipe) {
    notFound();
  }

  const ingredients = splitLines(recipe.ingredientsText);
  const instructions = splitLines(recipe.instructionsText);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link className="text-sm font-semibold text-stone-600" href="/recipes">
            ← Back to recipes
          </Link>
          <h2 className="font-display text-3xl text-stone-900">
            {recipe.title}
          </h2>
          {recipe.sourceUrl ? (
            <a
              className="text-sm text-stone-500 underline decoration-stone-300 underline-offset-4"
              href={recipe.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              {recipe.sourceUrl}
            </a>
          ) : (
            <p className="text-sm text-stone-500">No source URL provided.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
            href={`/recipes/${recipe.id}/edit`}
          >
            Edit
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
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm">
          <h3 className="font-display text-xl text-stone-900">Ingredients</h3>
          {ingredients.length ? (
            <ul className="mt-4 space-y-2 text-sm text-stone-700">
              {ingredients.map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[var(--cocoa)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-stone-500">
              No ingredients yet.
            </p>
          )}
        </div>
        <div className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm">
          <h3 className="font-display text-xl text-stone-900">
            Instructions
          </h3>
          {instructions.length ? (
            <ol className="mt-4 space-y-3 text-sm text-stone-700">
              {instructions.map((step, index) => (
                <li key={`${step}-${index}`} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--apricot)] text-xs font-semibold text-stone-900">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-stone-500">
              No instructions yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
