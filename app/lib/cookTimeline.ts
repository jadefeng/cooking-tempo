export type ActiveType = "active" | "passive" | "rest";

export type MealForTimeline = {
  id: string;
  title: string;
  serveAt: Date | null;
};

export type StepForTimeline = {
  id: string;
  order: number;
  instruction: string;
  durationMin: number | null;
  activeType: ActiveType;
  canPause: boolean;
  equipmentUsed: string[] | null;
  temperatureValue: number | null;
  temperatureUnit: "F" | "C" | null;
};

export type RecipeForTimeline = {
  id: string;
  title: string;
  steps: StepForTimeline[];
};

export type TimelineInput = {
  meal: MealForTimeline;
  recipes: RecipeForTimeline[];
  now?: Date;
};

export type ScheduledStep = {
  id: string;
  recipeId: string;
  recipeTitle: string;
  stepId: string;
  order: number;
  instruction: string;
  activeType: ActiveType;
  canPause: boolean;
  equipmentUsed: string[] | null;
  temperatureValue: number | null;
  temperatureUnit: "F" | "C" | null;
  durationMin: number;
  isEstimatedDuration: boolean;
  startTime: Date;
  endTime: Date;
  tMinusMin: number;
  startOffsetMin: number;
};

export type TimelineGroup = {
  startOffsetMin: number;
  label: string;
  steps: ScheduledStep[];
};

export type TimelineResult = {
  serveAt: Date;
  serveAtIsEstimated: boolean;
  estimatedServeAtReason: "unset";
  estimatedServeInMin: number | null;
  steps: ScheduledStep[];
  groups: TimelineGroup[];
};

export function defaultDurationMin(activeType: ActiveType) {
  switch (activeType) {
    case "active":
      return 2;
    case "passive":
      return 5;
    case "rest":
      return 5;
  }
}

export function roundToNearest5(valueMin: number) {
  return Math.round(valueMin / 5) * 5;
}

function minutesBetween(earlier: Date, later: Date) {
  return (later.getTime() - earlier.getTime()) / 60000;
}

function addMinutes(date: Date, deltaMin: number) {
  return new Date(date.getTime() + deltaMin * 60000);
}

export function buildCookTimeline(input: TimelineInput): TimelineResult {
  const now = input.now ?? new Date();
  const serveAtIsEstimated = input.meal.serveAt == null;

  const estimatedServeInMin = input.meal.serveAt == null ? 90 : null;
  const serveAt = input.meal.serveAt ?? addMinutes(now, 90);

  const scheduled: ScheduledStep[] = [];

  for (const recipe of input.recipes) {
    const steps = [...recipe.steps].sort((a, b) => a.order - b.order);
    let cursor = serveAt;

    for (const step of [...steps].reverse()) {
      const durationMin =
        step.durationMin ?? defaultDurationMin(step.activeType);
      const isEstimatedDuration = step.durationMin == null;
      const startTime = addMinutes(cursor, -durationMin);
      const endTime = cursor;
      const rawTMinus = minutesBetween(startTime, serveAt);
      const tMinusMin = Math.max(0, roundToNearest5(rawTMinus));

      scheduled.push({
        id: `${recipe.id}:${step.id}`,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        stepId: step.id,
        order: step.order,
        instruction: step.instruction,
        activeType: step.activeType,
        canPause: step.canPause,
        equipmentUsed: step.equipmentUsed,
        temperatureValue: step.temperatureValue,
        temperatureUnit: step.temperatureUnit,
        durationMin,
        isEstimatedDuration,
        startTime,
        endTime,
        tMinusMin,
        startOffsetMin: 0,
      });

      cursor = startTime;
    }
  }

  scheduled.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const startBaseline = scheduled[0]?.startTime ?? serveAt;
  const scheduledWithOffsets = scheduled.map((step) => {
    const offset = minutesBetween(startBaseline, step.startTime);
    const startOffsetMin = Math.max(0, roundToNearest5(offset));
    return { ...step, startOffsetMin };
  });

  const groupMap = new Map<number, ScheduledStep[]>();
  for (const step of scheduledWithOffsets) {
    const list = groupMap.get(step.startOffsetMin) ?? [];
    list.push(step);
    groupMap.set(step.startOffsetMin, list);
  }

  const groups: TimelineGroup[] = Array.from(groupMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([startOffsetMin, steps]) => ({
      startOffsetMin,
      label: `${startOffsetMin} min`,
      steps: steps.sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    }));

  return {
    serveAt,
    serveAtIsEstimated,
    estimatedServeAtReason: "unset",
    estimatedServeInMin,
    steps: scheduled,
    groups,
  };
}
