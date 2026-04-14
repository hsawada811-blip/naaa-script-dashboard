"use client";

import { useState, useRef } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GenerationVariant } from "@/types";

interface Props {
  scriptId: number;
  onSaved?: () => void;
}

const variantLabels: Record<GenerationVariant, string> = {
  b_plan: "B案",
  new_plan: "新案",
  similar: "類似台本",
};

export default function GenerationStream({ scriptId, onSaved }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<GenerationVariant>("b_plan");
  const [saved, setSaved] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [history, setHistory] = useState<{ variant: string; content: string; savedAt: string }[]>([]);
  const completionRef = useRef("");

  const { completion, isLoading, complete } = useCompletion({
    api: "/api/generate/script",
    body: { scriptId, variant: selectedVariant },
    streamProtocol: "text",
    onFinish: async (_prompt, completionText) => {
      // ストリーミング完了後に自動保存
      setAutoSaving(true);
      const res = await fetch("/api/scripts/generated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId,
          variant: selectedVariant,
          content: completionText,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setHistory((prev) => [
          { variant: selectedVariant, content: completionText, savedAt: new Date().toISOString() },
          ...prev,
        ]);
        onSaved?.();
      }
      setAutoSaving(false);
    },
  });

  // completionの最新値を追跡
  completionRef.current = completion;

  async function handleGenerate() {
    setSaved(false);
    await complete("");
  }

  return (
    <div className="space-y-4">
      {/* バリアント選択 */}
      <div className="flex gap-2 flex-wrap">
        {(Object.entries(variantLabels) as [GenerationVariant, string][]).map(([key, label]) => (
          <Button
            key={key}
            variant={selectedVariant === key ? "default" : "outline"}
            size="sm"
            onClick={() => { setSelectedVariant(key); setSaved(false); }}
            disabled={isLoading}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <Button onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? "生成中..." : `${variantLabels[selectedVariant]}を生成`}
        </Button>
        {autoSaving && <span className="text-sm text-muted-foreground">自動保存中...</span>}
        {saved && !autoSaving && <span className="text-sm text-green-600">自動保存済み</span>}
      </div>

      {/* 生成中/完了の表示 */}
      {completion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                生成結果
                <Badge variant="secondary" className="ml-2">{variantLabels[selectedVariant]}</Badge>
              </CardTitle>
              {isLoading && (
                <span className="text-xs text-muted-foreground animate-pulse">ストリーミング中...</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{completion}</div>
          </CardContent>
        </Card>
      )}

      {/* このセッションの生成履歴 */}
      {history.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">このセッションの生成履歴</h3>
          {history.map((h, i) => (
            <Card key={i} className="opacity-70">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{variantLabels[h.variant as GenerationVariant] ?? h.variant}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(h.savedAt).toLocaleTimeString("ja-JP")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="whitespace-pre-wrap text-xs leading-relaxed line-clamp-4">
                  {h.content.slice(0, 200)}...
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
