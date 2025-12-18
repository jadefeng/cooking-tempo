"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { RecipeFormState } from "@/app/recipes/actions";

type RecipeFormProps = {
  action: (
    prevState: RecipeFormState,
    formData: FormData,
  ) => Promise<RecipeFormState>;
  initialValues?: {
    title?: string;
    sourceUrl?: string | null;
    ingredientsText?: string;
    instructionsText?: string;
  };
  submitLabel: string;
};

const initialState: RecipeFormState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="w-full rounded-2xl bg-[var(--cocoa)] px-6 py-3 text-base font-semibold text-white shadow-sm transition disabled:opacity-70 sm:w-auto"
      type="submit"
      disabled={pending}
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

export default function RecipeForm({
  action,
  initialValues,
  submitLabel,
}: RecipeFormProps) {
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
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold text-stone-700">
          Title
          <input
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base"
            name="title"
            placeholder="Weeknight Pasta"
            required
            defaultValue={initialValues?.title ?? ""}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold text-stone-700">
          Source URL
          <input
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base"
            name="sourceUrl"
            placeholder="https://example.com/recipe"
            defaultValue={initialValues?.sourceUrl ?? ""}
            type="url"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-semibold text-stone-700">
        Ingredients (one per line)
        <textarea
          className="min-h-[160px] rounded-3xl border border-stone-200 bg-white px-4 py-3 text-base"
          name="ingredientsText"
          placeholder="1 cup olive oil"
          defaultValue={initialValues?.ingredientsText ?? ""}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold text-stone-700">
        Instructions (one step per line)
        <textarea
          className="min-h-[200px] rounded-3xl border border-stone-200 bg-white px-4 py-3 text-base"
          name="instructionsText"
          placeholder="Heat up the oil and toast the spices"
          defaultValue={initialValues?.instructionsText ?? ""}
        />
      </label>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
