import type { Stats } from "../types";

type StatsPanelProps = {
  activeStats: Stats;
  dueCount: number;
  wrongCount: number;
  scopeLabel: string;
  mode: "normal" | "reviewWrong";
  onStartReview: () => void;
  onExitReview: () => void;
};

export default function StatsPanel({
  activeStats,
  dueCount,
  wrongCount,
  scopeLabel,
  mode,
  onStartReview,
  onExitReview,
}: StatsPanelProps) {
  return (
    <section className="stats">
      <div>
        <div className="label">今日答題數</div>
        <div className="value">{activeStats.todayCount}</div>
      </div>
      <div>
        <div className="label">連續答對</div>
        <div className="value">{activeStats.streak}</div>
      </div>
      <div>
        <div className="label">待複習數</div>
        <div className="value">{dueCount}</div>
      </div>
      <div>
        <div className="label">目前範圍</div>
        <div className="value">{scopeLabel}</div>
      </div>
      <div className="review-card">
        <div className="label">今日答錯</div>
        <div className="value">{wrongCount}</div>
        {mode === "reviewWrong" ? (
          <button type="button" className="secondary" onClick={onExitReview}>
            回到正常題庫
          </button>
        ) : (
          <button type="button" onClick={onStartReview} disabled={wrongCount === 0}>
            複習今日答錯
          </button>
        )}
      </div>
    </section>
  );
}
