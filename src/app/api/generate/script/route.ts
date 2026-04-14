import { streamText } from "ai";
import { claudeSonnet } from "@/lib/models";
import { getScriptGeneratePrompt } from "@/prompts/script-generate";
import { getScript, getAppeal, getAnalysis } from "@/lib/db/queries";

export async function POST(request: Request) {
  const { scriptId, variant } = await request.json();

  if (!scriptId || !variant) {
    return new Response(JSON.stringify({ error: "scriptIdとvariantが必要です" }), {
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
  const analysis = getAnalysis(scriptId);

  const prompt = getScriptGeneratePrompt(
    script.originalScript,
    script.persona,
    appeal?.name ?? "",
    variant,
    analysis?.summary ?? undefined
  );

  const result = streamText({
    model: claudeSonnet,
    prompt,
  });

  return result.toTextStreamResponse();
}
