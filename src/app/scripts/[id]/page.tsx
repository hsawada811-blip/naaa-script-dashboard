"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AnalysisResult from "@/components/AnalysisResult";
import GenerationStream from "@/components/GenerationStream";
import { getVideoEmbedUrl } from "@/lib/video-preview";
import type { BuzzAnalysis } from "@/types";

interface ScriptData {
  id: number;
  title: string;
  originalVideoUrl: string | null;
  originalScript: string;
  persona: string;
  appealId: number | null;
  appealText: string | null;
  articleLpUrl: string | null;
  articleLpText: string | null;
  dproData: string | null;
  researchAnalysis: string | null;
  status: string;
  createdAt: string;
}

interface AnalysisData extends BuzzAnalysis {
  id: number;
  scriptId: number;
  createdAt: string;
}

interface GeneratedScriptData {
  id: number;
  scriptId: number;
  variant: string;
  content: string;
  reasoning: string | null;
  score: number | null;
  createdAt: string;
}

const variantLabels: Record<string, string> = {
  b_plan: "B案",
  new_plan: "新案",
  similar: "類似",
};

const statusLabels: Record<string, string> = {
  draft: "下書き",
  analyzing: "分析中",
  analyzed: "分析済",
  generating: "生成中",
  completed: "完了",
};

