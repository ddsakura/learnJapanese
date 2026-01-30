import type { FormEvent } from "react";
import type {
  AnswerMode,
  ChoiceStatus,
  ExampleEntry,
  PracticeKind,
  Question,
  QuestionType,
} from "../types";
import { QUESTION_LABELS } from "../data/constants";

type AnswerResult = {
  correct: boolean;
  correctAnswer: string;
  userAnswer: string;
  type: Exclude<QuestionType, "mixed">;
};

type QuestionCardProps = {
  question: Question | null;
  emptyMessage: string;
  canSpeak: boolean;
  isSpeaking: boolean;
  onSpeak: () => void;
  answerMode: AnswerMode;
  answer: string;
  onAnswerChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onSkip: () => void;
  onNext: () => void;
  result: AnswerResult | null;
  choiceStatus: ChoiceStatus;
  choiceMessage: string;
  choiceOptions: string[];
  onChoicePick: (option: string) => void;
  onRegenerateChoices: () => void;
  liveZh: string | null;
  isTranslating: boolean;
  example: ExampleEntry | null;
  exampleStatus: "idle" | "loading" | "error";
  exampleMessage: string;
  isExampleSpeaking: boolean;
  onExampleSpeak: () => void;
  dictLabel: string;
  practice: PracticeKind;
};

export default function QuestionCard({
  question,
  emptyMessage,
  canSpeak,
  isSpeaking,
  onSpeak,
  answerMode,
  answer,
  onAnswerChange,
  onSubmit,
  onSkip,
  onNext,
  result,
  choiceStatus,
  choiceMessage,
  choiceOptions,
  onChoicePick,
  onRegenerateChoices,
  liveZh,
  isTranslating,
  example,
  exampleStatus,
  exampleMessage,
  isExampleSpeaking,
  onExampleSpeak,
  dictLabel,
  practice,
}: QuestionCardProps) {
  return (
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
              onClick={onSpeak}
              disabled={isSpeaking || !canSpeak}
            >
              {isSpeaking ? "播放中…" : "播放"}
            </button>
          </div>
          {!canSpeak && (
            <div className="pronunciation-note">此瀏覽器不支援語音播放。</div>
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

      {answerMode === "input" ? (
        <form className="answer-form" onSubmit={onSubmit}>
          <input
            type="text"
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value)}
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
              onClick={onSkip}
              disabled={!question || Boolean(result)}
            >
              略過
            </button>
            <button
              type="button"
              className="secondary"
              onClick={onNext}
              disabled={!question || !result}
            >
              下一題
            </button>
          </div>
        </form>
      ) : (
        <div className="answer-form">
          {choiceStatus === "loading" && (
            <div className="choice-status">選項產生中…</div>
          )}
          {choiceStatus === "error" && (
            <div className="choice-status error">
              {choiceMessage || "選項產生失敗，請確認 Ollama 已啟動。"}
            </div>
          )}
          {choiceOptions.length > 0 && (
            <div className="choice-list">
              {choiceOptions.map((option) => {
                const isCorrect = result && option === result.correctAnswer;
                const isWrong =
                  result &&
                  option === result.userAnswer &&
                  option !== result.correctAnswer;
                return (
                  <button
                    key={option}
                    type="button"
                    className={`choice-button${isCorrect ? " correct" : ""}${
                      isWrong ? " wrong" : ""
                    }`}
                    onClick={() => onChoicePick(option)}
                    disabled={!question || Boolean(result)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}
          <div className="actions">
            <button
              type="button"
              className="ghost"
              onClick={onRegenerateChoices}
              disabled={!question || Boolean(result) || choiceStatus === "loading"}
            >
              重新產生選項
            </button>
            <button
              type="button"
              className="ghost"
              onClick={onSkip}
              disabled={!question || Boolean(result)}
            >
              略過
            </button>
            <button
              type="button"
              className="secondary"
              onClick={onNext}
              disabled={!question || !result}
            >
              下一題
            </button>
          </div>
        </div>
      )}

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
                    <div className="result-example-line zh">{example.zh}</div>
                    <div className="result-example-line grammar">
                      {example.grammar}
                    </div>
                    <div className="result-example-actions">
                      <button
                        type="button"
                        className="ghost"
                        onClick={onExampleSpeak}
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
                      <strong>{question.card.potential || "（未提供）"}</strong>
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
  );
}
