"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ArticleLp {
  id: number;
  scriptId: number;
  title: string;
  sourceUrl: string | null;
  generatedText: string | null;
  createdAt: string;
}

export default function LpPage() {
  const [lps, setLps] = useState<ArticleLp[]>([]);

  useEffect(() => {
    fetch("/api/lp").then((r) => r.json()).then(setLps);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">記事LP一覧</h1>

      {lps.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            まだ記事LPがありません。台本詳細ページから生成できます。
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lps.map((lp) => (
            <Card key={lp.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{lp.title}</CardTitle>
                  <Badge variant="secondary">台本#{lp.scriptId}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {lp.generatedText && (
                  <div className="text-sm text-muted-foreground line-clamp-6 whitespace-pre-wrap">
                    {lp.generatedText.slice(0, 300)}...
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(lp.createdAt).toLocaleDateString("ja-JP")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
