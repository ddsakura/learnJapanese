import type {
  AnswerMode,
  PracticeKind,
  QuestionType,
  Scope,
  TopicMode,
  TransitivityQuestionType,
} from "../types";
import { TRANSITIVITY_QUESTION_LABELS } from "../data/constants";

const PRACTICE_LABELS: Record<PracticeKind, string> = {
  verb: "動詞",
  adjective: "形容詞",
};

type HeaderControlsProps = {
  topicMode: TopicMode;
  practice: PracticeKind;
  summaryLine: string;
  questionType: QuestionType;
  scope: Scope;
  typeOptions: { value: QuestionType; label: string }[];
  scopeLabels: Record<Scope, string>;
  answerMode: AnswerMode;
  canSpeak: boolean;
  speechVoices: SpeechSynthesisVoice[];
  speechVoiceURI: string;
  speechRate: number;
  transitivityType: TransitivityQuestionType;
  onTopicModeChange: (value: TopicMode) => void;
  onPracticeChange: (value: PracticeKind) => void;
  onQuestionTypeChange: (value: QuestionType) => void;
  onScopeChange: (value: Scope) => void;
  onAnswerModeChange: (value: AnswerMode) => void;
  onSpeechVoiceChange: (value: string) => void;
  onSpeechRateChange: (value: number) => void;
  onTransitivityTypeChange: (value: TransitivityQuestionType) => void;
};

export default function HeaderControls({
  topicMode,
  practice,
  summaryLine,
  questionType,
  scope,
  typeOptions,
  scopeLabels,
  answerMode,
  canSpeak,
  speechVoices,
  speechVoiceURI,
  speechRate,
  transitivityType,
  onTopicModeChange,
  onPracticeChange,
  onQuestionTypeChange,
  onScopeChange,
  onAnswerModeChange,
  onSpeechVoiceChange,
  onSpeechRateChange,
  onTransitivityTypeChange,
}: HeaderControlsProps) {
  const practiceLabel =
    topicMode === "conjugation" ? PRACTICE_LABELS[practice] : "自他動詞";
  const title =
    topicMode === "conjugation"
      ? `JLPT N4 普通形${practiceLabel}變化練習`
      : "JLPT N4 自動詞・他動詞練習";

  return (
    <header className="header">
      <div>
        <h1>{title}</h1>
        <p>
          {topicMode === "conjugation"
            ? summaryLine
            : "自動詞・他動詞・找配對＋判斷自他"}
        </p>
      </div>
      <div className="controls">
        <label>
          主題
          <select
            value={topicMode}
            onChange={(event) =>
              onTopicModeChange(event.target.value as TopicMode)
            }
          >
            <option value="conjugation">活用練習</option>
            <option value="transitivity">自他動詞</option>
          </select>
        </label>
        {topicMode === "conjugation" && (
          <>
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
          </>
        )}
        {topicMode === "transitivity" && (
          <label>
            題型
            <select
              value={transitivityType}
              onChange={(event) =>
                onTransitivityTypeChange(
                  event.target.value as TransitivityQuestionType,
                )
              }
            >
              {Object.entries(TRANSITIVITY_QUESTION_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
        )}
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
        <label>
          日文語音
          <select
            value={speechVoiceURI}
            onChange={(event) => onSpeechVoiceChange(event.target.value)}
            disabled={!canSpeak}
          >
            <option value="">瀏覽器預設</option>
            {speechVoices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name}（{voice.lang}）
              </option>
            ))}
          </select>
        </label>
        <label className="rate-control">
          語速 {speechRate.toFixed(2)}
          <input
            type="range"
            min="0.7"
            max="1.15"
            step="0.05"
            value={speechRate}
            onChange={(event) =>
              onSpeechRateChange(Number(event.target.value))
            }
            disabled={!canSpeak}
          />
        </label>
      </div>
    </header>
  );
}
