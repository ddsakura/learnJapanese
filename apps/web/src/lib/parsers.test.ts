import { describe, expect, it } from "vitest";
import {
  exampleMatchesQuestion,
  normalizeTranslation,
  parseChoiceResponse,
  parseExampleResponse,
} from "./parsers";

describe("parsers", () => {
  it("parses example response", () => {
    const raw = "JP: 行った\nReading: いった\nZH: 去了\nGrammar: た形";
    const parsed = parseExampleResponse(raw);
    expect(parsed).toEqual({
      jp: "行った",
      reading: "いった",
      zh: "去了",
      grammar: "た形",
    });
  });

  it("checks that the example matches the required dict and term", () => {
    expect(
      exampleMatchesQuestion(
        {
          jp: "駅でとまろう。",
          reading: "えきでとまろう。",
          zh: "在車站停吧。",
          grammar: "「とまろう」は「とまる」の意向形です。",
        },
        "とまる",
        "とまろう",
      ),
    ).toBe(true);
    expect(
      exampleMatchesQuestion(
        {
          jp: "駅で止まろう。",
          reading: "えきでとまろう。",
          zh: "在車站停吧。",
          grammar: "「止まろう」は「とまる」の意向形です。",
        },
        ["止まる", "とまる"],
        "止まろう",
      ),
    ).toBe(true);
    expect(
      exampleMatchesQuestion(
        {
          jp: "明日、映画館で映画を見ようと決心しました。",
          reading: "あした、えいがかんでえいがをみようとけっしんしました。",
          zh: "我決定明天去電影院看電影。",
          grammar: "「とまろう」は止まる的意向形。",
        },
        "止まる",
        "とまろう",
      ),
    ).toBe(false);
    expect(
      exampleMatchesQuestion(
        {
          jp: "明日、晴れるとおろうから、ピクニックに行きたいです。",
          reading: "あした、はれるとおろうから、ぴくにっくにいきたいです。",
          zh: "因為明天預計是晴天，所以我想去野餐。",
          grammar: "「とおろう」是「晴れる」の意向形です。",
        },
        "とおる",
        "とおろう",
      ),
    ).toBe(false);
  });

  it("normalizes translation labels/quotes", () => {
    expect(normalizeTranslation('zh: "可愛"')).toBe("可愛");
    expect(normalizeTranslation("translation: 很棒")).toBe("很棒");
  });

  it("parses choice response lines", () => {
    const raw = "1. 行って\n- 行いた\n  3) 行った";
    expect(parseChoiceResponse(raw)).toEqual(["行って", "行いた", "行った"]);
  });
});
