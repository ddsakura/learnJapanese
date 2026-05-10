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
  const jp = stripMarkdownEmphasis(getLineValue("JP"));
  const readingRaw = stripMarkdownEmphasis(getLineValue("Reading"));
  const zh = stripMarkdownEmphasis(getLineValue("ZH"));
  const grammar = stripMarkdownEmphasis(getBlockValue("Grammar"));

  if (jp && readingRaw && zh && grammar)
    return { jp, reading: readingRaw, zh, grammar };
  return null;
}

export function sanitizeExampleEntry(entry: ExampleEntry): ExampleEntry {
  return {
    jp: stripMarkdownEmphasis(entry.jp),
    reading: stripMarkdownEmphasis(entry.reading),
    zh: stripMarkdownEmphasis(entry.zh),
    grammar: stripMarkdownEmphasis(entry.grammar),
  };
}

export function stripMarkdownEmphasis(value: string) {
  return value
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/[`*_]/g, "")
    .trim();
}

export function exampleMatchesQuestion(
  entry: ExampleEntry,
  dict: string | string[],
  term: string,
) {
  const normalizedJp = normalizeForTermCheck(entry.jp);
  const normalizedGrammar = normalizeForTermCheck(entry.grammar);
  const normalizedDicts = (Array.isArray(dict) ? dict : [dict])
    .map(normalizeForTermCheck)
    .filter(Boolean);
  const normalizedTerm = normalizeForTermCheck(term);
  return Boolean(
    normalizedDicts.length > 0 &&
      normalizedTerm &&
      normalizedJp.includes(normalizedTerm) &&
      normalizedDicts.some((normalizedDict) =>
        normalizedGrammar.includes(normalizedDict),
      ) &&
      normalizedGrammar.includes(normalizedTerm),
  );
}

function normalizeForTermCheck(value: string) {
  return stripMarkdownEmphasis(value).replace(/[\s\u3000「」『』"'`]/g, "").trim();
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
    .map((line) => line.replace(/^[\s*\d.()-]+/, "").trim())
    .filter(Boolean);
}
