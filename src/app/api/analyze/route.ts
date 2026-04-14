import { NextResponse } from "next/server";
import { runClaudeJson } from "@/lib/claude-cli";
import { getAnalyzePrompt } from "@/prompts/script-analyze";
import { createAnalysis, updateScript, getScript, getAppeal } from "@/lib/db/queries";
import type { BuzzAnalysis } from "@/types";

export async function POST(request: Request) {
  const { scriptId } = await request.json();

  if (!scriptId) {
    return NextResponse.json({ error: "scriptIdが必要です" }, { status: 400 });
  }

  const script = getScript(scriptId);
  if (!script) {
    return NextResponse.json({ error: "台本が見つかりません" }, { status: 404 });
  }

  updateScript(scriptId, { status: "analyzing" });

  const appeal = script.appealId ? getAppeal(script.appealId) : null;
  const prompt = getAnalyzePrompt(
    script.originalScript,
    script.persona,
    appeal?.name ?? "",
    script.articleLpText ?? undefined
  );

  const jsonPrompt = `${prompt}

以下のJSON形式で出力してください:
{
  "buzzFactors": {
    "hook": { "score": 数値1-10, "reason": "理由" },
    "emotion": { "score": 数値1-10, "reason": "理由" },
    "structure": { "score": 数値1-10, "reason": "理由" },
    "cta": { "score": 数値1-10, "reason": "理由" },
    "trend": { "score": 数値1-10, "reason": "理由" }
  },
  "conversionFactors": {
    "painPoint": { "score": 数値1-10, "reason": "理由" },
    "solution": { "score": 数値1-10, "reason": "理由" },
    "urgency": { "score": 数値1-10, "reason": "理由" },
    "trust": { "score": 数値1-10, "reason": "理由" },
    "offer": { "score": 数値1-10, "reason": "理由" }
  },
  "appealPattern": "訴求パターン名",
  "overallScore": 数値1-10,
  "summary": "総評",
  "improvementSuggestions": ["改善提案1", "改善提案2", "改善提案3"]
}`;

  try {
    const object = await runClaudeJson<BuzzAnalysis>(jsonPrompt);

    const analysis = createAnalysis({
      scriptId,
      buzzFactors: JSON.stringify(object.buzzFactors),
      conversionFactors: JSON.stringify(object.conversionFactors),
      appealPattern: object.appealPattern,
      overallScore: object.overallScore,
      summary: object.summary,
      improvementSuggestions: JSON.stringify(object.improvementSuggestions),
    });

    updateScript(scriptId, { status: "analyzed" });

    return NextResponse.json({
      ...analysis,
      buzzFactors: object.buzzFactors,
      conversionFactors: object.conversionFactors,
      improvementSuggestions: object.improvementSuggestions,
    });
  } catch (error) {
    updateScript(scriptId, { status: "draft" });
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "分析に失敗しました" }, { status: 500 });
  }
}
