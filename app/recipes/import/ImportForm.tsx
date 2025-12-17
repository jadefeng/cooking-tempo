"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import type { RecipeFormState } from "@/app/recipes/actions";
import { createRecipe } from "@/app/recipes/actions";

type PreviewState = {
  title: string;
  ingredientsText: string;
  instructionsText: string;
};

const initialState: RecipeFormState = {};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="w-full rounded-2xl bg-[var(--cocoa)] px-6 py-3 text-base font-semibold text-white shadow-sm transition disabled:opacity-70 sm:w-auto"
      type="submit"
      disabled={pending}
    >
      {pending ? "Saving..." : "Save recipe"}
    </button>
  );
}

export default function ImportForm() {
  const [state, formAction] = useFormState(createRecipe, initialState);
  const [importUrl, setImportUrl] = useState("");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  async function handleFetch() {
    if (!importUrl) return;
    setIsFetching(true);
    setError(null);
    try {
      const response = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to parse that recipe yet.");
        setIsFetching(false);
        return;
      }
      setPreview({
        title: data.title ?? "",
        ingredientsText: Array.isArray(data.ingredients)
          ? data.ingredients.join("\n")
          : "",
        instructionsText: Array.isArray(data.instructions)
          ? data.instructions.join("\n")
          : "",
      });
    } catch {
      setError("Unable to fetch that recipe. Try a different link.");
    } finally {
      setIsFetching(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm">
        <label className="flex flex-col gap-2 text-sm font-semibold text-stone-700">
          Recipe URL
          <input
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base"
            placeholder="https://example.com/recipe"
            value={importUrl}
            onChange={(event) => setImportUrl(event.target.value)}
          />
        </label>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            className="rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition disabled:opacity-60"
            type="button"
            onClick={handleFetch}
            disabled={!importUrl || isFetching}
          >
            {isFetching ? "Fetching..." : "Fetch & Parse"}
          </button>
          <p className="text-xs text-stone-500">
            We will parse structured data when available, then guess the rest.
          </p>
        </div>
        {error ? (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </div>

      {preview ? (
        <form
          action={formAction}
          className="flex flex-col gap-6 rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm"
        >
          {state.message ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {state.message}
            </p>
          ) : null}
          <input type="hidden" name="sourceUrl" value={importUrl} />
          <label className="flex flex-col gap-2 text-sm font-semibold text-stone-700">
            Title
            <input
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-base"
              name="title"
              required
              value={preview.title}
              onChange={(event) =>
                setPreview({ ...preview, title: event.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-stone-700">
            Ingredients (one per line)
            <textarea
              className="min-h-[160px] rounded-3xl border border-stone-200 bg-white px-4 py-3 text-base"
              name="ingredientsText"
              value={preview.ingredientsText}
              onChange={(event) =>
                setPreview({ ...preview, ingredientsText: event.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-stone-700">
            Instructions (one step per line)
            <textarea
              className="min-h-[200px] rounded-3xl border border-stone-200 bg-white px-4 py-3 text-base"
              name="instructionsText"
              value={preview.instructionsText}
              onChange={(event) =>
                setPreview({ ...preview, instructionsText: event.target.value })
              }
            />
          </label>
          <SaveButton />
        </form>
      ) : (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-600">
          Paste a URL and fetch to preview ingredients and instructions.
        </div>
      )}
    </div>
  );
}
