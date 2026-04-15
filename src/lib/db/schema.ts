import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ユーザー（簡易認証用）
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// プロジェクト（台本をグループ化するタグ）
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#6366f1"), // バッジカラー
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// 訴求パターン
export const appeals = sqliteTable("appeals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category", {
    enum: ["pain", "benefit", "fear", "social_proof", "authority", "scarcity", "curiosity", "other"],
  }).notNull(),
  description: text("description").notNull().default(""),
  exampleScript: text("example_script"),
  performanceScore: real("performance_score"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// 台本メイン
export const scripts = sqliteTable("scripts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  originalVideoUrl: text("original_video_url"),
  originalScript: text("original_script").notNull(),
  persona: text("persona").notNull().default(""),
  projectId: integer("project_id").references(() => projects.id),
  appealId: integer("appeal_id").references(() => appeals.id),
  appealText: text("appeal_text"),
  articleLpUrl: text("article_lp_url"),
  articleLpText: text("article_lp_text"),
  dproData: text("dpro_data"), // B案生成時のDProリサーチデータ
  researchAnalysis: text("research_analysis"), // B案生成時のリサーチ分析結果（JSON）
  status: text("status", {
    enum: ["draft", "analyzing", "analyzed", "generating", "completed"],
  }).notNull().default("draft"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// 生成された台本
export const generatedScripts = sqliteTable("generated_scripts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scriptId: integer("script_id").notNull().references(() => scripts.id),
  variant: text("variant", { enum: ["b_plan", "new_plan", "similar"] }).notNull(),
  content: text("content").notNull(),
  reasoning: text("reasoning"),
  score: real("score"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// 分析結果
export const analyses = sqliteTable("analyses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scriptId: integer("script_id").notNull().references(() => scripts.id),
  buzzFactors: text("buzz_factors").notNull(), // JSON
  conversionFactors: text("conversion_factors").notNull(), // JSON
  appealPattern: text("appeal_pattern"),
  overallScore: real("overall_score"),
  summary: text("summary"),
  improvementSuggestions: text("improvement_suggestions"), // JSON
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// 記事LP
export const articleLps = sqliteTable("article_lps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scriptId: integer("script_id").notNull().references(() => scripts.id),
  title: text("title").notNull(),
  sourceUrl: text("source_url"),
  generatedText: text("generated_text"),
  generatedHtml: text("generated_html"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// 広告メトリクス（将来MCP連携用プレースホルダー）
export const adMetrics = sqliteTable("ad_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  platform: text("platform").notNull(),
  scriptId: integer("script_id").references(() => scripts.id),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  cpa: real("cpa"),
  roas: real("roas"),
  recordedAt: text("recorded_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// リサーチプロジェクト
export const researchProjects = sqliteTable("research_projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  genre: text("genre").notNull(),
  conditions: text("conditions").notNull().default("{}"), // JSON: ジャンル条件
  freeText: text("free_text"),
  status: text("status", {
    enum: ["idle", "running", "completed", "error"],
  }).notNull().default("idle"),
  resultCount: integer("result_count").default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// リサーチ結果
export const researchResults = sqliteTable("research_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => researchProjects.id),
  videoUrl: text("video_url"),
  platform: text("platform"), // tiktok, youtube, instagram
  title: text("title").notNull(),
  script: text("script"),
  hookType: text("hook_type"),
  appealType: text("appeal_type"),
  estimatedViews: text("estimated_views"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// 参考台本（ユーザー登録の好調台本）
export const referenceScripts = sqliteTable("reference_scripts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").references(() => projects.id),
  scriptText: text("script_text").notNull(),
  hook: text("hook"),
  embedding: text("embedding"),
  contentHash: text("content_hash").notNull(),
  source: text("source").default("manual"), // "manual" | "csv_import" | "dpro"
  genre: text("genre"),
  videoUrl: text("video_url"),
  destinationUrl: text("destination_url"),
  metadata: text("metadata"), // JSON: 投稿日, 再生数, 広告費等
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// DPro台本エンベディング（ベクトル検索用）
export const dproEmbeddings = sqliteTable("dpro_embeddings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scriptText: text("script_text").notNull(),
  hook: text("hook"),
  embedding: text("embedding").notNull(), // JSON配列（number[]）
  costDifference: real("cost_difference"),
  playCount: integer("play_count"),
  duration: integer("duration"),
  streamingPeriod: integer("streaming_period"),
  videoType: text("video_type"),
  videoUrl: text("video_url"),
  genre: text("genre"),
  contentHash: text("content_hash").notNull(), // 重複防止用
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// 型エクスポート
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Script = typeof scripts.$inferSelect;
export type NewScript = typeof scripts.$inferInsert;
export type GeneratedScript = typeof generatedScripts.$inferSelect;
export type NewGeneratedScript = typeof generatedScripts.$inferInsert;
export type Analysis = typeof analyses.$inferSelect;
export type NewAnalysis = typeof analyses.$inferInsert;
export type Appeal = typeof appeals.$inferSelect;
export type NewAppeal = typeof appeals.$inferInsert;
export type ArticleLp = typeof articleLps.$inferSelect;
export type NewArticleLp = typeof articleLps.$inferInsert;
export type ResearchProject = typeof researchProjects.$inferSelect;
export type NewResearchProject = typeof researchProjects.$inferInsert;
export type ResearchResult = typeof researchResults.$inferSelect;
export type NewResearchResult = typeof researchResults.$inferInsert;
export type DproEmbedding = typeof dproEmbeddings.$inferSelect;
export type NewDproEmbedding = typeof dproEmbeddings.$inferInsert;
export type ReferenceScript = typeof referenceScripts.$inferSelect;
export type NewReferenceScript = typeof referenceScripts.$inferInsert;
