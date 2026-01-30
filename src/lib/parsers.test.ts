import { describe, expect, it } from "vitest";
import {
  normalizeTranslation,
  parseChoiceResponse,
  parseExampleResponse,
} from "./parsers";

describe("parsers", () => {
  it("parses example response", () => {
    const raw =
      "JP: 行った\nReading: いった\nZH: 去了\nGrammar: た形";
    const parsed = parseExampleResponse(raw);
    expect(parsed).toEqual({
      jp: "行った",
      reading: "いった",
      zh: "去了",
      grammar: "た形",
    });
  });

  it("normalizes translation labels/quotes", () => {
    expect(normalizeTranslation("zh: \"可愛\""))
      .toBe("可愛");
    expect(normalizeTranslation("translation: 很棒"))
      .toBe("很棒");
  });

  it("parses choice response lines", () => {
    const raw = "1. 行って\n- 行いた\n  3) 行った";
    expect(parseChoiceResponse(raw)).toEqual(["行って", "行いた", "行った"]);
  });
});
