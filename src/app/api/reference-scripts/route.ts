import { NextResponse } from "next/server";
import { listReferenceScripts, createReferenceScript, deleteReferenceScript } from "@/lib/db/queries";
import { embedText } from "@/lib/embedding";
import { hashText } from "@/lib/utils";

// 一覧取得
export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const genre = url.searchParams.get("genre");

  const items = listReferenceScripts({
    projectId: projectId ? Number(projectId) : undefined,
    genre: genre || undefined,
  });

  return NextResponse.json({ items, count: items.length });
}

// 1件追加
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scriptText, hook, projectId, genre, videoUrl, destinationUrl } = body as {
      scriptText: string;
      hook?: string;
      projectId?: number;
      genre?: string;
      videoUrl?: string;
      destinationUrl?: string;
    };

    if (!scriptText || scriptText.trim().length < 10) {
      return NextResponse.json({ error: "台本テキストが短すぎます（10文字以上）" }, { status: 400 });
    }

    // エンベディング生成
    let embedding: string | null = null;
    try {
      const vec = await embedText(scriptText);
      embedding = JSON.stringify(vec);
    } catch (err) {
      console.log("[Reference Scripts] エンベディング生成スキップ:", err instanceof Error ? err.message : err);
    }

    const result = createReferenceScript({
      scriptText: scriptText.trim(),
      hook: hook?.trim() || null,
      embedding,
      contentHash: hashText(scriptText.trim()),
      source: "manual",
      projectId: projectId || null,
      genre: genre || null,
      videoUrl: videoUrl?.trim() || null,
      destinationUrl: destinationUrl?.trim() || null,
      metadata: null,
    });

    if (!result) {
      return NextResponse.json({ error: "同一の台本が既に登録されています", skipped: true });
    }

    return NextResponse.json({ item: result });
  } catch (error) {
    console.error("[Reference Scripts] POST エラー:", error);
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
  }
}

// 削除
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }
  deleteReferenceScript(Number(id));
  return NextResponse.json({ success: true });
}
