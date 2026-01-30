import { describe, expect, it } from "vitest";
import { getAnswer, getPool, shuffle } from "./questions";
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
      group: "godan",
    },
    {
      dict: "食べる",
      nai: "食べない",
      ta: "食べた",
      nakatta: "食べなかった",
      te: "食べて",
      potential: "食べられる",
      group: "ichidan",
    },
  ];

  it("gets answer for potential", () => {
    expect(getAnswer(cards[0], "potential")).toBe("書ける");
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
