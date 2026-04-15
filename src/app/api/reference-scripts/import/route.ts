import { NextResponse } from "next/server";
import { bulkCreateReferenceScripts } from "@/lib/db/queries";
import { embedTexts } from "@/lib/embedding";
import { hashText } from "@/lib/utils";
import type { NewReferenceScript } from "@/lib/db/schema";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { csvText, genre, projectId } = body as {
      csvText: string;
      genre?: string;
      projectId?: number;
    };

    if (!csvText || csvText.trim().length === 0) {
      return NextResponse.json({ error: "CSVデータが空です" }, { status: 400 });
    }

    // CSVパース: 「日付,台本テキスト」形式
    // ダブルクォート内のカンマ・改行に対応
    const lines = csvText.trim().split("\n");
    const scripts: { date: string; text: string }[] = [];

    let currentText = "";
    let currentDate = "";
    let inQuote = false;

    for (const line of lines) {
      if (!inQuote) {
        // 新しい行の開始
        const quoteCount = (line.match(/"/g) || []).length;
        const firstComma = line.indexOf(",");

        if (firstComma === -1) continue; // カンマなし行はスキップ

        const datePart = line.slice(0, firstComma).trim();
        let textPart = line.slice(firstComma + 1).trim();

        // ヘッダー行をスキップ
        if (datePart === "日付" || datePart === "date") continue;

        if (textPart.startsWith('"')) {
          textPart = textPart.slice(1); // 先頭のダブルクォート除去
          if (textPart.endsWith('"') && quoteCount % 2 === 0) {
            // 同じ行で閉じている
            textPart = textPart.slice(0, -1);
            scripts.push({ date: datePart, text: textPart.replace(/""/g, '"') });
          } else {
            // 複数行にわたるテキスト
            inQuote = true;
            currentDate = datePart;
            currentText = textPart;
          }
        } else {
          scripts.push({ date: datePart, text: textPart });
        }
      } else {
        // ダブルクォート内の継続行
        if (line.endsWith('"')) {
          currentText += "\n" + line.slice(0, -1);
          scripts.push({ date: currentDate, text: currentText.replace(/""/g, '"') });
          inQuote = false;
          currentText = "";
          currentDate = "";
        } else {
          currentText += "\n" + line;
        }
      }
    }

    // 空テキスト・短すぎるテキストを除外
    const validScripts = scripts.filter(s => s.text.trim().length >= 10);

    if (validScripts.length === 0) {
      return NextResponse.json({ error: "有効な台本データが見つかりません" }, { status: 400 });
    }

    // エンベディング生成（バッチ処理）
    const textsToEmbed = validScripts.map(s => s.text);
    let embeddings: number[][] = [];
    try {
      embeddings = await embedTexts(textsToEmbed);
    } catch (err) {
      console.log("[CSV Import] エンベディング生成スキップ:", err instanceof Error ? err.message : err);
    }

    // バルク挿入用データ構築
    const items: NewReferenceScript[] = validScripts.map((s, i) => ({
      scriptText: s.text.trim(),
      hook: s.text.trim().split(/[。！？\n]/)[0] || null,
      embedding: embeddings[i] ? JSON.stringify(embeddings[i]) : null,
      contentHash: hashText(s.text.trim()),
      source: "csv_import" as const,
      projectId: projectId || null,
      genre: genre || null,
      metadata: s.date ? JSON.stringify({ date: s.date }) : null,
    }));

    const result = bulkCreateReferenceScripts(items);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[CSV Import] エラー:", error);
    return NextResponse.json({ error: "インポートに失敗しました" }, { status: 500 });
  }
}
