import type { PracticeKind } from "../types";

type RulesPanelProps = {
  practice: PracticeKind;
  ruleSummary: string;
};

export default function RulesPanel({ practice, ruleSummary }: RulesPanelProps) {
  return practice === "verb" ? (
    <details className="rules">
      <summary>{ruleSummary}</summary>
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
            <div className="rule-title">五段動詞（可能形）</div>
            <div className="rule-line">語尾改 e 段＋る</div>
          </div>
          <div className="rule-card">
            <div className="rule-title">二段動詞（可能形）</div>
            <div className="rule-line">語幹＋られる</div>
          </div>
          <div className="rule-card">
            <div className="rule-title">する／くる</div>
            <div className="rule-line">た形：した／きた</div>
            <div className="rule-line">て形：して／きて</div>
            <div className="rule-line">可能形：できる／こられる</div>
          </div>
        </div>
      </div>
    </details>
  ) : (
    <details className="rules">
      <summary>{ruleSummary}</summary>
      <div className="rules-body">
        <div className="rule-grid">
          <div className="rule-card">
            <div className="rule-title">い形容詞</div>
            <div className="rule-line">ない形：語幹＋くない</div>
            <div className="rule-line">た形：語幹＋かった</div>
            <div className="rule-line">なかった形：語幹＋くなかった</div>
            <div className="rule-line">て形：語幹＋くて</div>
          </div>
          <div className="rule-card">
            <div className="rule-title">な形容詞</div>
            <div className="rule-line">ない形：語幹＋じゃない</div>
            <div className="rule-line">た形：語幹＋だった</div>
            <div className="rule-line">なかった形：語幹＋じゃなかった</div>
            <div className="rule-line">て形：語幹＋で</div>
          </div>
          <div className="rule-card">
            <div className="rule-title">いい（例外）</div>
            <div className="rule-line">ない形：よくない</div>
            <div className="rule-line">た形：よかった</div>
          </div>
        </div>
      </div>
    </details>
  );
}
