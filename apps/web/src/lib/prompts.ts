import type { QuestionType } from "../types";
import { QUESTION_LABELS } from "../data/constants";

export function buildExamplePrompt(
  dict: string,
  term: string,
  typeLabel: string,
  retry = false,
) {
  const retryInstruction = retry
    ? `\n注意：上一個回答無效，因為 JP 句子沒有正確使用「${dict}」的「${term}」。請重新產生，這次 JP 必須逐字包含「${term}」，Grammar 必須同時提到「${dict}」和「${term}」。`
    : "";
  const typeSpecificInstruction =
    typeLabel === "意向形"
      ? `\n意向形特別要求：JP 請使用「${term}と思います」「${term}と決めました」或同等自然句型，表達主語打算做「${dict}」這個動作；不要把「${term}」接在無關子句、天氣、形容詞或其他動詞後面。`
      : "";
  return `系統設定：你是一位專業的日語老師，擅長將複雜的文法用簡單易懂的方式解釋給 N4 程度的學生。
任務：請用辭書形「${dict}」的「${typeLabel}」答案詞形「${term}」造一個 N4 程度的日文句子。
硬性要求：
1) JP 欄位的日文句子必須逐字包含「${term}」。
2) 「${term}」必須是「${dict}」的活用形，不能當成其他單字或其他動詞來解釋。
3) 「${term}」必須是句子中的實際用詞，不能只出現在 Grammar 解釋。
4) 不要把「${term}」換成同義詞、其他動詞、辭書形、漢字/假名替代表記，或其他活用形。
5) Grammar 欄位必須同時包含「${dict}」和「${term}」，並說明「${term}」是「${dict}」的「${typeLabel}」。${typeSpecificInstruction}
輸出格式要求（嚴格執行）：
不要使用 Markdown、星號、粗體、項目符號或任何裝飾標記。
JP: [必須包含「${term}」的日文句子]
Reading: [全平假名]
ZH: [繁體中文翻譯]
Grammar: [簡短說明該單字在此處的用法與形態變化，需點出${typeLabel}]${retryInstruction}`;
}

export function buildTranslationPrompt(dict: string) {
  return `請把以下日文翻譯成繁體中文，只輸出翻譯結果，不要加標點或解釋。\n日文：${dict}`;
}

export function buildChoicePrompt(
  correctAnswer: string,
  dict: string,
  type: Exclude<QuestionType, "mixed">,
) {
  const typeLabel = QUESTION_LABELS[type];
  return `任務：幫日文變化練習產生 3 個錯誤答案。\n題目：辭書形＝${dict}，目標＝${typeLabel}，正確答案＝${correctAnswer}。\n要求：\n1) 只輸出 3 行，每行 1 個錯誤答案。\n2) 不要包含正確答案。\n3) 不要重複，不要解釋，不要加編號或其他文字。\n4) 輸出必須是日文詞形。`;
}
