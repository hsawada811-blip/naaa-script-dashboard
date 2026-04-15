/**
 * DPro動画広告データ検索APIルート
 *
 * GET: クエリパラメータで動画広告データを検索
 *   - genre_id: ジャンルIDで絞り込み
 *   - product_id: 商材IDで絞り込み
 *   - keyword: キーワード検索
 *   - sort: ソート順（デフォルト: cost_difference-desc）
 *   - limit: 取得件数（デフォルト: 20、最大: 100）
 *   - interval: 期間（デフォルト: 2）
 *   - app_id: アプリIDで絞り込み
 *   - next: ページネーション用カーソル
 */
import { NextResponse } from "next/server";
import { getDproClient } from "@/lib/dpro";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const dpro = getDproClient();

    // パラメータを安全に取得
    const genreId = searchParams.get("genre_id") || undefined;
    const productId = searchParams.get("product_id") || undefined;
    const keyword = searchParams.get("keyword") || undefined;
    const keywordLogic = (searchParams.get("keyword_logic") as "and" | "or") || "and";
    const sort = searchParams.get("sort") || "cost_difference-desc";
    const limitStr = searchParams.get("limit");
    const limit = limitStr ? Math.min(parseInt(limitStr), 100) : 20;
    const intervalStr = searchParams.get("interval");
    const interval = intervalStr ? parseInt(intervalStr) : 2;
    const appId = searchParams.get("app_id") || undefined;
    const next = searchParams.get("next") || undefined;
    const toDate = searchParams.get("to_date") || undefined;
    const mediaType = searchParams.get("media_type") || undefined;
    const isAffiliateStr = searchParams.get("is_affiliate");
    const isAffiliate = isAffiliateStr === "true" ? true : isAffiliateStr === "false" ? false : undefined;
    const adSentence = searchParams.get("ad_sentence") || undefined;
    const narration = searchParams.get("narration") || undefined;
    const videoType = searchParams.get("video_type") || undefined;
    const duration = searchParams.get("duration") || undefined;
    const creationTime = searchParams.get("creation_time") || undefined;
    const costDifference = searchParams.get("cost_difference") || undefined;
    const playCount = searchParams.get("play_count") || undefined;
    const advertiserName = searchParams.get("advertiser_name") || undefined;
    const accountName = searchParams.get("account_name") || undefined;

    const result = await dpro.searchItems({
      genre_id: genreId,
      product_id: productId,
      keyword,
      keyword_logic: keywordLogic,
      sort,
      limit,
      interval,
      app_id: appId,
      next,
      to_date: toDate,
      media_type: mediaType,
      is_affiliate: isAffiliate,
      ad_sentence: adSentence,
      narration,
      video_type: videoType,
      duration,
      creation_time: creationTime,
      cost_difference: costDifference,
      play_count: playCount,
      advertiser_name: advertiserName,
      account_name: accountName,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[DPro items] エラー:", error);
    const message = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
