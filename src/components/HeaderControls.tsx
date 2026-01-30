import type {
  AnswerMode,
  PracticeKind,
  QuestionType,
  Scope,
} from "../types";

const PRACTICE_LABELS: Record<PracticeKind, string> = {
  verb: "動詞",
  adjective: "形容詞",
};

type HeaderControlsProps = {
  practice: PracticeKind;
  summaryLine: string;
  questionType: QuestionType;
  scope: Scope;
  typeOptions: { value: QuestionType; label: string }[];
  scopeLabels: Record<Scope, string>;
  answerMode: AnswerMode;
  onPracticeChange: (value: PracticeKind) => void;
  onQuestionTypeChange: (value: QuestionType) => void;
  onScopeChange: (value: Scope) => void;
  onAnswerModeChange: (value: AnswerMode) => void;
};

export default function HeaderControls({
  practice,
  summaryLine,
  questionType,
  scope,
  typeOptions,
  scopeLabels,
  answerMode,
  onPracticeChange,
  onQuestionTypeChange,
  onScopeChange,
  onAnswerModeChange,
}: HeaderControlsProps) {
  const practiceLabel = PRACTICE_LABELS[practice];

  return (
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
              onPracticeChange(event.target.value as PracticeKind)
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
              onQuestionTypeChange(event.target.value as QuestionType)
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
            onChange={(event) => onScopeChange(event.target.value as Scope)}
          >
            {Object.entries(scopeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          作答方式
          <select
            value={answerMode}
            onChange={(event) =>
              onAnswerModeChange(event.target.value as AnswerMode)
            }
          >
            <option value="input">文字輸入</option>
            <option value="choice">四選一</option>
          </select>
        </label>
      </div>
    </header>
  );
}
