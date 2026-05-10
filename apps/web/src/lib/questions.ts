import type { Card, QuestionType, Scope } from "../types";

const QUESTION_FORM_TYPES: Exclude<QuestionType, "mixed">[] = [
  "nai",
  "ta",
  "nakatta",
  "te",
  "potential",
  "causative",
  "volitional",
  "imperative",
];

export function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function getPool(bank: Card[], scope: Scope) {
  if (scope === "all") return bank;
  return bank.filter((card) => card.group === scope);
}

export function getAnswer(card: Card, type: Exclude<QuestionType, "mixed">) {
  if (type === "potential") return card.potential ?? "";
  if (type === "causative") return card.causative ?? "";
  if (type === "volitional") return card.volitional ?? "";
  if (type === "imperative") return card.imperative ?? "";
  return card[type];
}

export function buildWrongChoiceCandidates(
  card: Card,
  type: Exclude<QuestionType, "mixed">,
  correctAnswer: string,
  modelChoices: string[],
) {
  const localChoices = QUESTION_FORM_TYPES.filter((candidateType) => {
    return candidateType !== type;
  }).map((candidateType) => getAnswer(card, candidateType));
  return Array.from(
    new Set([...modelChoices, ...localChoices].map((choice) => choice.trim())),
  )
    .filter((choice) => choice && choice !== correctAnswer)
    .slice(0, 3);
}

export function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
