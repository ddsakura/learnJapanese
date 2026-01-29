import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  DAY_MS,
  DEFAULT_ADJECTIVE_BANK,
  DEFAULT_VERB_BANK,
  GODAN_RU_EXCEPTIONS,
  INCORRECT_DELAY_MS,
  NA_ADJECTIVE_I_EXCEPTIONS,
  QUESTION_LABELS,
  ADJECTIVE_SCOPE_LABELS,
  DEFAULT_OLLAMA_MODEL,
  DEV_OLLAMA_ENDPOINT,
  OLLAMA_ENDPOINT,
  STORAGE_KEYS,
  TYPE_KEYS,
  TYPE_OPTIONS,
  VERB_SCOPE_LABELS,
} from "./data/constants";
import type {
  AdjectiveGroup,
  AdjectiveScope,
  Card,
  PracticeKind,
  Question,
  QuestionType,
  Scope,
  Settings,
  SrsState,
  Stats,
  VerbGroup,
  VerbScope,
  WrongToday,
} from "./types";

const defaultStats = (): Stats => ({
  streak: 0,
  todayCount: 0,
  lastDate: getTodayKey(),
});

const defaultWrongToday = (): WrongToday => ({
  date: getTodayKey(),
  items: [],
});

const defaultSettings = (): Settings => ({
  practice: "verb",
  verb: { scope: "all", type: "mixed" },
  adjective: { scope: "all", type: "mixed" },
});

type LegacySettings = {
  scope: Scope;
  type: QuestionType;
};

type ExampleEntry = {
  jp: string;
  reading: string;
  zh: string;
  grammar: string;
};

const OLLAMA_GENERATE_ENDPOINT = import.meta.env.DEV
  ? DEV_OLLAMA_ENDPOINT
  : OLLAMA_ENDPOINT;

function normalizeSettings(value: Settings | LegacySettings): Settings {
  const normalized: Settings =
    "practice" in value
      ? value
      : {
          practice: "verb",
          verb: { scope: value.scope as "all" | VerbGroup, type: value.type },
          adjective: { scope: "all", type: "mixed" },
        };
  if (normalized.adjective.type === "potential") {
    return {
      ...normalized,
      adjective: { ...normalized.adjective, type: "mixed" },
    };
  }
  return normalized;
}

