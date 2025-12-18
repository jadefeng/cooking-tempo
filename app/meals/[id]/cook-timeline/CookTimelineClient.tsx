"use client";

import { useMemo, useState } from "react";
import {
  roundToNearest5,
  type ScheduledStep,
  type TimelineGroup,
} from "@/app/lib/cookTimeline";

type CookTimelineClientProps = {
  mealId: string;
  serveAtIsEstimated: boolean;
  groups: TimelineGroup[];
  steps: ScheduledStep[];
};

function badgeClass(kind: "active" | "passive" | "rest") {
  switch (kind) {
    case "active":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "passive":
      return "bg-sky-100 text-sky-900 border-sky-200";
    case "rest":
      return "bg-emerald-100 text-emerald-900 border-emerald-200";
  }
}

function formatTemp(step: ScheduledStep) {
  if (!step.temperatureValue || !step.temperatureUnit) return null;
  const unitSymbol = step.temperatureUnit === "F" ? "°F" : "°C";
  const value = `${step.temperatureValue}${unitSymbol}`;
  const usesOven = step.equipmentUsed?.some(
    (equipment) => equipment.toLowerCase() === "oven",
  );
  return usesOven ? `Oven: ${value}` : value;
}

export default function CookTimelineClient({
  mealId,
  serveAtIsEstimated,
  groups,
  steps,
}: CookTimelineClientProps) {
  const [startMode, setStartMode] = useState(false);
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const merged = useMemo(() => steps, [steps]);
  const [cursorIndex, setCursorIndex] = useState(0);

  const currentStep = merged[cursorIndex] ?? null;
  const nextStep = merged[cursorIndex + 1] ?? null;
  const totalDuration = useMemo(() => {
    if (!merged.length) return 0;
    const earliest = merged.reduce(
      (min, step) =>
        step.startTime.getTime() < min ? step.startTime.getTime() : min,
      merged[0].startTime.getTime(),
    );
    const latest = merged.reduce(
      (max, step) =>
        step.endTime.getTime() > max ? step.endTime.getTime() : max,
      merged[0].endTime.getTime(),
    );
    const rawMinutes = (latest - earliest) / 60000;
    // round to nearest 5
    return Math.round(rawMinutes / 5) * 5;
  }, [merged]);

  function toggleDone(stepId: string) {
    setDoneMap((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  }

  function markDoneAndAdvance() {
    if (!currentStep) return;
    setDoneMap((prev) => ({ ...prev, [currentStep.id]: true }));
    setCursorIndex((prev) => Math.min(prev + 1, merged.length - 1));
  }

  function goNext() {
    setCursorIndex((prev) => Math.min(prev + 1, merged.length - 1));
  }

  function goBack() {
    setCursorIndex((prev) => Math.max(prev - 1, 0));
  }

  return (
    <div className="flex flex-col gap-5">
      {serveAtIsEstimated ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-semibold">Total cooking time: ~{totalDuration} minutes.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-stone-900">Cook Timeline</h2>
          <p className="text-sm text-stone-600">
            One plan, across{" "}
            {groups.reduce((count, group) => count + group.steps.length, 0)}{" "}
            steps.
          </p>
        </div>
        <button
          className={`rounded-full px-5 py-3 text-sm font-semibold text-white ${
            startMode ? "bg-rose-600" : "bg-emerald-600"
          }`}
          type="button"
          onClick={() => setStartMode((prev) => !prev)}
        >
          {startMode ? "Stop cooking" : "Start cooking"}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          {startMode ? (
            <div className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm">
              {currentStep ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    {currentStep.startOffsetMin} min
                  </p>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-stone-800">
                        {currentStep.recipeTitle}
                      </p>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(
                          currentStep.activeType,
                        )}`}
                      >
                        {currentStep.activeType}
                      </span>
                      {currentStep.isEstimatedDuration ? (
                        <span className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                          Estimated
                        </span>
                      ) : null}
                    </div>
                    <p className="text-lg font-semibold text-stone-900">
                      {currentStep.instruction}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm text-stone-600">
                      <span>{currentStep.durationMin} min</span>
                      <span className="text-stone-300">•</span>
                      <span>{`${currentStep.startOffsetMin} min from start`}</span>
                      {formatTemp(currentStep) ? (
                        <>
                          <span className="text-stone-300">•</span>
                          <span className="font-semibold text-stone-700">
                            {formatTemp(currentStep)}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      className="rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700"
                      type="button"
                      onClick={goBack}
                      disabled={cursorIndex === 0}
                    >
                      Back
                    </button>
                    <button
                      className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800"
                      type="button"
                      onClick={markDoneAndAdvance}
                    >
                      Done
                    </button>
                    {cursorIndex >= merged.length - 1 ? null : (
                      <button
                        className="rounded-2xl bg-[var(--cocoa)] px-5 py-3 text-sm font-semibold text-white"
                        type="button"
                        onClick={goNext}
                      >
                        Next
                      </button>
                    )}
                    {cursorIndex >= merged.length - 1 ? (
                      <span className="text-sm font-semibold text-stone-600">
                        Last step
                      </span>
                    ) : null}
                  </div>
                  {nextStep ? (
                    <div className="mt-4 rounded-3xl border border-stone-200 bg-white px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                        Next
                      </p>
                      <p className="mt-2 text-sm font-semibold text-stone-900">
                        {nextStep.recipeTitle}: {nextStep.instruction}
                      </p>
                      <p className="mt-1 text-xs text-stone-600">
                        {`${nextStep.startOffsetMin} min`} • {nextStep.durationMin} min
                      </p>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-stone-600">No steps yet.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {groups.map((group) => (
                <div key={group.startOffsetMin} className="space-y-3">
                  <div className="sticky top-2 z-10 -mx-1 rounded-2xl bg-[var(--cream)]/90 px-1 py-2 backdrop-blur">
                    <h3 className="font-display text-lg text-stone-900">
                      {group.label}
                    </h3>
                  </div>
                  <div className="grid gap-3">
                    {group.steps.map((step) => (
                      <div
                        key={step.id}
                        className="flex flex-col gap-3 rounded-3xl border border-black/10 bg-white/80 p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-stone-800">
                              {step.recipeTitle}
                            </p>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(
                                step.activeType,
                              )}`}
                            >
                              {step.activeType}
                            </span>
                            {step.isEstimatedDuration ? (
                              <span className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                                Estimated
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-stone-800">
                            {step.instruction}
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs text-stone-600">
                            <span className="font-semibold text-stone-700">
                              {step.durationMin} min
                            </span>
                            {formatTemp(step) ? (
                              <span className="font-semibold text-stone-700">
                                {formatTemp(step)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
                          <input
                            className="h-4 w-4 accent-[var(--cocoa)]"
                            type="checkbox"
                            checked={!!doneMap[step.id]}
                            onChange={() => toggleDone(step.id)}
                          />
                          Done
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-6 rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Next Up
            </p>
            {currentStep ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-stone-900">
                  {currentStep.recipeTitle}
                </p>
                <p className="text-sm text-stone-700">{currentStep.instruction}</p>
                <p className="text-xs text-stone-600">
                  {`${currentStep.startOffsetMin} min`} • {currentStep.durationMin} min
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-stone-600">No steps yet.</p>
            )}
            <div className="mt-5 text-xs text-stone-500">
              Step runner lives on mobile via “Start cooking”.
            </div>
            <div className="mt-5 text-xs text-stone-400">Meal id: {mealId}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
