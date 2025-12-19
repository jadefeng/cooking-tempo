import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { normalizeMultiline } from "@/app/lib/recipes";
import { recipeInputSchema } from "@/app/lib/validation";
import { redirect } from "next/navigation";
import { SubmitButton } from "./SubmitButton";

export const dynamic = "force-dynamic";

type AiRecipe = {
  title: string;
  prepTime?: string;
  cookTime?: string;
  ingredients: string[];
  instructions: string[];
};

function cleanJson(text: string) {
  const fenced = text.match(/```json([\s\S]*?)```/i);
  if (fenced) return fenced[1];

  const braces = text.match(/\{[\s\S]*\}/);
  if (braces) return braces[0];

  return text;
}

function toText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  return null;
}

function normalizeIngredients(raw: unknown): string[] {
  const result: string[] = [];
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/\r?\n/) : [];

  for (const item of list) {
    if (typeof item === "string") {
      const text = item.trim();
      if (text) result.push(text);
      continue;
    }
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const name =
        toText(obj.ingredient) ??
        toText(obj.item) ??
        toText(obj.name) ??
        toText(obj.text) ??
        toText(obj.description);
      const qty =
        toText(obj.quantity) ??
        toText(obj.qty) ??
        toText(obj.amount) ??
        toText(obj.measure);
      const unit = toText(obj.unit);
      const combined = [qty, unit, name].filter(Boolean).join(" ").trim();
      if (combined) result.push(combined);
    }
  }
  return result;
}

function normalizeInstructions(raw: unknown): string[] {
  const result: string[] = [];
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/\r?\n+/) : [];

  for (const item of list) {
    if (typeof item === "string") {
      const text = item.trim();
      if (text) result.push(text);
      continue;
    }
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const text =
        toText(obj.instruction) ??
        toText(obj.step) ??
        toText(obj.direction) ??
        toText(obj.text) ??
        toText(obj.description) ??
        toText(obj.action);
      if (text) result.push(text);
    }
  }
  return result;
  console.log('using AI');
}

function parseAiResponse(content: string): AiRecipe | null {
  const cleaned = cleanJson(content).trim();
  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const title = toText(parsed.title);
    const ingredients =
      normalizeIngredients(
        parsed.ingredients ?? (parsed as Record<string, unknown>).ingredientList,
      ) || [];
    const instructions =
      normalizeInstructions(
        parsed.instructions ??
          (parsed as Record<string, unknown>).directions ??
          (parsed as Record<string, unknown>).steps,
      ) || [];

    if (title && ingredients.length > 0 && instructions.length > 0) {
      return {
        title,
        prepTime: toText(parsed.prepTime ?? parsed.prep_time) ?? undefined,
        cookTime: toText(parsed.cookTime ?? parsed.cook_time) ?? undefined,
        ingredients,
        instructions,
      };
    }
  } catch {
    // swallow
  }
  return null;
}

async function callOpenAI(prompt: string): Promise<AiRecipe | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY missing; falling back to template.");
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    temperature: 0.6,
    messages: [
      {
        role: "system",
        content:
          "You are ChatGPT, returning ONLY JSON. Keys: title, prepTime, cookTime, ingredients (array of strings with measurements), instructions (array of step strings). Each instruction must include the time it takes (e.g., 'Sear chicken in oil — 6 minutes'). No prose, only JSON.",
      },
      {
        role: "user",
        content: `Generate a complete recipe for the dish name "${prompt}". Include: prep time, cook time, precise ingredients list with measurements, and step-by-step instructions. Each instruction should include the time it takes.`,
      },
    ],
      }),
    });

    console.log("OpenAI response status", response.status);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("OpenAI request failed", response.status, text);
      return null;
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error("OpenAI response missing content", data);
      return null;
    }

    const parsed = parseAiResponse(content);
    return parsed;
  } catch (err) {
    console.error("OpenAI call error", err);
    return null;
  }
}

async function generateDraft(prompt: string) {
  const ai = await callOpenAI(prompt);
  if (ai) {
    const ingredientsText = ai.ingredients.join("\n");
    const instructionsText = ai.instructions.join("\n");
    return {
      title: ai.title,
      ingredientsText,
      instructionsText,
    };
  }

  // Fallback template if AI is unavailable
  const title =
    prompt
      .split(" ")
      .slice(0, 6)
      .join(" ")
      .trim() || "Chef's Special";

  const ingredients = [
    "2 cups chopped veggies",
    "1 tbsp olive oil",
    "Salt and pepper to taste",
  ];
  const instructions = [
    "Prep your ingredients and preheat the pan — 10 minutes.",
    "Cook until tender and well seasoned — 12 minutes.",
    "Plate and serve immediately — 3 minutes.",
  ];

  return {
    title: title[0].toUpperCase() + title.slice(1),
    ingredientsText: ingredients.join("\n"),
    instructionsText: instructions.join("\n"),
  };
}

async function createFromPrompt(formData: FormData) {
  "use server";

  const prompt = (formData.get("prompt") as string | null)?.trim() ?? "";
  if (!prompt) {
    return;
  }

  const draft = await generateDraft(prompt);

  const parsed = recipeInputSchema.safeParse({
    title: draft.title,
    sourceUrl: "",
    ingredientsText: normalizeMultiline(draft.ingredientsText),
    instructionsText: normalizeMultiline(draft.instructionsText),
  });

  if (!parsed.success) {
    return;
  }

  const created = await prisma.recipe.create({
    data: {
      title: parsed.data.title,
      sourceUrl: null,
      ingredientsText: parsed.data.ingredientsText,
      instructionsText: parsed.data.instructionsText,
    },
    select: { id: true },
  });

  revalidatePath("/recipes");
  redirect(`/recipes/${created.id}`);
}

export default function GenerateRecipePage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link className="text-sm font-semibold text-stone-600" href="/recipes">
          ← Back to recipes
        </Link>
        <h2 className="font-display text-2xl text-stone-900">
          Generate a recipe
        </h2>
        <p className="text-sm text-stone-600">
          Describe what you want to make. We will generate a starting recipe—you
          can edit it later in your library.
        </p>
      </div>

      <form
        action={createFromPrompt}
        className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm"
      >
        <label className="flex flex-col gap-2 text-sm font-semibold text-stone-700">
          What do you want to make?
          <textarea
            className="min-h-[160px] rounded-3xl border border-stone-200 bg-white px-4 py-3 text-base"
            name="prompt"
            placeholder="E.g., crispy lemon herb chicken with roasted veggies"
            required
          />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SubmitButton />
          <p className="text-xs text-stone-500">
            This can take a 1-2 minutes to generate, so please be patient. <br></br>
            Powered by ChatGPT. You can edit the result in your recipes list.
          </p>
        </div>
      </form>
    </section>
  );
}
