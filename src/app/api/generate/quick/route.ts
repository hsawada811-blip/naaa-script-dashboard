import { NextResponse } from "next/server";
import { runClaudeJson } from "@/lib/claude-cli";

// API route のタイムアウト設定（Vercel: 最大300秒、ローカル: 無制限）
export const maxDuration = 300;
import { getResearchAnalysisPrompt, getScriptGenerationPrompt } from "@/prompts/quick-generate";
import { getDproClient } from "@/lib/dpro";
import { embedText, embedTexts, findSimilar } from "@/lib/embedding";
import { upsertDproEmbedding, listDproEmbeddingsByGenre, listReferenceScriptsByGenre, createScript, createGeneratedScript, updateScript } from "@/lib/db/queries";
import { hashText } from "@/lib/utils";

interface DproItemSummary {
  ad_start_sentence?: string;
  ad_all_sentence?: string;
  narration?: string;
  cost_difference?: number;
  play_count?: number;
  duration?: number;
  streaming_period?: number;
  video_type?: string;
  video_url?: string;
}

/**
 * DProアイテムが「意味のある台本データ」を持っているか判定
 */
function hasValidScript(item: DproItemSummary): boolean {
  const text = item.ad_all_sentence || item.narration || "";
  if (text.length < 50) return false;
  if (/差押|限度額|ご利用額|明細書|納付|滞納|つきましては/.test(text) && text.length < 200) return false;
  return true;
}

/**
 * DProアイテムをプロンプト用テキストに変換
 */
function formatDproItem(item: DproItemSummary, index: number): string {
  const parts = [`### 好調広告${index + 1}`];
  if (item.cost_difference) parts.push(`推定広告費: ${Math.round(item.cost_difference / 10000)}万円`);
  if (item.play_count) parts.push(`再生数: ${item.play_count.toLocaleString()}`);
  if (item.duration) parts.push(`尺: ${item.duration}秒`);
  if (item.streaming_period) parts.push(`配信期間: ${item.streaming_period}日`);
  if (item.video_type) parts.push(`タイプ: ${item.video_type}`);
  if (item.video_url) parts.push(`動画URL: ${item.video_url}`);
  if (item.ad_start_sentence) parts.push(`フック: ${item.ad_start_sentence}`);
  if (item.ad_all_sentence) parts.push(`台本全文:\n${item.ad_all_sentence}`);
  else if (item.narration) parts.push(`ナレーション:\n${item.narration}`);
  return parts.join("\n");
}

/**
 * ステップ1: DProリサーチ + エンベディング類似検索 + ペルソナ分析
 */
