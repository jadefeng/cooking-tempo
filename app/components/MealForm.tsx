"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { MealFormState } from "@/app/meals/actions";

type MealFormProps = {
  action: (
    prevState: MealFormState,
    formData: FormData,
  ) => Promise<MealFormState>;
  recipes: { id: string; title: string }[];
};

const initialState: MealFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="w-full rounded-2xl bg-[var(--cocoa)] px-6 py-3 text-base font-semibold text-white shadow-sm transition disabled:opacity-70 sm:w-auto"
      type="submit"
      disabled={pending}
    >
      {pending ? "Creating..." : "Create meal"}
    </button>
  );
}

export default function MealForm({ action, recipes }: MealFormProps) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-6 rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm"
    >
      {state.message ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {state.message}
        </p>
      ) : null}
      <label className="flex flex-col gap-2 text-sm font-semibold text-stone-700">
        Meal title
        <input
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base"
          name="title"
          placeholder="Friday Night Feast"
          required
        />
      </label>
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-stone-700">
          Select recipes
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {recipes.length === 0 ? (
            <p className="text-sm text-stone-500">
              Save some recipes first to build a meal.
            </p>
          ) : (
            recipes.map((recipe) => (
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
                {recipe.title}
              </label>
            ))
          )}
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}
