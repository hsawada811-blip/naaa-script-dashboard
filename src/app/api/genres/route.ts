import { NextResponse } from "next/server";
import { listDistinctGenres } from "@/lib/db/queries";

// DProでヒットしやすいプリセットジャンル
const PRESET_GENRES = [
  "債務整理",
  "転職",
  "不動産査定",
  "車査定",
  "美容",
  "脱毛",
  "探偵",
  "退職代行",
  "ウォーターサーバー",
  "結婚相談所",
];

export async function GET() {
  const dbGenres = listDistinctGenres();
  // プリセットとDB登録済みを統合（重複排除）
  const genres = [...new Set([...PRESET_GENRES, ...dbGenres])].sort();

  return NextResponse.json({ genres, dbGenres, presets: PRESET_GENRES });
}
