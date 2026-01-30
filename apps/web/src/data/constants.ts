import type {
  AdjectiveScope,
  QuestionType,
  VerbScope,
  Card,
} from '../types'

export const STORAGE_KEYS = {
  bank: {
    verb: 'jlpt-n4-verb-bank',
    adjective: 'jlpt-n4-adjective-bank',
  },
  srs: {
    verb: 'jlpt-n4-verb-srs',
    adjective: 'jlpt-n4-adjective-srs',
  },
  stats: {
    verb: 'jlpt-n4-verb-stats',
    adjective: 'jlpt-n4-adjective-stats',
  },
  settings: 'jlpt-n4-practice-settings',
  wrong: {
    verb: 'jlpt-n4-verb-wrong-today',
    adjective: 'jlpt-n4-adjective-wrong-today',
  },
  examples: 'jlpt-n4-example-cache',
  answerMode: 'jlpt-n4-answer-mode',
}

export const DAY_MS = 24 * 60 * 60 * 1000
export const INCORRECT_DELAY_MS = 2 * 60 * 1000
export const OLLAMA_ENDPOINT = 'http://127.0.0.1:11434/api/generate'
export const DEV_OLLAMA_ENDPOINT = '/ollama/api/generate'
export const DEFAULT_OLLAMA_MODEL = 'translategemma:12b'

export const DEFAULT_VERB_BANK: Card[] = [
  { dict: '行く', nai: '行かない', ta: '行った', nakatta: '行かなかった', te: '行って', potential: '行ける', group: 'godan' },
  { dict: '書く', nai: '書かない', ta: '書いた', nakatta: '書かなかった', te: '書いて', potential: '書ける', group: 'godan' },
  { dict: '泳ぐ', nai: '泳がない', ta: '泳いだ', nakatta: '泳がなかった', te: '泳いで', potential: '泳げる', group: 'godan' },
  { dict: '話す', nai: '話さない', ta: '話した', nakatta: '話さなかった', te: '話して', potential: '話せる', group: 'godan' },
  { dict: '待つ', nai: '待たない', ta: '待った', nakatta: '待たなかった', te: '待って', potential: '待てる', group: 'godan' },
  { dict: '売る', nai: '売らない', ta: '売った', nakatta: '売らなかった', te: '売って', potential: '売れる', group: 'godan' },
  { dict: '読む', nai: '読まない', ta: '読んだ', nakatta: '読まなかった', te: '読んで', potential: '読める', group: 'godan' },
  { dict: '遊ぶ', nai: '遊ばない', ta: '遊んだ', nakatta: '遊ばなかった', te: '遊んで', potential: '遊べる', group: 'godan' },
  { dict: '死ぬ', nai: '死なない', ta: '死んだ', nakatta: '死なかった', te: '死んで', potential: '死ねる', group: 'godan' },
  { dict: '飲む', nai: '飲まない', ta: '飲んだ', nakatta: '飲まなかった', te: '飲んで', potential: '飲める', group: 'godan' },
  { dict: '買う', nai: '買わない', ta: '買った', nakatta: '買わなかった', te: '買って', potential: '買える', group: 'godan' },
  { dict: '使う', nai: '使わない', ta: '使った', nakatta: '使わなかった', te: '使って', potential: '使える', group: 'godan' },
  { dict: '会う', nai: '会わない', ta: '会った', nakatta: '会わなかった', te: '会って', potential: '会える', group: 'godan' },
  { dict: '立つ', nai: '立たない', ta: '立った', nakatta: '立たなかった', te: '立って', potential: '立てる', group: 'godan' },
  { dict: '撮る', nai: '撮らない', ta: '撮った', nakatta: '撮らなかった', te: '撮って', potential: '撮れる', group: 'godan' },
  { dict: '帰る', nai: '帰らない', ta: '帰った', nakatta: '帰らなかった', te: '帰って', potential: '帰れる', group: 'godan' },
  { dict: '走る', nai: '走らない', ta: '走った', nakatta: '走らなかった', te: '走って', potential: '走れる', group: 'godan' },
  { dict: '聞く', nai: '聞かない', ta: '聞いた', nakatta: '聞かなかった', te: '聞いて', potential: '聞ける', group: 'godan' },
  { dict: '脱ぐ', nai: '脱がない', ta: '脱いだ', nakatta: '脱がなかった', te: '脱いで', potential: '脱げる', group: 'godan' },
  { dict: '消す', nai: '消さない', ta: '消した', nakatta: '消さなかった', te: '消して', potential: '消せる', group: 'godan' },
  { dict: '食べる', nai: '食べない', ta: '食べた', nakatta: '食べなかった', te: '食べて', potential: '食べられる', group: 'ichidan' },
  { dict: '見る', nai: '見ない', ta: '見た', nakatta: '見なかった', te: '見て', potential: '見られる', group: 'ichidan' },
  { dict: '起きる', nai: '起きない', ta: '起きた', nakatta: '起きなかった', te: '起きて', potential: '起きられる', group: 'ichidan' },
  { dict: '寝る', nai: '寝ない', ta: '寝た', nakatta: '寝なかった', te: '寝て', potential: '寝られる', group: 'ichidan' },
  { dict: '教える', nai: '教えない', ta: '教えた', nakatta: '教えなかった', te: '教えて', potential: '教えられる', group: 'ichidan' },
  { dict: '借りる', nai: '借りない', ta: '借りた', nakatta: '借りなかった', te: '借りて', potential: '借りられる', group: 'ichidan' },
  { dict: '浴びる', nai: '浴びない', ta: '浴びた', nakatta: '浴びなかった', te: '浴びて', potential: '浴びられる', group: 'ichidan' },
  { dict: 'する', nai: 'しない', ta: 'した', nakatta: 'しなかった', te: 'して', potential: 'できる', group: 'irregular' },
  { dict: 'くる', nai: 'こない', ta: 'きた', nakatta: 'こなかった', te: 'きて', potential: 'こられる', group: 'irregular' },
]

