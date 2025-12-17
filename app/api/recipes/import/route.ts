import { NextResponse } from "next/server";
import { extractRecipeFromHtml } from "@/app/lib/recipeParser";
import { recipeImportSchema } from "@/app/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = recipeImportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(parsed.data.url, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CookingTempoBot/1.0; +https://example.com)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch the recipe URL." },
        { status: 400 },
      );
    }

    const html = await response.text();
    const extracted = extractRecipeFromHtml(html, parsed.data.url);

    return NextResponse.json({
      title: extracted.title || "Imported Recipe",
      ingredients: extracted.ingredients ?? [],
      instructions: extracted.instructions ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "We couldn't parse that recipe URL yet." },
      { status: 500 },
    );
  }
}
