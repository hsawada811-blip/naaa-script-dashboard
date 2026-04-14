import { NextResponse } from "next/server";
import { runClaudeJson } from "@/lib/claude-cli";
import { getScript, getAppeal, getAnalysis, listAppeals } from "@/lib/db/queries";

interface Suggestion {
  type: "appeal" | "script";
  title: string;
  description: string;
  category?: string;
  confidence: number;
}

export async function POST(request: Request) {
  const { scriptId, appealPattern } = await request.json();

  if (!scriptId) {
    return NextResponse.json({ error: "scriptIdが必要です" }, { status: 400 });
  }

  const script = getScript(scriptId);
  if (!script) {
    return NextResponse.json({ error: "台本が見つかりません" }, { status: 404 });
  }

  const appeal = script.appealId ? getAppeal(script.appealId) : null;
  const analysis = getAnalysis(scriptId);
  const allAppeals = listAppeals();

  const prompt = `あなたは獲得広告の訴求戦略アドバイザーです。
以下の台本と分析結果を元に、類似する訴求パターンと新しい台本の切り口を提案してください。

## 元台本
${script.originalScript}

## ペルソナ
${script.persona || "指定なし"}

## 現在の訴求
${appeal?.name ?? appealPattern ?? "未指定"}

## 分析結果
${analysis?.summary ?? "未分析"}

## 既存の訴求パターン
${allAppeals.map((a) => `- ${a.name}（${a.category}）: ${a.description}`).join("\n")}

## 提案ルール
1. 類似する訴求パターン（既存から2つ+新規1つ）を提案
2. 新しい台本の切り口（2-3案）を提案
3. 各提案にconfidence（0-1）を付与
4. 合計5-6個の提案を返してください

以下のJSON配列形式で出力:
[
  { "type": "appeal", "title": "提案名", "description": "説明", "confidence": 0.8 },
  { "type": "script", "title": "切り口名", "description": "説明", "confidence": 0.7 }
]`;

  try {
    const suggestions = await runClaudeJson<Suggestion[]>(prompt);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Suggestion error:", error);
    return NextResponse.json({ error: "提案の生成に失敗しました" }, { status: 500 });
  }
}
