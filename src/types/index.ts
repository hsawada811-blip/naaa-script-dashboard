// 台本ステータス
export type ScriptStatus = "draft" | "analyzing" | "analyzed" | "generating" | "completed";

// 生成バリアント
export type GenerationVariant = "b_plan" | "new_plan" | "similar";

// ユーザーロール
export type UserRole = "admin" | "member";

// バズ分析結果の構造
export interface BuzzAnalysis {
  buzzFactors: {
    hook: { score: number; reason: string };
    emotion: { score: number; reason: string };
    structure: { score: number; reason: string };
    cta: { score: number; reason: string };
    trend: { score: number; reason: string };
  };
  conversionFactors: {
    painPoint: { score: number; reason: string };
    solution: { score: number; reason: string };
    urgency: { score: number; reason: string };
    trust: { score: number; reason: string };
    offer: { score: number; reason: string };
  };
  appealPattern: string;
  overallScore: number;
  summary: string;
  improvementSuggestions: string[];
}

// 訴求カテゴリ
export type AppealCategory =
  | "pain" // 痛み訴求
  | "benefit" // ベネフィット訴求
  | "fear" // 恐怖訴求
  | "social_proof" // 社会的証明
  | "authority" // 権威性
  | "scarcity" // 希少性
  | "curiosity" // 好奇心
  | "other";
