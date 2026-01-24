import type { QuestionType, Scope, VerbCard } from '../types'

export const STORAGE_KEYS = {
  bank: 'jlpt-n4-verb-bank',
  srs: 'jlpt-n4-verb-srs',
  stats: 'jlpt-n4-verb-stats',
  settings: 'jlpt-n4-verb-settings',
  wrong: 'jlpt-n4-verb-wrong-today',
}

export const DAY_MS = 24 * 60 * 60 * 1000
export const INCORRECT_DELAY_MS = 2 * 60 * 1000

export const DEFAULT_BANK: VerbCard[] = [
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

export const QUESTION_LABELS: Record<Exclude<QuestionType, 'mixed'>, string> = {
  nai: 'ない形',
  ta: 'た形',
  nakatta: 'なかった形',
  te: 'て形',
}

export const SCOPE_LABELS: Record<Scope, string> = {
  all: '全部',
  godan: '五段',
  ichidan: '二段',
  irregular: '不規則',
}

export const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'mixed', label: '混合' },
  { value: 'nai', label: 'ない形' },
  { value: 'ta', label: 'た形' },
  { value: 'nakatta', label: 'なかった形' },
  { value: 'te', label: 'て形' },
]

export const TYPE_KEYS: Exclude<QuestionType, 'mixed'>[] = ['nai', 'ta', 'nakatta', 'te']

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
