import { describe, expect, it } from "vitest";
import {
  buildNakatta,
  conjugateAdjective,
  conjugateVerb,
  inferVerbGroup,
  normalizeVerbBank,
} from "./conjugation";

describe("conjugation", () => {
  it("infers verb groups", () => {
    expect(inferVerbGroup("食べる")).toBe("ichidan");
    expect(inferVerbGroup("泳ぐ")).toBe("godan");
    expect(inferVerbGroup("する")).toBe("irregular");
    expect(inferVerbGroup("来る")).toBe("irregular");
  });

  it("conjugates godan verbs", () => {
    const card = conjugateVerb("書く", "godan");
    expect(card?.nai).toBe("書かない");
    expect(card?.ta).toBe("書いた");
    expect(card?.te).toBe("書いて");
    expect(card?.potential).toBe("書ける");
    expect(card?.causative).toBe("書かせる");
    expect(card?.volitional).toBe("書こう");
    expect(card?.imperative).toBe("書け");
  });

  it("handles 行く exception", () => {
    const card = conjugateVerb("行く", "godan");
    expect(card?.ta).toBe("行った");
    expect(card?.te).toBe("行って");
    expect(card?.causative).toBe("行かせる");
    expect(card?.volitional).toBe("行こう");
    expect(card?.imperative).toBe("行け");
  });

  it("conjugates causative, volitional, and imperative forms for ichidan and irregular verbs", () => {
    expect(conjugateVerb("食べる", "ichidan")?.causative).toBe("食べさせる");
    expect(conjugateVerb("食べる", "ichidan")?.volitional).toBe("食べよう");
    expect(conjugateVerb("食べる", "ichidan")?.imperative).toBe("食べろ");
    expect(conjugateVerb("勉強する", "irregular")?.causative).toBe(
      "勉強させる",
    );
    expect(conjugateVerb("勉強する", "irregular")?.volitional).toBe(
      "勉強しよう",
    );
    expect(conjugateVerb("勉強する", "irregular")?.imperative).toBe(
      "勉強しろ",
    );
    expect(conjugateVerb("くる", "irregular")?.causative).toBe("こさせる");
    expect(conjugateVerb("くる", "irregular")?.volitional).toBe("こよう");
    expect(conjugateVerb("くる", "irregular")?.imperative).toBe("こい");
    expect(conjugateVerb("ある", "irregular")?.imperative).toBe("あれ");
  });

  it("conjugates 来る with kanji forms", () => {
    const card = conjugateVerb("来る", "irregular");
    expect(card?.nai).toBe("来ない");
    expect(card?.ta).toBe("来た");
    expect(card?.nakatta).toBe("来なかった");
    expect(card?.te).toBe("来て");
    expect(card?.potential).toBe("来られる");
    expect(card?.causative).toBe("来させる");
    expect(card?.volitional).toBe("来よう");
    expect(card?.imperative).toBe("来い");
  });

  it("trims stored optional verb forms when normalizing", () => {
    const [card] = normalizeVerbBank([
      {
        dict: "書く",
        nai: "書かない",
        ta: "書いた",
        nakatta: "書かなかった",
        te: "書いて",
        potential: " 書ける ",
        causative: " 書かせる ",
        volitional: " 書こう ",
        imperative: " 書け ",
        group: "godan",
      },
    ]);
    expect(card.potential).toBe("書ける");
    expect(card.causative).toBe("書かせる");
    expect(card.volitional).toBe("書こう");
    expect(card.imperative).toBe("書け");
  });

  it("fills missing stored optional verb forms when normalizing", () => {
    const [card] = normalizeVerbBank([
      {
        dict: "書く",
        nai: "書かない",
        ta: "書いた",
        nakatta: "書かなかった",
        te: "書いて",
        potential: "書ける",
        causative: "書かせる",
        group: "godan",
      },
    ]);
    expect(card.volitional).toBe("書こう");
    expect(card.imperative).toBe("書け");
  });

  it("conjugates i/na adjectives and いい exception", () => {
    const iAdj = conjugateAdjective("高い", "i");
    expect(iAdj?.nai).toBe("高くない");
    expect(iAdj?.ta).toBe("高かった");

    const good = conjugateAdjective("いい", "i");
    expect(good?.nai).toBe("よくない");
    expect(good?.ta).toBe("よかった");

    const naAdj = conjugateAdjective("便利", "na");
    expect(naAdj?.nai).toBe("便利じゃない");
    expect(naAdj?.te).toBe("便利で");
  });

  it("builds nakatta", () => {
    expect(buildNakatta("話さない")).toBe("話さなかった");
  });
});
