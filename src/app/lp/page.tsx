"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [previewLp, setPreviewLp] = useState<ArticleLp | null>(null);

  useEffect(() => {
    fetch("/api/lp").then((r) => r.json()).then(setLps);
  }, []);

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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">記事LP一覧</h1>

      {lps.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-muted-foreground">まだ記事LPがありません。</p>
            <Link href="/scripts">
              <Button variant="outline" size="sm">台本一覧から生成する</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lps.map((lp) => (
            <Card key={lp.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{lp.title}</CardTitle>
                  <Link href={`/scripts/${lp.scriptId}`}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      台本#{lp.scriptId}
                    </Badge>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                {lp.generatedText && (
                  <div className="text-sm text-muted-foreground line-clamp-6 whitespace-pre-wrap">
                    {lp.generatedText.slice(0, 300)}...
                  </div>
                )}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-muted-foreground">
                    {new Date(lp.createdAt).toLocaleDateString("ja-JP")}
                  </p>
                  <div className="flex gap-2">
                    {lp.generatedText && (
                      <Button variant="outline" size="sm" onClick={() => setPreviewLp(lp)}>
                        プレビュー
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (lp.generatedText) {
                          navigator.clipboard.writeText(lp.generatedText);
                        }
                      }}
                    >
                      コピー
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* プレビューダイアログ */}
      <Dialog open={!!previewLp} onOpenChange={() => setPreviewLp(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewLp?.title}</DialogTitle>
          </DialogHeader>
          {previewLp?.generatedText && (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(previewLp.generatedText) }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
