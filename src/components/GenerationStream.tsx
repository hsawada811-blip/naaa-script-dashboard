"use client";

import { useState } from "react";
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

  const { completion, isLoading, complete } = useCompletion({
    api: "/api/generate/script",
    body: { scriptId, variant: selectedVariant },
    streamProtocol: "text",
  });

  async function handleGenerate() {
    setSaved(false);
    await complete("");
  }

  async function handleSave() {
    const res = await fetch("/api/scripts/generated", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scriptId,
        variant: selectedVariant,
        content: completion,
      }),
    });
    if (res.ok) {
      setSaved(true);
      onSaved?.();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(Object.entries(variantLabels) as [GenerationVariant, string][]).map(([key, label]) => (
          <Button
            key={key}
            variant={selectedVariant === key ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedVariant(key)}
            disabled={isLoading}
          >
            {label}
          </Button>
        ))}
      </div>

      <Button onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? "生成中..." : `${variantLabels[selectedVariant]}を生成`}
      </Button>

      {completion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                生成結果
                <Badge variant="secondary" className="ml-2">{variantLabels[selectedVariant]}</Badge>
              </CardTitle>
              {!isLoading && (
                <Button size="sm" onClick={handleSave} disabled={saved}>
                  {saved ? "保存済み" : "保存"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{completion}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
