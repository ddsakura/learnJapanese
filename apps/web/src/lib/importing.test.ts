import { describe, expect, it } from "vitest";
import { mergeBank, normalizeImport, pruneSrs, validateBank } from "./importing";
import type { Card, SrsState } from "../types";

describe("importing", () => {
  it("normalizes verb strings", () => {
    const result = normalizeImport(["書く"], "verb");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bank[0].dict).toBe("書く");
    expect(result.bank[0].nai).toBe("書かない");
    expect(result.bank[0].causative).toBe("書かせる");
    expect(result.bank[0].volitional).toBe("書こう");
  });

  it("normalizes adjective objects with overrides", () => {
    const result = normalizeImport(
      [{ dict: "静か", group: "na", nai: "静かじゃない" }],
      "adjective",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bank[0].nai).toBe("静かじゃない");
  });

  it("accepts verb banks without stored causative or volitional", () => {
    expect(
      validateBank(
        [
          {
            dict: "書く",
            nai: "書かない",
            ta: "書いた",
            nakatta: "書かなかった",
            te: "書いて",
            potential: "書ける",
            group: "godan",
          },
        ],
        "verb",
      ),
    ).toBe(true);
  });

  it("fills volitional when importing older complete verb objects", () => {
    const result = normalizeImport(
      [
        {
          dict: "書く",
          nai: "書かない",
          ta: "書いた",
          nakatta: "書かなかった",
          te: "書いて",
          potential: "書ける",
          group: "godan",
        },
      ],
      "verb",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bank[0].volitional).toBe("書こう");
  });

  it("trims complete verb objects before validating and backfilling", () => {
    const result = normalizeImport(
      [
        {
          dict: " 書く ",
          nai: " 書かない ",
          ta: " 書いた ",
          nakatta: " 書かなかった ",
          te: " 書いて ",
          potential: " 書ける ",
          group: " godan ",
        },
      ],
      "verb",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bank[0]).toMatchObject({
      dict: "書く",
      nai: "書かない",
      ta: "書いた",
      nakatta: "書かなかった",
      te: "書いて",
      potential: "書ける",
      volitional: "書こう",
      group: "godan",
    });
  });

  it("mergeBank keeps existing zh if incoming missing", () => {
    const existing: Card[] = [
      {
        dict: "書く",
        nai: "書かない",
        ta: "書いた",
        nakatta: "書かなかった",
        te: "書いて",
        potential: "書ける",
        causative: "書かせる",
        group: "godan",
        zh: "寫",
      },
    ];
    const incoming: Card[] = [
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
    ];
    const merged = mergeBank(existing, incoming);
    expect(merged[0].zh).toBe("寫");
  });

  it("pruneSrs removes missing cards", () => {
    const srs: Record<string, SrsState> = {
      書く: { intervalDays: 1, due: 1 },
      消す: { intervalDays: 1, due: 1 },
    };
    const bank: Card[] = [
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
    ];
    const next = pruneSrs(srs, bank);
    expect(Object.keys(next)).toEqual(["書く"]);
  });
});
