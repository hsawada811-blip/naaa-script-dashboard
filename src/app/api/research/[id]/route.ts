import { NextResponse } from "next/server";
import {
  getResearchProject,
  listResearchResults,
  updateResearchProject,
  deleteResearchProject,
  createResearchResult,
} from "@/lib/db/queries";
import { runClaudeJson } from "@/lib/claude-cli";
import { KNOWLEDGE_BASE } from "@/prompts/knowledge-base";
import { getDproClient, type DproItem } from "@/lib/dpro";

interface ResearchResultItem {
  title: string;
  platform: string;
  videoUrl: string;
  script: string;
  hookType: string;
  appealType: string;
  estimatedViews: string;
  notes: string;
}

// プロジェクト詳細 + 結果取得
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getResearchProject(parseInt(id));
  if (!project) {
    return NextResponse.json({ error: "プロジェクトが見つかりません" }, { status: 404 });
  }
  const results = listResearchResults(project.id);
  return NextResponse.json({ project, results });
}

// リサーチ実行
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getResearchProject(parseInt(id));
  if (!project) {
    return NextResponse.json({ error: "プロジェクトが見つかりません" }, { status: 404 });
  }

  updateResearchProject(project.id, { status: "running" });

  const conditions = JSON.parse(project.conditions || "{}");

  const prompt = `あなたは獲得広告の台本リサーチャーです。
条件に合致するTikTok広告動画のパターンと台本を5件生成してください。

## フックパターン（この中から選択）
警告/否定型 | タイプ別診断型 | 結果宣言型 | ランキング型 | 矛盾フック型 | 暴露型 | 損失回避型 | 質問型 | 数字暴露型 | 対比型

## 台本ルール
- ハイテンポ型: 20〜30シーン / 1シーン1〜3秒 / 総尺40〜50秒
- フロー型: 5〜7シーン / 1シーン6〜12秒 / 総尺40〜45秒
- CTA: 2〜3秒に圧縮 / 感情ラベル・数字・オノマトペを3回以上

## リサーチ条件
- ジャンル: ${project.genre}
${conditions.targetAge ? `- ターゲット年齢: ${conditions.targetAge}` : ""}
${conditions.targetGender ? `- ターゲット性別: ${conditions.targetGender}` : ""}
${conditions.format ? `- フォーマット: ${conditions.format}` : ""}
${conditions.platform ? `- プラットフォーム: ${conditions.platform}` : ""}
${project.freeText ? `- 追加条件: ${project.freeText}` : ""}

5件の台本パターンをJSON配列で出力:
[{"title":"概要","platform":"tiktok","videoUrl":"","script":"台本全文（フック+本文+CTA）","hookType":"パターン名","appealType":"訴求タイプ","estimatedViews":"想定再生数","notes":"効く理由"}]`;

  try {
    // Claude CLI生成とDPro検索を並列実行
    const [claudeResult, dproResult] = await Promise.allSettled([
      // 1. Claude CLIで台本パターン生成
      runClaudeJson<ResearchResultItem[]>(prompt, { timeout: 600000 }),
      // 2. DProから実際の動画広告データを取得
      fetchDproData(project.genre, conditions),
    ]);

    let totalCount = 0;

    // Claude CLIの結果を保存
    if (claudeResult.status === "fulfilled") {
      for (const item of claudeResult.value) {
        createResearchResult({
          projectId: project.id,
          title: item.title,
          platform: item.platform || "tiktok",
          videoUrl: item.videoUrl || null,
          script: item.script || null,
          hookType: item.hookType || null,
          appealType: item.appealType || null,
          estimatedViews: item.estimatedViews || null,
          notes: item.notes || null,
        });
      }
      totalCount += claudeResult.value.length;
    } else {
      console.error("[Research] Claude CLI生成エラー:", claudeResult.reason);
    }

    // DProの結果を保存
    if (dproResult.status === "fulfilled" && dproResult.value.length > 0) {
      for (const item of dproResult.value) {
        createResearchResult({
          projectId: project.id,
          title: item.title,
          platform: item.platform || "dpro",
          videoUrl: item.videoUrl || null,
          script: item.script || null,
          hookType: item.hookType || null,
          appealType: item.appealType || null,
          estimatedViews: item.estimatedViews || null,
          notes: item.notes || null,
        });
      }
      totalCount += dproResult.value.length;
    } else if (dproResult.status === "rejected") {
      console.error("[Research] DPro検索エラー:", dproResult.reason);
    }

    // 両方失敗した場合はエラー
    if (claudeResult.status === "rejected" && dproResult.status === "rejected") {
      throw new Error("Claude CLIとDProの両方でエラーが発生しました");
    }

    updateResearchProject(project.id, {
      status: "completed",
      resultCount: totalCount,
    });

    const results = listResearchResults(project.id);
    return NextResponse.json({ project: getResearchProject(project.id), results });
  } catch (error) {
    console.error("Research error:", error);
    updateResearchProject(project.id, { status: "error" });
    return NextResponse.json({ error: "リサーチに失敗しました" }, { status: 500 });
  }
}

// プロジェクト削除
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteResearchProject(parseInt(id));
  return NextResponse.json({ ok: true });
}

/**
 * DProから動画広告データを取得し、リサーチ結果の形式に変換する
 */
async function fetchDproData(
  genre: string,
  conditions: Record<string, string>
): Promise<ResearchResultItem[]> {
  const dpro = getDproClient();

  // ジャンル名からジャンルIDを検索
  const genreResult = await dpro.searchGenres({ genre_name: genre, limit: 5 });
  const matchedGenre = genreResult.results[0];

  // DProで動画広告を検索（ジャンルIDがあればそれで、なければキーワードで）
  const searchParams: Record<string, unknown> = {
    limit: 10,
    sort: "cost_difference-desc",
    interval: 7,
  };

  if (matchedGenre) {
    searchParams.genre_id = String(matchedGenre.id);
  } else {
    searchParams.keyword = genre;
  }

  // プラットフォーム条件があればapp_idに変換
  if (conditions.platform) {
    const platformMap: Record<string, string> = {
      TikTok: "1",
      "YouTube Shorts": "2",
      "Instagram Reels": "3",
    };
    const appId = platformMap[conditions.platform];
    if (appId) searchParams.app_id = appId;
  }

  const itemsResult = await dpro.searchItems(searchParams as Record<string, string>);

  // DProのアイテムをリサーチ結果形式に変換
  return itemsResult.items.map((item: DproItem) => ({
    title: `[DPro] ${item.product_name || item.advertiser_name || "動画広告"}`,
    platform: item.platform || "dpro",
    videoUrl: item.video_url || "",
    script: item.ad_all_sentence || item.ad_sentence || item.narration || "",
    hookType: item.ad_start_sentence ? "実データ" : "不明",
    appealType: item.genre_name || "不明",
    estimatedViews: item.play_count ? String(item.play_count) : "不明",
    notes: [
      item.cost_difference ? `推定広告費差: ${item.cost_difference}` : null,
      item.streaming_period ? `配信期間: ${item.streaming_period}日` : null,
      item.digg_count ? `いいね: ${item.digg_count}` : null,
      item.advertiser_name ? `広告主: ${item.advertiser_name}` : null,
      matchedGenre ? `ジャンル: ${matchedGenre.name}` : null,
    ].filter(Boolean).join(" / "),
  }));
}
