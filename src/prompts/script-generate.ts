export function getScriptGeneratePrompt(
  originalScript: string,
  persona: string,
  appealType: string,
  variant: "b_plan" | "new_plan" | "similar",
  analysisResult?: string
) {
  const variantInstructions = {
    b_plan: `## タスク: B案生成
元台本の構成・訴求を維持しつつ、表現・フック・CTAを改善したB案を作成してください。
- 元台本の良い点は残す
- 弱い部分を強化する
- 同じペルソナ・訴求でより刺さる表現に`,

    new_plan: `## タスク: 新案生成
同じペルソナ・訴求で、構成を完全に刷新した新しい台本を作成してください。
- 元台本とは異なるアプローチ
- フック・構成・CTAを全て新規設計
- 元台本の分析結果があれば、弱点を克服する構成に`,

    similar: `## タスク: 類似台本生成
元台本のパターンを踏襲しつつ、別の切り口で類似台本を作成してください。
- 同じ構成パターンを使う
- 具体例・エピソードを変える
- ターゲットの別の悩みに寄せる`,
  };

  return `あなたは獲得広告の台本ライターです。TikTok/Reels向けの短尺動画台本を作成します。

${variantInstructions[variant]}

## 元台本
${originalScript}

## ペルソナ
${persona || "指定なし"}

## 訴求タイプ
${appealType || "指定なし"}

${analysisResult ? `## 元台本の分析結果\n${analysisResult}` : ""}

## 出力形式
以下の形式で台本を出力してください:

---
【フック（冒頭3秒）】
（ここに冒頭のセリフ）

【本文】
（メインの内容）

【CTA（締め）】
（行動喚起のセリフ）
---

台本の後に、この台本の狙い・意図を簡潔に説明してください。`;
}
