import type { AdjectiveScope, QuestionType, VerbScope, Card } from "../types";
import defaultBank from "./bank.json";

export const STORAGE_KEYS = {
  bank: {
    verb: "jlpt-n4-verb-bank",
    adjective: "jlpt-n4-adjective-bank",
  },
  srs: {
    verb: "jlpt-n4-verb-srs",
    adjective: "jlpt-n4-adjective-srs",
  },
  stats: {
    verb: "jlpt-n4-verb-stats",
    adjective: "jlpt-n4-adjective-stats",
  },
  settings: "jlpt-n4-practice-settings",
  wrong: {
    verb: "jlpt-n4-verb-wrong-today",
    adjective: "jlpt-n4-adjective-wrong-today",
  },
  examples: "jlpt-n4-example-cache",
  answerMode: "jlpt-n4-answer-mode",
};

export const DAY_MS = 24 * 60 * 60 * 1000;
export const INCORRECT_DELAY_MS = 2 * 60 * 1000;
export const OLLAMA_ENDPOINT = "http://127.0.0.1:11434/api/generate";
export const DEV_OLLAMA_ENDPOINT = "/ollama/api/generate";
export const DEFAULT_OLLAMA_MODEL = "translategemma:12b";

export const DEFAULT_VERB_BANK: Card[] = defaultBank.verb as Card[];
export const DEFAULT_ADJECTIVE_BANK: Card[] = defaultBank.adjective as Card[];

export const QUESTION_LABELS: Record<Exclude<QuestionType, "mixed">, string> = {
  nai: "ない形",
  ta: "た形",
  nakatta: "なかった形",
  te: "て形",
  potential: "可能形",
};

export const VERB_SCOPE_LABELS: Record<VerbScope, string> = {
  all: "全部",
  godan: "五段",
  ichidan: "二段",
  irregular: "不規則",
};

export const ADJECTIVE_SCOPE_LABELS: Record<AdjectiveScope, string> = {
  all: "全部",
  i: "い形",
  na: "な形",
};

export const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "mixed", label: "混合" },
  { value: "nai", label: "ない形" },
  { value: "ta", label: "た形" },
  { value: "nakatta", label: "なかった形" },
  { value: "te", label: "て形" },
  { value: "potential", label: "可能形" },
];

export const TYPE_KEYS: Exclude<QuestionType, "mixed">[] = [
  "nai",
  "ta",
  "nakatta",
  "te",
  "potential",
];

export const GODAN_RU_EXCEPTIONS = new Set([
  "帰る",
  "走る",
  "入る",
  "切る",
  "知る",
  "要る",
  "喋る",
  "滑る",
  "減る",
  "焦る",
  "限る",
]);

export const NA_ADJECTIVE_I_EXCEPTIONS = new Set(["きれい", "嫌い", "きらい"]);
