import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { updateMealTitle } from "@/app/meals/actions";

export const dynamic = "force-dynamic";

type MealEditProps = {
  params: Promise<{ id: string }>;
};

export default async function MealEditPage({ params }: MealEditProps) {
  const { id } = await params;
  const meal = await prisma.meal.findUnique({ where: { id } });

  if (!meal) {
    notFound();
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link className="text-sm font-semibold text-stone-600" href="/meals">
          ← Back to meals
        </Link>
        <h2 className="font-display text-2xl text-stone-900">
          Edit meal name
        </h2>
        <p className="text-sm text-stone-600">
          Update the title and save to return to the meal.
        </p>
      </div>

      <form
        action={updateMealTitle.bind(null, meal.id)}
        className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm"
      >
        <label className="flex flex-col gap-2 text-sm font-semibold text-stone-700">
          Meal title
          <input
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base"
            name="title"
            defaultValue={meal.title}
            required
          />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            className="rounded-2xl bg-[var(--cocoa)] px-5 py-3 text-sm font-semibold text-white"
            type="submit"
          >
            Save name
          </button>
          <Link
            className="rounded-2xl border border-stone-200 bg-white px-5 py-3 text-center text-sm font-semibold text-stone-600"
            href={`/meals/${meal.id}`}
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
