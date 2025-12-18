"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EditIngredientsProps = {
  mealId: string;
  baseItems: string[];
};

export function EditIngredients({ mealId, baseItems }: EditIngredientsProps) {
  const router = useRouter();
  const storageKey = `meal-ingredients-custom-${mealId}`;
  const [items, setItems] = useState<string[]>(baseItems);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setItems(parsed);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  function addItem() {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    setItems((prev) => {
      const rest = prev.filter((item) => item !== trimmed);
      return [trimmed, ...rest];
    });
    setNewItem("");
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function resetToBase() {
    setItems(baseItems);
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  }

  function saveAndClose() {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
    router.push(`/meals/${mealId}/ingredients`);
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-stone-700">
          Add or remove ingredients for this meal
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
            type="button"
            onClick={resetToBase}
          >
            Reset to meal ingredients
          </button>
          <button
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
            type="button"
            onClick={saveAndClose}
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <input
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
          type="text"
          placeholder="E.g., 1 lemon"
          value={newItem}
          onChange={(event) => setNewItem(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addItem();
            }
          }}
        />
        <button
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
          type="button"
          onClick={addItem}
        >
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-stone-500">
          No ingredients yet. Add one to get started.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
            >
              <span>{item}</span>
              <button
                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                type="button"
                onClick={() => removeItem(index)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
