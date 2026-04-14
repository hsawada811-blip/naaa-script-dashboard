"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AnalysisResult from "@/components/AnalysisResult";
import GenerationStream from "@/components/GenerationStream";
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

export default function ScriptDetailPage() {
  const params = useParams();
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

  if (!script) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{script.title}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(script.createdAt).toLocaleDateString("ja-JP")}
          </p>
        </div>
        <Badge variant={script.status === "completed" ? "default" : "secondary"}>
          {script.status}
        </Badge>
      </div>

      <Tabs defaultValue="original" className="space-y-4">
        <TabsList>
          <TabsTrigger value="original">元台本</TabsTrigger>
          <TabsTrigger value="analysis">分析結果</TabsTrigger>
          <TabsTrigger value="generate">台本生成</TabsTrigger>
          <TabsTrigger value="generated">生成済み ({generatedScripts.length})</TabsTrigger>
        </TabsList>

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
                  className="text-sm text-primary hover:underline"
                >
                  {script.originalVideoUrl}
                </a>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {analysis ? (
            <AnalysisResult analysis={analysis} />
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

        <TabsContent value="generate" className="space-y-4">
          <GenerationStream scriptId={parseInt(id)} onSaved={loadData} />
        </TabsContent>

        <TabsContent value="generated" className="space-y-4">
          {generatedScripts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                まだ生成された台本はありません
              </CardContent>
            </Card>
          ) : (
            generatedScripts.map((g) => (
              <Card key={g.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {variantLabels[g.variant] ?? g.variant}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {new Date(g.createdAt).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {g.content}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
