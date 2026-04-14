import { runClaudeStream } from "@/lib/claude-cli";
import { getLpGeneratePrompt } from "@/prompts/lp-generate";
import { getScript, getAppeal } from "@/lib/db/queries";

export async function POST(request: Request) {
  const { scriptId } = await request.json();

  if (!scriptId) {
    return new Response(JSON.stringify({ error: "scriptIdが必要です" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const script = getScript(scriptId);
  if (!script) {
    return new Response(JSON.stringify({ error: "台本が見つかりません" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const appeal = script.appealId ? getAppeal(script.appealId) : null;

  const prompt = getLpGeneratePrompt(
    script.originalScript,
    script.persona,
    appeal?.name ?? "",
    script.articleLpUrl ?? undefined
  );

  const stream = await runClaudeStream(prompt);
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
