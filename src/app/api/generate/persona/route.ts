import { NextResponse } from "next/server";
import { runClaude } from "@/lib/claude-cli";

export async function POST(request: Request) {
  const { script } = await request.json();

  if (!script) {
    return NextResponse.json({ error: "台本が必要です" }, { status: 400 });
  }

  const prompt = `以下の広告台本を読んで、この台本が狙っているターゲットペルソナを推定してください。

## 台本
${script}

## 出力形式
以下の要素を含めて、自然な文章で1段落（3〜5行）で記述してください:
- 年齢層・性別
- 職業・年収帯
- 抱えている悩み・痛み
- 行動特性（SNS利用、情報収集方法）
- 心理状態（焦り、不安、期待等）

ペルソナの説明文だけを出力してください。前置きや見出しは不要です。`;

  try {
    const persona = await runClaude(prompt);
    return NextResponse.json({ persona });
  } catch (error) {
    console.error("Persona generation error:", error);
    return NextResponse.json({ error: "ペルソナ生成に失敗しました" }, { status: 500 });
  }
}
