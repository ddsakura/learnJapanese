import type { QuestionType } from "../types";
import { QUESTION_LABELS } from "../data/constants";

export function buildExamplePrompt(term: string, typeLabel: string) {
  return `系統設定： 你是一位專業的日語老師，擅長將複雜的文法用簡單易懂的方式解釋給 N4 程度的學生。 任務： 請用單字『${term}』（形態：${typeLabel}）造一個 N4 程度的日文句子。  輸出格式要求（嚴格執行）： JP: [日文句子] Reading: [全平假名] ZH: [繁體中文翻譯] Grammar: [簡短說明該單字在此處的用法與形態變化，需點出${typeLabel}]`;
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