async function handleResearch(body: Record<string, unknown>) {
  const scripts = (body.scripts as string[]) || [];
  const genre = (body.genre as string) || "";
  const articleLpText = (body.articleLpText as string) || "";
  const instructions = (body.instructions as string) || "";

  let dproData = "";
  let embeddingUsed = false;
  let matchedTerm = "";
  const searchTerm = genre || (scripts[0]?.slice(0, 50) || "");

  try {
    const dpro = getDproClient();

    if (searchTerm) {
      // ジャンル検索: 元のキーワード → 短縮版 → 単語分割の順で試行
      const searchVariants = [searchTerm];
      // 2文字以上の部分文字列を追加（「中古車査定」→「中古車」「車査定」「査定」）
      if (searchTerm.length > 2) {
        for (let len = searchTerm.length - 1; len >= 2; len--) {
          for (let start = 0; start <= searchTerm.length - len; start++) {
            const sub = searchTerm.slice(start, start + len);
            if (!searchVariants.includes(sub)) searchVariants.push(sub);
          }
        }
      }
      // 最大8パターンまで
      const candidates = searchVariants.slice(0, 8);

      let genreId: number | undefined;
      for (const term of candidates) {
        const genreResult = await dpro.searchGenres({ genre_name: term, limit: 5 });
        if (genreResult.results.length > 0) {
          genreId = genreResult.results[0].id;
          matchedTerm = term;
          console.log(`[Quick generate] DProジャンル: "${term}" でヒット (id=${genreId}, 元の検索: "${searchTerm}")`);
          break;
        }
      }
      if (!genreId) {
        console.log(`[Quick generate] DProジャンル未検出: 試行した検索語 = ${candidates.join(", ")}`);
      }

      if (genreId) {
        // DProから好調広告を取得
        const itemsResult = await dpro.searchItems({
          genre_id: String(genreId),
          sort: "cost_difference-desc",
          limit: 30,
          interval: 30,
        });

        const validItems = itemsResult.items.filter((item: DproItemSummary) => hasValidScript(item));
        console.log(`[Quick generate] DPro: ${itemsResult.items.length}件取得 → ${validItems.length}件が有効な台本データ`);

        // === エンベディング: 有効な台本をDBに保存 ===
        const genreName = genre || searchTerm;
        try {
          const textsToEmbed = validItems.map((item: DproItemSummary) =>
            item.ad_all_sentence || item.narration || ""
          );
          const embeddings = await embedTexts(textsToEmbed);

          let newCount = 0;
          for (let i = 0; i < validItems.length; i++) {
            const item = validItems[i] as DproItemSummary;
            const scriptText = item.ad_all_sentence || item.narration || "";
            const result = upsertDproEmbedding({
              scriptText,
              hook: item.ad_start_sentence || null,
              embedding: JSON.stringify(embeddings[i]),
              costDifference: item.cost_difference || null,
              playCount: item.play_count || null,
              duration: item.duration || null,
              streamingPeriod: item.streaming_period || null,
              videoType: item.video_type || null,
              videoUrl: item.video_url || null,
              genre: genreName,
              contentHash: hashText(scriptText),
            });
            if (result && "id" in result && !("id" in result && result.id === undefined)) {
              newCount++;
            }
          }
          console.log(`[Quick generate] エンベディング: ${newCount}件を新規保存`);

          // === 参考台本がある場合、エンベディング類似検索で最適な台本を選ぶ ===
          if (scripts.length > 0 && scripts[0].trim().length >= 10) {
            const existingEmbeddings = listDproEmbeddingsByGenre(genreName);
            const refScripts = listReferenceScriptsByGenre(genreName);

            // DPro + referenceScripts の両方を候補として統合
            const allCandidates: { id: number; embedding: number[]; source: "dpro" | "reference" }[] = [
              ...existingEmbeddings.map(e => ({
                id: e.id,
                embedding: JSON.parse(e.embedding) as number[],
                source: "dpro" as const,
              })),
              ...refScripts
                .filter(r => r.embedding)
                .map(r => ({
                  id: r.id + 100000, // IDが衝突しないようオフセット
                  embedding: JSON.parse(r.embedding!) as number[],
                  source: "reference" as const,
                })),
            ];

            if (allCandidates.length >= 3) {
              // 参考台本を結合してクエリベクトルを作成
              const queryText = scripts.join("\n");
              const queryEmbedding = await embedText(queryText);

              // 類似度Top 10を取得（候補が増えたため）
              const similar = findSimilar(queryEmbedding, allCandidates, 10);

              // 類似度の高い台本でdproDataを構築
              const similarItems = similar.map(s => {
                const candidate = allCandidates.find(c => c.id === s.id)!;
                if (candidate.source === "dpro") {
                  const e = existingEmbeddings.find(e => e.id === s.id)!;
                  const parts = [`### 好調広告（類似度: ${(s.score * 100).toFixed(1)}% / DPro）`];
                  if (e.costDifference) parts.push(`推定広告費: ${Math.round(e.costDifference / 10000)}万円`);
                  if (e.playCount) parts.push(`再生数: ${e.playCount.toLocaleString()}`);
                  if (e.duration) parts.push(`尺: ${e.duration}秒`);
                  if (e.streamingPeriod) parts.push(`配信期間: ${e.streamingPeriod}日`);
                  if (e.videoType) parts.push(`タイプ: ${e.videoType}`);
                  if (e.videoUrl) parts.push(`動画URL: ${e.videoUrl}`);
                  if (e.hook) parts.push(`フック: ${e.hook}`);
                  parts.push(`台本全文:\n${e.scriptText}`);
                  return parts.join("\n");
                } else {
                  const r = refScripts.find(r => r.id + 100000 === s.id)!;
                  const parts = [`### 参考台本（類似度: ${(s.score * 100).toFixed(1)}%）`];
                  if (r.hook) parts.push(`フック: ${r.hook}`);
                  parts.push(`台本全文:\n${r.scriptText}`);
                  return parts.join("\n");
                }
              });

              dproData = similarItems.join("\n\n---\n\n");
              embeddingUsed = true;
              const dproCount = similar.filter(s => allCandidates.find(c => c.id === s.id)?.source === "dpro").length;
              const refCount = similar.length - dproCount;
              console.log(`[Quick generate] エンベディング類似検索: DPro${existingEmbeddings.length}件+参考台本${refScripts.length}件 → 上位${similar.length}件選定（DPro:${dproCount}, 参考:${refCount}）`);
            }
          }
        } catch (embErr) {
          console.log("[Quick generate] エンベディング処理スキップ:", embErr instanceof Error ? embErr.message : embErr);
          // エンベディングエラーでもフォールバック（広告費順）で続行
        }

        // エンベディング未使用の場合はフォールバック（従来の広告費順）
        if (!embeddingUsed && validItems.length > 0) {
          const top10 = validItems.slice(0, 10);
          const summaries = top10.map((item: DproItemSummary, i: number) => formatDproItem(item, i));
          dproData = summaries.join("\n\n---\n\n");
        }
      }
    }
  } catch (err) {
    console.log("[Quick generate] DPro検索スキップ:", err instanceof Error ? err.message : err);
  }

  // referenceScriptsの件数を取得
  const genreName = genre || searchTerm;
  const refScriptCount = genreName ? listReferenceScriptsByGenre(genreName).length : 0;

  const prompt = getResearchAnalysisPrompt(scripts, dproData, {
    genre,
    articleLpText,
    instructions,
  });

  const analysis = await runClaudeJson<Record<string, unknown>>(prompt, { timeout: 600000 });

  return NextResponse.json({
    analysis,
    dproData,
    dproItemCount: dproData ? dproData.split(/### (好調広告|参考台本)/).length - 1 : 0,
    embeddingUsed,
    referenceScriptCount: refScriptCount,
    dproSearchInfo: dproData
      ? `${matchedTerm || searchTerm} でDProヒット`
      : `DPro未検出: ${searchTerm}`,
  });
}

/**
 * ステップ2: 台本生成
 */
interface GeneratedVariant {
  category?: string;
  type?: string;
  title?: string;
  hookPattern?: string;
  format?: string;
  estimatedDuration?: string;
  hook?: string;
  script?: string;
  reasoning?: string;
}

async function handleGenerate(body: Record<string, unknown>) {
  const scripts = (body.scripts as string[]) || [];
  const analysisResult = body.analysisResult as string;
  const dproData = (body.dproData as string) || "";
  const genre = (body.genre as string) || "";
  const articleLpText = (body.articleLpText as string) || "";
  const instructions = (body.instructions as string) || "";
  const projectId = body.projectId as number | null | undefined;

  if (!analysisResult) {
    return NextResponse.json({ error: "分析結果が必要です" }, { status: 400 });
  }

  const prompt = getScriptGenerationPrompt(analysisResult, scripts, dproData, {
    genre,
    articleLpText,
    instructions,
  });

  const result = await runClaudeJson<{ variants: GeneratedVariant[] }>(prompt, { timeout: 600000 });

  // 結果をDBに保存
  let savedScriptId: number | null = null;
  if (result?.variants?.length > 0) {
    try {
      const title = genre
        ? `${genre} B案生成 (${new Date().toLocaleDateString("ja-JP")})`
        : `B案生成 (${new Date().toLocaleDateString("ja-JP")})`;

      const script = createScript({
        title,
        originalScript: scripts[0] || "(ジャンル入力のみ)",
        projectId: projectId || null,
        dproData: dproData || null,
        researchAnalysis: analysisResult || null,
        status: "completed",
      });
      savedScriptId = script.id;

      for (const v of result.variants) {
        const variant = v.category === "新規フォーマット" ? "new_plan" as const : "b_plan" as const;
        createGeneratedScript({
          scriptId: script.id,
          variant,
          content: v.script || "",
          reasoning: v.reasoning || null,
        });
      }

      console.log(`[Quick generate] DB保存: script#${script.id} に${result.variants.length}件の台本を保存`);
    } catch (saveErr) {
      console.error("[Quick generate] DB保存エラー:", saveErr);
    }
  }

  return NextResponse.json({ ...result, scriptId: savedScriptId });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const step = url.searchParams.get("step") || "research";

  try {
    const body = await request.json();

    if (step === "research") {
      return await handleResearch(body);
    } else if (step === "generate") {
      return await handleGenerate(body);
    }

    return NextResponse.json({ error: "stepパラメータが不正です" }, { status: 400 });
  } catch (error) {
    console.error(`[Quick generate ${step}] エラー:`, error);
    return NextResponse.json(
      { error: `${step === "research" ? "リサーチ" : "生成"}に失敗しました。再度お試しください。` },
      { status: 500 }
    );
  }
}
