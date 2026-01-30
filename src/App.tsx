import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import BankPanel from "./components/BankPanel";
import HeaderControls from "./components/HeaderControls";
import QuestionCard from "./components/QuestionCard";
import RulesPanel from "./components/RulesPanel";
import StatsPanel from "./components/StatsPanel";
import {
  DAY_MS,
  DEFAULT_ADJECTIVE_BANK,
  DEFAULT_VERB_BANK,
  INCORRECT_DELAY_MS,
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
import { normalizeVerbBank } from "./lib/conjugation";
import { normalizeImport, mergeBank, pruneSrs } from "./lib/importing";
import {
  getAnswer,
  getPool,
  pickRandom,
  shuffle,
} from "./lib/questions";
import {
  defaultStats,
  defaultWrongToday,
  getTodayKey,
  normalizeStats,
  normalizeWrongToday,
} from "./lib/stats";
import {
  normalizeTranslation,
  parseChoiceResponse,
  parseExampleResponse,
} from "./lib/parsers";
import {
  buildChoicePrompt,
  buildExamplePrompt,
  buildTranslationPrompt,
} from "./lib/prompts";
import type {
  AdjectiveScope,
  AnswerMode,
  Card,
  ChoiceStatus,
  ExampleEntry,
  PracticeKind,
  Question,
  QuestionType,
  Scope,
  Settings,
  SrsState,
  Stats,
  VerbScope,
  WrongToday,
} from "./types";

const defaultSettings = (): Settings => ({
  practice: "verb",
  verb: { scope: "all", type: "mixed" },
  adjective: { scope: "all", type: "mixed" },
});

type LegacySettings = {
  scope: Scope;
  type: QuestionType;
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
          verb: { scope: value.scope as VerbScope, type: value.type },
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

const translationCache = new Map<string, string>();
const choiceCache = new Map<string, string[]>();

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
  const [answerMode, setAnswerMode] = useState<AnswerMode>(() => {
    return loadFromStorage<AnswerMode>(STORAGE_KEYS.answerMode, "input");
  });
  const [choiceOptions, setChoiceOptions] = useState<string[]>([]);
  const [choiceStatus, setChoiceStatus] = useState<ChoiceStatus>("idle");
  const [choiceMessage, setChoiceMessage] = useState("");
  const choiceRequestId = useRef(0);
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
    saveToStorage(STORAGE_KEYS.answerMode, answerMode);
  }, [answerMode]);

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
    setChoiceOptions([]);
    setChoiceStatus("idle");
    setChoiceMessage("");
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
    if (!question || answerMode !== "choice") {
      setChoiceOptions([]);
      setChoiceStatus("idle");
      setChoiceMessage("");
      return;
    }
    if (result) return;
    startChoiceGeneration(false);
  }, [answerMode, practice, question, result]);

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

  function handleChoicePick(option: string) {
    if (result || !question) return;
    setAnswer(option);
    checkAnswer(option);
  }

  function startChoiceGeneration(force: boolean) {
    if (!question) return;
    const correctAnswer = getAnswer(question.card, question.type);
    if (!correctAnswer.trim()) {
      setChoiceStatus("error");
      setChoiceMessage("選項產生失敗：正確答案為空。");
      return;
    }
    const cacheKey = `${practice}:${question.type}:${question.card.dict}:${correctAnswer}`;
    if (!force) {
      const cached = choiceCache.get(cacheKey);
      if (cached) {
        setChoiceOptions(cached);
        setChoiceStatus("idle");
        setChoiceMessage("");
        return;
      }
    }
    const requestId = (choiceRequestId.current += 1);
    setChoiceStatus("loading");
    setChoiceMessage("");
    buildWrongChoices(correctAnswer, question.card.dict, question.type)
      .then((wrong) => {
        if (choiceRequestId.current !== requestId) return;
        if (!wrong || wrong.length < 3) {
          setChoiceStatus("error");
          setChoiceMessage(
            "選項產生失敗，請確認 Ollama 已啟動且模型可用。",
          );
          return;
        }
        const options = shuffle([correctAnswer, ...wrong.slice(0, 3)]);
        choiceCache.set(cacheKey, options);
        setChoiceOptions(options);
        setChoiceStatus("idle");
      })
      .catch(() => {
        if (choiceRequestId.current !== requestId) return;
        setChoiceStatus("error");
        setChoiceMessage(
          "選項產生失敗，請確認 Ollama 已啟動且模型可用。",
        );
      });
  }

  function handleRegenerateChoices() {
    if (!question || result) return;
    startChoiceGeneration(true);
  }

  async function buildWrongChoices(
    correctAnswer: string,
    dict: string,
    type: Exclude<QuestionType, "mixed">,
  ) {
    const response = await fetch(OLLAMA_GENERATE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_OLLAMA_MODEL,
        prompt: buildChoicePrompt(correctAnswer, dict, type),
        stream: false,
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { response?: string };
    const raw = data.response?.trim();
    if (!raw) return null;
    const items = parseChoiceResponse(raw);
    const unique = Array.from(new Set(items)).filter(
      (item) => item !== correctAnswer,
    );
    return unique.slice(0, 3);
  }

  function handleExport() {
    setBankText(JSON.stringify(bank, null, 2));
    setMessage("已將題庫輸出到文字框。");
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
      <HeaderControls
        practice={practice}
        summaryLine={summaryLine}
        questionType={questionType}
        scope={scope}
        typeOptions={typeOptions}
        scopeLabels={scopeLabels}
        answerMode={answerMode}
        onPracticeChange={setPractice}
        onQuestionTypeChange={(value) =>
          practice === "verb"
            ? setVerbQuestionType(value)
            : setAdjectiveQuestionType(value)
        }
        onScopeChange={(value) =>
          practice === "verb"
            ? setVerbScope(value as VerbScope)
            : setAdjectiveScope(value as AdjectiveScope)
        }
        onAnswerModeChange={setAnswerMode}
      />

      <main className="main">
        <QuestionCard
          question={question}
          emptyMessage={emptyMessage}
          canSpeak={canSpeak}
          isSpeaking={isSpeaking}
          onSpeak={handleSpeak}
          answerMode={answerMode}
          answer={answer}
          onAnswerChange={setAnswer}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          onNext={handleNext}
          result={result}
          choiceStatus={choiceStatus}
          choiceMessage={choiceMessage}
          choiceOptions={choiceOptions}
          onChoicePick={handleChoicePick}
          onRegenerateChoices={handleRegenerateChoices}
          liveZh={liveZh}
          isTranslating={isTranslating}
          example={example}
          exampleStatus={exampleStatus}
          exampleMessage={exampleMessage}
          isExampleSpeaking={isExampleSpeaking}
          onExampleSpeak={handleExampleSpeak}
          dictLabel={dictLabel}
          practice={practice}
        />

        <StatsPanel
          activeStats={activeStats}
          dueCount={dueCount}
          wrongCount={wrongCount}
          scopeLabel={scopeLabels[scope]}
          mode={mode}
          onStartReview={handleStartReview}
          onExitReview={handleExitReview}
        />

        <RulesPanel practice={practice} ruleSummary={ruleSummary} />

        <BankPanel
          practice={practice}
          bankExample={bankExample}
          groupHint={groupHint}
          bankCount={bank.length}
          bankText={bankText}
          onBankTextChange={setBankText}
          quickInput={quickInput}
          onQuickInputChange={setQuickInput}
          onQuickImport={handleQuickImport}
          onExport={handleExport}
          onImport={handleImport}
          onReset={handleResetBank}
          onClearProgress={handleClearProgress}
          isImporting={isImporting}
          message={message}
        />
      </main>
    </div>
  );
}

export default App;