function loadSettings() {
  const stored = loadFromStorage<Settings | LegacySettings | null>(
    STORAGE_KEYS.settings,
    null,
  );
  if (stored) return normalizeSettings(stored);
  const legacy = loadFromStorage<LegacySettings | null>(
    "jlpt-n4-verb-settings",
    null,
  );
  if (legacy) return normalizeSettings(legacy);
  return defaultSettings();
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

function loadExampleCache() {
  return loadFromStorage<Record<string, ExampleEntry>>(
    STORAGE_KEYS.examples,
    {},
  );
}

function saveExampleCache(next: Record<string, ExampleEntry>) {
  saveToStorage(STORAGE_KEYS.examples, next);
}

function normalizeStats(stats: Stats) {
  const today = getTodayKey();
  if (stats.lastDate !== today) {
    return { ...stats, todayCount: 0, lastDate: today };
  }
  return stats;
}

function normalizeWrongToday(data: WrongToday) {
  const today = getTodayKey();
  if (data.date !== today) {
    return { date: today, items: [] };
  }
  return data;
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function getPool(bank: Card[], scope: Scope) {
  if (scope === "all") return bank;
  return bank.filter((card) => card.group === scope);
}

function getAnswer(card: Card, type: Exclude<QuestionType, "mixed">) {
  if (type === "potential") return card.potential ?? "";
  return card[type];
}

function validateBank(data: unknown, practice: PracticeKind): data is Card[] {
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

function isKana(char: string) {
  return /[ぁ-ゖァ-ヺ]/.test(char);
}

function isIchidan(dict: string) {
  if (!dict.endsWith("る")) return false;
  if (GODAN_RU_EXCEPTIONS.has(dict)) return false;
  const before = dict.slice(-2, -1);
  if (!before) return false;
  if (!isKana(before)) return false;
  return /[いきぎしじちぢにひびぴみりえけげせぜてでねへべぺめれ]/.test(before);
}

function inferVerbGroup(dict: string): VerbGroup {
  if (dict.endsWith("する")) return "irregular";
  if (dict.endsWith("くる") || dict.endsWith("来る")) return "irregular";
  if (isIchidan(dict)) return "ichidan";
  return "godan";
}

function normalizeAdjectiveDict(dict: string) {
  return dict.endsWith("だ") ? dict.slice(0, -1) : dict;
}

function inferAdjectiveGroup(dict: string): AdjectiveGroup {
  const normalized = normalizeAdjectiveDict(dict);
  if (normalized.endsWith("い") && !NA_ADJECTIVE_I_EXCEPTIONS.has(normalized))
    return "i";
  return "na";
}

function buildNakatta(nai: string) {
  return nai.endsWith("ない")
    ? `${nai.slice(0, -2)}なかった`
    : `${nai}なかった`;
}

function buildExamplePrompt(term: string, typeLabel: string) {
  return `系統設定： 你是一位專業的日語老師，擅長將複雜的文法用簡單易懂的方式解釋給 N4 程度的學生。 任務： 請用單字『${term}』（形態：${typeLabel}）造一個 N4 程度的日文句子。  輸出格式要求（嚴格執行）： JP: [日文句子] Reading: [全平假名] ZH: [繁體中文翻譯] Grammar: [簡短說明該單字在此處的用法與形態變化，需點出${typeLabel}]`;
}

function parseExampleResponse(text: string): ExampleEntry | null {
  const normalized = text.replace(/\\n/g, "\n").trim();
  const getLineValue = (label: string) => {
    const match = normalized.match(new RegExp(`${label}:\\s*([^\\n]+)`, "i"));
    return match ? match[1].trim() : "";
  };
  const getBlockValue = (label: string) => {
    const match = normalized.match(new RegExp(`${label}:\\s*([\\s\\S]+)`, "i"));
    return match ? match[1].trim() : "";
  };
  const jp = getLineValue("JP");
  const readingRaw = getLineValue("Reading");
  const zh = getLineValue("ZH");
  const grammar = getBlockValue("Grammar");

  const reading = readingRaw;

  if (jp && reading && zh && grammar) return { jp, reading, zh, grammar };
  return null;
}

async function generateExample(term: string, typeLabel: string) {
  const response = await fetch(OLLAMA_GENERATE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: DEFAULT_OLLAMA_MODEL,
      prompt: buildExamplePrompt(term, typeLabel),
      stream: false,
    }),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { response?: string };
  const raw = data.response?.trim();
  if (!raw) return null;
  return parseExampleResponse(raw);
}

function conjugateVerb(dict: string, group: VerbGroup): Card | null {
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
        group,
      };
    }
    if (dict.endsWith("くる") || dict.endsWith("来る")) {
      const base = dict.endsWith("くる")
        ? dict.slice(0, -2)
        : dict.slice(0, -1);
      const nai = `${base}こない`;
      const potential = dict.endsWith("くる")
        ? `${base}こられる`
        : `${base}られる`;
      return {
        dict,
        nai,
        ta: `${base}きた`,
        nakatta: `${base}こなかった`,
        te: `${base}きて`,
        potential,
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
      group,
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
      return null;
  }

  return {
    dict,
    nai,
    ta,
    nakatta: buildNakatta(nai),
    te,
    potential,
    group,
  };
}

function conjugateAdjective(dict: string, group: AdjectiveGroup): Card | null {
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

function normalizeVerbBank(bank: Card[]) {
  return bank.map((card) => {
    if (
      card.group !== "godan" &&
      card.group !== "ichidan" &&
      card.group !== "irregular"
    ) {
      return card;
    }
    if (card.potential?.trim()) return card;
    const generated = conjugateVerb(card.dict, card.group);
    if (!generated?.potential) return card;
    return { ...card, potential: generated.potential };
  });
}

function normalizeImport(
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

const translationCache = new Map<string, string>();

function buildTranslationPrompt(dict: string) {
  return `請把以下日文翻譯成繁體中文，只輸出翻譯結果，不要加標點或解釋。\n日文：${dict}`;
}

function normalizeTranslation(raw: string) {
  const normalized = raw.replace(/\\n/g, "\n").trim();
  const firstLine = normalized
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstLine) return null;
  const withoutLabel = firstLine
    .replace(/^zh[:：]\s*/i, "")
    .replace(/^translation[:：]\s*/i, "")
    .trim();
  const withoutQuotes = withoutLabel.replace(
    /^["'「『](.*)["'」』]$/,
    "$1",
  );
  return withoutQuotes.trim() || null;
}

async function fetchZhTranslation(dict: string) {
  try {
    const response = await fetch(OLLAMA_GENERATE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_OLLAMA_MODEL,
        prompt: buildTranslationPrompt(dict),
        stream: false,
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { response?: string };
    const raw = data.response?.trim();
    if (!raw) return null;
    const text = normalizeTranslation(raw);
    if (!text || text === dict) return null;
    return text;
  } catch {
    return null;
  }
}

async function enrichTranslations(cards: Card[], existing: Card[]) {
  const existingMap = new Map<string, string>();
  existing.forEach((card) => {
    if (card.zh?.trim()) existingMap.set(card.dict, card.zh.trim());
  });

  const enriched: Card[] = [];
  for (const card of cards) {
    const current = card.zh?.trim();
    if (current) {
      enriched.push(card);
      continue;
    }
    const cached =
      translationCache.get(card.dict) ?? existingMap.get(card.dict);
    if (cached) {
      enriched.push({ ...card, zh: cached });
      continue;
    }
    const fetched = await fetchZhTranslation(card.dict);
    if (fetched) translationCache.set(card.dict, fetched);
    enriched.push(fetched ? { ...card, zh: fetched } : card);
  }
  return enriched;
}

function App() {
  const [practice, setPractice] = useState<PracticeKind>(() => {
    return loadSettings().practice;
  });
  const [banks, setBanks] = useState<Record<PracticeKind, Card[]>>(() => ({
    verb: normalizeVerbBank(
      loadFromStorage(STORAGE_KEYS.bank.verb, DEFAULT_VERB_BANK),
    ),
    adjective: loadFromStorage(
      STORAGE_KEYS.bank.adjective,
      DEFAULT_ADJECTIVE_BANK,
    ),
  }));
  const [srs, setSrs] = useState<
    Record<PracticeKind, Record<string, SrsState>>
  >(() => ({
    verb: loadFromStorage(STORAGE_KEYS.srs.verb, {}),
    adjective: loadFromStorage(STORAGE_KEYS.srs.adjective, {}),
  }));
  const [stats, setStats] = useState<Record<PracticeKind, Stats>>(() => ({
    verb: normalizeStats(
      loadFromStorage(STORAGE_KEYS.stats.verb, defaultStats()),
    ),
    adjective: normalizeStats(
      loadFromStorage(STORAGE_KEYS.stats.adjective, defaultStats()),
    ),
  }));
  const [wrongToday, setWrongToday] = useState<
    Record<PracticeKind, WrongToday>
  >(() => ({
    verb: normalizeWrongToday(
      loadFromStorage(STORAGE_KEYS.wrong.verb, defaultWrongToday()),
    ),
    adjective: normalizeWrongToday(
      loadFromStorage(STORAGE_KEYS.wrong.adjective, defaultWrongToday()),
    ),
  }));
  const [verbScope, setVerbScope] = useState<VerbScope>(() => {
    return loadSettings().verb.scope;
  });
  const [adjectiveScope, setAdjectiveScope] = useState<AdjectiveScope>(() => {
    return loadSettings().adjective.scope;
  });
  const [verbQuestionType, setVerbQuestionType] = useState<QuestionType>(() => {
    return loadSettings().verb.type;
  });
  const [adjectiveQuestionType, setAdjectiveQuestionType] =
    useState<QuestionType>(() => {
      return loadSettings().adjective.type;
    });
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{
    correct: boolean;
    correctAnswer: string;
    userAnswer: string;
    type: Exclude<QuestionType, "mixed">;
  } | null>(null);
  const [example, setExample] = useState<ExampleEntry | null>(null);
  const [exampleStatus, setExampleStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [exampleMessage, setExampleMessage] = useState("");
  const [liveZh, setLiveZh] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isExampleSpeaking, setIsExampleSpeaking] = useState(false);
  const makeQuestionRef = useRef<() => Question | null>(() => null);
  const [mode, setMode] = useState<"normal" | "reviewWrong">("normal");
  const [message, setMessage] = useState<string>("");
  const [bankText, setBankText] = useState("");
  const [quickInput, setQuickInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  const scope: Scope = practice === "verb" ? verbScope : adjectiveScope;
  const questionType =
    practice === "verb" ? verbQuestionType : adjectiveQuestionType;
  const bank = banks[practice];
  const activeSrs = srs[practice];
  const activeStats = stats[practice];
  const activeWrongToday = wrongToday[practice];
  const scopeLabels = (
    practice === "verb" ? VERB_SCOPE_LABELS : ADJECTIVE_SCOPE_LABELS
  ) as Record<Scope, string>;
  const practiceLabel = practice === "verb" ? "動詞" : "形容詞";
  const dictLabel = practice === "verb" ? "辭書形" : "原形";
  const typeOptions = useMemo(
    () =>
      practice === "verb"
        ? TYPE_OPTIONS
        : TYPE_OPTIONS.filter((option) => option.value !== "potential"),
    [practice],
  );
  const typeKeys = useMemo(
    () =>
      practice === "verb"
        ? TYPE_KEYS
        : TYPE_KEYS.filter((type) => type !== "potential"),
    [practice],
  );
  const summaryLine =
    practice === "verb"
      ? "ない形／た形／なかった形／て形／可能形・快速刷題 + 簡易 SRS"
      : "ない形／た形／なかった形／て形・快速刷題 + 簡易 SRS";
  const ruleSummary =
    practice === "verb" ? "た形・て形・可能形 變形規則" : "形容詞變化規則";
  const currentCard = useMemo(() => {
    if (!question) return null;
    return bank.find((card) => card.dict === question.card.dict) ?? question.card;
  }, [bank, question]);
  const bankExample =
    practice === "verb"
      ? `[
  "行く",
  "見る",
  { "dict": "帰る", "group": "godan" },
  { "dict": "勉強する", "group": "irregular", "zh": "念書" }
]`
      : `[
  "新しい",
  "便利",
  { "dict": "静か", "group": "na" },
  { "dict": "面白い", "group": "i", "zh": "有趣" }
]`;
  const groupHint =
    practice === "verb"
      ? "group 代碼：godan = 五段、ichidan = 二段、irregular = 不規則；可選 zh 欄位放中文翻譯"
      : "group 代碼：i = い形、na = な形；可選 zh 欄位放中文翻譯";

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.bank.verb, banks.verb);
  }, [banks.verb]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.bank.adjective, banks.adjective);
  }, [banks.adjective]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.srs.verb, srs.verb);
  }, [srs.verb]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.srs.adjective, srs.adjective);
  }, [srs.adjective]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.stats.verb, stats.verb);
  }, [stats.verb]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.stats.adjective, stats.adjective);
  }, [stats.adjective]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.wrong.verb, wrongToday.verb);
  }, [wrongToday.verb]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.wrong.adjective, wrongToday.adjective);
  }, [wrongToday.adjective]);

  useEffect(() => {
    const nextSettings: Settings = {
      practice,
      verb: { scope: verbScope, type: verbQuestionType },
      adjective: { scope: adjectiveScope, type: adjectiveQuestionType },
    };
    saveToStorage(STORAGE_KEYS.settings, nextSettings);
  }, [
    practice,
    verbScope,
    verbQuestionType,
    adjectiveScope,
    adjectiveQuestionType,
  ]);

  useEffect(() => {
    setStats((prev) => ({
      verb: normalizeStats(prev.verb),
      adjective: normalizeStats(prev.adjective),
    }));
    setWrongToday((prev) => ({
      verb: normalizeWrongToday(prev.verb),
      adjective: normalizeWrongToday(prev.adjective),
    }));
  }, []);

  const pool = useMemo(() => getPool(bank, scope), [bank, scope]);
  const reviewPool = useMemo(() => {
    const bankMap = new Map(bank.map((card) => [card.dict, card]));
    return activeWrongToday.items
      .map((entry) => {
        const card = bankMap.get(entry.dict);
        return card ? { card, type: entry.type } : null;
      })
      .filter((entry): entry is Question => Boolean(entry));
  }, [bank, activeWrongToday]);

  const dueCount = useMemo(() => {
    const now = Date.now();
    return pool.filter((card) => (activeSrs[card.dict]?.due ?? 0) <= now)
      .length;
  }, [pool, activeSrs]);
  const wrongCount = activeWrongToday.items.length;
  const emptyMessage =
    mode === "reviewWrong" ? "今天沒有答錯的題目" : "目前題庫沒有可用題目";

  const makeQuestion = useCallback((): Question | null => {
    if (mode === "reviewWrong") {
      return reviewPool.length > 0 ? pickRandom(reviewPool) : null;
    }
    const candidatePool = getPool(bank, scope);
    if (candidatePool.length === 0) return null;
    const now = Date.now();
    const dueCards = candidatePool.filter(
      (card) => (activeSrs[card.dict]?.due ?? 0) <= now,
    );
    const card =
      dueCards.length > 0 ? pickRandom(dueCards) : pickRandom(candidatePool);
    const sanitizedType =
      practice === "adjective" && questionType === "potential"
        ? "mixed"
        : questionType;
    const actualType =
      sanitizedType === "mixed"
        ? pickRandom(typeKeys)
        : (sanitizedType as Exclude<QuestionType, "mixed">);
    return { card, type: actualType };
  }, [
    activeSrs,
    bank,
    mode,
    practice,
    questionType,
    reviewPool,
    scope,
    typeKeys,
  ]);

  useEffect(() => {
    makeQuestionRef.current = makeQuestion;
  }, [makeQuestion]);

  useEffect(() => {
    if (result) return;
    setQuestion(makeQuestionRef.current());
    setAnswer("");
    setResult(null);
    setExample(null);
    setExampleStatus("idle");
    setExampleMessage("");
  }, [scope, questionType, bank, mode, result]);

  useEffect(() => {
    setMode("normal");
  }, [practice]);

  useEffect(() => {
    setExample(null);
    setExampleStatus("idle");
    setExampleMessage("");
    if (!result || !question) return;
    const term = result.correctAnswer;
    const typeLabel = QUESTION_LABELS[result.type];
    const cacheKey = `${practice}:${result.type}:${term}`;
    const cache = loadExampleCache();
    const cached = cache[cacheKey];
    if (cached) {
      setExample(cached);
      return;
    }
    let cancelled = false;
    setExampleStatus("loading");
    generateExample(term, typeLabel)
      .then((entry) => {
        if (cancelled) return;
        if (!entry) {
          setExampleStatus("error");
          setExampleMessage(
            "例句產生失敗，請確認 Ollama 已啟動且模型可用（必要時設定 CORS）。",
          );
          return;
        }
        setExample(entry);
        setExampleStatus("idle");
        const next = { ...cache, [cacheKey]: entry };
        saveExampleCache(next);
      })
      .catch(() => {
        if (cancelled) return;
        setExampleStatus("error");
        setExampleMessage(
          "例句產生失敗，請確認 Ollama 已啟動且模型可用（必要時設定 CORS）。",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [practice, question, result]);

  useEffect(() => {
    if (!result || !question) return;
    const answer = result.correctAnswer;
    let cancelled = false;
    setLiveZh(null);
    setIsTranslating(true);
    fetchZhTranslation(answer).then((zh) => {
      if (cancelled) return;
      setLiveZh(zh);
      setIsTranslating(false);
    });
    return () => {
      cancelled = true;
    };
  }, [practice, question, result]);

  useEffect(() => {
    if (canSpeak) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsExampleSpeaking(false);
    }
  }, [canSpeak, question]);

  function applySrs(card: Card, isCorrect: boolean) {
    setSrs((prev) => {
      const currentPractice = prev[practice];
      const current = currentPractice[card.dict];
      const intervalDays = isCorrect
        ? Math.max(1, (current?.intervalDays ?? 0) * 2 || 1)
        : 0;
      const due = isCorrect
        ? Date.now() + intervalDays * DAY_MS
        : Date.now() + INCORRECT_DELAY_MS;
      return {
        ...prev,
        [practice]: {
          ...currentPractice,
          [card.dict]: { intervalDays, due },
        },
      };
    });
  }

  function updateStats(isCorrect: boolean) {
    setStats((prev) => {
      const normalized = normalizeStats(prev[practice]);
      return {
        ...prev,
        [practice]: {
          ...normalized,
          todayCount: normalized.todayCount + 1,
          streak: isCorrect ? normalized.streak + 1 : 0,
        },
      };
    });
  }

  function checkAnswer(submitted: string, forcedIncorrect = false) {
    if (!question) return;
    const correctAnswer = getAnswer(question.card, question.type);
    const trimmed = submitted.trim();
    const isCorrect = !forcedIncorrect && trimmed === correctAnswer;
    const entry = { dict: question.card.dict, type: question.type };
    applySrs(question.card, isCorrect);
    updateStats(isCorrect);
    if (isCorrect) {
      if (mode === "reviewWrong") {
        setWrongToday((prev) => {
          const current = prev[practice];
          return {
            ...prev,
            [practice]: {
              ...current,
              items: current.items.filter(
                (item) =>
                  !(item.dict === entry.dict && item.type === entry.type),
              ),
            },
          };
        });
      }
    } else {
      setWrongToday((prev) => {
        const current = prev[practice];
        if (
          current.items.some(
            (item) => item.dict === entry.dict && item.type === entry.type,
          )
        ) {
          return prev;
        }
        return {
          ...prev,
          [practice]: { ...current, items: [...current.items, entry] },
        };
      });
    }
    setResult({
      correct: isCorrect,
      correctAnswer,
      userAnswer: trimmed,
      type: question.type,
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (result || !question) return;
    checkAnswer(answer);
  }

  function handleSkip() {
    if (!question || result) return;
    checkAnswer("", true);
  }

  function handleNext() {
    setQuestion(makeQuestion());
    setAnswer("");
    setResult(null);
  }

  function handleStartReview() {
    setMode("reviewWrong");
    setQuestion(makeQuestion());
    setAnswer("");
    setResult(null);
  }

  function handleExitReview() {
    setMode("normal");
    setQuestion(makeQuestion());
    setAnswer("");
    setResult(null);
  }

  function handleSpeak() {
    if (!question || !canSpeak) return;
    const utterance = new SpeechSynthesisUtterance(question.card.dict);
    utterance.lang = "ja-JP";
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function handleExampleSpeak() {
    if (!example || !canSpeak) return;
    const utterance = new SpeechSynthesisUtterance(example.jp);
    utterance.lang = "ja-JP";
    utterance.onend = () => setIsExampleSpeaking(false);
    utterance.onerror = () => setIsExampleSpeaking(false);
    window.speechSynthesis.cancel();
    setIsExampleSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function handleExport() {
    setBankText(JSON.stringify(bank, null, 2));
    setMessage("已將題庫輸出到文字框。");
  }

  function mergeBank(existing: Card[], incoming: Card[]) {
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

  function pruneSrs(srs: Record<string, SrsState>, bank: Card[]) {
    const allowed = new Set(bank.map((card) => card.dict));
    const next: Record<string, SrsState> = {};
    Object.entries(srs).forEach(([dict, state]) => {
      if (allowed.has(dict)) next[dict] = state;
    });
    return next;
  }

  async function handleImport() {
    setMessage("");
    setIsImporting(true);
    try {
      const parsed = JSON.parse(bankText);
      const normalized = normalizeImport(parsed, practice);
      if (!normalized.ok) {
        setMessage(`匯入失敗：${normalized.error}`);
        return;
      }
      setMessage("正在查詢中文翻譯...");
      const enriched = await enrichTranslations(normalized.bank, bank);
      const merged = mergeBank(bank, enriched);
      const nextBank = practice === "verb" ? normalizeVerbBank(merged) : merged;
      setBanks((prev) => ({ ...prev, [practice]: nextBank }));
      setSrs((prev) => ({
        ...prev,
        [practice]: pruneSrs(prev[practice], nextBank),
      }));
      setAnswer("");
      setResult(null);
      setMessage("匯入成功，已合併題庫。");
    } catch {
      setMessage("匯入失敗：JSON 解析錯誤。");
    } finally {
      setIsImporting(false);
    }
  }

  async function handleQuickImport() {
    setMessage("");
    const entries = quickInput
      .split(/[\s,]+/)
      .map((value) => value.trim())
      .filter(Boolean);
    if (entries.length === 0) {
      setMessage(practice === "verb" ? "請先輸入動詞。" : "請先輸入形容詞。");
      return;
    }
    const normalized = normalizeImport(entries, practice);
    if (!normalized.ok) {
      setMessage(`匯入失敗：${normalized.error}`);
      return;
    }
    setIsImporting(true);
    try {
      setMessage("正在查詢中文翻譯...");
      const enriched = await enrichTranslations(normalized.bank, bank);
      const merged = mergeBank(bank, enriched);
      const nextBank = practice === "verb" ? normalizeVerbBank(merged) : merged;
      setBanks((prev) => ({ ...prev, [practice]: nextBank }));
      setSrs((prev) => ({
        ...prev,
        [practice]: pruneSrs(prev[practice], nextBank),
      }));
      setAnswer("");
      setResult(null);
      setQuickInput("");
      setMessage("匯入成功，已合併題庫。");
    } finally {
      setIsImporting(false);
    }
  }

  function handleResetBank() {
    const nextBank =
      practice === "verb" ? DEFAULT_VERB_BANK : DEFAULT_ADJECTIVE_BANK;
    const normalizedBank =
      practice === "verb" ? normalizeVerbBank(nextBank) : nextBank;
    setBanks((prev) => ({ ...prev, [practice]: normalizedBank }));
    setSrs((prev) => ({ ...prev, [practice]: {} }));
    setStats((prev) => ({ ...prev, [practice]: defaultStats() }));
    setQuestion(makeQuestion());
    setAnswer("");
    setResult(null);
    setMessage("已重置為內建題庫。");
  }

  function handleClearProgress() {
    setSrs((prev) => ({ ...prev, [practice]: {} }));
    setStats((prev) => ({ ...prev, [practice]: defaultStats() }));
    setMessage("已清空學習紀錄。");
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>JLPT N4 普通形{practiceLabel}變化練習</h1>
          <p>{summaryLine}</p>
        </div>
        <div className="controls">
          <label>
            類型
            <select
              value={practice}
              onChange={(event) =>
                setPractice(event.target.value as PracticeKind)
              }
            >
              <option value="verb">動詞</option>
              <option value="adjective">形容詞</option>
            </select>
          </label>
          <label>
            題型
            <select
              value={questionType}
              onChange={(event) =>
                practice === "verb"
                  ? setVerbQuestionType(event.target.value as QuestionType)
                  : setAdjectiveQuestionType(event.target.value as QuestionType)
              }
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            範圍
            <select
              value={scope}
              onChange={(event) =>
                practice === "verb"
                  ? setVerbScope(event.target.value as VerbScope)
                  : setAdjectiveScope(event.target.value as AdjectiveScope)
              }
            >
              {Object.entries(scopeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <main className="main">
        <section className="question-card">
          <div className="question">
            {question ? (
              <>
                <div className="prompt">{question.card.dict}</div>
                <div className="arrow">→</div>
                <div className="target">{QUESTION_LABELS[question.type]}</div>
              </>
            ) : (
              <div className="empty">{emptyMessage}</div>
            )}
          </div>
          {question && (
            <div className="pronunciation">
              <div className="pronunciation-header">
                <span>發音</span>
                <button
                  type="button"
                  className="ghost"
                  onClick={handleSpeak}
                  disabled={isSpeaking || !canSpeak}
                >
                  {isSpeaking ? "播放中…" : "播放"}
                </button>
              </div>
              {!canSpeak && (
                <div className="pronunciation-note">
                  此瀏覽器不支援語音播放。
                </div>
              )}
            </div>
          )}
          {question && (
            <div className="dictionary-link">
              <a
                href={`https://mazii.net/zh-TW/search/word/jatw/${encodeURIComponent(
                  question.card.dict,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                查字典：{question.card.dict}
              </a>
            </div>
          )}

          <form className="answer-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="輸入答案，Enter 送出"
              disabled={!question || Boolean(result)}
              autoFocus
            />
            <div className="actions">
              <button type="submit" disabled={!question || Boolean(result)}>
                批改
              </button>
              <button
                type="button"
                className="ghost"
                onClick={handleSkip}
                disabled={!question || Boolean(result)}
              >
                略過
              </button>
              <button
                type="button"
                className="secondary"
                onClick={handleNext}
                disabled={!question || !result}
              >
                下一題
              </button>
            </div>
          </form>

          <div className="result">
            {result ? (
              <div className={result.correct ? "correct" : "wrong"}>
                <div className="badge">
                  {result.correct ? "✅ 正確" : "❌ 錯誤 / 略過"}
                </div>
                <div className="result-row">
                  <span>題型</span>
                  <strong>{QUESTION_LABELS[result.type]}</strong>
                </div>
                <div className="result-row">
                  <span>我的答案</span>
                  <strong>{result.userAnswer || "（空白）"}</strong>
                </div>
                <div className="result-row">
                  <span>正確答案</span>
                  <strong>{result.correctAnswer}</strong>
                </div>
                <div className="dictionary-link">
                  <a
                    href={`https://mazii.net/zh-TW/search/word/jatw/${encodeURIComponent(
                      result.correctAnswer,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    查字典：{result.correctAnswer}
                  </a>
                </div>
                {question && (
                  <div className="result-row">
                    <span>中文</span>
                    <strong>
                      {liveZh?.trim() ||
                        (isTranslating ? "（翻譯中…）" : "（未取得）")}
                    </strong>
                  </div>
                )}
                {result && (
                  <div className="result-example">
                    <div className="result-example-title">例句</div>
                    {exampleStatus === "loading" && (
                      <div className="result-example-line">例句產生中…</div>
                    )}
                    {exampleStatus === "error" && (
                      <div className="result-example-line error">
                        {exampleMessage}
                      </div>
                    )}
                    {example && (
                      <>
                        <div className="result-example-line">{example.jp}</div>
                        <div className="result-example-line reading">
                          {example.reading}
                        </div>
                        <div className="result-example-line zh">
                          {example.zh}
                        </div>
                        <div className="result-example-line grammar">
                          {example.grammar}
                        </div>
                        <div className="result-example-actions">
                          <button
                            type="button"
                            className="ghost"
                            onClick={handleExampleSpeak}
                            disabled={isExampleSpeaking || !canSpeak}
                          >
                            {isExampleSpeaking ? "播放中…" : "朗讀例句"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {question && (
                  <div className="result-forms">
                    <div className="result-forms-title">全部形</div>
                    <div className="result-forms-grid">
                      <span>{dictLabel}</span>
                      <strong>{question.card.dict}</strong>
                      <span>ない形</span>
                      <strong>{question.card.nai}</strong>
                      <span>た形</span>
                      <strong>{question.card.ta}</strong>
                      <span>なかった形</span>
                      <strong>{question.card.nakatta}</strong>
                      <span>て形</span>
                      <strong>{question.card.te}</strong>
                      {practice === "verb" && (
                        <>
                          <span>可能形</span>
                          <strong>
                            {question.card.potential || "（未提供）"}
                          </strong>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hint">輸入答案後按 Enter，或點「批改」。</div>
            )}
          </div>
        </section>

        <section className="stats">
          <div>
            <div className="label">今日答題數</div>
            <div className="value">{activeStats.todayCount}</div>
          </div>
          <div>
            <div className="label">連續答對</div>
            <div className="value">{activeStats.streak}</div>
          </div>
          <div>
            <div className="label">待複習數</div>
            <div className="value">{dueCount}</div>
          </div>
          <div>
            <div className="label">目前範圍</div>
            <div className="value">{scopeLabels[scope]}</div>
          </div>
          <div className="review-card">
            <div className="label">今日答錯</div>
            <div className="value">{wrongCount}</div>
            {mode === "reviewWrong" ? (
              <button
                type="button"
                className="secondary"
                onClick={handleExitReview}
              >
                回到正常題庫
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartReview}
                disabled={wrongCount === 0}
              >
                複習今日答錯
              </button>
            )}
          </div>
        </section>

        {practice === "verb" ? (
          <details className="rules">
            <summary>{ruleSummary}</summary>
            <div className="rules-body">
              <div className="rule-grid">
                <div className="rule-card">
                  <div className="rule-title">う／つ／る</div>
                  <div className="rule-line">た形：〜った</div>
                  <div className="rule-line">て形：〜って</div>
                </div>
                <div className="rule-card">
                  <div className="rule-title">む／ぶ／ぬ</div>
                  <div className="rule-line">た形：〜んだ</div>
                  <div className="rule-line">て形：〜んで</div>
                </div>
                <div className="rule-card">
                  <div className="rule-title">く（行く除外）</div>
                  <div className="rule-line">た形：〜いた</div>
                  <div className="rule-line">て形：〜いて</div>
                </div>
                <div className="rule-card">
                  <div className="rule-title">ぐ</div>
                  <div className="rule-line">た形：〜いだ</div>
                  <div className="rule-line">て形：〜いで</div>
                </div>
                <div className="rule-card">
                  <div className="rule-title">す</div>
                  <div className="rule-line">た形：〜した</div>
                  <div className="rule-line">て形：〜して</div>
                </div>
                <div className="rule-card">
                  <div className="rule-title">行く（例外）</div>
                  <div className="rule-line">た形：行った</div>
                  <div className="rule-line">て形：行って</div>
                </div>
                <div className="rule-card">
                  <div className="rule-title">二段動詞</div>
                  <div className="rule-line">た形：語幹＋た</div>
                  <div className="rule-line">て形：語幹＋て</div>
                </div>
                <div className="rule-card">
                  <div className="rule-title">五段動詞（可能形）</div>
                  <div className="rule-line">語尾改 e 段＋る</div>
                </div>
                <div className="rule-card">
                  <div className="rule-title">二段動詞（可能形）</div>
                  <div className="rule-line">語幹＋られる</div>
                </div>
                <div className="rule-card">
                  <div className="rule-title">する／くる</div>
                  <div className="rule-line">た形：した／きた</div>
                  <div className="rule-line">て形：して／きて</div>
                  <div className="rule-line">可能形：できる／こられる</div>
                </div>
              </div>
            </div>
          </details>
        ) : (
          <details className="rules">
            <summary>{ruleSummary}</summary>
            <div className="rules-body">
              <div className="rule-grid">
                <div className="rule-card">
                  <div className="rule-title">い形容詞</div>
                  <div className="rule-line">ない形：語幹＋くない</div>
                  <div className="rule-line">た形：語幹＋かった</div>
                  <div className="rule-line">なかった形：語幹＋くなかった</div>
                  <div className="rule-line">て形：語幹＋くて</div>
                </div>
                <div className="rule-card">
                  <div className="rule-title">な形容詞</div>
                  <div className="rule-line">ない形：語幹＋じゃない</div>
                  <div className="rule-line">た形：語幹＋だった</div>
                  <div className="rule-line">
                    なかった形：語幹＋じゃなかった
                  </div>
                  <div className="rule-line">て形：語幹＋で</div>
                </div>
                <div className="rule-card">
                  <div className="rule-title">いい（例外）</div>
                  <div className="rule-line">ない形：よくない</div>
                  <div className="rule-line">た形：よかった</div>
                </div>
              </div>
            </div>
          </details>
        )}

        <details className="bank">
          <summary>題庫管理</summary>
          <div className="bank-body">
            <div className="bank-guide">
              <p>匯入會合併題庫並保留學習紀錄。匯出可直接複製。</p>
              <div className="steps">
                <div className="step">
                  <span>1.</span> 點「匯出題庫」可取得目前 JSON。
                </div>
                <div className="step">
                  <span>2.</span> 貼上你的 JSON（支援只給{dictLabel}）。
                </div>
                <div className="step">
                  <span>3.</span> 點「匯入題庫」立即生效。
                </div>
              </div>
              <div className="group-hint">{groupHint}</div>
              <pre className="example">{bankExample}</pre>
            </div>
            <div className="bank-count">
              目前題庫共有 {bank.length} 個單字。
            </div>
            <textarea
              value={bankText}
              onChange={(event) => setBankText(event.target.value)}
              placeholder="在此貼上題庫 JSON 或按下匯出填入"
              rows={10}
              disabled={isImporting}
            />
            <div className="bank-quick">
              <input
                type="text"
                value={quickInput}
                onChange={(event) => setQuickInput(event.target.value)}
                placeholder={`直接輸入${practiceLabel}（可用空白或逗號分隔）`}
                disabled={isImporting}
              />
              <button
                type="button"
                onClick={handleQuickImport}
                className="secondary"
                disabled={isImporting}
              >
                直接匯入{practiceLabel}
              </button>
            </div>
            <div className="bank-actions">
              <button
                type="button"
                onClick={handleExport}
                disabled={isImporting}
              >
                匯出題庫
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="secondary"
                disabled={isImporting}
              >
                匯入題庫
              </button>
              <button
                type="button"
                onClick={handleResetBank}
                className="ghost"
                disabled={isImporting}
              >
                重置題庫
              </button>
              <button
                type="button"
                onClick={handleClearProgress}
                className="ghost"
                disabled={isImporting}
              >
                清空學習紀錄
              </button>
            </div>
            {message && <div className="message">{message}</div>}
          </div>
        </details>
      </main>
    </div>
  );
}

export default App;
