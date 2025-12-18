import Link from "next/link";
import MealForm from "@/app/components/MealForm";
import { prisma } from "@/app/lib/prisma";
import { createMeal } from "@/app/meals/actions";

export const dynamic = "force-dynamic";

export default async function NewMealPage() {
  const recipes = await prisma.recipe.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link className="text-sm font-semibold text-stone-600" href="/meals">
          ← Back to meals
        </Link>
        <h2 className="font-display text-2xl text-stone-900">New meal</h2>
        <p className="text-sm text-stone-600">
          Choose recipes to build a meal in minutes.
        </p>
      </div>
      <MealForm action={createMeal} recipes={recipes} />
    </section>
  );
}
