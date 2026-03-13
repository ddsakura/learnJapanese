import { describe, expect, it } from "vitest"
import type { TransitivityCard, TransitivityQuestion } from "../types"
import {
  getTransitivityAnswer,
  getTransitivityChoices,
  makeTransitivityQuestion,
} from "./transitivity"

const bank: TransitivityCard[] = [
  {
    intransitive: "開く",
    transitive: "開ける",
    reading_i: "あく",
    reading_t: "あける",
    group: "pair",
  },
  {
    intransitive: "閉まる",
    transitive: "閉める",
    reading_i: "しまる",
    reading_t: "しめる",
    group: "pair",
  },
  {
    intransitive: "付く",
    transitive: "付ける",
    reading_i: "つく",
    reading_t: "つける",
    group: "pair",
  },
]

describe("transitivity", () => {
  it("returns null when bank is empty", () => {
    expect(makeTransitivityQuestion([], "find-pair")).toBeNull()
  })

  it("creates a question using the requested type", () => {
    const question = makeTransitivityQuestion(bank, "identify")
    expect(question).not.toBeNull()
    expect(question?.type).toBe("identify")
    expect(["intransitive", "transitive"]).toContain(question?.side)
  })

  it("gets identify answers from the shown side", () => {
    const question: TransitivityQuestion = {
      card: bank[0],
      type: "identify",
      side: "intransitive",
    }
    expect(getTransitivityAnswer(question)).toBe("自動詞")
  })

  it("gets find-pair answers from the opposite side", () => {
    const question: TransitivityQuestion = {
      card: bank[0],
      type: "find-pair",
      side: "transitive",
    }
    expect(getTransitivityAnswer(question)).toBe("開く")
  })

  it("returns the fixed identify choices", () => {
    const question: TransitivityQuestion = {
      card: bank[0],
      type: "identify",
      side: "transitive",
    }
    expect(getTransitivityChoices(question, bank)).toEqual(["自動詞", "他動詞"])
  })

  it("includes the correct answer without duplicates for pair questions", () => {
    const question: TransitivityQuestion = {
      card: bank[0],
      type: "find-pair",
      side: "intransitive",
    }
    const choices = getTransitivityChoices(question, bank)
    expect(choices).toContain("開ける")
    expect(new Set(choices).size).toBe(choices.length)
    expect(choices.length).toBeLessThanOrEqual(4)
  })

  it("handles small banks when generating distractors", () => {
    const question: TransitivityQuestion = {
      card: bank[0],
      type: "find-pair",
      side: "intransitive",
    }
    const choices = getTransitivityChoices(question, [bank[0], bank[1]])
    expect(choices).toContain("開ける")
    expect(new Set(choices).size).toBe(choices.length)
    expect(choices.length).toBe(2)
  })
})
