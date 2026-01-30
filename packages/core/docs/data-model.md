# 題庫資料格式（Data Model）

## Card

動詞與形容詞共用同一筆資料結構：

```
Card {
  dict: string          // 辭書形/原形
  nai: string           // ない形
  ta: string            // た形
  nakatta: string       // なかった形
  te: string            // て形
  potential?: string    // 可能形（動詞用）
  group: string         // 動詞: godan | ichidan | irregular
                         // 形容詞: i | na
  zh?: string           // 可選中文翻譯（題庫儲存用）
}
```

## QuestionType

- nai | ta | nakatta | te | potential | mixed

## Scope

- 動詞：all | godan | ichidan | irregular
- 形容詞：all | i | na

## AnswerMode

- input | choice

## AnswerResult

```
AnswerResult {
  correct: boolean
  correctAnswer: string
  userAnswer: string
  type: QuestionType (不含 mixed)
}
```
