"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BuzzAnalysis } from "@/types";

function ScoreBar({ score, label, reason }: { score: number; label: string; reason: string }) {
  const color =
    score >= 8 ? "bg-green-500" : score >= 6 ? "bg-yellow-500" : score >= 4 ? "bg-orange-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-bold">{score}/10</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score * 10}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{reason}</p>
    </div>
  );
}

interface Props {
  analysis: BuzzAnalysis;
}

export default function AnalysisResult({ analysis }: Props) {
  const buzzLabels: Record<string, string> = {
    hook: "冒頭の引き",
    emotion: "感情喚起",
    structure: "構成力",
    cta: "行動喚起",
    trend: "トレンド性",
  };

  const conversionLabels: Record<string, string> = {
    painPoint: "痛みの的確さ",
    solution: "解決策の魅力",
    urgency: "緊急性",
    trust: "信頼性",
    offer: "オファーの強さ",
  };

  return (
    <div className="space-y-6">
      {/* 総合スコア */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>分析結果</CardTitle>
            <div className="text-3xl font-bold">
              {analysis.overallScore.toFixed(1)}
              <span className="text-lg text-muted-foreground">/10</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{analysis.summary}</p>
          {analysis.appealPattern && (
            <Badge variant="secondary" className="mt-2">
              訴求: {analysis.appealPattern}
            </Badge>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* バズ要因 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">バズ要因</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analysis.buzzFactors).map(([key, val]) => (
              <ScoreBar key={key} score={val.score} label={buzzLabels[key] ?? key} reason={val.reason} />
            ))}
          </CardContent>
        </Card>

        {/* 獲得要因 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">獲得要因</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analysis.conversionFactors).map(([key, val]) => (
              <ScoreBar key={key} score={val.score} label={conversionLabels[key] ?? key} reason={val.reason} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 改善提案 */}
      {analysis.improvementSuggestions?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">改善提案</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.improvementSuggestions.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