/** DProリサーチデータ表示コンポーネント */
function DproResearchData({ rawData }: { rawData: string }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const items = rawData.split("---").map(b => b.trim()).filter(Boolean).map(block => {
    const get = (label: string) => {
      const m = block.match(new RegExp(`${label}[:：]\\s*(.+)`));
      return m ? m[1].trim() : "";
    };
    const scriptMatch = block.match(/台本全文[:：]\n([\s\S]*?)$/);
    const narrationMatch = block.match(/ナレーション[:：]\n([\s\S]*?)$/);
    const isReference = block.includes("### 参考台本");
    return {
      costDifference: get("推定広告費"),
      playCount: get("再生数"),
      duration: get("尺"),
      streamingPeriod: get("配信期間"),
      videoType: get("タイプ"),
      videoUrl: get("動画URL"),
      hook: get("フック"),
      script: scriptMatch?.[1]?.trim() || narrationMatch?.[1]?.trim() || "",
      source: isReference ? "参考台本" : "DPro",
    };
  });

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground mb-2">{items.length}件のリサーチデータ</p>
      {items.map((item, i) => (
        <div key={i} className="border rounded-md overflow-hidden">
          <div
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors text-sm"
            onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
          >
            <span className="text-xs text-muted-foreground w-5 shrink-0">#{i + 1}</span>
            <Badge variant={item.source === "参考台本" ? "default" : "secondary"} className="text-xs shrink-0">
              {item.source}
            </Badge>
            {item.costDifference && <Badge variant="outline" className="text-xs shrink-0">{item.costDifference}</Badge>}
            {item.playCount && <span className="text-xs text-muted-foreground shrink-0">{item.playCount}再生</span>}
            {item.duration && <span className="text-xs text-muted-foreground shrink-0">{item.duration}</span>}
            {item.hook && <span className="text-xs truncate">{item.hook.slice(0, 40)}</span>}
            <span className="ml-auto text-xs text-muted-foreground shrink-0">{expandedIdx === i ? "▲" : "▼"}</span>
          </div>
          {expandedIdx === i && item.script && (
            <div className="border-t px-3 py-2 space-y-2">
              {item.videoUrl && (() => {
                const embed = getVideoEmbedUrl(item.videoUrl);
                return (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">動画プレビュー</p>
                    {embed ? (
                      <div className="rounded overflow-hidden border bg-black max-w-sm">
                        <iframe src={embed.embedUrl} className="w-full aspect-video" allow="autoplay" allowFullScreen />
                      </div>
                    ) : (
                      <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all">
                        {item.videoUrl}
                      </a>
                    )}
                  </div>
                );
              })()}
              {item.hook && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">フック</p>
                  <p className="text-sm font-medium bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">{item.hook}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">台本全文</p>
                <p className="text-sm whitespace-pre-wrap bg-muted/30 p-2 rounded leading-relaxed">{item.script}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ScriptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [script, setScript] = useState<ScriptData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [generatedScripts, setGeneratedScripts] = useState<GeneratedScriptData[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const loadData = useCallback(async () => {
    const [sRes, gRes] = await Promise.all([
      fetch(`/api/scripts/${id}`),
      fetch(`/api/scripts/generated?scriptId=${id}`),
    ]);
    if (sRes.ok) {
      const data = await sRes.json();
      setScript(data.script);
      if (data.analysis) setAnalysis(data.analysis);
    }
    if (gRes.ok) setGeneratedScripts(await gRes.json());
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAnalyze() {
    setAnalyzing(true);
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scriptId: parseInt(id) }),
    });
    if (res.ok) {
      const data = await res.json();
      setAnalysis(data);
      setScript((prev) => prev ? { ...prev, status: "analyzed" } : prev);
    }
    setAnalyzing(false);
  }

  async function handleDelete() {
    if (!confirm("この台本を削除しますか？")) return;
    const res = await fetch(`/api/scripts/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/scripts");
  }

  if (!script) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{script.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(script.createdAt).toLocaleDateString("ja-JP")} 作成
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={script.status === "completed" ? "default" : "secondary"} className="text-xs">
            {statusLabels[script.status] ?? script.status}
          </Badge>
          <button onClick={handleDelete} className="text-sm text-destructive hover:underline">
            削除
          </button>
        </div>
      </div>

      <Tabs defaultValue="original" className="space-y-6">
        <TabsList className="flex-wrap bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="original">元台本</TabsTrigger>
          <TabsTrigger value="analysis">分析結果</TabsTrigger>
          <TabsTrigger value="generate">台本生成</TabsTrigger>
          <TabsTrigger value="generated">生成済み ({generatedScripts.length})</TabsTrigger>
        </TabsList>

        {/* 元台本タブ */}
        <TabsContent value="original" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">元台本</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 p-4 rounded-lg">
                {script.originalScript}
              </div>
            </CardContent>
          </Card>

          {/* 動画プレビュー */}
          {script.originalVideoUrl && (() => {
            const embed = getVideoEmbedUrl(script.originalVideoUrl);
            return (
              <Card>
                <CardHeader><CardTitle className="text-lg">元動画</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {embed ? (
                    <div className="rounded-lg overflow-hidden border bg-black max-w-lg">
                      <iframe
                        src={embed.embedUrl}
                        className="w-full aspect-video"
                        allow="autoplay"
                        allowFullScreen
                      />
                    </div>
                  ) : null}
                  <a
                    href={script.originalVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {script.originalVideoUrl}
                  </a>
                </CardContent>
              </Card>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {script.persona && (
              <Card>
                <CardHeader><CardTitle className="text-lg">ペルソナ</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{script.persona}</p>
                </CardContent>
              </Card>
            )}

            {script.appealText && (
              <Card>
                <CardHeader><CardTitle className="text-lg">訴求内容</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{script.appealText}</p>
                </CardContent>
              </Card>
            )}

            {script.articleLpUrl && (
              <Card>
                <CardHeader><CardTitle className="text-lg">記事LP URL</CardTitle></CardHeader>
                <CardContent>
                  <a
                    href={script.articleLpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {script.articleLpUrl}
                  </a>
                </CardContent>
              </Card>
            )}
          </div>

          {/* DProリサーチデータ */}
          {script.dproData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">DProリサーチデータ</CardTitle>
              </CardHeader>
              <CardContent>
                <DproResearchData rawData={script.dproData} />
              </CardContent>
            </Card>
          )}

          {/* クイックアクション */}
          <div className="flex gap-3 flex-wrap">
            {!analysis && (
              <Button onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? "分析中..." : "AIで分析する"}
              </Button>
            )}
            {analysis && (
              <Button variant="outline" onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? "再分析中..." : "再分析する"}
              </Button>
            )}
          </div>
        </TabsContent>

        {/* 分析結果タブ */}
        <TabsContent value="analysis" className="space-y-6">
          {/* B案生成のリサーチ分析結果 */}
          {script.researchAnalysis && (() => {
            try {
              const ra = JSON.parse(script.researchAnalysis) as Record<string, unknown>;
              const persona = ra.persona as Record<string, string> | undefined;
              const appeal = ra.appeal as Record<string, string> | undefined;
              const winningPatterns = ra.winningPatterns as string[] | undefined;
              const ngPatterns = ra.ngPatterns as string[] | undefined;
              const hookStrategy = ra.hookStrategy as Record<string, unknown> | undefined;
              const structureStrategy = ra.structureStrategy as Record<string, unknown> | undefined;
              const ctaStrategy = ra.ctaStrategy as Record<string, string> | undefined;
              const dproInsights = ra.dproInsights as string | undefined;
              return (
                <div className="space-y-4">
                  <Badge variant="outline" className="text-xs">B案生成リサーチ分析</Badge>
                  {persona && (
                    <Card>
                      <CardHeader><CardTitle className="text-base">ペルソナ</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(persona).map(([k, v]) => (
                          <div key={k}><span className="text-muted-foreground">{k}: </span>{String(v)}</div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                  {appeal && (
                    <Card>
                      <CardHeader><CardTitle className="text-base">訴求戦略</CardTitle></CardHeader>
                      <CardContent className="space-y-1 text-sm">
                        {Object.entries(appeal).map(([k, v]) => (
                          <div key={k}><span className="text-muted-foreground">{k}: </span>{String(v)}</div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {winningPatterns && winningPatterns.length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="text-base">勝ちパターン</CardTitle></CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-4 text-sm space-y-1">
                            {winningPatterns.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    {ngPatterns && ngPatterns.length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="text-base">NGパターン</CardTitle></CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-4 text-sm space-y-1 text-red-600">
                            {ngPatterns.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  {hookStrategy && (() => {
                    const patterns: string[] = Array.isArray(hookStrategy.bestPatterns) ? hookStrategy.bestPatterns as string[] : [];
                    const hooks: string[] = Array.isArray(hookStrategy.exampleHooks) ? hookStrategy.exampleHooks as string[] : [];
                    return (
                      <Card>
                        <CardHeader><CardTitle className="text-base">フック戦略</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {patterns.map((p, i) => <Badge key={i} variant="secondary" className="mr-1">{p}</Badge>)}
                          {hookStrategy.reasoning ? <p className="text-muted-foreground mt-2">{String(hookStrategy.reasoning)}</p> : null}
                          {hooks.map((h, i) => <p key={i} className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-sm">{h}</p>)}
                        </CardContent>
                      </Card>
                    );
                  })()}
                  {structureStrategy && (
                    <Card>
                      <CardHeader><CardTitle className="text-base">構成戦略</CardTitle></CardHeader>
                      <CardContent className="space-y-1 text-sm">
                        <div><span className="text-muted-foreground">推奨フォーマット: </span>{String(structureStrategy.recommendedFormat)}</div>
                        <div><span className="text-muted-foreground">推奨尺: </span>{String(structureStrategy.idealDuration)}</div>
                        {structureStrategy.reasoning ? <p className="text-muted-foreground">{String(structureStrategy.reasoning)}</p> : null}
                      </CardContent>
                    </Card>
                  )}
                  {ctaStrategy && (
                    <Card>
                      <CardHeader><CardTitle className="text-base">CTA戦略</CardTitle></CardHeader>
                      <CardContent className="space-y-1 text-sm">
                        {Object.entries(ctaStrategy).map(([k, v]) => (
                          <div key={k}><span className="text-muted-foreground">{k}: </span>{String(v)}</div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                  {dproInsights && (
                    <Card>
                      <CardHeader><CardTitle className="text-base">DProインサイト</CardTitle></CardHeader>
                      <CardContent><p className="text-sm whitespace-pre-wrap">{dproInsights}</p></CardContent>
                    </Card>
                  )}
                </div>
              );
            } catch {
              return <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap">{script.researchAnalysis}</pre>;
            }
          })()}
          {/* 従来の分析結果 */}
          {analysis ? (
            <>
              <AnalysisResult analysis={analysis} />
              <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? "再分析中..." : "再分析する"}
              </Button>
            </>
          ) : !script.researchAnalysis ? (
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <p className="text-muted-foreground">まだ分析されていません</p>
                <Button onClick={handleAnalyze} disabled={analyzing}>
                  {analyzing ? "分析中..." : "AIで分析する"}
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        {/* 台本生成タブ */}
        <TabsContent value="generate" className="space-y-6">
          <GenerationStream scriptId={parseInt(id)} onSaved={loadData} />
        </TabsContent>

        {/* 生成済みタブ */}
        <TabsContent value="generated" className="space-y-4">
          {generatedScripts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                まだ生成された台本はありません。「台本生成」タブから生成してください。
              </CardContent>
            </Card>
          ) : (
            <>
              {/* バリアント別グループ */}
              {["b_plan", "new_plan", "similar"].map((variant) => {
                const filtered = generatedScripts.filter((g) => g.variant === variant);
                if (filtered.length === 0) return null;
                return (
                  <div key={variant} className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      {variantLabels[variant]}
                      <Badge variant="outline">{filtered.length}件</Badge>
                    </h3>
                    {filtered.map((g) => (
                      <Card key={g.id}>
                        <CardHeader className="py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              #{g.id} - {new Date(g.createdAt).toLocaleString("ja-JP")}
                            </span>
                            {g.score && <Badge variant="secondary">スコア: {g.score}</Badge>}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {g.content}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Separator />
                  </div>
                );
              })}
            </>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}
