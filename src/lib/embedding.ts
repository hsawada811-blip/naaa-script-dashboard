import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL = "gemini-embedding-001";
const DIMENSIONS = 768; // 軽量で十分な精度

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY が設定されていません");
    client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return client;
}

/**
 * テキストをエンベディングベクトルに変換
 */
export async function embedText(text: string): Promise<number[]> {
  const ai = getClient();
  const result = await ai.models.embedContent({
    model: MODEL,
    contents: text,
    config: { outputDimensionality: DIMENSIONS },
  });
  return result.embeddings?.[0]?.values || [];
}

/**
 * 複数テキストを一括エンベディング
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  // Gemini APIは1リクエストで複数テキスト可能
  const ai = getClient();
  const results: number[][] = [];
  // バッチサイズ制限があるので10件ずつ処理
  for (let i = 0; i < texts.length; i += 10) {
    const batch = texts.slice(i, i + 10);
    const promises = batch.map(text =>
      ai.models.embedContent({
        model: MODEL,
        contents: text,
        config: { outputDimensionality: DIMENSIONS },
      })
    );
    const batchResults = await Promise.all(promises);
    for (const r of batchResults) {
      results.push(r.embeddings?.[0]?.values || []);
    }
  }
  return results;
}

/**
 * コサイン類似度を計算（-1〜1、1が最も類似）
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * クエリベクトルに対して類似度Top Kを返す
 */
export function findSimilar(
  queryEmbedding: number[],
  candidates: { id: number; embedding: number[] }[],
  topK: number = 5
): { id: number; score: number }[] {
  const scored = candidates.map(c => ({
    id: c.id,
    score: cosineSimilarity(queryEmbedding, c.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
