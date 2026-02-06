import type { PracticeKind } from "../types";

type BankPanelProps = {
  practice: PracticeKind;
  bankExample: string;
  groupHint: string;
  bankCount: number;
  bankText: string;
  onBankTextChange: (value: string) => void;
  quickInput: string;
  onQuickInputChange: (value: string) => void;
  onQuickImport: () => void;
  onExport: () => void;
  onExportAll: () => void;
  onImport: () => void;
  onReset: () => void;
  onClearProgress: () => void;
  isImporting: boolean;
  message: string;
};

export default function BankPanel({
  practice,
  bankExample,
  groupHint,
  bankCount,
  bankText,
  onBankTextChange,
  quickInput,
  onQuickInputChange,
  onQuickImport,
  onExport,
  onExportAll,
  onImport,
  onReset,
  onClearProgress,
  isImporting,
  message,
}: BankPanelProps) {
  const practiceLabel = practice === "verb" ? "動詞" : "形容詞";
  const dictLabel = practice === "verb" ? "辭書形" : "原形";

  return (
    <details className="bank">
      <summary>題庫管理</summary>
      <div className="bank-body">
        <div className="bank-guide">
          <p>匯入會合併題庫並保留學習紀錄。匯出可直接複製或下載。</p>
          <div className="steps">
            <div className="step">
              <span>1.</span> 點「匯出題庫」可取得目前 JSON。
            </div>
            <div className="step">
              <span>2.</span> 貼上你的 JSON（支援只給{dictLabel}）。
            </div>
            <div className="step">
              <span>3.</span> 點「匯入題庫」立即生效。
            </div>
            <div className="step">
              <span>4.</span> 點「匯出全部題庫」可下載 bank-export.json（跨平台用）。
            </div>
          </div>
          <div className="group-hint">{groupHint}</div>
          <pre className="example">{bankExample}</pre>
        </div>
        <div className="bank-count">目前題庫共有 {bankCount} 個單字。</div>
        <textarea
          value={bankText}
          onChange={(event) => onBankTextChange(event.target.value)}
          placeholder="在此貼上題庫 JSON 或按下匯出填入"
          rows={10}
          disabled={isImporting}
        />
        <div className="bank-quick">
          <input
            type="text"
            value={quickInput}
            onChange={(event) => onQuickInputChange(event.target.value)}
            placeholder={`直接輸入${practiceLabel}（可用空白或逗號分隔）`}
            disabled={isImporting}
          />
          <button
            type="button"
            onClick={onQuickImport}
            className="secondary"
            disabled={isImporting}
          >
            直接匯入{practiceLabel}
          </button>
        </div>
        <div className="bank-actions">
          <button type="button" onClick={onExport} disabled={isImporting}>
            匯出題庫
          </button>
          <button type="button" onClick={onExportAll} disabled={isImporting}>
            匯出全部題庫
          </button>
          <button
            type="button"
            onClick={onImport}
            className="secondary"
            disabled={isImporting}
          >
            匯入題庫
          </button>
          <button
            type="button"
            onClick={onReset}
            className="ghost"
            disabled={isImporting}
          >
            重置題庫
          </button>
          <button
            type="button"
            onClick={onClearProgress}
            className="ghost"
            disabled={isImporting}
          >
            清空學習紀錄
          </button>
        </div>
        {message && <div className="message">{message}</div>}
      </div>
    </details>
  );
}
