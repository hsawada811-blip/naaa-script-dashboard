"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReferenceScript {
  id: number;
  scriptText: string;
  hook: string | null;
  source: string | null;
  genre: string | null;
  videoUrl: string | null;
  destinationUrl: string | null;
  projectId: number | null;
  metadata: string | null;
  createdAt: string;
}

export default function ReferenceScriptsPage() {
  const [items, setItems] = useState<ReferenceScript[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterGenre, setFilterGenre] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // CSVインポート
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importGenre, setImportGenre] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; total: number } | null>(null);

  // 手動追加
  const [showAdd, setShowAdd] = useState(false);
  const [newScriptText, setNewScriptText] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newDestinationUrl, setNewDestinationUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [isCustomGenre, setIsCustomGenre] = useState(false);
  const [customGenre, setCustomGenre] = useState("");
  const [genreList, setGenreList] = useState<string[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterGenre) params.set("genre", filterGenre);
    const res = await fetch(`/api/reference-scripts?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setCount(data.count || 0);
    setLoading(false);
  }, [filterGenre]);

  const fetchGenres = useCallback(async () => {
    try {
      const res = await fetch("/api/genres");
      const data = await res.json();
      setGenreList(data.genres || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchGenres();
  }, [fetchItems, fetchGenres]);

  async function handleDelete(id: number) {
    if (!confirm("この参考台本を削除しますか？")) return;
    await fetch(`/api/reference-scripts?id=${id}`, { method: "DELETE" });
    fetchItems();
  }

  async function handleImport() {
    if (!csvText.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/reference-scripts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText, genre: importGenre || undefined }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setImportResult(data);
        setCsvText("");
        fetchItems();
        fetchGenres();
      }
    } catch {
      alert("インポートに失敗しました");
    }
    setImporting(false);
  }

  async function handleAdd() {
    if (!newScriptText.trim() || newScriptText.trim().length < 10) {
      alert("台本テキストは10文字以上必要です");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/reference-scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptText: newScriptText,
          genre: newGenre || undefined,
          videoUrl: newVideoUrl || undefined,
          destinationUrl: newDestinationUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setNewScriptText("");
        setNewVideoUrl("");
        setNewDestinationUrl("");
        setNewGenre("");
        setIsCustomGenre(false);
        setCustomGenre("");
        setShowAdd(false);
        fetchItems();
        fetchGenres();
      }
    } catch {
      alert("追加に失敗しました");
    }
    setAdding(false);
  }

  function toggleExpand(id: number) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // フィルタ用: 実際にデータがあるジャンル
  const dataGenres = Array.from(new Set(items.map(i => i.genre).filter(Boolean))) as string[];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">参考台本管理</h1>
        <Badge variant="secondary">{count}件</Badge>
      </div>

      {/* フィルタ・アクションバー */}
      <div className="flex gap-2 flex-wrap">
        <Select
          value={filterGenre || "__all__"}
          onValueChange={(v) => setFilterGenre(v === "__all__" ? "" : (v ?? ""))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue>
              {filterGenre || "全ジャンル"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全ジャンル</SelectItem>
            {dataGenres.length > 0 && <SelectSeparator />}
            {dataGenres.map(g => (
              <SelectItem key={`filter-${g}`} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showImport ? "secondary" : "outline"}
          size="sm"
          onClick={() => { setShowImport(!showImport); setShowAdd(false); }}
        >
          CSVインポート
        </Button>
        <Button
          variant={showAdd ? "secondary" : "outline"}
          size="sm"
          onClick={() => { setShowAdd(!showAdd); setShowImport(false); }}
        >
          手動追加
        </Button>
      </div>

      {/* CSVインポートパネル */}
      {showImport && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div>
              <Label className="text-sm">ジャンル</Label>
              <Input
                placeholder="例: 債務整理、IT転職"
                value={importGenre}
                onChange={e => setImportGenre(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">CSVデータ（日付,台本テキスト）</Label>
              <Textarea
                placeholder={"2024-01-01,台本テキストをここに...\n2024-01-02,別の台本テキスト..."}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                rows={8}
                className="mt-1 font-mono text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleImport} disabled={importing || !csvText.trim()} size="sm">
                {importing ? "インポート中..." : "インポート実行"}
              </Button>
              {importResult && (
                <span className="text-sm text-muted-foreground">
                  {importResult.imported}件追加 / {importResult.skipped}件スキップ（重複）/ 全{importResult.total}件
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 手動追加パネル */}
      {showAdd && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div>
              <Label className="text-sm">ジャンルタグ</Label>
              <Select
                value={isCustomGenre ? "__custom__" : (newGenre || "__none__")}
                onValueChange={(v) => {
                  if (!v) return;
                  if (v === "__custom__") {
                    setIsCustomGenre(true);
                    setNewGenre(customGenre);
                  } else if (v === "__none__") {
                    setIsCustomGenre(false);
                    setCustomGenre("");
                    setNewGenre("");
                  } else {
                    setIsCustomGenre(false);
                    setCustomGenre("");
                    setNewGenre(v);
                  }
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue>
                    {isCustomGenre ? "新規タグ入力" : (newGenre || "未分類")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">未分類</SelectItem>
                  {genreList.length > 0 && <SelectSeparator />}
                  {genreList.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value="__custom__">新規タグを追加</SelectItem>
                </SelectContent>
              </Select>
              {isCustomGenre && (
                <Input
                  value={customGenre}
                  onChange={(e) => {
                    setCustomGenre(e.target.value);
                    setNewGenre(e.target.value);
                  }}
                  placeholder="新しいジャンル名を入力"
                  className="mt-2"
                  autoFocus
                />
              )}
            </div>
            <div>
              <Label className="text-sm">台本テキスト</Label>
              <Textarea
                placeholder="台本テキストを入力..."
                value={newScriptText}
                onChange={e => setNewScriptText(e.target.value)}
                rows={6}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">動画URL（任意）</Label>
              <Input
                placeholder="https://..."
                value={newVideoUrl}
                onChange={e => setNewVideoUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">遷移先URL（任意）</Label>
              <Input
                placeholder="https://..."
                value={newDestinationUrl}
                onChange={e => setNewDestinationUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleAdd} disabled={adding} size="sm">
              {adding ? "追加中..." : "追加"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 台本一覧 */}
      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            参考台本がまだありません。CSVインポートまたは手動追加で登録してください。
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const expanded = expandedIds.has(item.id);
            const preview = item.scriptText.slice(0, 100);
            const sourceBadge = item.source === "csv_import" ? "CSV" : item.source === "dpro" ? "DPro" : "手動";
            return (
              <Card key={item.id} className="cursor-pointer" onClick={() => toggleExpand(item.id)}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.genre && <Badge variant="outline" className="text-xs">{item.genre}</Badge>}
                        <Badge variant="secondary" className="text-xs">{sourceBadge}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                        </span>
                      </div>
                      {item.hook && (
                        <p className="text-sm font-medium mb-1 truncate">{item.hook}</p>
                      )}
                      {(item.videoUrl || item.destinationUrl) && (
                        <div className="flex gap-3 mb-1 text-xs">
                          {item.videoUrl && (
                            <a
                              href={item.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                              onClick={e => e.stopPropagation()}
                            >
                              動画URL
                            </a>
                          )}
                          {item.destinationUrl && (
                            <a
                              href={item.destinationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                              onClick={e => e.stopPropagation()}
                            >
                              遷移先URL
                            </a>
                          )}
                        </div>
                      )}
                      {expanded ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.scriptText}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground truncate">{preview}{item.scriptText.length > 100 ? "..." : ""}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 shrink-0"
                      onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                    >
                      削除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
