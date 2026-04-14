import { NextResponse } from "next/server";
import { createGeneratedScript, listGeneratedScripts } from "@/lib/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scriptId = searchParams.get("scriptId");
  if (!scriptId) {
    return NextResponse.json({ error: "scriptIdが必要です" }, { status: 400 });
  }
  return NextResponse.json(listGeneratedScripts(parseInt(scriptId)));
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = createGeneratedScript({
    scriptId: body.scriptId,
    variant: body.variant,
    content: body.content,
    reasoning: body.reasoning ?? null,
    score: body.score ?? null,
  });
  return NextResponse.json(result, { status: 201 });
}
