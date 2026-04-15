import { execFile } from "child_process";

const CLAUDE_PATH = "/Applications/cmux NIGHTLY.app/Contents/Resources/bin/claude";

/**
 * Claude Code CLIを使ってプロンプトを実行（サブスク内で完結）
 */
export function runClaude(prompt: string, options?: { timeout?: number }): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      CLAUDE_PATH,
      ["-p", "--output-format", "text"],
      {
        maxBuffer: 1024 * 1024 * 10, // 10MB
        timeout: options?.timeout ?? 300000, // デフォルト5分
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Claude CLI error: ${error.message}\n${stderr}`));
          return;
        }
        resolve(stdout.trim());
      }
    );
    // プロンプトをstdinに渡す
    child.stdin?.write(prompt);
    child.stdin?.end();
  });
}

/**
 * Claude CLIでJSON出力を取得
 */
export async function runClaudeJson<T>(prompt: string, options?: { timeout?: number }): Promise<T> {
  const result = await runClaude(
    prompt + "\n\n必ず有効なJSONのみを出力してください。説明文やマークダウンのコードブロックは不要です。JSONだけを返してください。",
    options
  );

  // JSON部分を抽出（コードブロックで囲まれている場合に対応）
  let jsonStr = result;
  const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // 先頭の非JSON文字を除去
  const firstBrace = jsonStr.search(/[{\[]/);
  if (firstBrace > 0) {
    jsonStr = jsonStr.slice(firstBrace);
  }

  return JSON.parse(jsonStr) as T;
}

/**
 * Claude CLIでストリーミング的に実行（実際は一括だがレスポンスを返す）
 */
export async function runClaudeStream(prompt: string): Promise<ReadableStream<Uint8Array>> {
  const result = await runClaude(prompt);
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      // チャンクに分割してストリーム風に返す
      const chunks: string[] = [];
      for (let i = 0; i < result.length; i += 100) {
        chunks.push(result.slice(i, i + 100));
      }
      if (chunks.length === 0) chunks.push(result);
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}
