"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  scriptId: number;
  appealPattern?: string;
}

interface Suggestion {
  type: "appeal" | "script";
  title: string;
  description: string;
  category?: string;
  confidence: number;
}

export default function SuggestionPanel({ scriptId, appealPattern }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchSuggestions() {
    setLoading(true);
    const res = await fetch("/api/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scriptId, appealPattern }),
    });
    if (res.ok) {
      setSuggestions(await res.json());
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">AI提案</h3>
        <Button variant="outline" size="sm" onClick={fetchSuggestions} disabled={loading}>
          {loading ? "分析中..." : "類似提案を取得"}
        </Button>
      </div>

      {suggestions.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground">
          「類似提案を取得」で、この台本に類似した訴求パターンや台本の切り口を提案します。
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((s, i) => (
          <Card key={i}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{s.title}</CardTitle>
                <div className="flex gap-1">
                  <Badge variant={s.type === "appeal" ? "default" : "secondary"}>
                    {s.type === "appeal" ? "訴求" : "台本案"}
                  </Badge>
                  <Badge variant="outline">{Math.round(s.confidence * 100)}%</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
