import type { AdjectiveGroup, Card, VerbGroup } from "../types";
import {
  GODAN_RU_EXCEPTIONS,
  NA_ADJECTIVE_I_EXCEPTIONS,
} from "../data/constants";

export function isKana(char: string) {
  return /[ぁ-ゖァ-ヺ]/.test(char);
}

export function isIchidan(dict: string) {
  if (!dict.endsWith("る")) return false;
  if (GODAN_RU_EXCEPTIONS.has(dict)) return false;
  const before = dict.slice(-2, -1);
  if (!before) return false;
  if (!isKana(before)) return false;
  return /[いきぎしじちぢにひびぴみりえけげせぜてでねへべぺめれ]/.test(before);
}

export function inferVerbGroup(dict: string): VerbGroup {
  if (dict.endsWith("する")) return "irregular";
  if (dict.endsWith("くる") || dict.endsWith("来る")) return "irregular";
  if (isIchidan(dict)) return "ichidan";
  return "godan";
}

export function normalizeAdjectiveDict(dict: string) {
  return dict.endsWith("だ") ? dict.slice(0, -1) : dict;
}

export function inferAdjectiveGroup(dict: string): AdjectiveGroup {
  const normalized = normalizeAdjectiveDict(dict);
  if (normalized.endsWith("い") && !NA_ADJECTIVE_I_EXCEPTIONS.has(normalized))
    return "i";
  return "na";
}

export function buildNakatta(nai: string) {
  return nai.endsWith("ない")
    ? `${nai.slice(0, -2)}なかった`
    : `${nai}なかった`;
}

export function conjugateVerb(dict: string, group: VerbGroup): Card | null {
  if (group === "irregular") {
    if (dict.endsWith("する")) {
      const base = dict.slice(0, -2);
      const nai = `${base}しない`;
      return {
        dict,
        nai,
        ta: `${base}した`,
        nakatta: `${base}しなかった`,
        te: `${base}して`,
        potential: `${base}できる`,
        causative: `${base}させる`,
        volitional: `${base}しよう`,
        group,
      };
    }
    if (dict.endsWith("くる")) {
      const base = dict.slice(0, -2);
      const nai = `${base}こない`;
      return {
        dict,
        nai,
        ta: `${base}きた`,
        nakatta: `${base}こなかった`,
        te: `${base}きて`,
        potential: `${base}こられる`,
        causative: `${base}こさせる`,
        volitional: `${base}こよう`,
        group,
      };
    }
    if (dict.endsWith("来る")) {
      const base = dict.slice(0, -1);
      const nai = `${base}ない`;
      return {
        dict,
        nai,
        ta: `${base}た`,
        nakatta: `${base}なかった`,
        te: `${base}て`,
        potential: `${base}られる`,
        causative: `${base}させる`,
        volitional: `${base}よう`,
        group,
      };
    }
    return null;
  }

  if (group === "ichidan") {
    if (!dict.endsWith("る")) return null;
    const stem = dict.slice(0, -1);
    const nai = `${stem}ない`;
    return {
      dict,
      nai,
      ta: `${stem}た`,
      nakatta: `${stem}なかった`,
      te: `${stem}て`,
      potential: `${stem}られる`,
      causative: `${stem}させる`,
      volitional: `${stem}よう`,
      group,
    };
  }

  const last = dict.slice(-1);
  const stem = dict.slice(0, -1);
  let nai = "";
  let ta = "";
  let te = "";
  let potential = "";
  let causative = "";
  let volitional = "";

  switch (last) {
    case "う":
      nai = `${stem}わない`;
      ta = `${stem}った`;
      te = `${stem}って`;
      potential = `${stem}える`;
      causative = `${stem}わせる`;
      volitional = `${stem}おう`;
      break;
    case "つ":
      nai = `${stem}たない`;
      ta = `${stem}った`;
      te = `${stem}って`;
      potential = `${stem}てる`;
      causative = `${stem}たせる`;
      volitional = `${stem}とう`;
      break;
    case "る":
      nai = `${stem}らない`;
      ta = `${stem}った`;
      te = `${stem}って`;
      potential = `${stem}れる`;
      causative = `${stem}らせる`;
      volitional = `${stem}ろう`;
      break;
    case "ぶ":
      nai = `${stem}ばない`;
      ta = `${stem}んだ`;
      te = `${stem}んで`;
      potential = `${stem}べる`;
      causative = `${stem}ばせる`;
      volitional = `${stem}ぼう`;
      break;
    case "む":
      nai = `${stem}まない`;
      ta = `${stem}んだ`;
      te = `${stem}んで`;
      potential = `${stem}める`;
      causative = `${stem}ませる`;
      volitional = `${stem}もう`;
      break;
    case "ぬ":
      nai = `${stem}なない`;
      ta = `${stem}んだ`;
      te = `${stem}んで`;
      potential = `${stem}ねる`;
      causative = `${stem}なせる`;
      volitional = `${stem}のう`;
      break;
    case "く":
      nai = `${stem}かない`;
      if (dict.endsWith("行く")) {
        ta = `${stem}った`;
        te = `${stem}って`;
      } else {
        ta = `${stem}いた`;
        te = `${stem}いて`;
      }
      potential = `${stem}ける`;
      causative = `${stem}かせる`;
      volitional = `${stem}こう`;
      break;
    case "ぐ":
      nai = `${stem}がない`;
      ta = `${stem}いだ`;
      te = `${stem}いで`;
      potential = `${stem}げる`;
      causative = `${stem}がせる`;
      volitional = `${stem}ごう`;
      break;
    case "す":
      nai = `${stem}さない`;
      ta = `${stem}した`;
      te = `${stem}して`;
      potential = `${stem}せる`;
      causative = `${stem}させる`;
      volitional = `${stem}そう`;
      break;
    default:
      return null;
  }

  return {
    dict,
    nai,
    ta,
    nakatta: buildNakatta(nai),
    te,
    potential,
    causative,
    volitional,
    group,
  };
}

export function conjugateAdjective(
  dict: string,
  group: AdjectiveGroup,
): Card | null {
  const normalized = normalizeAdjectiveDict(dict);
  if (!normalized) return null;
  if (group === "i") {
    if (normalized === "いい") {
      return {
        dict: normalized,
        nai: "よくない",
        ta: "よかった",
        nakatta: "よくなかった",
        te: "よくて",
        group,
      };
    }
    if (!normalized.endsWith("い")) return null;
    const stem = normalized.slice(0, -1);
    return {
      dict: normalized,
      nai: `${stem}くない`,
      ta: `${stem}かった`,
      nakatta: `${stem}くなかった`,
      te: `${stem}くて`,
      group,
    };
  }

  const base = normalized;
  return {
    dict: base,
    nai: `${base}じゃない`,
    ta: `${base}だった`,
    nakatta: `${base}じゃなかった`,
    te: `${base}で`,
    group,
  };
}

export function normalizeVerbBank(bank: Card[]) {
  return bank.map((card) => {
    if (
      card.group !== "godan" &&
      card.group !== "ichidan" &&
      card.group !== "irregular"
    ) {
      return card;
    }
    const generated = conjugateVerb(card.dict, card.group);
    if (!generated) return card;
    const potential = card.potential?.trim();
    const causative = card.causative?.trim();
    const volitional = card.volitional?.trim();
    return {
      ...card,
      potential: potential || generated.potential,
      causative: causative || generated.causative,
      volitional: volitional || generated.volitional,
    };
  });
}
