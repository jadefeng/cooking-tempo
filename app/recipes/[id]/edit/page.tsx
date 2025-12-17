import Link from "next/link";
import { notFound } from "next/navigation";
import RecipeForm from "@/app/components/RecipeForm";
import { prisma } from "@/app/lib/prisma";
import { updateRecipe } from "@/app/recipes/actions";

type RecipeEditProps = {
  params: Promise<{ id: string }>;
};

export default async function RecipeEditPage({ params }: RecipeEditProps) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
  });

  if (!recipe) {
    notFound();
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link className="text-sm font-semibold text-stone-600" href="/recipes">
          ← Back to recipes
        </Link>
        <h2 className="font-display text-2xl text-stone-900">
          Edit recipe
        </h2>
      </div>
      <RecipeForm
        action={updateRecipe.bind(null, recipe.id)}
        submitLabel="Update recipe"
        initialValues={{
          title: recipe.title,
          sourceUrl: recipe.sourceUrl,
          ingredientsText: recipe.ingredientsText,
          instructionsText: recipe.instructionsText,
        }}
      />
    </section>
  );
}
