/**
 * DPro検索APIルート
 *
 * GET: ジャンル・商材のプルダウン用検索
 * POST: 条件を受け取ってDProで動画広告データを検索
 */
import { NextResponse } from "next/server";
import { getDproClient } from "@/lib/dpro";

/** GET: ジャンル・商材の検索（プルダウン用） */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "genres" | "products" | "apps"
  const query = searchParams.get("q") || undefined;
  const genreId = searchParams.get("genre_id") || undefined;
  const limit = searchParams.get("limit")
    ? parseInt(searchParams.get("limit")!)
    : undefined;

  try {
    const dpro = getDproClient();

    switch (type) {
      case "genres": {
        const data = await dpro.searchGenres({
          genre_name: query,
          limit: limit || 100,
        });
        return NextResponse.json(data);
      }

      case "products": {
        const data = await dpro.searchProducts({
          product_name: query,
          genre_id: genreId,
          limit: limit || 100,
        });
        return NextResponse.json(data);
      }

      case "apps": {
        const data = await dpro.getApps();
        return NextResponse.json({ results: data });
      }

      case "transition_urls": {
        const url = searchParams.get("url") || undefined;
        const transitionTypeId = searchParams.get("transition_type_id") || undefined;
        const data = await dpro.searchTransitionUrls({
          url,
          transition_type_id: transitionTypeId,
        });
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json(
          { error: "typeパラメータが必要です（genres / products / apps / transition_urls）" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[DPro search] エラー:", error);
    const message = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST: 条件指定で動画広告データを検索 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const dpro = getDproClient();

    const result = await dpro.searchItems({
      genre_id: body.genre_id as string | undefined,
      product_id: body.product_id as string | undefined,
      keyword: body.keyword as string | undefined,
      keyword_logic: (body.keyword_logic as "and" | "or") || "and",
      app_id: body.app_id as string | undefined,
      sort: (body.sort as string) || "cost_difference-desc",
      limit: (body.limit as number) || 20,
      interval: (body.interval as number) || 2,
      to_date: body.to_date as string | undefined,
      is_affiliate: body.is_affiliate as boolean | undefined,
      media_type: body.media_type as string | undefined,
      ad_sentence: body.ad_sentence as string | undefined,
      narration: body.narration as string | undefined,
      video_type: body.video_type as string | undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[DPro search POST] エラー:", error);
    const message = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
