import { createAnthropic } from "@ai-sdk/anthropic";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 構造化出力（分析）+ ストリーミング生成 両方に使用
export const claudeSonnet = anthropic("claude-sonnet-4-20250514");