export const DEFAULT_ADJECTIVE_BANK: Card[] = [
  { dict: '新しい', nai: '新しくない', ta: '新しかった', nakatta: '新しくなかった', te: '新しくて', group: 'i' },
  { dict: '面白い', nai: '面白くない', ta: '面白かった', nakatta: '面白くなかった', te: '面白くて', group: 'i' },
  { dict: '高い', nai: '高くない', ta: '高かった', nakatta: '高くなかった', te: '高くて', group: 'i' },
  { dict: '安い', nai: '安くない', ta: '安かった', nakatta: '安くなかった', te: '安くて', group: 'i' },
  { dict: '暑い', nai: '暑くない', ta: '暑かった', nakatta: '暑くなかった', te: '暑くて', group: 'i' },
  { dict: '寒い', nai: '寒くない', ta: '寒かった', nakatta: '寒くなかった', te: '寒くて', group: 'i' },
  { dict: '忙しい', nai: '忙しくない', ta: '忙しかった', nakatta: '忙しくなかった', te: '忙しくて', group: 'i' },
  { dict: '元気', nai: '元気じゃない', ta: '元気だった', nakatta: '元気じゃなかった', te: '元気で', group: 'na' },
  { dict: '静か', nai: '静かじゃない', ta: '静かだった', nakatta: '静かじゃなかった', te: '静かで', group: 'na' },
  { dict: '便利', nai: '便利じゃない', ta: '便利だった', nakatta: '便利じゃなかった', te: '便利で', group: 'na' },
  { dict: '有名', nai: '有名じゃない', ta: '有名だった', nakatta: '有名じゃなかった', te: '有名で', group: 'na' },
  { dict: 'きれい', nai: 'きれいじゃない', ta: 'きれいだった', nakatta: 'きれいじゃなかった', te: 'きれいで', group: 'na' },
]

export const QUESTION_LABELS: Record<Exclude<QuestionType, 'mixed'>, string> = {
  nai: 'ない形',
  ta: 'た形',
  nakatta: 'なかった形',
  te: 'て形',
  potential: '可能形',
}

export const VERB_SCOPE_LABELS: Record<VerbScope, string> = {
  all: '全部',
  godan: '五段',
  ichidan: '二段',
  irregular: '不規則',
}

export const ADJECTIVE_SCOPE_LABELS: Record<AdjectiveScope, string> = {
  all: '全部',
  i: 'い形',
  na: 'な形',
}

export const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'mixed', label: '混合' },
  { value: 'nai', label: 'ない形' },
  { value: 'ta', label: 'た形' },
  { value: 'nakatta', label: 'なかった形' },
  { value: 'te', label: 'て形' },
  { value: 'potential', label: '可能形' },
]

export const TYPE_KEYS: Exclude<QuestionType, 'mixed'>[] = [
  'nai',
  'ta',
  'nakatta',
  'te',
  'potential',
]

export const GODAN_RU_EXCEPTIONS = new Set([
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

export const NA_ADJECTIVE_I_EXCEPTIONS = new Set([
  'きれい',
  '嫌い',
  'きらい',
])
