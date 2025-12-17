import Link from "next/link";
import { notFound } from "next/navigation";
import CookTimelineClient from "@/app/meals/[id]/cook-timeline/CookTimelineClient";
import {
  buildCookTimeline,
  type RecipeForTimeline,
} from "@/app/lib/cookTimeline";
import { prisma } from "@/app/lib/prisma";
import { splitLines } from "@/app/lib/recipes";

type CookTimelinePageProps = {
  params: Promise<{ id: string }>;
};

function parseDurationMin(text: string) {
  const lower = text.toLowerCase();
  const hourMatch = lower.match(/(\d+)\s*(hours|hour|hr)\b/);
  if (hourMatch) return Number(hourMatch[1]) * 60;
  const minMatch = lower.match(/(\d+)\s*(minutes|minute|min)\b/);
  if (minMatch) return Number(minMatch[1]);
  return null;
}

function parseTemperature(text: string) {
  const match = text.match(/(\d{2,4})\s*°?\s*([FC])\b/i);
  if (!match) return { value: null, unit: null };
  return { value: Number(match[1]), unit: match[2].toUpperCase() as "F" | "C" };
}

function detectEquipment(text: string) {
  const lower = text.toLowerCase();
  const equipment: string[] = [];
  if (/\boven\b/.test(lower)) equipment.push("oven");
  if (/\bskillet\b|\bpan\b/.test(lower)) equipment.push("pan");
  if (/\bpot\b|\bboil\b|\bsimmer\b/.test(lower)) equipment.push("stove");
  if (/\bgrill\b/.test(lower)) equipment.push("grill");
  return equipment.length ? equipment : null;
}

function detectActiveType(text: string) {
  const lower = text.toLowerCase();
  if (/\brest\b|\blet sit\b/.test(lower)) return "rest" as const;
  if (
    /\bbake\b|\broast\b|\bsimmer\b|\bboil\b|\bbring to a boil\b|\bpreheat\b/.test(
      lower,
    )
  ) {
    return "passive" as const;
  }
  return "active" as const;
}

function toTimelineRecipes(
  dbRecipes: { id: string; title: string; instructionsText: string }[],
): RecipeForTimeline[] {
  return dbRecipes.map((recipe) => {
    const steps = splitLines(recipe.instructionsText).map(
      (instruction, index) => {
      const durationMin = parseDurationMin(instruction);
      const activeType = detectActiveType(instruction);
      const equipmentUsed = detectEquipment(instruction);
      const temperature = parseTemperature(instruction);

      return {
        id: `${recipe.id}-step-${index + 1}`,
        order: index + 1,
        instruction,
        durationMin,
        activeType,
        canPause: activeType !== "active",
        equipmentUsed,
        temperatureValue: temperature.value,
        temperatureUnit: temperature.unit,
      };
    },
    );

    return {
      id: recipe.id,
      title: recipe.title,
      steps: steps.length
        ? steps
        : [
            {
              id: `${recipe.id}-step-1`,
              order: 1,
              instruction: "Cook and serve.",
              durationMin: null,
              activeType: "active" as const,
              canPause: false,
              equipmentUsed: null,
              temperatureValue: null,
              temperatureUnit: null,
            },
          ],
    };
  });
}

export default async function CookTimelinePage({ params }: CookTimelinePageProps) {
  const { id } = await params;

  const meal = await prisma.meal.findUnique({
    where: { id },
    include: {
      recipes: {
        include: {
          recipe: true,
        },
      },
    },
  });

  if (!meal) {
    notFound();
  }

  const recipes = meal.recipes.map((item) => ({
    id: item.recipe.id,
    title: item.recipe.title,
    instructionsText: item.recipe.instructionsText,
  }));

  const timeline = buildCookTimeline({
    meal: { id: meal.id, title: meal.title, serveAt: null },
    recipes: toTimelineRecipes(recipes),
  });

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          className="text-sm font-semibold text-stone-600"
          href={`/meals/${meal.id}`}
        >
          ← Back to meal
        </Link>
      </div>
      <CookTimelineClient
        mealId={meal.id}
        serveAtIsEstimated={timeline.serveAtIsEstimated}
        groups={timeline.groups}
        steps={timeline.steps}
      />
    </section>
  );
}
