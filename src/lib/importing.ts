import type { Card, PracticeKind, SrsState } from "../types";
import {
  conjugateAdjective,
  conjugateVerb,
  inferAdjectiveGroup,
  inferVerbGroup,
} from "./conjugation";

export function validateBank(
  data: unknown,
  practice: PracticeKind,
): data is Card[] {
  if (!Array.isArray(data)) return false;
  return data.every((item) => {
    if (typeof item !== "object" || item === null) return false;
    const record = item as Record<string, unknown>;
    const requiredKeys =
      practice === "verb"
        ? ["dict", "nai", "ta", "nakatta", "te", "potential", "group"]
        : ["dict", "nai", "ta", "nakatta", "te", "group"];
    if (!requiredKeys.every((key) => typeof record[key] === "string"))
      return false;
    const group = record.group as string;
    if (practice === "verb") {
      return group === "godan" || group === "ichidan" || group === "irregular";
    }
    return group === "i" || group === "na";
  });
}

export function normalizeImport(
  data: unknown,
  practice: PracticeKind,
): { ok: true; bank: Card[] } | { ok: false; error: string } {
  if (!Array.isArray(data)) {
    return { ok: false, error: "JSON 必須為陣列。" };
  }

  const bank: Card[] = [];
  for (const item of data) {
    if (typeof item === "string") {
      const dict = item.trim();
      if (!dict) return { ok: false, error: "存在空的項目。" };
      if (practice === "verb") {
        const group = inferVerbGroup(dict);
        const generated = conjugateVerb(dict, group);
        if (!generated) return { ok: false, error: `無法推導：${dict}` };
        bank.push(generated);
        continue;
      }
      const group = inferAdjectiveGroup(dict);
      const generated = conjugateAdjective(dict, group);
      if (!generated) return { ok: false, error: `無法推導：${dict}` };
      bank.push(generated);
      continue;
    }

    if (typeof item !== "object" || item === null) {
      return { ok: false, error: "題庫項目格式錯誤。" };
    }

    const record = item as Record<string, unknown>;
    const dict = typeof record.dict === "string" ? record.dict.trim() : "";
    if (!dict) return { ok: false, error: "每筆資料需包含 dict。" };
    if (practice === "verb") {
      const groupValue =
        typeof record.group === "string" ? record.group : undefined;
      const group =
        groupValue === "godan" ||
        groupValue === "ichidan" ||
        groupValue === "irregular"
          ? groupValue
          : inferVerbGroup(dict);

      if (validateBank([record as Card], practice)) {
        bank.push(record as Card);
        continue;
      }

      const generated = conjugateVerb(dict, group);
      if (!generated) return { ok: false, error: `無法推導：${dict}` };
      const overrides: Partial<Card> = {};
      if (typeof record.nai === "string" && record.nai.trim())
        overrides.nai = record.nai.trim();
      if (typeof record.ta === "string" && record.ta.trim())
        overrides.ta = record.ta.trim();
      if (typeof record.nakatta === "string" && record.nakatta.trim())
        overrides.nakatta = record.nakatta.trim();
      if (typeof record.te === "string" && record.te.trim())
        overrides.te = record.te.trim();
      if (typeof record.potential === "string" && record.potential.trim())
        overrides.potential = record.potential.trim();
      if (typeof record.zh === "string" && record.zh.trim())
        overrides.zh = record.zh.trim();

      bank.push({ ...generated, ...overrides, group });
      continue;
    }

    const groupValue =
      typeof record.group === "string" ? record.group : undefined;
    const group =
      groupValue === "i" || groupValue === "na"
        ? groupValue
        : inferAdjectiveGroup(dict);

    if (validateBank([record as Card], practice)) {
      bank.push(record as Card);
      continue;
    }

    const generated = conjugateAdjective(dict, group);
    if (!generated) return { ok: false, error: `無法推導：${dict}` };
    const overrides: Partial<Card> = {};
    if (typeof record.nai === "string" && record.nai.trim())
      overrides.nai = record.nai.trim();
    if (typeof record.ta === "string" && record.ta.trim())
      overrides.ta = record.ta.trim();
    if (typeof record.nakatta === "string" && record.nakatta.trim())
      overrides.nakatta = record.nakatta.trim();
    if (typeof record.te === "string" && record.te.trim())
      overrides.te = record.te.trim();
    if (typeof record.zh === "string" && record.zh.trim())
      overrides.zh = record.zh.trim();

    bank.push({ ...generated, ...overrides, group });
  }

  return { ok: true, bank };
}

export function mergeBank(existing: Card[], incoming: Card[]) {
  const map = new Map<string, Card>();
  existing.forEach((card) => map.set(card.dict, card));
  incoming.forEach((card) => {
    const current = map.get(card.dict);
    if (current?.zh && !card.zh) {
      map.set(card.dict, { ...card, zh: current.zh });
      return;
    }
    map.set(card.dict, card);
  });
  return Array.from(map.values());
}

export function pruneSrs(srs: Record<string, SrsState>, bank: Card[]) {
  const allowed = new Set(bank.map((card) => card.dict));
  const next: Record<string, SrsState> = {};
  Object.entries(srs).forEach(([dict, state]) => {
    if (allowed.has(dict)) next[dict] = state;
  });
  return next;
}
