"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ChecklistProps = {
  items: string[];
  mealId: string;
};

export default function Checklist({ items, mealId }: ChecklistProps) {
  const storageKey = `meal-checklist-${mealId}`;
  const customKey = `meal-ingredients-custom-${mealId}`;
  const [customItems, setCustomItems] = useState<string[] | null>(null);

  const sorted = useMemo(() => {
    const source = (customItems ?? items).filter(Boolean);
    return Array.from(new Set(source)).sort((a, b) => a.localeCompare(b));
  }, [customItems, items]);

  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return {};
      const saved = JSON.parse(raw) as Record<string, boolean>;
      return saved;
    } catch {
      return {};
    }
  });
  const router = useRouter();

  // Hydrate from localStorage when the meal or items change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const customRaw = localStorage.getItem(customKey);
      if (customRaw) {
        const parsed = JSON.parse(customRaw) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomItems(parsed);
        }
      } else {
        setCustomItems(null);
      }

      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<string, boolean>;
      const filtered: Record<string, boolean> = {};
      sorted.forEach((item) => {
        if (saved[item] !== undefined) {
          filtered[item] = saved[item];
        }
      });
      setChecked(filtered);
    } catch {
      setChecked({});
    }
    // only when ingredients change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, sorted.join("|")]);

  // Persist to localStorage whenever the checklist changes.
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(checked));
    }
  }, [checked, storageKey]);

  function toggle(item: string) {
    setChecked((prev) => ({ ...prev, [item]: !prev[item] }));
  }

  function reset() {
    setChecked({});
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  }

  function save() {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(checked));
    }
    router.push(`/meals/${mealId}`);
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-semibold text-stone-700">
          Check items you need to buy
        </p>
        <button
          className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
          type="button"
          onClick={save}
        >
          Save
        </button>
        <button
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
          type="button"
          onClick={reset}
        >
          Reset
        </button>
        <Link
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
          href={`/meals/${mealId}/ingredients/edit`}
        >
          Edit ingredients
        </Link>
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm text-stone-500">
          No ingredients found for this meal.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {sorted.map((item) => (
            <li key={item}>
              <label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
                <input
                  className="mt-1 h-4 w-4 accent-[var(--cocoa)]"
                  type="checkbox"
                  checked={!!checked[item]}
                  onChange={() => toggle(item)}
                />
                <span className={checked[item] ? "line-through text-stone-400" : ""}>
                  {item}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
