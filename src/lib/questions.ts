import type { Card, QuestionType, Scope } from "../types";

export function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function getPool(bank: Card[], scope: Scope) {
  if (scope === "all") return bank;
  return bank.filter((card) => card.group === scope);
}

export function getAnswer(card: Card, type: Exclude<QuestionType, "mixed">) {
  if (type === "potential") return card.potential ?? "";
  return card[type];
}

export function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
