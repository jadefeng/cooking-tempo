import Link from "next/link";
import RecipeForm from "@/app/components/RecipeForm";
import { createRecipe } from "@/app/recipes/actions";

export default function NewRecipePage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link className="text-sm font-semibold text-stone-600" href="/recipes">
          ← Back to recipes
        </Link>
        <h2 className="font-display text-2xl text-stone-900">
          Add a new recipe
        </h2>
        <p className="text-sm text-stone-600">
          Save ingredients and steps with your own formatting.
        </p>
      </div>
      <RecipeForm action={createRecipe} submitLabel="Save recipe" />
    </section>
  );
}
