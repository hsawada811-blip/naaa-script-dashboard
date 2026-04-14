import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { claudeSonnet } from "@/lib/models";
import { getAnalyzePrompt } from "@/prompts/script-analyze";
import { createAnalysis, updateScript, getScript, getAppeal } from "@/lib/db/queries";

const factorSchema = z.object({
  score: z.number().min(1).max(10),
  reason: z.string(),
});

const analysisSchema = z.object({
  buzzFactors: z.object({
    hook: factorSchema,
    emotion: factorSchema,
    structure: factorSchema,
    cta: factorSchema,
    trend: factorSchema,
  }),
  conversionFactors: z.object({
    painPoint: factorSchema,
    solution: factorSchema,
    urgency: factorSchema,
    trust: factorSchema,
    offer: factorSchema,
  }),
  appealPattern: z.string(),
  overallScore: z.number().min(1).max(10),
  summary: z.string(),
  improvementSuggestions: z.array(z.string()),
});

export async function POST(request: Request) {
  const { scriptId } = await request.json();

  if (!scriptId) {
    return NextResponse.json({ error: "scriptIdが必要です" }, { status: 400 });
  }

  const script = getScript(scriptId);
  if (!script) {
    return NextResponse.json({ error: "台本が見つかりません" }, { status: 404 });
  }

  // ステータス更新
  updateScript(scriptId, { status: "analyzing" });

  const appeal = script.appealId ? getAppeal(script.appealId) : null;
  const prompt = getAnalyzePrompt(
    script.originalScript,
    script.persona,
    appeal?.name ?? "",
    script.articleLpText ?? undefined
  );

  try {
    const { object } = await generateObject({
      model: claudeSonnet,
      schema: analysisSchema,
      prompt,
    });

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
