"use client";

import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  scriptId: number;
  scriptTitle: string;
  onSaved?: () => void;
}

export default function LpGenerationStream({ scriptId, scriptTitle, onSaved }: Props) {
  const [saved, setSaved] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { completion, isLoading, complete } = useCompletion({
    api: "/api/generate/lp",
    body: { scriptId },
    streamProtocol: "text",
    onFinish: async (_prompt, completionText) => {
      setAutoSaving(true);
      const res = await fetch("/api/lp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId,
          title: `${scriptTitle} - 記事LP`,
          generatedText: completionText,
        }),
      });
      if (res.ok) {
        setSaved(true);
        onSaved?.();
      }
      setAutoSaving(false);
    },
  });

  async function handleGenerate() {
    setSaved(false);
    setShowPreview(false);
    await complete("");
  }

  // マークダウンを簡易HTML変換
  function markdownToHtml(md: string) {
    return md
      .replace(/^### (.+)$/gm, "<h3 class='text-lg font-bold mt-6 mb-2'>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2 class='text-xl font-bold mt-8 mb-3'>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1 class='text-2xl font-bold mt-8 mb-4'>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/^- (.+)$/gm, "<li class='ml-4'>$1</li>")
      .replace(/\n\n/g, "<br/><br/>")
      .replace(/\n/g, "<br/>");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Button onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? "記事LP生成中..." : "記事LPを生成"}
        </Button>
        {completion && !isLoading && (
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? "マークダウン表示" : "プレビュー表示"}
          </Button>
        )}
        {autoSaving && <span className="text-sm text-muted-foreground">自動保存中...</span>}
        {saved && !autoSaving && <span className="text-sm text-green-600">自動保存済み</span>}
      </div>

      {completion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">生成された記事LP</CardTitle>
              {isLoading && (
                <span className="text-xs text-muted-foreground animate-pulse">ストリーミング中...</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {showPreview ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(completion) }}
              />
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono bg-muted/50 p-4 rounded-lg">
                {completion}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
