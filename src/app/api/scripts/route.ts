import { NextResponse } from "next/server";
import { listScripts, createScript } from "@/lib/db/queries";
import { getSession } from "@/lib/auth";
import type { ScriptStatus } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as ScriptStatus | null;
  const limit = searchParams.get("limit");

  const data = listScripts({
    status: status ?? undefined,
    limit: limit ? parseInt(limit) : undefined,
  });

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await getSession();
  const body = await request.json();

  const script = createScript({
    title: body.title,
    originalVideoUrl: body.originalVideoUrl ?? null,
    originalScript: body.originalScript,
    persona: body.persona ?? "",
    projectId: body.projectId ?? null,
    appealId: body.appealId ? parseInt(body.appealId) : null,
    appealText: body.appealText ?? null,
    articleLpUrl: body.articleLpUrl ?? null,
    articleLpText: body.articleLpText ?? null,
    status: body.status ?? "draft",
    createdBy: session?.userId ?? null,
  });

  return NextResponse.json(script, { status: 201 });
}
