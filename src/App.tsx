import { useEffect, useMemo, useState } from 'react'
import './App.css'

type VerbGroup = 'godan' | 'ichidan' | 'irregular'

type VerbCard = {
  dict: string
  nai: string
  ta: string
  nakatta: string
  te: string
  group: VerbGroup
  zh?: string
}

type QuestionType = 'nai' | 'ta' | 'nakatta' | 'te' | 'mixed'

type Scope = 'all' | VerbGroup

type SrsState = {
  intervalDays: number
  due: number
}

type Settings = {
  scope: Scope
  type: QuestionType
}

type Stats = {
  streak: number
  todayCount: number
  lastDate: string
}

type Question = {
  card: VerbCard
  type: Exclude<QuestionType, 'mixed'>
}

const STORAGE_KEYS = {
  bank: 'jlpt-n4-verb-bank',
  srs: 'jlpt-n4-verb-srs',
  stats: 'jlpt-n4-verb-stats',
  settings: 'jlpt-n4-verb-settings',
}

const DAY_MS = 24 * 60 * 60 * 1000
const INCORRECT_DELAY_MS = 2 * 60 * 1000

const DEFAULT_BANK: VerbCard[] = [
  { dict: '行く', nai: '行かない', ta: '行った', nakatta: '行かなかった', te: '行って', group: 'godan' },
  { dict: '書く', nai: '書かない', ta: '書いた', nakatta: '書かなかった', te: '書いて', group: 'godan' },
  { dict: '泳ぐ', nai: '泳がない', ta: '泳いだ', nakatta: '泳がなかった', te: '泳いで', group: 'godan' },
  { dict: '話す', nai: '話さない', ta: '話した', nakatta: '話さなかった', te: '話して', group: 'godan' },
  { dict: '待つ', nai: '待たない', ta: '待った', nakatta: '待たなかった', te: '待って', group: 'godan' },
  { dict: '売る', nai: '売らない', ta: '売った', nakatta: '売らなかった', te: '売って', group: 'godan' },
  { dict: '読む', nai: '読まない', ta: '読んだ', nakatta: '読まなかった', te: '読んで', group: 'godan' },
  { dict: '遊ぶ', nai: '遊ばない', ta: '遊んだ', nakatta: '遊ばなかった', te: '遊んで', group: 'godan' },
  { dict: '死ぬ', nai: '死なない', ta: '死んだ', nakatta: '死なかった', te: '死んで', group: 'godan' },
  { dict: '飲む', nai: '飲まない', ta: '飲んだ', nakatta: '飲まなかった', te: '飲んで', group: 'godan' },
  { dict: '買う', nai: '買わない', ta: '買った', nakatta: '買わなかった', te: '買って', group: 'godan' },
  { dict: '使う', nai: '使わない', ta: '使った', nakatta: '使わなかった', te: '使って', group: 'godan' },
  { dict: '会う', nai: '会わない', ta: '会った', nakatta: '会わなかった', te: '会って', group: 'godan' },
  { dict: '立つ', nai: '立たない', ta: '立った', nakatta: '立たなかった', te: '立って', group: 'godan' },
  { dict: '撮る', nai: '撮らない', ta: '撮った', nakatta: '撮らなかった', te: '撮って', group: 'godan' },
  { dict: '帰る', nai: '帰らない', ta: '帰った', nakatta: '帰らなかった', te: '帰って', group: 'godan' },
  { dict: '走る', nai: '走らない', ta: '走った', nakatta: '走らなかった', te: '走って', group: 'godan' },
  { dict: '聞く', nai: '聞かない', ta: '聞いた', nakatta: '聞かなかった', te: '聞いて', group: 'godan' },
  { dict: '脱ぐ', nai: '脱がない', ta: '脱いだ', nakatta: '脱がなかった', te: '脱いで', group: 'godan' },
  { dict: '消す', nai: '消さない', ta: '消した', nakatta: '消さなかった', te: '消して', group: 'godan' },
  { dict: '食べる', nai: '食べない', ta: '食べた', nakatta: '食べなかった', te: '食べて', group: 'ichidan' },
  { dict: '見る', nai: '見ない', ta: '見た', nakatta: '見なかった', te: '見て', group: 'ichidan' },
  { dict: '起きる', nai: '起きない', ta: '起きた', nakatta: '起きなかった', te: '起きて', group: 'ichidan' },
  { dict: '寝る', nai: '寝ない', ta: '寝た', nakatta: '寝なかった', te: '寝て', group: 'ichidan' },
  { dict: '教える', nai: '教えない', ta: '教えた', nakatta: '教えなかった', te: '教えて', group: 'ichidan' },
  { dict: '借りる', nai: '借りない', ta: '借りた', nakatta: '借りなかった', te: '借りて', group: 'ichidan' },
  { dict: '浴びる', nai: '浴びない', ta: '浴びた', nakatta: '浴びなかった', te: '浴びて', group: 'ichidan' },
  { dict: 'する', nai: 'しない', ta: 'した', nakatta: 'しなかった', te: 'して', group: 'irregular' },
  { dict: 'くる', nai: 'こない', ta: 'きた', nakatta: 'こなかった', te: 'きて', group: 'irregular' },
]

