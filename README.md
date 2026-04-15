# ScriptDB - AI台本生成ダッシュボード

TikTok/YouTube広告の台本をAIで分析・生成するダッシュボード。
DPro（広告リサーチツール）から好調広告データを取得し、エンベディング類似検索で最適な参考台本を選定、Claudeで高品質なB案台本を自動生成します。

## 主な機能

### B案クイック生成（メイン機能）
- 既存台本 or ジャンル名を入力するだけで、5パターンのB案台本を自動生成
- **2ステップ構成**: リサーチ（DPro検索 + ペルソナ分析）→ 台本生成
- DPro好調広告のエンベディング類似検索で、関連性の高い参考データを自動選定
- 生成結果はDB保存され、あとから閲覧・編集可能

### 参考台本管理
- 好調だった台本をCSVバルクインポートまたは手動登録
- ジャンル別管理（債務整理、IT転職 等）
- 登録した参考台本は自動的にエンベディング化され、B案生成時の類似検索対象になる

### DProリサーチ連携
- ジャンル名で好調広告を自動検索（部分文字列マッチで最大8パターン試行）
- 取得した台本データをエンベディングでDB保存（重複自動スキップ）
- 広告費・再生数・配信期間等のメタデータも保持
- 台本詳細ページでリサーチデータを閲覧可能

### 台本管理
- 元台本・生成台本の一覧管理
- プロジェクト（タグ）別分類
- ステータス管理（下書き → 分析済 → 完了）
- 動画プレビュー（YouTube / TikTok / Google Drive URL対応）

### AI分析
- 台本のバズ要因・CV要因をスコアリング
- ペルソナ自動生成
- 訴求パターン分析・分類

### その他
- 記事LP生成（台本からLP原稿を自動生成）
- リサーチプロジェクト管理（条件保存・結果蓄積）
- 訴求パターン別パフォーマンス分析
- ダッシュボード（台本数・生成数・分析数の統計）

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Next.js (App Router) / React / TypeScript / Tailwind CSS / shadcn/ui |
| バックエンド | Next.js API Routes |
| DB | SQLite (better-sqlite3) / Drizzle ORM |
| AI | Claude API (Anthropic) / Gemini API (エンベディング) |
| 外部連携 | DPro MCP (好調広告リサーチ) |

## セットアップ

### 前提条件
- Node.js 18以上
- npm
- Anthropic APIキー（Claude用）
- Gemini APIキー（エンベディング用）
- DPro アカウント（任意。なくてもB案生成は動作する）

### インストール

```bash
git clone https://github.com/hsawada811-blip/naaa-script-dashboard.git
cd naaa-script-dashboard
npm install
```

### 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集して各APIキーを設定:

```env
# 認証（ログイン用JWTシークレット。任意の文字列）
JWT_SECRET=your-jwt-secret-here

# Anthropic API（台本生成・分析に使用）
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Gemini API（エンベディングに使用。text-embedding-004）
GEMINI_API_KEY=AIzaSyxxxxx

# DPro（好調広告リサーチ。なくても動作する）
DPRO_ACCESS_TOKEN=your-token
DPRO_REFRESH_TOKEN=your-refresh-token
DPRO_CLIENT_ID=your-client-id
DPRO_MCP_URL=https://your-dpro-mcp-url
```

### DBセットアップ

```bash
npx drizzle-kit push
```

これでSQLiteのテーブルが自動作成されます（`data/script-dashboard.db`）。

### 起動

```bash
npm run dev
```

http://localhost:3000 でアクセス。

初回アクセス時にログイン画面が表示されます。初期ユーザーは以下のコマンドで作成:

```bash
# ブラウザの開発者ツールコンソールから
fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'admin', password: 'your-password', action: 'register' })
})
```

## 使い方

### B案台本を生成する

1. ナビの「B案生成」をクリック
2. 参考にしたい台本テキストを貼り付け（複数可）、またはジャンル名を入力
3. 「リサーチ開始」→ DProから好調広告を自動検索、ペルソナ・勝ちパターンを分析
4. 分析結果を確認・編集（ペルソナ、訴求、フック戦略等）
5. 「台本を生成する」→ 5パターンの台本が自動生成
6. 各台本をコピー・編集・保存

### 参考台本を登録する

