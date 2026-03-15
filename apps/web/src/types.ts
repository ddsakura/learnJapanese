export type PracticeKind = "verb" | "adjective";

export type VerbGroup = "godan" | "ichidan" | "irregular";
export type AdjectiveGroup = "i" | "na";
export type Group = VerbGroup | AdjectiveGroup;

export type Card = {
  dict: string;
  nai: string;
  ta: string;
  nakatta: string;
  te: string;
  potential?: string;
  group: Group;
  zh?: string;
};

export type QuestionType =
  | "nai"
  | "ta"
  | "nakatta"
  | "te"
  | "potential"
  | "mixed";

export type VerbScope = "all" | VerbGroup;
export type AdjectiveScope = "all" | AdjectiveGroup;
export type Scope = VerbScope | AdjectiveScope;

export type SrsState = {
  intervalDays: number;
  due: number;
};

export type PracticeSettings<TScope extends Scope> = {
  scope: TScope;
  type: QuestionType;
};

export type TopicMode = "conjugation" | "transitivity";

export type TransitivityCard = {
  intransitive: string;
  transitive: string;
  reading_i?: string;
  reading_t?: string;
  zh?: string;
  group: "pair";
};

export type TransitivityQuestionType = "find-pair" | "identify";

export type TransitivityQuestion = {
  card: TransitivityCard;
  type: TransitivityQuestionType;
  side: "intransitive" | "transitive";
};

export type Settings = {
  topicMode: TopicMode;
  practice: PracticeKind;
  verb: PracticeSettings<VerbScope>;
  adjective: PracticeSettings<AdjectiveScope>;
  transitivityType: TransitivityQuestionType;
};

export type Stats = {
  streak: number;
  todayCount: number;
  lastDate: string;
};

export type WrongEntry = {
  dict: string;
  type: Exclude<QuestionType, "mixed">;
};

export type WrongToday<TEntry = WrongEntry> = {
  date: string;
  items: TEntry[];
};

export type TransitivityWrongEntry = {
  dict: string;
  type: TransitivityQuestionType;
};

export type ExampleEntry = {
  jp: string;
  reading: string;
  zh: string;
  grammar: string;
};

export type AnswerMode = "input" | "choice";
export type ChoiceStatus = "idle" | "loading" | "error";

export type AnswerResult = {
  correct: boolean;
  correctAnswer: string;
  userAnswer: string;
  type: Exclude<QuestionType, "mixed">;
};

export type TransitivityAnswerResult = {
  correct: boolean;
  correctAnswer: string;
  userAnswer: string;
};

export type Question = {
  card: Card;
  type: Exclude<QuestionType, "mixed">;
};
