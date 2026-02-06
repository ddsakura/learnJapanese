export function normalizeDictForRule(dict) {
  return dict.trim().replace(/[（(][^（）()]*[）)]$/u, "").trim();
}

function isKana(ch) {
  return /[ぁ-ゖァ-ヺー]/u.test(ch);
}

function isIchidan(dict) {
  if (!dict.endsWith("る")) return false;
  const godanRuExceptions = new Set([
    "帰る",
    "走る",
    "入る",
    "切る",
    "知る",
    "要る",
    "喋る",
    "滑る",
    "減る",
    "焦る",
    "限る",
  ]);
  if (godanRuExceptions.has(dict)) return false;
  const before = dict.slice(-2, -1);
  if (!before || !isKana(before)) return false;
  return /[いきぎしじちぢにひびぴみりえけげせぜてでねへべぺめれ]/u.test(before);
}

function inferVerbGroup(dict) {
  if (dict.endsWith("する")) return "irregular";
  if (dict.endsWith("くる") || dict.endsWith("来る")) return "irregular";
  if (isIchidan(dict)) return "ichidan";
  return "godan";
}

function normalizeAdjectiveDict(dict) {
  return dict.endsWith("だ") ? dict.slice(0, -1) : dict;
}

function inferAdjectiveGroup(dict) {
  const normalized = normalizeAdjectiveDict(dict);
  const naAdjectiveIExceptions = new Set(["きれい", "嫌い", "きらい"]);
  if (normalized.endsWith("い") && !naAdjectiveIExceptions.has(normalized)) return "i";
  return "na";
}

function buildNakatta(nai) {
  return nai.endsWith("ない") ? `${nai.slice(0, -2)}なかった` : `${nai}なかった`;
}

function conjugateVerb(dict, group) {
  if (group === "irregular") {
    if (dict.endsWith("する")) {
      const base = dict.slice(0, -2);
      const nai = `${base}しない`;
      return {
        nai,
        ta: `${base}した`,
        nakatta: `${base}しなかった`,
        te: `${base}して`,
        potential: `${base}できる`,
      };
    }
    if (dict.endsWith("くる") || dict.endsWith("来る")) {
      const base = dict.endsWith("くる") ? dict.slice(0, -2) : dict.slice(0, -1);
      return {
        nai: `${base}こない`,
        ta: `${base}きた`,
        nakatta: `${base}こなかった`,
        te: `${base}きて`,
        potential: dict.endsWith("くる") ? `${base}こられる` : `${base}られる`,
      };
    }
    throw new Error(`invalid irregular verb: ${dict}`);
  }

  if (group === "ichidan") {
    if (!dict.endsWith("る")) throw new Error(`invalid ichidan verb: ${dict}`);
    const stem = dict.slice(0, -1);
    const nai = `${stem}ない`;
    return {
      nai,
      ta: `${stem}た`,
      nakatta: `${stem}なかった`,
      te: `${stem}て`,
      potential: `${stem}られる`,
    };
  }

  const last = dict.slice(-1);
  const stem = dict.slice(0, -1);
  let nai = "";
  let ta = "";
  let te = "";
  let potential = "";

  switch (last) {
    case "う":
      nai = `${stem}わない`;
      ta = `${stem}った`;
      te = `${stem}って`;
      potential = `${stem}える`;
      break;
    case "つ":
      nai = `${stem}たない`;
      ta = `${stem}った`;
      te = `${stem}って`;
      potential = `${stem}てる`;
      break;
    case "る":
      nai = `${stem}らない`;
      ta = `${stem}った`;
      te = `${stem}って`;
      potential = `${stem}れる`;
      break;
    case "ぶ":
      nai = `${stem}ばない`;
      ta = `${stem}んだ`;
      te = `${stem}んで`;
      potential = `${stem}べる`;
      break;
    case "む":
      nai = `${stem}まない`;
      ta = `${stem}んだ`;
      te = `${stem}んで`;
      potential = `${stem}める`;
      break;
    case "ぬ":
      nai = `${stem}なない`;
      ta = `${stem}んだ`;
      te = `${stem}んで`;
      potential = `${stem}ねる`;
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
      break;
    case "ぐ":
      nai = `${stem}がない`;
      ta = `${stem}いだ`;
      te = `${stem}いで`;
      potential = `${stem}げる`;
      break;
    case "す":
      nai = `${stem}さない`;
      ta = `${stem}した`;
      te = `${stem}して`;
      potential = `${stem}せる`;
      break;
    default:
      throw new Error(`invalid godan verb: ${dict}`);
  }

  return { nai, ta, nakatta: buildNakatta(nai), te, potential };
}

function conjugateAdjective(dict, group) {
  const normalized = normalizeAdjectiveDict(dict);
  if (!normalized) throw new Error("invalid adjective");

  if (group === "i") {
    if (normalized === "いい") {
      return {
        dict: normalized,
        nai: "よくない",
        ta: "よかった",
        nakatta: "よくなかった",
        te: "よくて",
      };
    }
    if (!normalized.endsWith("い")) throw new Error(`invalid i-adjective: ${dict}`);
    const stem = normalized.slice(0, -1);
    return {
      dict: normalized,
      nai: `${stem}くない`,
      ta: `${stem}かった`,
      nakatta: `${stem}くなかった`,
      te: `${stem}くて`,
    };
  }

  return {
    dict: normalized,
    nai: `${normalized}じゃない`,
    ta: `${normalized}だった`,
    nakatta: `${normalized}じゃなかった`,
    te: `${normalized}で`,
  };
}

export function buildConjugationFixtures(bank) {
  const verbs = [];
  const adjectives = [];
  const errors = [];

  for (const card of bank.verb ?? []) {
    const dict = normalizeDictForRule(card.dict);
    const group = inferVerbGroup(dict);
    try {
      verbs.push({
        dict,
        group,
        expected: conjugateVerb(dict, group),
      });
    } catch (error) {
      errors.push(`verb '${card.dict}': ${error.message}`);
    }
  }

  for (const card of bank.adjective ?? []) {
    const dict = normalizeDictForRule(card.dict);
    const group = inferAdjectiveGroup(dict);
    try {
      adjectives.push({
        dict,
        group,
        expected: conjugateAdjective(dict, group),
      });
    } catch (error) {
      errors.push(`adjective '${card.dict}': ${error.message}`);
    }
  }

  if (errors.length > 0) {
    const details = errors.map((entry) => `- ${entry}`).join("\n");
    throw new Error(`Invalid bank entries found while generating conjugation fixtures:\n${details}`);
  }

  return { verbs, adjectives };
}

export function stringifyConjugationFixtures(fixtures) {
  return `${JSON.stringify(fixtures, null, 2)}\n`;
}
