import { NextResponse } from "next/server";
import { getScript, getAnalysis, updateScript, deleteScript } from "@/lib/db/queries";
import type { BuzzAnalysis } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const script = getScript(parseInt(id));
  if (!script) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }

  const rawAnalysis = getAnalysis(parseInt(id));
  let analysis: (BuzzAnalysis & { id: number; scriptId: number; createdAt: string }) | null = null;

  if (rawAnalysis) {
    analysis = {
      id: rawAnalysis.id,
      scriptId: rawAnalysis.scriptId,
      createdAt: rawAnalysis.createdAt,
      buzzFactors: JSON.parse(rawAnalysis.buzzFactors),
      conversionFactors: JSON.parse(rawAnalysis.conversionFactors),
      appealPattern: rawAnalysis.appealPattern ?? "",
      overallScore: rawAnalysis.overallScore ?? 0,
      summary: rawAnalysis.summary ?? "",
      improvementSuggestions: rawAnalysis.improvementSuggestions
        ? JSON.parse(rawAnalysis.improvementSuggestions)
        : [],
    };
  }

  return NextResponse.json({ script, analysis });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  updateScript(parseInt(id), body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteScript(parseInt(id));
  return NextResponse.json({ ok: true });
}
