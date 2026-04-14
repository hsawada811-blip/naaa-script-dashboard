import { NextResponse } from "next/server";
import { listArticleLps, createArticleLp } from "@/lib/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scriptId = searchParams.get("scriptId");
  const data = listArticleLps(scriptId ? parseInt(scriptId) : undefined);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const lp = createArticleLp({
    scriptId: body.scriptId,
    title: body.title,
    sourceUrl: body.sourceUrl ?? null,
    generatedText: body.generatedText ?? null,
    generatedHtml: body.generatedHtml ?? null,
  });
  return NextResponse.json(lp, { status: 201 });
}
