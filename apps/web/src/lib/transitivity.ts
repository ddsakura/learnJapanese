import type {
  TransitivityCard,
  TransitivityQuestion,
  TransitivityQuestionType,
} from "../types";
import { pickRandom, shuffle } from "./questions";

export function makeTransitivityQuestion(
  bank: TransitivityCard[],
  type: TransitivityQuestionType,
): TransitivityQuestion | null {
  if (bank.length === 0) return null;
  const card = pickRandom(bank);
  const side = pickRandom(["intransitive", "transitive"] as const);
  return { card, type, side };
}

export function getTransitivityAnswer(question: TransitivityQuestion): string {
  if (question.type === "identify") {
    return question.side === "intransitive" ? "自動詞" : "他動詞";
  }
  // find-pair: return the opposite side
  return question.side === "intransitive"
    ? question.card.transitive
    : question.card.intransitive;
}

export function getTransitivityChoices(
  question: TransitivityQuestion,
  bank: TransitivityCard[],
): string[] {
  if (question.type === "identify") {
    return ["自動詞", "他動詞"];
  }
  // find-pair: correct answer + 3 distractors from other cards (same polarity/side as answer)
  const correct = getTransitivityAnswer(question);
  const answerSide =
    question.side === "intransitive" ? "transitive" : "intransitive";
  const distractors = bank
    .filter((c) => c !== question.card)
    .map((c) => c[answerSide])
    .filter((v): v is string => Boolean(v) && v !== correct);
  const wrong = shuffle(distractors).slice(0, 3);
  return shuffle([correct, ...wrong]);
}
