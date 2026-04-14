import { NextResponse } from "next/server";

// MCP連携用プレースホルダー
// 将来的にGoogle Ads / Meta Ads等のAPIと連携
export async function GET() {
  return NextResponse.json({
    message: "広告データAPI - MCP連携準備中",
    platforms: [
      { name: "Google Ads", status: "未接続", description: "検索/ディスプレイ広告" },
      { name: "Meta Ads", status: "未接続", description: "Facebook/Instagram広告" },
      { name: "TikTok Ads", status: "未接続", description: "TikTok広告" },
    ],
  });
}
