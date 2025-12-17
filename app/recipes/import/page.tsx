import Link from "next/link";
import ImportForm from "@/app/recipes/import/ImportForm";

export default function ImportRecipePage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link className="text-sm font-semibold text-stone-600" href="/recipes">
          ← Back to recipes
        </Link>
        <h2 className="font-display text-2xl text-stone-900">
          Import a recipe
        </h2>
        <p className="text-sm text-stone-600">
          Grab ingredients and steps from a recipe URL, then tweak them before
          saving.
        </p>
      </div>
      <ImportForm />
    </section>
  );
}
