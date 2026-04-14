export function getLpGeneratePrompt(
  script: string,
  persona: string,
  appealType: string,
  sourceUrl?: string
) {
  return `あなたは記事LP（ランディングページ）のライターです。
広告動画から流入するユーザー向けの記事LPを作成してください。

## 入力情報

### 広告台本
${script}

### ペルソナ
${persona || "指定なし"}

### 訴求タイプ
${appealType || "指定なし"}

${sourceUrl ? `### 参考LP URL\n${sourceUrl}` : ""}

## 記事LP構成ルール

1. **ファーストビュー**: 広告の続きを感じさせる導入（離脱防止）
2. **共感パート**: ペルソナの悩み・状況を深掘り
3. **解決策提示**: サービス/商品の紹介（メリット3つ以上）
4. **社会的証明**: 口コミ・実績・数字
5. **FAQ**: よくある不安の解消（3つ以上）
6. **CTA**: 明確な行動喚起（ボタン文言含む）

## 出力形式
マークダウン形式で出力してください。見出し・箇条書き・強調を適切に使用してください。`;
}
