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
import LpGenerationStream from "@/components/LpGenerationStream";
import SuggestionPanel from "@/components/SuggestionPanel";
import type { BuzzAnalysis } from "@/types";

interface ScriptData {
  id: number;
  title: string;
  originalVideoUrl: string | null;
  originalScript: string;
  persona: string;
  appealId: number | null;
  articleLpUrl: string | null;
  articleLpText: string | null;
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{script.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(script.createdAt).toLocaleDateString("ja-JP")} 作成
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={script.status === "completed" ? "default" : "secondary"}>
            {statusLabels[script.status] ?? script.status}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive">
            削除
          </Button>
        </div>
      </div>

      <Tabs defaultValue="original" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="original">元台本</TabsTrigger>
          <TabsTrigger value="analysis">分析結果</TabsTrigger>
          <TabsTrigger value="generate">台本生成</TabsTrigger>
          <TabsTrigger value="generated">生成済み ({generatedScripts.length})</TabsTrigger>
          <TabsTrigger value="lp">記事LP</TabsTrigger>
          <TabsTrigger value="suggest">AI提案</TabsTrigger>
        </TabsList>

        {/* 元台本タブ */}
        <TabsContent value="original" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>元台本</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {script.originalScript}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {script.persona && (
              <Card>
                <CardHeader><CardTitle className="text-lg">ペルソナ</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm">{script.persona}</p>
                </CardContent>
              </Card>
            )}

            {script.originalVideoUrl && (
              <Card>
                <CardHeader><CardTitle className="text-lg">元動画</CardTitle></CardHeader>
                <CardContent>
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

          {/* クイックアクション */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2 flex-wrap">
                {!analysis && (
                  <Button size="sm" onClick={handleAnalyze} disabled={analyzing}>
                    {analyzing ? "分析中..." : "AIで分析する"}
                  </Button>
                )}
                {analysis && (
                  <Button size="sm" variant="outline" onClick={handleAnalyze} disabled={analyzing}>
                    {analyzing ? "再分析中..." : "再分析する"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 分析結果タブ */}
        <TabsContent value="analysis" className="space-y-4">
          {analysis ? (
            <>
              <AnalysisResult analysis={analysis} />
              <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? "再分析中..." : "再分析する"}
              </Button>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <p className="text-muted-foreground">まだ分析されていません</p>
                <Button onClick={handleAnalyze} disabled={analyzing}>
                  {analyzing ? "分析中..." : "AIで分析する"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 台本生成タブ */}
        <TabsContent value="generate" className="space-y-4">
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

        {/* 記事LPタブ */}
        <TabsContent value="lp" className="space-y-4">
          <LpGenerationStream
            scriptId={parseInt(id)}
            scriptTitle={script.title}
            onSaved={loadData}
          />
        </TabsContent>

        {/* AI提案タブ */}
        <TabsContent value="suggest" className="space-y-4">
          <SuggestionPanel
            scriptId={parseInt(id)}
            appealPattern={analysis?.appealPattern}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