const QUESTION_LABELS: Record<Exclude<QuestionType, 'mixed'>, string> = {
  nai: 'ない形',
  ta: 'た形',
  nakatta: 'なかった形',
  te: 'て形',
}

const SCOPE_LABELS: Record<Scope, string> = {
  all: '全部',
  godan: '五段',
  ichidan: '二段',
  irregular: '不規則',
}

const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'mixed', label: '混合' },
  { value: 'nai', label: 'ない形' },
  { value: 'ta', label: 'た形' },
  { value: 'nakatta', label: 'なかった形' },
  { value: 'te', label: 'て形' },
]

const TYPE_KEYS: Exclude<QuestionType, 'mixed'>[] = ['nai', 'ta', 'nakatta', 'te']

const defaultStats = (): Stats => ({
  streak: 0,
  todayCount: 0,
  lastDate: getTodayKey(),
})

const defaultSettings = (): Settings => ({
  scope: 'all',
  type: 'mixed',
})

const GODAN_RU_EXCEPTIONS = new Set([
  '帰る',
  '走る',
  '入る',
  '切る',
  '知る',
  '要る',
  '喋る',
  '滑る',
  '減る',
  '焦る',
  '限る',
])

function getTodayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(key, JSON.stringify(value))
}

function normalizeStats(stats: Stats) {
  const today = getTodayKey()
  if (stats.lastDate !== today) {
    return { ...stats, todayCount: 0, lastDate: today }
  }
  return stats
}

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

function getPool(bank: VerbCard[], scope: Scope) {
  if (scope === 'all') return bank
  return bank.filter((card) => card.group === scope)
}

function getAnswer(card: VerbCard, type: Exclude<QuestionType, 'mixed'>) {
  return card[type]
}

function validateBank(data: unknown): data is VerbCard[] {
  if (!Array.isArray(data)) return false
  return data.every((item) => {
    if (typeof item !== 'object' || item === null) return false
    const record = item as Record<string, unknown>
    const requiredKeys = ['dict', 'nai', 'ta', 'nakatta', 'te', 'group']
    if (!requiredKeys.every((key) => typeof record[key] === 'string')) return false
    const group = record.group as string
    return group === 'godan' || group === 'ichidan' || group === 'irregular'
  })
}

function isKana(char: string) {
  return /[ぁ-ゖァ-ヺ]/.test(char)
}

function isIchidan(dict: string) {
  if (!dict.endsWith('る')) return false
  if (GODAN_RU_EXCEPTIONS.has(dict)) return false
  const before = dict.slice(-2, -1)
  if (!before) return false
  if (!isKana(before)) return false
  return /[いきぎしじちぢにひびぴみりえけげせぜてでねへべぺめれ]/.test(before)
}

function inferGroup(dict: string): VerbGroup {
  if (dict.endsWith('する')) return 'irregular'
  if (dict.endsWith('くる') || dict.endsWith('来る')) return 'irregular'
  if (isIchidan(dict)) return 'ichidan'
  return 'godan'
}

function buildNakatta(nai: string) {
  return nai.endsWith('ない') ? `${nai.slice(0, -2)}なかった` : `${nai}なかった`
}

