export type VerbGroup = 'godan' | 'ichidan' | 'irregular'

export type VerbCard = {
  dict: string
  nai: string
  ta: string
  nakatta: string
  te: string
  group: VerbGroup
  zh?: string
}

export type QuestionType = 'nai' | 'ta' | 'nakatta' | 'te' | 'mixed'

export type Scope = 'all' | VerbGroup

export type SrsState = {
  intervalDays: number
  due: number
}

export type Settings = {
  scope: Scope
  type: QuestionType
}

export type Stats = {
  streak: number
  todayCount: number
  lastDate: string
}

export type WrongEntry = {
  dict: string
  type: Exclude<QuestionType, 'mixed'>
}

export type WrongToday = {
  date: string
  items: WrongEntry[]
}

export type Question = {
  card: VerbCard
  type: Exclude<QuestionType, 'mixed'>
}
