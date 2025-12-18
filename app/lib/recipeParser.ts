import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

type ParsedRecipe = {
  title: string;
  ingredients: string[];
  instructions: string[];
};

type CaptionLine = {
  text: string;
  hadBullet: boolean;
};

function decodeEntities(value?: string) {
  if (!value) return "";
  const wrapped = `<span>${value}</span>`;
  const $ = cheerio.load(wrapped);
  return $("span").text();
}

function normalizeArray(values: string[]) {
  return values
    .map((value) => decodeEntities(value).trim())
    .filter(Boolean);
}

function normalizeText(value?: string) {
  const decoded = decodeEntities(value);
  return decoded.replace(/\s+/g, " ").trim() ?? "";
}

function normalizeCaption(value?: string) {
  if (!value) return "";
  return decodeEntities(value).replace(/\r/g, "").replace(/\\n/g, "\n").trim();
}

function extractRecipeNodes(json: unknown): Record<string, unknown>[] {
  if (!json) return [];
  if (Array.isArray(json)) {
    return json.flatMap(extractRecipeNodes);
  }
  if (typeof json !== "object") return [];

  const record = json as Record<string, unknown>;
  const type = record["@type"];
  const types = Array.isArray(type) ? type : type ? [type] : [];
  const isRecipe = types.some((value) =>
    value.toString().toLowerCase().includes("recipe"),
  );

  const nested: Record<string, unknown>[] = [];
  if (record["@graph"]) {
    nested.push(...extractRecipeNodes(record["@graph"]));
  }

  return isRecipe ? [record, ...nested] : nested;
}

function collectInstructionText(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.flatMap(collectInstructionText);
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record.text) return [String(record.text)];
    if (record.name) return [String(record.name)];
    if (record.itemListElement) {
      return collectInstructionText(record.itemListElement);
    }
  }
  return [];
}

function extractCaptionFromMeta(value: string) {
  const lower = value.toLowerCase();
  const marker = "on instagram:";
  const index = lower.lastIndexOf(marker);
  if (index >= 0) {
    const after = value.slice(index + marker.length).trim();
    return after.replace(/^[“"]|[”"]$/g, "").trim();
  }
  return value.trim();
}

function toCaptionLines(caption: string): CaptionLine[] {
  return caption
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const hadBullet = /^[•\-*]/.test(line);
      const cleaned = line.replace(/^[•\-*\u2022]+\s*/, "").trim();
      return { text: cleaned, hadBullet };
    })
    .filter((line) => line.text.length > 0);
}

function parseCaption(caption: string) {
  const lines = toCaptionLines(caption);
  const onlyText = lines.map((line) => line.text);

  const ingredientIndex = onlyText.findIndex((line) =>
    /^ingredients?\b[:\-]?/i.test(line),
  );
  const instructionIndex = onlyText.findIndex((line) =>
    /^(instructions?|directions?|method|steps)\b[:\-]?/i.test(line),
  );

  let ingredients: string[] = [];
  let instructions: string[] = [];

  if (ingredientIndex >= 0) {
    const endIndex =
      instructionIndex > ingredientIndex ? instructionIndex : undefined;
    ingredients = onlyText
      .slice(ingredientIndex + 1, endIndex)
      .filter(Boolean);
  }

  if (instructionIndex >= 0) {
    instructions = onlyText.slice(instructionIndex + 1).filter(Boolean);
  }

  if (!ingredients.length && !instructions.length) {
    const bulletLines = lines.filter((line) => line.hadBullet);
    if (bulletLines.length >= 2) {
      ingredients = bulletLines.map((line) => line.text);
    } else {
      instructions = onlyText;
    }
  }

  return {
    ingredients: normalizeArray(ingredients),
    instructions: normalizeArray(instructions),
  };
}

function extractFromJsonLd(html: string): ParsedRecipe | null {
  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).contents().text())
    .get();

  for (const script of scripts) {
    try {
      const json = JSON.parse(script);
      const recipes = extractRecipeNodes(json);
      for (const recipe of recipes) {
        const title = normalizeText(recipe.name as string);
        const ingredients = normalizeArray(
          Array.isArray(recipe.recipeIngredient)
            ? (recipe.recipeIngredient as string[])
            : [],
        );
        const instructions = normalizeArray(
          collectInstructionText(recipe.recipeInstructions),
        );

        if (title || ingredients.length || instructions.length) {
          return { title, ingredients, instructions };
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

function extractFromInstagram(html: string): ParsedRecipe | null {
  const $ = cheerio.load(html);
  const ogTitle = normalizeText($('meta[property="og:title"]').attr("content"));
  const ogDescription = normalizeCaption(
    $('meta[property="og:description"]').attr("content"),
  );
  const metaDescription = normalizeCaption(
    $('meta[name="description"]').attr("content"),
  );

  const captionRaw = ogDescription || metaDescription;
  if (!captionRaw) return null;

  const caption = extractCaptionFromMeta(captionRaw);
  const lines = caption.split("\n").filter(Boolean);
  const fallbackTitle = lines[0] ?? "";
  const title =
    ogTitle && !/instagram/i.test(ogTitle)
      ? ogTitle
      : normalizeText(fallbackTitle);

  const { ingredients, instructions } = parseCaption(caption);

  return { title, ingredients, instructions };
}

function collectSectionLines($: cheerio.CheerioAPI, heading: AnyNode) {
  const lines: string[] = [];
  let cursor = $(heading).next();

  while (cursor.length) {
    if (cursor.is("h1, h2, h3, h4")) break;
    if (cursor.is("ul, ol")) {
      cursor.find("li").each((_, li) => {
        const text = normalizeText($(li).text());
        if (text) lines.push(text);
      });
    } else if (cursor.is("p")) {
      const text = normalizeText(cursor.text());
      if (text) lines.push(text);
    }
    cursor = cursor.next();
  }

  return lines;
}

function extractFromHeuristics(html: string): ParsedRecipe {
  const $ = cheerio.load(html);
  const title =
    normalizeText($('meta[property="og:title"]').attr("content")) ||
    normalizeText($("title").text());

  let ingredients: string[] = [];
  let instructions: string[] = [];

  $("h1, h2, h3, h4").each((_, el) => {
    const heading = normalizeText($(el).text()).toLowerCase();
    if (!ingredients.length && heading.includes("ingredient")) {
      ingredients = collectSectionLines($, el);
    }
    if (
      !instructions.length &&
      (heading.includes("instruction") || heading.includes("direction"))
    ) {
      instructions = collectSectionLines($, el);
    }
  });

  return {
    title,
    ingredients: normalizeArray(ingredients),
    instructions: normalizeArray(instructions),
  };
}

export function extractRecipeFromHtml(
  html: string,
  url?: string,
): ParsedRecipe {
  if (url?.includes("instagram.com")) {
    const instagram = extractFromInstagram(html);
    if (instagram) return instagram;
  }
  const jsonLd = extractFromJsonLd(html);
  if (jsonLd) return jsonLd;
  return extractFromHeuristics(html);
}