function conjugate(dict: string, group: VerbGroup): VerbCard | null {
  if (group === 'irregular') {
    if (dict.endsWith('する')) {
      const base = dict.slice(0, -2)
      const nai = `${base}しない`
      return {
        dict,
        nai,
        ta: `${base}した`,
        nakatta: `${base}しなかった`,
        te: `${base}して`,
        group,
      }
    }
    if (dict.endsWith('くる') || dict.endsWith('来る')) {
      const base = dict.endsWith('くる') ? dict.slice(0, -2) : dict.slice(0, -1)
      const nai = `${base}こない`
      return {
        dict,
        nai,
        ta: `${base}きた`,
        nakatta: `${base}こなかった`,
        te: `${base}きて`,
        group,
      }
    }
    return null
  }

  if (group === 'ichidan') {
    if (!dict.endsWith('る')) return null
    const stem = dict.slice(0, -1)
    const nai = `${stem}ない`
    return {
      dict,
      nai,
      ta: `${stem}た`,
      nakatta: `${stem}なかった`,
      te: `${stem}て`,
      group,
    }
  }

  const last = dict.slice(-1)
  const stem = dict.slice(0, -1)
  let nai = ''
  let ta = ''
  let te = ''

  switch (last) {
    case 'う':
      nai = `${stem}わない`
      ta = `${stem}った`
      te = `${stem}って`
      break
    case 'つ':
      nai = `${stem}たない`
      ta = `${stem}った`
      te = `${stem}って`
      break
    case 'る':
      nai = `${stem}らない`
      ta = `${stem}った`
      te = `${stem}って`
      break
    case 'ぶ':
      nai = `${stem}ばない`
      ta = `${stem}んだ`
      te = `${stem}んで`
      break
    case 'む':
      nai = `${stem}まない`
      ta = `${stem}んだ`
      te = `${stem}んで`
      break
    case 'ぬ':
      nai = `${stem}なない`
      ta = `${stem}んだ`
      te = `${stem}んで`
      break
    case 'く':
      nai = `${stem}かない`
      if (dict.endsWith('行く')) {
        ta = `${stem}った`
        te = `${stem}って`
      } else {
        ta = `${stem}いた`
        te = `${stem}いて`
      }
      break
    case 'ぐ':
      nai = `${stem}がない`
      ta = `${stem}いだ`
      te = `${stem}いで`
      break
    case 'す':
      nai = `${stem}さない`
      ta = `${stem}した`
      te = `${stem}して`
      break
    default:
      return null
  }

  return {
    dict,
    nai,
    ta,
    nakatta: buildNakatta(nai),
    te,
    group,
  }
}

function normalizeImport(data: unknown): { ok: true; bank: VerbCard[] } | { ok: false; error: string } {
  if (!Array.isArray(data)) {
    return { ok: false, error: 'JSON 必須為陣列。' }
  }

  const bank: VerbCard[] = []
  for (const item of data) {
    if (typeof item === 'string') {
      const dict = item.trim()
      if (!dict) return { ok: false, error: '存在空的動詞項目。' }
      const group = inferGroup(dict)
      const generated = conjugate(dict, group)
      if (!generated) return { ok: false, error: `無法推導：${dict}` }
      bank.push(generated)
      continue
    }

    if (typeof item !== 'object' || item === null) {
      return { ok: false, error: '題庫項目格式錯誤。' }
    }

    const record = item as Record<string, unknown>
    const dict = typeof record.dict === 'string' ? record.dict.trim() : ''
    if (!dict) return { ok: false, error: '每筆資料需包含 dict。' }
    const groupValue = typeof record.group === 'string' ? record.group : undefined
    const group = groupValue === 'godan' || groupValue === 'ichidan' || groupValue === 'irregular' ? groupValue : inferGroup(dict)

    if (validateBank([record as VerbCard])) {
      bank.push(record as VerbCard)
      continue
    }

    const generated = conjugate(dict, group)
    if (!generated) return { ok: false, error: `無法推導：${dict}` }
    const overrides: Partial<VerbCard> = {}
    if (typeof record.nai === 'string' && record.nai.trim()) overrides.nai = record.nai.trim()
    if (typeof record.ta === 'string' && record.ta.trim()) overrides.ta = record.ta.trim()
    if (typeof record.nakatta === 'string' && record.nakatta.trim())
      overrides.nakatta = record.nakatta.trim()
    if (typeof record.te === 'string' && record.te.trim()) overrides.te = record.te.trim()
    if (typeof record.zh === 'string' && record.zh.trim()) overrides.zh = record.zh.trim()

    bank.push({ ...generated, ...overrides, group })
  }

  return { ok: true, bank }
}