1. ナビの「参考台本」をクリック
2. 「CSVインポート」→ `日付,台本テキスト` 形式のCSVを貼り付けてインポート
3. または「手動追加」→ 台本テキストとジャンルを入力
4. 登録した台本は次回のB案生成時にエンベディング類似検索の対象になる

### 台本を管理する

1. 「台本一覧」で全台本を確認
2. 各台本をクリックして詳細表示
3. 「元台本」タブ: 元の台本テキスト、動画プレビュー、DProリサーチデータ
4. 「分析結果」タブ: AIによるバズ要因・CV要因分析
5. 「台本生成」タブ: その場で追加の台本生成
6. 「生成済み」タブ: 過去に生成した台本の一覧

## ディレクトリ構成

```
src/
├── app/
│   ├── api/
│   │   ├── generate/quick/    # B案クイック生成API
│   │   ├── reference-scripts/ # 参考台本CRUD + CSVインポートAPI
│   │   ├── scripts/           # 台本CRUD API
│   │   ├── research/          # リサーチプロジェクトAPI
│   │   ├── dpro/              # DProプロキシAPI
│   │   └── ...
│   ├── scripts/
│   │   ├── quick/             # B案クイック生成ページ
│   │   └── [id]/              # 台本詳細ページ
│   ├── reference-scripts/     # 参考台本管理ページ
│   └── research/              # リサーチプロジェクトページ
├── components/                # UIコンポーネント
├── lib/
│   ├── db/
│   │   ├── schema.ts          # DBスキーマ定義（Drizzle ORM）
│   │   ├── queries.ts         # クエリ関数
│   │   └── client.ts          # DB接続
│   ├── claude-cli.ts          # Claude API呼び出し
│   ├── embedding.ts           # Gemini エンベディング + 類似検索
│   ├── dpro.ts                # DProクライアント
│   ├── video-preview.ts       # 動画URLプレビューユーティリティ
│   └── utils.ts               # 共通ユーティリティ
├── prompts/
│   ├── quick-generate.ts      # B案生成プロンプト
│   └── knowledge-base.ts      # ドメイン知識ベース
└── types/                     # 型定義
```

## DBスキーマ（主要テーブル）

| テーブル | 用途 |
|---------|------|
| `scripts` | 台本メイン（元台本・ステータス・DProデータ） |
| `generated_scripts` | AI生成された台本（B案・新案・類似） |
| `reference_scripts` | 参考台本（CSVインポート・手動登録・エンベディング） |
| `dpro_embeddings` | DPro台本のエンベディングキャッシュ |
| `analyses` | AI分析結果（バズ要因・CV要因・スコア） |
| `projects` | プロジェクト（台本のグループ化タグ） |
| `appeals` | 訴求パターン |
| `research_projects` | リサーチプロジェクト |
| `research_results` | リサーチ結果 |

## API一覧

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/api/generate/quick?step=research` | POST | リサーチ実行（DPro検索 + ペルソナ分析） |
| `/api/generate/quick?step=generate` | POST | 台本生成（5パターン） |
| `/api/reference-scripts` | GET/POST/DELETE | 参考台本CRUD |
| `/api/reference-scripts/import` | POST | CSVバルクインポート |
| `/api/scripts` | GET/POST | 台本一覧・作成 |
| `/api/scripts/[id]` | GET/DELETE | 台本詳細・削除 |
| `/api/analyze` | POST | AI分析実行 |
| `/api/projects` | GET/POST | プロジェクト管理 |
| `/api/research` | GET/POST | リサーチプロジェクト |
| `/api/dpro/search` | GET | DProジャンル検索 |
| `/api/dpro/items` | GET | DProアイテム取得 |

## 注意事項

- **APIキーの管理**: `.env.local` は絶対にGitにコミットしないこと（`.gitignore`で除外済み）
- **DBファイル**: `data/*.db` もGit管理外。環境ごとに `npx drizzle-kit push` でテーブル作成
- **Claude API**: B案生成1回あたりリサーチ + 生成で2回のAPI呼び出し。1回あたり数分かかる場合がある
- **Gemini API**: エンベディング生成に使用。無料枠あり。CSVインポート時にバッチ処理
- **DPro**: アクセストークンの有効期限に注意。期限切れの場合はリフレッシュトークンで更新
- **SQLite**: 同時書き込みに制限あり。個人〜少人数利用向け

## ライセンス

Private - All rights reserved
