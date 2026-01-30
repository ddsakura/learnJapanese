import type { ExampleEntry } from "../types";

export function parseExampleResponse(text: string): ExampleEntry | null {
  const normalized = text.replace(/\\n/g, "\n").trim();
  const getLineValue = (label: string) => {
    const match = normalized.match(new RegExp(`${label}:\\s*([^\\n]+)`, "i"));
    return match ? match[1].trim() : "";
  };
  const getBlockValue = (label: string) => {
    const match = normalized.match(new RegExp(`${label}:\\s*([\\s\\S]+)`, "i"));
    return match ? match[1].trim() : "";
  };
  const jp = getLineValue("JP");
  const readingRaw = getLineValue("Reading");
  const zh = getLineValue("ZH");
  const grammar = getBlockValue("Grammar");

  const reading = readingRaw;

  if (jp && reading && zh && grammar) return { jp, reading, zh, grammar };
  return null;
}

export function normalizeTranslation(raw: string) {
  const normalized = raw.replace(/\\n/g, "\n").trim();
  const firstLine = normalized
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstLine) return null;
  const withoutLabel = firstLine
    .replace(/^zh[:：]\s*/i, "")
    .replace(/^translation[:：]\s*/i, "")
    .trim();
  const withoutQuotes = withoutLabel.replace(/^['"「『](.*)['"」』]$/, "$1");
  return withoutQuotes.trim() || null;
}

export function parseChoiceResponse(text: string) {
  const normalized = text.replace(/\\n/g, "\n").trim();
  if (!normalized) return [];
  return normalized
    .split("\n")
    .map((line) => line.replace(/^[\s*\d.\)\(-]+/, "").trim())
    .filter(Boolean);
}
