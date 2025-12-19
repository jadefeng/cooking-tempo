type UnitDefinition = {
  canonical: string;
  aliases: string[];
  plural?: string;
  countable?: boolean;
};

const UNIT_DEFINITIONS: UnitDefinition[] = [
  { canonical: "tsp", aliases: ["teaspoon", "teaspoons", "tsp"], countable: false },
  {
    canonical: "tbsp",
    aliases: ["tablespoon", "tablespoons", "tbsp"],
    countable: false,
  },
  { canonical: "cup", aliases: ["cup", "cups"] },
  { canonical: "oz", aliases: ["ounce", "ounces", "oz"], countable: false },
  { canonical: "lb", aliases: ["pound", "pounds", "lb", "lbs"], countable: false },
  { canonical: "g", aliases: ["gram", "grams", "g"], countable: false },
  { canonical: "kg", aliases: ["kilogram", "kilograms", "kg"], countable: false },
  {
    canonical: "ml",
    aliases: ["milliliter", "milliliters", "ml"],
    countable: false,
  },
  { canonical: "l", aliases: ["liter", "liters", "l"], countable: false },
  { canonical: "pinch", aliases: ["pinch"], plural: "pinches" },
  { canonical: "clove", aliases: ["clove", "cloves"] },
  { canonical: "slice", aliases: ["slice", "slices"] },
  { canonical: "can", aliases: ["can", "cans"] },
  { canonical: "package", aliases: ["package", "packages"] },
  { canonical: "packet", aliases: ["packet", "packets"] },
  { canonical: "stick", aliases: ["stick", "sticks"] },
  { canonical: "dash", aliases: ["dash"], plural: "dashes" },
  { canonical: "head", aliases: ["head", "heads"] },
];

const UNIT_ALIASES = UNIT_DEFINITIONS.flatMap((unit) =>
  unit.aliases.map((alias) => ({ alias, canonical: unit.canonical })),
).sort((a, b) => b.alias.length - a.alias.length);

const QUANTITY_PATTERN =
  "(?:\\d+\\s+\\d+/\\d+|\\d+/\\d+|\\d+(?:\\.\\d+)?|\\d+\\s*-\\s*\\d+)";
const UNITS_PATTERN = UNIT_ALIASES.map((unit) => unit.alias).join("|");
function parseQuantity(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (/\d+\s*-\s*\d+|\d+\s*to\s*\d+/i.test(trimmed)) {
    return { value: null, text: trimmed };
  }
  if (/\d+\s+\d+\/\d+/.test(trimmed)) {
    const [whole, fraction] = trimmed.split(/\s+/);
    const [num, den] = fraction.split("/").map(Number);
    if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0) {
      return { value: Number(whole) + num / den, text: trimmed };
    }
  }
  if (/\d+\/\d+/.test(trimmed)) {
    const [num, den] = trimmed.split("/").map(Number);
    if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0) {
      return { value: num / den, text: trimmed };
    }
  }
  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric)) {
    return { value: numeric, text: trimmed };
  }
  return { value: null, text: trimmed };
}

function formatQuantity(value: number) {
  const rounded = Math.round(value * 100) / 100;
  if (Math.abs(rounded - Math.round(rounded)) < 0.001) {
    return String(Math.round(rounded));
  }
  return String(rounded).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

function formatUnit(unit: string, quantity: number) {
  const def = UNIT_DEFINITIONS.find((item) => item.canonical === unit);
  if (!def) return unit;
  if (def.countable === false) return def.canonical;
  const plural = def.plural ?? `${def.canonical}s`;
  return quantity === 1 ? def.canonical : plural;
}

function parseIngredientLine(line: string) {
  let cleaned = line.trim().replace(/^[-*•]\s*/, "");
  cleaned = cleaned.replace(/\([^)]*\)/g, "").trim();
  let working = cleaned;
  const quantityMatch = working.match(new RegExp(`^\\s*(${QUANTITY_PATTERN})\\b`, "i"));
  const quantityText = quantityMatch?.[1] ?? "";
  const quantity = quantityText ? parseQuantity(quantityText) : null;
  if (quantityText) {
    working = working.slice(quantityText.length).trim();
  }
  let unit: string | null = null;
  if (working) {
    const lower = working.toLowerCase();
    const unitMatch = UNIT_ALIASES.find((item) =>
      new RegExp(`^${item.alias}\\b`, "i").test(lower),
    );
    if (unitMatch) {
      unit = unitMatch.canonical;
      working = working.replace(new RegExp(`^${unitMatch.alias}\\b`, "i"), "").trim();
    }
  }
  working = working.replace(/^of\s+/i, "");
  working = working.replace(/\bto\s+taste\b/i, "").trim();
  cleaned = cleaned.replace(/\bto\s+taste\b/i, "").trim();
  const noComma = working.split(",")[0].trim();
  const label = noComma || working || cleaned || line.trim();
  const key = label.toLowerCase();
  return {
    key,
    label,
    quantityText: quantity?.text ?? null,
    quantityValue: quantity?.value ?? null,
    unit,
  };
}

export function aggregateIngredientLines(lines: string[]) {
  const map = new Map<
    string,
    {
      label: string;
      parts: Map<string, { sum: number; nonNumeric: string[] }>;
      misc: string[];
      hasUnspecified: boolean;
    }
  >();
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const { key, label, quantityText, quantityValue, unit } =
      parseIngredientLine(trimmed);
    const finalKey = key || trimmed.toLowerCase();
    if (!map.has(finalKey)) {
      map.set(finalKey, {
        label: label || trimmed,
        parts: new Map(),
        misc: [],
        hasUnspecified: false,
      });
    }
    const entry = map.get(finalKey);
    if (!entry) return;
    if (!quantityText && !unit) {
      entry.hasUnspecified = true;
      return;
    }
    if (unit) {
      if (!entry.parts.has(unit)) {
        entry.parts.set(unit, { sum: 0, nonNumeric: [] });
      }
      const part = entry.parts.get(unit);
      if (!part) return;
      if (typeof quantityValue === "number") {
        part.sum += quantityValue;
      } else if (quantityText) {
        part.nonNumeric.push(`${quantityText} ${unit}`);
      } else {
        part.nonNumeric.push(unit);
      }
      return;
    }
    if (quantityText) {
      entry.misc.push(quantityText);
    }
  });

  return Array.from(map.values()).map((entry) => {
    const parts: string[] = [];
    entry.parts.forEach((part, unit) => {
      if (part.sum > 0) {
        const quantity = formatQuantity(part.sum);
        parts.push(`${quantity} ${formatUnit(unit, part.sum)}`);
      }
      part.nonNumeric.forEach((item) => parts.push(item));
    });
    entry.misc.forEach((item) => parts.push(item));
    if (entry.hasUnspecified && parts.length > 0) {
      parts.push("as needed");
    }
    if (parts.length === 0) return entry.label;
    if (parts.length === 1 && !entry.hasUnspecified) {
      return `${parts[0]} ${entry.label}`;
    }
    return `${entry.label} (${parts.join(" + ")})`;
  });
}
