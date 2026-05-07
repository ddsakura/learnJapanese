import { describe, expect, it } from "vitest";
import {
  buildNakatta,
  conjugateAdjective,
  conjugateVerb,
  inferVerbGroup,
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
  });

  it("handles 行く exception", () => {
    const card = conjugateVerb("行く", "godan");
    expect(card?.ta).toBe("行った");
    expect(card?.te).toBe("行って");
    expect(card?.causative).toBe("行かせる");
  });

  it("conjugates causative forms for ichidan and irregular verbs", () => {
    expect(conjugateVerb("食べる", "ichidan")?.causative).toBe("食べさせる");
    expect(conjugateVerb("勉強する", "irregular")?.causative).toBe(
      "勉強させる",
    );
    expect(conjugateVerb("くる", "irregular")?.causative).toBe("こさせる");
    expect(conjugateVerb("来る", "irregular")?.causative).toBe("来させる");
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
