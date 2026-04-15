"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// --- 型定義 ---

interface DproGenre {
  id: number;
  name: string;
}

interface DproProduct {
  id: number;
  genre_id: number;
  genre_name: string;
  name: string;
}

interface DproItem {
  id?: number;
  title?: string;
  video_url?: string;
  thumbnail_url?: string;
  platform?: string;
  genre_name?: string;
  product_name?: string;
  advertiser_name?: string;
  account_name?: string;
  duration?: number;
  play_count?: number;
  play_count_difference?: number;
  digg_count?: number;
  digg_rate?: number;
  cost?: number;
  cost_difference?: number;
  creation_time?: string;
  end_time?: string;
  streaming_period?: number;
  ad_sentence?: string;
  ad_start_sentence?: string;
  ad_all_sentence?: string;
  transition_url?: string;
  narration?: string;
  bgm?: string;
  video_type?: string;
  media_type?: string;
  [key: string]: unknown;
}

// --- ユーティリティ ---

function formatCost(cost: number | undefined | null): string {
  if (cost === undefined || cost === null) return "-";
  if (cost >= 10000) return `${Math.round(cost / 10000)}万円`;
  return `${cost.toLocaleString()}円`;
}

function formatCount(count: number | undefined | null): string {
  if (count === undefined || count === null) return "-";
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
  return count.toLocaleString();
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  } catch {
    return dateStr.slice(0, 10);
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

// --- メインコンポーネント ---

export default function ResearchPage() {
  // フィルター
  const [genres, setGenres] = useState<DproGenre[]>([]);
  const [products, setProducts] = useState<DproProduct[]>([]);
  const [genreQuery, setGenreQuery] = useState("");
  const [selectedGenreId, setSelectedGenreId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("cost_difference-desc");
  const [limit, setLimit] = useState("20");
  const [interval, setInterval] = useState("2");
  const [mediaType, setMediaType] = useState("");
  const [videoType, setVideoType] = useState("");
  const [durationRange, setDurationRange] = useState("");
  const [costRange, setCostRange] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // 結果
  const [items, setItems] = useState<DproItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ジャンル検索
  const handleSearchGenres = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams({ type: "genres" });
      if (genreQuery) params.set("q", genreQuery);
      const res = await fetch(`/api/dpro/search?${params}`);
      if (!res.ok) throw new Error("ジャンル検索に失敗");
      const data = await res.json();
      setGenres(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラー");
    }
  }, [genreQuery]);

  // ジャンル選択 → 商材取得
  async function handleSelectGenre(genreId: string) {
    setSelectedGenreId(genreId);
    setSelectedProductId("");
    setProducts([]);
    if (!genreId) return;
    try {
      const res = await fetch(`/api/dpro/search?type=products&genre_id=${genreId}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.results || []);
      }
    } catch { /* ignore */ }
  }

  // 検索実行
  async function handleSearch() {
    setSearching(true);
    setError(null);
    setItems([]);
    setExpandedId(null);
    try {
      const params = new URLSearchParams();
      if (selectedGenreId) params.set("genre_id", selectedGenreId);
      if (selectedProductId && selectedProductId !== "__all__") params.set("product_id", selectedProductId);
      if (keyword) params.set("keyword", keyword);
      params.set("sort", sort);
      params.set("limit", limit);
      params.set("interval", interval);
      if (mediaType) params.set("media_type", mediaType);
      if (videoType) params.set("video_type", videoType);
      if (durationRange) params.set("duration", durationRange);
      if (costRange) params.set("cost_difference", costRange);

      const res = await fetch(`/api/dpro/items?${params}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "検索失敗");
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラー");
    } finally {
      setSearching(false);
    }
  }

  // コピー通知
  function handleCopy(text: string, fieldName: string) {
    copyToClipboard(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  }

  // CSV出力
  function handleExportCsv() {
    if (items.length === 0) return;

    const headers = [
      "商材", "広告主", "ジャンル", "推定広告費", "再生数", "いいね",
      "尺(秒)", "配信期間(日)", "作成日", "動画URL", "遷移先URL",
      "フック(冒頭)", "台本全文", "ナレーション"
    ];
    const rows = items.map(item => [
      item.product_name || "",
      item.advertiser_name || "",
      item.genre_name || "",
      item.cost_difference?.toString() || "",
      item.play_count?.toString() || "",
      item.digg_count?.toString() || "",
      item.duration?.toString() || "",
      item.streaming_period?.toString() || "",
      item.creation_time || "",
      item.video_url || "",
      item.transition_url || "",
      (item.ad_start_sentence || "").replace(/\n/g, " "),
      (item.ad_all_sentence || "").replace(/\n/g, " "),
      (item.narration || "").replace(/\n/g, " "),
    ]);

    const bom = "\uFEFF";
    const csv = bom + [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dpro-research-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 初回ジャンル読み込み
  useEffect(() => { handleSearchGenres(); }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">台本リサーチ</h1>
        {items.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            CSV出力
          </Button>
        )}
      </div>

      {/* フィルター */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          {/* 1行目: ジャンル + 商材 + キーワード */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3 space-y-1">
              <Label className="text-xs">ジャンル</Label>
              <div className="flex gap-1">
                <Input
                  value={genreQuery}
                  onChange={(e) => setGenreQuery(e.target.value)}
                  placeholder="ジャンル検索..."
                  className="h-9 text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearchGenres(); }}
                />
                <Button variant="outline" size="sm" className="h-9 px-2" onClick={handleSearchGenres}>
                  検索
                </Button>
              </div>
              {genres.length > 0 && (
                <Select value={selectedGenreId} onValueChange={(v) => { if (v) handleSelectGenre(v); }}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="ジャンル選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="md:col-span-3 space-y-1">
              <Label className="text-xs">商材</Label>
              <Select
                value={selectedProductId}
                onValueChange={(v) => { if (v) setSelectedProductId(v); }}
                disabled={products.length === 0}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={products.length > 0 ? `${products.length}件から選択` : "ジャンル選択後"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全商材</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 space-y-1">
              <Label className="text-xs">キーワード</Label>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="フリーワード"
                className="h-9 text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              />
            </div>

            <div className="md:col-span-3 flex gap-2 items-end">
              <Button
                onClick={handleSearch}
                disabled={searching || (!selectedGenreId && !keyword)}
                className="h-9 flex-1"
              >
                {searching ? "検索中..." : "検索"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                {showAdvancedFilters ? "閉じる" : "詳細"}
              </Button>
            </div>
          </div>

          {/* 2行目: ソート + 件数 + 期間 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">ソート</Label>
              <Select value={sort} onValueChange={(v) => { if (v) setSort(v); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cost_difference-desc">広告費(高い順)</SelectItem>
                  <SelectItem value="cost_difference-asc">広告費(低い順)</SelectItem>
                  <SelectItem value="play_count_difference-desc">再生増加(多い順)</SelectItem>
                  <SelectItem value="creation_time-desc">新しい順</SelectItem>
                  <SelectItem value="creation_time-asc">古い順</SelectItem>
                  <SelectItem value="streaming_period-desc">配信期間(長い順)</SelectItem>
                  <SelectItem value="digg_rate-desc">エンゲージ率(高い順)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">件数</Label>
              <Select value={limit} onValueChange={(v) => { if (v) setLimit(v); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10件</SelectItem>
                  <SelectItem value="20">20件</SelectItem>
                  <SelectItem value="50">50件</SelectItem>
                  <SelectItem value="100">100件</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">集計期間</Label>
              <Select value={interval} onValueChange={(v) => { if (v) setInterval(v); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">直近1日</SelectItem>
                  <SelectItem value="2">直近2日</SelectItem>
                  <SelectItem value="7">直近7日</SelectItem>
                  <SelectItem value="14">直近14日</SelectItem>
                  <SelectItem value="30">直近30日</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 詳細フィルター */}
          {showAdvancedFilters && (
            <>
              <Separator />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">メディアタイプ</Label>
                  <Select value={mediaType} onValueChange={(v) => { if (v !== null) setMediaType(v === "__none__" ? "" : v); }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="全て" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">全て</SelectItem>
                      <SelectItem value="video">動画</SelectItem>
                      <SelectItem value="image">画像</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">動画タイプ</Label>
                  <Select value={videoType} onValueChange={(v) => { if (v !== null) setVideoType(v === "__none__" ? "" : v); }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="全て" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">全て</SelectItem>
                      <SelectItem value="実写">実写</SelectItem>
                      <SelectItem value="アニメーション">アニメーション</SelectItem>
                      <SelectItem value="スライドショー">スライドショー</SelectItem>
                      <SelectItem value="テキスト">テキスト</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">尺(秒)</Label>
                  <Select value={durationRange} onValueChange={(v) => { if (v !== null) setDurationRange(v === "__none__" ? "" : v); }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="全て" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">全て</SelectItem>
                      <SelectItem value="0-15">~15秒</SelectItem>
                      <SelectItem value="15-30">15~30秒</SelectItem>
                      <SelectItem value="30-60">30~60秒</SelectItem>
                      <SelectItem value="60-">60秒~</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">推定広告費</Label>
                  <Select value={costRange} onValueChange={(v) => { if (v !== null) setCostRange(v === "__none__" ? "" : v); }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="全て" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">全て</SelectItem>
                      <SelectItem value="100000-">10万円~</SelectItem>
                      <SelectItem value="500000-">50万円~</SelectItem>
                      <SelectItem value="1000000-">100万円~</SelectItem>
                      <SelectItem value="5000000-">500万円~</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* 結果テーブル */}
      {items.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">{items.length}件の結果</p>
          </div>

          {/* ヘッダー行 */}
          <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
            <div className="col-span-1"></div>
            <div className="col-span-3">商材 / 広告主</div>
            <div className="col-span-1 text-right">広告費</div>
            <div className="col-span-1 text-right">再生数</div>
            <div className="col-span-1 text-right">いいね</div>
            <div className="col-span-1 text-center">尺</div>
            <div className="col-span-1 text-center">配信期間</div>
            <div className="col-span-1 text-center">作成日</div>
            <div className="col-span-2 text-center">タイプ</div>
          </div>

          {/* データ行 */}
          {items.map((item, idx) => (
            <div key={item.id || idx} className="border rounded-lg overflow-hidden">
              {/* コンパクト行 */}
              <div
                className="grid grid-cols-1 md:grid-cols-12 gap-2 px-3 py-2 items-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedId(expandedId === idx ? null : idx)}
              >
                {/* サムネイル */}
                <div className="col-span-1 flex items-center justify-center">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt=""
                      className="w-12 h-16 object-cover rounded"
                    />
                  ) : item.video_url ? (
                    <div className="w-12 h-16 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                      VID
                    </div>
                  ) : (
                    <div className="w-12 h-16 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                      -
                    </div>
                  )}
                </div>

                {/* 商材/広告主 */}
                <div className="col-span-3 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {item.product_name || item.advertiser_name || `広告 #${idx + 1}`}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.advertiser_name && item.product_name ? item.advertiser_name : item.genre_name || ""}
                  </p>
                </div>

                {/* 広告費 */}
                <div className="col-span-1 text-right">
                  <p className="text-sm font-medium">{formatCost(item.cost_difference)}</p>
                </div>

                {/* 再生数 */}
                <div className="col-span-1 text-right">
                  <p className="text-sm">{formatCount(item.play_count)}</p>
                </div>

                {/* いいね */}
                <div className="col-span-1 text-right">
                  <p className="text-sm">{formatCount(item.digg_count)}</p>
                </div>

                {/* 尺 */}
                <div className="col-span-1 text-center">
                  <p className="text-sm">{item.duration ? `${item.duration}s` : "-"}</p>
                </div>

                {/* 配信期間 */}
                <div className="col-span-1 text-center">
                  <p className="text-sm">{item.streaming_period ? `${item.streaming_period}日` : "-"}</p>
                </div>

                {/* 作成日 */}
                <div className="col-span-1 text-center">
                  <p className="text-xs">{formatDate(item.creation_time)}</p>
                </div>

                {/* タイプバッジ */}
                <div className="col-span-2 flex gap-1 justify-center flex-wrap">
                  {item.video_type && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">{item.video_type}</Badge>
                  )}
                  {item.platform && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">{item.platform}</Badge>
                  )}
                </div>
              </div>

              {/* 展開プレビュー */}
              {expandedId === idx && (
                <div className="border-t bg-muted/30 p-4 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* 左: 動画プレビュー */}
                    <div className="space-y-3">
                      {item.video_url && (
                        <div>
                          <video
                            src={item.video_url}
                            controls
                            className="w-full max-h-[400px] rounded-lg bg-black"
                            preload="metadata"
                          />
                          <div className="flex gap-1 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={(e) => { e.stopPropagation(); handleCopy(item.video_url!, `video-${idx}`); }}
                            >
                              {copiedField === `video-${idx}` ? "コピー済" : "動画URL"}
                            </Button>
                            <a
                              href={item.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center h-7 px-2 text-xs border rounded-md hover:bg-muted"
                              onClick={(e) => e.stopPropagation()}
                            >
                              開く
                            </a>
                          </div>
                        </div>
                      )}

                      {/* メトリクス詳細 */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 bg-background rounded">
                          <p className="text-xs text-muted-foreground">推定広告費</p>
                          <p className="font-medium">{formatCost(item.cost_difference)}</p>
                        </div>
                        <div className="p-2 bg-background rounded">
                          <p className="text-xs text-muted-foreground">累計広告費</p>
                          <p className="font-medium">{formatCost(item.cost)}</p>
                        </div>
                        <div className="p-2 bg-background rounded">
                          <p className="text-xs text-muted-foreground">再生数</p>
                          <p className="font-medium">{formatCount(item.play_count)}</p>
                        </div>
                        <div className="p-2 bg-background rounded">
                          <p className="text-xs text-muted-foreground">いいね / 率</p>
                          <p className="font-medium">
                            {formatCount(item.digg_count)}
                            {item.digg_rate !== undefined && item.digg_rate !== null
                              ? ` (${(item.digg_rate * 100).toFixed(1)}%)`
                              : ""}
                          </p>
                        </div>
                        <div className="p-2 bg-background rounded">
                          <p className="text-xs text-muted-foreground">尺</p>
                          <p className="font-medium">{item.duration ? `${item.duration}秒` : "-"}</p>
                        </div>
                        <div className="p-2 bg-background rounded">
                          <p className="text-xs text-muted-foreground">配信期間</p>
                          <p className="font-medium">{item.streaming_period ? `${item.streaming_period}日` : "-"}</p>
                        </div>
                      </div>

                      {/* 遷移先URL */}
                      {item.transition_url && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">遷移先URL</p>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={(e) => { e.stopPropagation(); handleCopy(item.transition_url!, `lp-${idx}`); }}
                            >
                              {copiedField === `lp-${idx}` ? "コピー済" : "URLコピー"}
                            </Button>
                            <a
                              href={item.transition_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center h-7 px-2 text-xs border rounded-md hover:bg-muted"
                              onClick={(e) => e.stopPropagation()}
                            >
                              LPを開く
                            </a>
                          </div>
                          <p className="text-xs text-muted-foreground break-all">{item.transition_url}</p>
                        </div>
                      )}
                    </div>

                    {/* 中央: 台本・テキスト */}
                    <div className="lg:col-span-2 space-y-3">
                      {/* フック（冒頭テキスト） */}
                      {item.ad_start_sentence && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-muted-foreground">フック（冒頭）</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2"
                              onClick={(e) => { e.stopPropagation(); handleCopy(item.ad_start_sentence!, `hook-${idx}`); }}
                            >
                              {copiedField === `hook-${idx}` ? "コピー済" : "コピー"}
                            </Button>
                          </div>
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm whitespace-pre-wrap leading-relaxed">
                            {item.ad_start_sentence}
                          </div>
                        </div>
                      )}

                      {/* 広告テキスト全文 */}
                      {item.ad_all_sentence && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-muted-foreground">台本（全文）</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2"
                              onClick={(e) => { e.stopPropagation(); handleCopy(item.ad_all_sentence!, `script-${idx}`); }}
                            >
                              {copiedField === `script-${idx}` ? "コピー済" : "コピー"}
                            </Button>
                          </div>
                          <div className="p-3 bg-background border rounded-md text-sm whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                            {item.ad_all_sentence}
                          </div>
                        </div>
                      )}

                      {/* ナレーション */}
                      {item.narration && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-muted-foreground">ナレーション</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2"
                              onClick={(e) => { e.stopPropagation(); handleCopy(item.narration!, `narr-${idx}`); }}
                            >
                              {copiedField === `narr-${idx}` ? "コピー済" : "コピー"}
                            </Button>
                          </div>
                          <div className="p-3 bg-background border rounded-md text-sm whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">
                            {item.narration}
                          </div>
                        </div>
                      )}

                      {/* 基本情報タグ */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {item.advertiser_name && (
                          <span className="px-2 py-1 bg-muted rounded">広告主: {item.advertiser_name}</span>
                        )}
                        {item.account_name && (
                          <span className="px-2 py-1 bg-muted rounded">アカウント: {item.account_name}</span>
                        )}
                        {item.genre_name && (
                          <span className="px-2 py-1 bg-muted rounded">ジャンル: {item.genre_name}</span>
                        )}
                        {item.video_type && (
                          <span className="px-2 py-1 bg-muted rounded">タイプ: {item.video_type}</span>
                        )}
                        {item.media_type && (
                          <span className="px-2 py-1 bg-muted rounded">メディア: {item.media_type}</span>
                        )}
                        {item.creation_time && (
                          <span className="px-2 py-1 bg-muted rounded">作成: {item.creation_time}</span>
                        )}
                        {item.end_time && (
                          <span className="px-2 py-1 bg-muted rounded">終了: {item.end_time}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 空状態 */}
      {items.length === 0 && !searching && !error && (
        <Card>
          <CardContent className="pt-8 pb-8 text-center text-muted-foreground space-y-2">
            <p className="text-lg font-medium">DProで動画広告をリサーチ</p>
            <p className="text-sm">ジャンルを検索して選択、またはキーワードを入力して検索</p>
            <p className="text-xs">債務整理、IT転職、不動産、車査定など、あらゆるジャンルの広告台本を検索できます</p>
          </CardContent>
        </Card>
      )}

      {searching && (
        <Card>
          <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
            <p>DProで検索中...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
