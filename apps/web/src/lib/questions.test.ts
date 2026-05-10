import { describe, expect, it } from "vitest";
import {
  buildWrongChoiceCandidates,
  getAnswer,
  getPool,
  shuffle,
} from "./questions";
import type { Card } from "../types";

describe("questions", () => {
  const cards: Card[] = [
    {
      dict: "書く",
      nai: "書かない",
      ta: "書いた",
      nakatta: "書かなかった",
      te: "書いて",
      potential: "書ける",
      causative: "書かせる",
      volitional: "書こう",
      imperative: "書け",
      group: "godan",
    },
    {
      dict: "食べる",
      nai: "食べない",
      ta: "食べた",
      nakatta: "食べなかった",
      te: "食べて",
      potential: "食べられる",
      causative: "食べさせる",
      volitional: "食べよう",
      imperative: "食べろ",
      group: "ichidan",
    },
  ];

  it("gets answer for potential", () => {
    expect(getAnswer(cards[0], "potential")).toBe("書ける");
  });

  it("gets answer for causative", () => {
    expect(getAnswer(cards[0], "causative")).toBe("書かせる");
  });

  it("gets answer for volitional", () => {
    expect(getAnswer(cards[0], "volitional")).toBe("書こう");
  });

  it("gets answer for imperative", () => {
    expect(getAnswer(cards[0], "imperative")).toBe("書け");
  });

  it("fills short or duplicate model choices from local card forms", () => {
    expect(
      buildWrongChoiceCandidates(cards[0], "causative", "書かせる", [
        "書かれた",
        "書かれた",
        "書いて",
      ]),
    ).toEqual(["書かれた", "書いて", "書かない"]);
  });

  it("filters pool by scope", () => {
    expect(getPool(cards, "godan")).toHaveLength(1);
    expect(getPool(cards, "all")).toHaveLength(2);
  });

  it("shuffles without losing items", () => {
    const base = [1, 2, 3, 4];
    const result = shuffle(base);
    expect(result).toHaveLength(4);
    expect([...result].sort()).toEqual([1, 2, 3, 4]);
  });
});
