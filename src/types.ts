export type PracticeKind = 'verb' | 'adjective'

export type VerbGroup = 'godan' | 'ichidan' | 'irregular'
export type AdjectiveGroup = 'i' | 'na'
export type Group = VerbGroup | AdjectiveGroup

export type Card = {
  dict: string
  nai: string
  ta: string
  nakatta: string
  te: string
  potential?: string
  group: Group
  zh?: string
}

export type QuestionType = 'nai' | 'ta' | 'nakatta' | 'te' | 'potential' | 'mixed'

export type VerbScope = 'all' | VerbGroup
export type AdjectiveScope = 'all' | AdjectiveGroup
export type Scope = VerbScope | AdjectiveScope

export type SrsState = {
  intervalDays: number
  due: number
}

export type PracticeSettings<TScope extends Scope> = {
  scope: TScope
  type: QuestionType
}

export type Settings = {
  practice: PracticeKind
  verb: PracticeSettings<VerbScope>
  adjective: PracticeSettings<AdjectiveScope>
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
  card: Card
  type: Exclude<QuestionType, 'mixed'>
}
