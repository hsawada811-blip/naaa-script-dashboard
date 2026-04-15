import { KNOWLEDGE_BASE, DEBT_CONSOLIDATION_RULES } from "./knowledge-base";

/**
 * ステップ1: リサーチ+ペルソナ分析プロンプト
 * 参考台本群+DProデータから、ペルソナ・勝ちパターンを分析
 */
export function getResearchAnalysisPrompt(
  referenceScripts: string[],
  dproData: string,
  options?: {
    genre?: string;
    articleLpText?: string;
    instructions?: string;
  }
) {
  const allText = referenceScripts.join("\n") + dproData + (options?.genre || "");
  const isDebt = /債務|借金|減額|返済|サイム/.test(allText);

  const scriptsSection = referenceScripts.length > 0
    ? referenceScripts.map((s, i) => `### ユーザー提供の参考台本${i + 1}\n${s}`).join("\n\n")
    : "（ユーザーからの参考台本なし）";

  return `あなたは獲得広告のリサーチャー兼ストラテジストです。
提供された情報を全て分析し、ターゲットペルソナ・勝ちパターン・台本戦略を導き出してください。

${KNOWLEDGE_BASE}

${isDebt ? DEBT_CONSOLIDATION_RULES : ""}

## ジャンル
${options?.genre || "参考台本から推定してください"}

## 参考台本
${scriptsSection}

## DProから取得した同ジャンルの好調広告データ
${dproData || "（DProデータなし）"}

${options?.articleLpText ? `## 記事LP内容\n${options.articleLpText}` : ""}
${options?.instructions ? `## 追加指示\n${options.instructions}` : ""}

## 分析タスク

以下を徹底的に分析してください:

1. **ターゲットペルソナ**: 年齢/性別/職業/年収帯/具体的な悩み/日常のストレスシーン/SNS利用パターン。「30代男性」のような粗い分類ではなく、「32歳・中小企業営業職・手取り22万・子供1人・毎月カツカツ」レベルで具体化
2. **訴求軸**: このジャンルで刺さる訴求の核心は何か。感情のどこを突くべきか。表層的な悩みではなく「夜寝る前に頭をよぎる本当の恐怖」を特定する
3. **DProデータ深堀り分析**: DProの好調広告データがある場合、以下を分析:
   - 上位広告の共通点は何か（フック型、構成、訴求角度、尺、トーン）
   - 広告費が高い＝長期配信されている広告の特徴は何か
   - 再生数上位の広告で使われているフレーズ・キーワードの傾向
   - DProデータと参考台本の「差分」（DProにあって参考台本にない要素は何か）
4. **勝ちパターン分析**: 参考台本・DProデータから「なぜ伸びているか」の共通法則。「共感がある」等の抽象的な回答ではなく「冒頭で金額を出して損失回避を煽り、中盤で体験談で共感させ、後半で行動ハードルを下げている」レベルで具体化
5. **フック戦略**: このジャンルで効くフックパターンとその理由。DProで実際に使われている高効果フックのパターンを分析に反映
6. **構成戦略**: ハイテンポ型/フロー型どちらが向くか。その理由。DProデータから尺・シーン数の傾向も加味
7. **NGパターン**: このジャンルで避けるべき表現・構成。DProで配信期間が短い（打ち切られた）広告の特徴も含める
8. **CTA戦略**: CTAの最適な形（このジャンル特有の心理障壁は何か）

以下のJSON形式で出力:

{
  "persona": {
    "age": "年齢層",
    "gender": "性別",
    "occupation": "職業・状況",
    "income": "年収帯",
    "pain": "最も深い悩み（具体的に）",
    "dailyStress": "日常で感じるストレスシーン3つ",
    "triggerMoment": "行動を起こすきっかけになる瞬間"
  },
  "appeal": {
    "core": "訴求の核心（一言）",
    "emotionalTrigger": "感情のどこを突くか",
    "beforeAfter": "ビフォー→アフターの変化"
  },
  "winningPatterns": [
    "勝ちパターン1（具体的に）",
    "勝ちパターン2",
    "勝ちパターン3"
  ],
  "hookStrategy": {
    "bestPatterns": ["効くフックパターン名1", "パターン名2"],
    "reasoning": "なぜこのフックが効くか",
    "exampleHooks": ["具体的なフック例1", "フック例2", "フック例3"]
  },
  "structureStrategy": {
    "recommendedFormat": "ハイテンポ型 or フロー型",
    "reasoning": "なぜこの型が向くか",
    "idealDuration": "推奨尺",
    "keyScenes": "必ず入れるべきシーン・要素"
  },
  "ngPatterns": ["避けるべきこと1", "避けるべきこと2"],
  "ctaStrategy": {
    "type": "最適なCTAの形",
    "psychologicalBarrier": "視聴者の心理障壁",
    "barrierRemoval": "障壁を除去する方法"
  },
  "dproInsights": "DProデータから得られた追加インサイト（好調広告の共通点など）",
  "dproTopHooks": ["DPro上位広告から抽出した最も強いフック表現1", "フック表現2", "フック表現3"],
  "dproWinningElements": ["上位広告で共通して使われている要素1", "要素2", "要素3"]
}

必ず有効なJSONのみを出力してください。`;
}

/**
 * ステップ2: 台本生成プロンプト
 * ステップ1の分析結果を元に台本を生成
 */
export function getScriptGenerationPrompt(
  analysisResult: string,
  referenceScripts: string[],
  dproData: string,
  options?: {
    genre?: string;
    articleLpText?: string;
    instructions?: string;
  }
) {
  const allText = referenceScripts.join("\n") + dproData + (options?.genre || "");
  const isDebt = /債務|借金|減額|返済|サイム/.test(allText);

  const scriptsSection = referenceScripts.length > 0
    ? referenceScripts.map((s, i) => `### 参考台本${i + 1}\n${s}`).join("\n\n")
    : "";

  return `あなたは獲得広告の台本ライターです。トップクリエイターレベルの台本を書きます。

${KNOWLEDGE_BASE}

${isDebt ? DEBT_CONSOLIDATION_RULES : ""}

## リサーチ分析結果（これに基づいて台本を書く）
${analysisResult}

${scriptsSection ? `## 参考台本\n${scriptsSection}` : ""}

${dproData ? `## DProの好調広告データ（参考）\n${dproData}` : ""}

${options?.articleLpText ? `## 記事LP内容（台本→LP→CVの流れを意識）\n${options.articleLpText}` : ""}
${options?.instructions ? `## 追加指示\n${options.instructions}` : ""}

## 台本生成ルール（絶対守ること）

### 出力フォーマット
- 「シーン1:」「シーン2:」のような番号は絶対に付けない
- 実際のTikTok広告のナレーション/テロップそのままの形で書く
- 改行で区切るだけ。自然な話し言葉で
- テロップ＝ナレーション完全一致

### 台本の質
- フックは最初の1文。スクロールを止める一撃
- 数字は端数を使う（94.7%、47年、月3万→月8千円）
- 感情ラベル・オノマトペを自然に散りばめる（1本に3回以上）
- 「広告っぽさ」を消す。友達に話すトーンで
- CTAは最後の1文。2秒で言い切る
- 口語（「〜してさ」「〜なんよ」「マジで」「ガチで」）

### 生成前の思考プロセス（必ず実行）
台本を書く前に、以下を頭の中で整理してから書き始めること:
1. 参考台本で「最も獲得に効いている要素」は何か（フック？訴求？構成？CTA？）→ それをA〜Cで守る
2. DProデータで「参考台本にない新しい武器」は何か → それをD〜Eで使う
3. 5本それぞれの「差別化ポイント」を事前に決める（フック型×訴求角度×構成の組み合わせが5本すべて異なること）
4. 各台本の「勝ちシナリオ」を想定する（どういう視聴者が、どの瞬間に心が動いて、最終的にCTAをクリックするか）

### 生成台本の構成（5本の役割分担）

**【A〜C】類似展開（B案）3本** — 参考台本の訴求・フォーマットを踏襲したバリエーション
- 参考台本と同じ訴求軸・同じフォーマット（ハイテンポ型 or フロー型）を維持する
- フックの切り口・具体エピソード・数字・言い回しを変えて3パターン作る
- 「参考台本の別バージョン」として現場がすぐ使えるレベルで書く
- 参考台本がない場合は、分析で特定した最強の訴求×フォーマットで3本書く
- A/B/Cそれぞれの差別化: Aは参考台本に最も近い安全牌、Bはフック・エピソードを大きく変えた攻め、Cは構成の順序やペースを変えた構造テスト

**【D〜E】新規フォーマット 2本** — DProの好調広告を参考に、訴求やフォーマットを変える
- 参考台本とは異なるフォーマット（ハイテンポ→フロー、またはその逆）
- 訴求の角度を変える（例: 共感型→損失回避型、体験談→比較型）
- DProの好調広告で再生数の多い構成・フック・訴求を積極的に取り入れる
- DProの上位広告のフレーズや構成を「そのまま真似る」のではなく「本質を抽出して自分のジャンルに転用する」
- 「今のクリエイティブとは全く違うアプローチ」を試すためのテスト枠
- Dは完全にフォーマット変更（ハイテンポ↔フロー）、Eは訴求角度を大胆に変える

### 台本の質チェック（全5本共通・書いた後に確認）
- 同じフック型を2回使っていないか？（5本すべて異なるフックパターン）
- 冒頭2秒で「え？」「なに？」と思えるか？
- 広告っぽい表現（です・ます、機能説明、煽り文句）が混じっていないか？
- 1文が30文字を超えていないか？
- 「このまま5パターン並べた時、全部違う切り口に見えるか？」（似通ったパターンは書き直す）
- 数字・感情ラベルが各台本に3回以上入っているか？

## タスク: 5パターンの台本を生成

以下のJSON形式で出力:

{
  "variants": [
    {
      "category": "類似展開 or 新規フォーマット",
      "type": "パターンの特徴を一言で",
      "title": "台本のコンセプト（キャッチーに）",
      "hookPattern": "使用フックパターン名",
      "format": "ハイテンポ型 or フロー型",
      "estimatedDuration": "○○秒",
      "hook": "冒頭のセリフ（これだけで興味を引く一文）",
      "script": "台本全文（フックから始まりCTAで終わる。シーン番号なし。改行区切り。自然な話し言葉）",
      "reasoning": "この台本が刺さる理由。(1)どの心理メカニズムを使っているか (2)参考台本/DProのどの要素を活用したか (3)他の4本との差別化ポイント"
    }
  ]
}

variantsは必ず5つ。最初の3つがcategory:"類似展開"、後の2つがcategory:"新規フォーマット"。

**重要: scriptフィールドは「シーン1:」等の番号を絶対に付けず、ナレーションテキストだけを改行区切りで書くこと。**

必ず有効なJSONのみを出力してください。`;
}
