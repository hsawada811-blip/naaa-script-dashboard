import { KNOWLEDGE_BASE, DEBT_CONSOLIDATION_RULES } from "./knowledge-base";

export function getLpGeneratePrompt(
  script: string,
  persona: string,
  appealType: string,
  sourceUrl?: string
) {
  const isDebt = /債務|借金|減額|返済|サイム/.test(script + appealType);

  return `あなたは記事LP（ランディングページ）のライターです。
広告動画から流入するユーザー向けの記事LPを作成してください。

${KNOWLEDGE_BASE}

${isDebt ? DEBT_CONSOLIDATION_RULES : ""}

## 入力情報

### 広告台本
${script}

### ペルソナ
${persona || "指定なし"}

### 訴求タイプ
${appealType || "指定なし"}

${sourceUrl ? `### 参考LP URL\n${sourceUrl}` : ""}

## 記事LP構成ルール

1. **ファーストビュー**: 広告の台本のトーン・文体を引き継いだ導入（離脱防止）。広告の続きを読んでいる感覚にする
2. **共感パート**: ペルソナの悩み・状況を深掘り。口語調で「自分もありえる」リアリティを出す
3. **解決策提示**: サービス/商品の紹介（メリット3つ以上）。端数の数字で信頼感UP
4. **社会的証明**: 口コミ・実績・具体数字。感情ラベルを使ってリアルな声に
5. **FAQ**: よくある不安の解消（3つ以上）。心理障壁の除去を意識
6. **CTA**: 明確な行動喚起（ボタン文言含む）。損失回避の表現を使う
${isDebt ? "\n**重要**: 債務整理案件のため「無料相談」「0円相談」レベルのCTAに限定。「減額診断」「シミュレーター」は使用禁止。" : ""}

## 出力形式
マークダウン形式で出力してください。見出し・箇条書き・強調を適切に使用してください。`;
}