const translationCache = new Map<string, string>()

async function fetchZhTranslation(dict: string) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(dict)}&langpair=ja|zh-TW`
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const data = (await response.json()) as { responseData?: { translatedText?: string } }
    const text = data.responseData?.translatedText?.trim()
    if (!text || text === dict) return null
    return text
  } catch {
    return null
  }
}

async function enrichTranslations(cards: VerbCard[], existing: VerbCard[]) {
  const existingMap = new Map<string, string>()
  existing.forEach((card) => {
    if (card.zh?.trim()) existingMap.set(card.dict, card.zh.trim())
  })

  const enriched: VerbCard[] = []
  for (const card of cards) {
    const current = card.zh?.trim()
    if (current) {
      enriched.push(card)
      continue
    }
    const cached = translationCache.get(card.dict) ?? existingMap.get(card.dict)
    if (cached) {
      enriched.push({ ...card, zh: cached })
      continue
    }
    const fetched = await fetchZhTranslation(card.dict)
    if (fetched) translationCache.set(card.dict, fetched)
    enriched.push(fetched ? { ...card, zh: fetched } : card)
  }
  return enriched
}

function App() {
  const [bank, setBank] = useState<VerbCard[]>(() =>
    loadFromStorage(STORAGE_KEYS.bank, DEFAULT_BANK)
  )
  const [srs, setSrs] = useState<Record<string, SrsState>>(() =>
    loadFromStorage(STORAGE_KEYS.srs, {})
  )
  const [stats, setStats] = useState<Stats>(() =>
    normalizeStats(loadFromStorage(STORAGE_KEYS.stats, defaultStats()))
  )
  const [scope, setScope] = useState<Scope>(() => {
    const saved = loadFromStorage<Settings>(STORAGE_KEYS.settings, defaultSettings())
    return saved.scope
  })
  const [questionType, setQuestionType] = useState<QuestionType>(() => {
    const saved = loadFromStorage<Settings>(STORAGE_KEYS.settings, defaultSettings())
    return saved.type
  })
  const [question, setQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<{
    correct: boolean
    correctAnswer: string
    userAnswer: string
    type: Exclude<QuestionType, 'mixed'>
  } | null>(null)
  const [message, setMessage] = useState<string>('')
  const [bankText, setBankText] = useState('')
  const [quickInput, setQuickInput] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.bank, bank)
  }, [bank])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.srs, srs)
  }, [srs])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.stats, stats)
  }, [stats])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.settings, { scope, type: questionType })
  }, [scope, questionType])

  useEffect(() => {
    setStats((prev) => normalizeStats(prev))
  }, [])

  useEffect(() => {
    setQuestion(makeQuestion())
    setAnswer('')
    setResult(null)
  }, [scope, questionType, bank])

  const pool = useMemo(() => getPool(bank, scope), [bank, scope])

  const dueCount = useMemo(() => {
    const now = Date.now()
    return pool.filter((card) => (srs[card.dict]?.due ?? 0) <= now).length
  }, [pool, srs])

  function makeQuestion(): Question | null {
    const candidatePool = getPool(bank, scope)
    if (candidatePool.length === 0) return null
    const now = Date.now()
    const dueCards = candidatePool.filter((card) => (srs[card.dict]?.due ?? 0) <= now)
    const card = dueCards.length > 0 ? pickRandom(dueCards) : pickRandom(candidatePool)
    const actualType =
      questionType === 'mixed' ? pickRandom(TYPE_KEYS) : (questionType as Exclude<QuestionType, 'mixed'>)
    return { card, type: actualType }
  }

  function applySrs(card: VerbCard, isCorrect: boolean) {
    setSrs((prev) => {
      const current = prev[card.dict]
      const intervalDays = isCorrect ? Math.max(1, (current?.intervalDays ?? 0) * 2 || 1) : 0
      const due = isCorrect ? Date.now() + intervalDays * DAY_MS : Date.now() + INCORRECT_DELAY_MS
      return {
        ...prev,
        [card.dict]: { intervalDays, due },
      }
    })
  }

  function updateStats(isCorrect: boolean) {
    setStats((prev) => {
      const normalized = normalizeStats(prev)
      return {
        ...normalized,
        todayCount: normalized.todayCount + 1,
        streak: isCorrect ? normalized.streak + 1 : 0,
      }
    })
  }

  function checkAnswer(submitted: string, forcedIncorrect = false) {
    if (!question) return
    const correctAnswer = getAnswer(question.card, question.type)
    const trimmed = submitted.trim()
    const isCorrect = !forcedIncorrect && trimmed === correctAnswer
    applySrs(question.card, isCorrect)
    updateStats(isCorrect)
    setResult({
      correct: isCorrect,
      correctAnswer,
      userAnswer: trimmed,
      type: question.type,
    })
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (result || !question) return
    checkAnswer(answer)
  }

  function handleSkip() {
    if (!question || result) return
    checkAnswer('', true)
  }

  function handleNext() {
    setQuestion(makeQuestion())
    setAnswer('')
    setResult(null)
  }

  function handleExport() {
    setBankText(JSON.stringify(bank, null, 2))
    setMessage('已將題庫輸出到文字框。')
  }

  function mergeBank(existing: VerbCard[], incoming: VerbCard[]) {
    const map = new Map<string, VerbCard>()
    existing.forEach((card) => map.set(card.dict, card))
    incoming.forEach((card) => {
      const current = map.get(card.dict)
      if (current?.zh && !card.zh) {
        map.set(card.dict, { ...card, zh: current.zh })
        return
      }
      map.set(card.dict, card)
    })
    return Array.from(map.values())
  }

  async function handleImport() {
    setMessage('')
    setIsImporting(true)
    try {
      const parsed = JSON.parse(bankText)
      const normalized = normalizeImport(parsed)
      if (!normalized.ok) {
        setMessage(`匯入失敗：${normalized.error}`)
        return
      }
      setMessage('正在查詢中文翻譯...')
      const enriched = await enrichTranslations(normalized.bank, bank)
      setBank((prev) => mergeBank(prev, enriched))
      setSrs({})
      setStats(defaultStats())
      setQuestion(makeQuestion())
      setAnswer('')
      setResult(null)
      setMessage('匯入成功，已合併題庫並清空學習紀錄。')
    } catch {
      setMessage('匯入失敗：JSON 解析錯誤。')
    } finally {
      setIsImporting(false)
    }
  }

  async function handleQuickImport() {
    setMessage('')
    const entries = quickInput
      .split(/[\s,]+/)
      .map((value) => value.trim())
      .filter(Boolean)
    if (entries.length === 0) {
      setMessage('請先輸入動詞。')
      return
    }
    const normalized = normalizeImport(entries)
    if (!normalized.ok) {
      setMessage(`匯入失敗：${normalized.error}`)
      return
    }
    setIsImporting(true)
    try {
      setMessage('正在查詢中文翻譯...')
      const enriched = await enrichTranslations(normalized.bank, bank)
      setBank((prev) => mergeBank(prev, enriched))
      setSrs({})
      setStats(defaultStats())
      setQuestion(makeQuestion())
      setAnswer('')
      setResult(null)
      setQuickInput('')
      setMessage('匯入成功，已合併題庫並清空學習紀錄。')
    } finally {
      setIsImporting(false)
    }
  }

  function handleResetBank() {
    setBank(DEFAULT_BANK)
    setSrs({})
    setStats(defaultStats())
    setQuestion(makeQuestion())
    setAnswer('')
    setResult(null)
    setMessage('已重置為內建題庫。')
  }

  function handleClearProgress() {
    setSrs({})
    setStats(defaultStats())
    setMessage('已清空學習紀錄。')
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>JLPT N4 普通形動詞變化練習</h1>
          <p>ない形／た形／なかった形／て形・快速刷題 + 簡易 SRS</p>
        </div>
        <div className="controls">
          <label>
            題型
            <select
              value={questionType}
              onChange={(event) => setQuestionType(event.target.value as QuestionType)}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            範圍
            <select value={scope} onChange={(event) => setScope(event.target.value as Scope)}>
              {Object.entries(SCOPE_LABELS).map(([value, label]) => (
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
              <div className="empty">目前題庫沒有可用題目</div>
            )}
          </div>
          {question && (
            <div className="dictionary-link">
              <a
                href={`https://mazii.net/zh-TW/search/word/jatw/${encodeURIComponent(
                  question.card.dict
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
              <button type="button" className="ghost" onClick={handleSkip} disabled={!question || Boolean(result)}>
                略過
              </button>
              <button type="button" className="secondary" onClick={handleNext} disabled={!question || !result}>
                下一題
              </button>
            </div>
          </form>

          <div className="result">
            {result ? (
              <div className={result.correct ? 'correct' : 'wrong'}>
                <div className="badge">{result.correct ? '✅ 正確' : '❌ 錯誤 / 略過'}</div>
                <div className="result-row">
                  <span>題型</span>
                  <strong>{QUESTION_LABELS[result.type]}</strong>
                </div>
                <div className="result-row">
                  <span>我的答案</span>
                  <strong>{result.userAnswer || '（空白）'}</strong>
                </div>
                <div className="result-row">
                  <span>正確答案</span>
                  <strong>{result.correctAnswer}</strong>
                </div>
                {question && (
                  <div className="result-row">
                    <span>中文</span>
                    <strong>{question.card.zh?.trim() || '（未取得）'}</strong>
                  </div>
                )}
                {question && (
                  <div className="result-forms">
                    <div className="result-forms-title">全部形</div>
                    <div className="result-forms-grid">
                      <span>辭書形</span>
                      <strong>{question.card.dict}</strong>
                      <span>ない形</span>
                      <strong>{question.card.nai}</strong>
                      <span>た形</span>
                      <strong>{question.card.ta}</strong>
                      <span>なかった形</span>
                      <strong>{question.card.nakatta}</strong>
                      <span>て形</span>
                      <strong>{question.card.te}</strong>
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
            <div className="value">{stats.todayCount}</div>
          </div>
          <div>
            <div className="label">連續答對</div>
            <div className="value">{stats.streak}</div>
          </div>
          <div>
            <div className="label">待複習數</div>
            <div className="value">{dueCount}</div>
          </div>
          <div>
            <div className="label">目前範圍</div>
            <div className="value">{SCOPE_LABELS[scope]}</div>
          </div>
        </section>

        <details className="rules">
          <summary>た形・て形 變形規則</summary>
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
                <div className="rule-title">する／くる</div>
                <div className="rule-line">た形：した／きた</div>
                <div className="rule-line">て形：して／きて</div>
              </div>
            </div>
          </div>
        </details>

        <details className="bank">
          <summary>題庫管理</summary>
          <div className="bank-body">
            <div className="bank-guide">
              <p>匯入會覆蓋題庫並清空學習紀錄。匯出可直接複製。</p>
              <div className="steps">
                <div className="step">
                  <span>1.</span> 點「匯出題庫」可取得目前 JSON。
                </div>
                <div className="step">
                  <span>2.</span> 貼上你的 JSON（支援只給辭書形）。
                </div>
                <div className="step">
                  <span>3.</span> 點「匯入題庫」立即生效。
                </div>
              </div>
              <div className="group-hint">
                group 代碼：godan = 五段、ichidan = 二段、irregular = 不規則；可選 zh 欄位放中文翻譯
              </div>
              <pre className="example">
{`[
  "行く",
  "見る",
  { "dict": "帰る", "group": "godan" },
  { "dict": "勉強する", "group": "irregular", "zh": "念書" }
]`}
              </pre>
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
                placeholder="直接輸入動詞（可用空白或逗號分隔）"
                disabled={isImporting}
              />
              <button type="button" onClick={handleQuickImport} className="secondary" disabled={isImporting}>
                直接匯入動詞
              </button>
            </div>
            <div className="bank-actions">
              <button type="button" onClick={handleExport} disabled={isImporting}>
                匯出題庫
              </button>
              <button type="button" onClick={handleImport} className="secondary" disabled={isImporting}>
                匯入題庫
              </button>
              <button type="button" onClick={handleResetBank} className="ghost" disabled={isImporting}>
                重置題庫
              </button>
              <button type="button" onClick={handleClearProgress} className="ghost" disabled={isImporting}>
                清空學習紀錄
              </button>
            </div>
            {message && <div className="message">{message}</div>}
          </div>
        </details>
      </main>
    </div>
  )
}

export default App
