/**
 * DPro（動画広告分析Pro）MCPクライアント
 *
 * MCP JSON-RPC over HTTP POST（SSEレスポンス）でDProサーバーと通信する。
 * OAuth2トークンによる認証、自動リフレッシュ機能付き。
 */

// --- 型定義 ---

/** DProジャンル */
export interface DproGenre {
  id: number;
  name: string;
}

/** DPro商材 */
export interface DproProduct {
  id: number;
  genre_id: number;
  genre_name: string;
  name: string;
}

/** DProアプリ（広告媒体） */
export interface DproApp {
  id: number;
  name: string;
  nickname: string;
  description: string;
  last_aggregation_time: string;
  updated_at: string;
}

/** DPro動画広告アイテム（主要フィールド） */
export interface DproItem {
  id?: number;
  title?: string;
  video_url?: string;
  thumbnail_url?: string;
  platform?: string;
  genre_name?: string;
  product_name?: string;
  advertiser_name?: string;
  account_name?: string;
  duration?: number;
  play_count?: number;
  prev_play_count?: number;
  play_count_difference?: number;
  digg_count?: number;
  digg_rate?: number;
  cost?: number;
  prev_cost?: number;
  cost_difference?: number;
  creation_time?: string;
  end_time?: string;
  streaming_period?: number;
  ad_sentence?: string;
  ad_start_sentence?: string;
  ad_all_sentence?: string;
  transition_url?: string;
  transition_url_id?: number;
  narration?: string;
  bgm?: string;
  video_type?: string;
  media_type?: string;
  [key: string]: unknown;
}

/** 遷移先URL */
export interface DproTransitionUrl {
  id: number;
  url: string;
  type_id: number;
  type: string;
}

/** 遷移先URLテキストコンテンツ */
export interface DproTransitionUrlContent {
  id: number;
  url: string;
  wayback_url: string | null;
  article_text: string | null;
  ocr_texts: string[];
  full_text: string | null;
}

/** アイテム検索パラメータ */
export interface DproSearchItemsParams {
  interval?: number;
  to_date?: string;
  limit?: number;
  offset?: number;
  app_id?: string;
  genre_id?: string;
  product_id?: string;
  keyword?: string;
  keyword_logic?: "and" | "or";
  sort?: string;
  next?: string;
  media_type?: string;
  is_affiliate?: boolean;
  transition_type_id?: string;
  ad_sentence?: string;
  ad_start_sentence?: string;
  ad_all_sentence?: string;
  duration?: string;
  creation_time?: string;
  end_time?: string;
  streaming_period?: string;
  play_count?: string;
  cost?: string;
  cost_difference?: string;
  narration?: string;
  video_type?: string;
  video_shape?: string;
  advertiser_name?: string;
  account_name?: string;
}

/** ジャンル検索パラメータ */
export interface DproSearchGenresParams {
  genre_name?: string;
  next?: string;
  limit?: number;
}

/** 商材検索パラメータ */
export interface DproSearchProductsParams {
  product_name?: string;
  genre_id?: string;
  sort?: string;
  next?: string;
  limit?: number;
}

/** 遷移先URL検索パラメータ */
export interface DproSearchTransitionUrlsParams {
  url?: string;
  transition_type_id?: string;
  next?: string;
}

/** MCP JSON-RPCレスポンスの型 */
interface McpJsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number;
  result?: {
    content?: Array<{ type: string; text: string }>;
    [key: string]: unknown;
  } & T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// --- DProクライアントクラス ---

class DproClient {
  private mcpUrl: string;
  private accessToken: string;
  private refreshToken: string;
  private clientId: string;
  private requestId = 0;

  constructor() {
    this.mcpUrl = process.env.DPRO_MCP_URL || "https://api.kashika-20mile.com/mcp";
    this.accessToken = process.env.DPRO_ACCESS_TOKEN || "";
    this.refreshToken = process.env.DPRO_REFRESH_TOKEN || "";
    this.clientId = process.env.DPRO_CLIENT_ID || "";

    if (!this.accessToken) {
      console.warn("[DPro] DPRO_ACCESS_TOKENが設定されていません");
    }
  }

  /** リクエストIDをインクリメントして返す */
  private nextId(): number {
    this.requestId += 1;
    return this.requestId;
  }

  /**
   * SSEレスポンスからJSON-RPCの結果を抽出する
   */
  private parseSSEResponse(text: string): unknown {
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const dataStr = line.slice(6).trim();
        if (!dataStr) continue;
        try {
          const parsed = JSON.parse(dataStr) as McpJsonRpcResponse;
          if (parsed.error) {
            throw new Error(
              `DPro MCPエラー [${parsed.error.code}]: ${parsed.error.message}`
            );
          }
          return parsed.result;
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
    // SSE形式でない場合、直接JSONとしてパース
    try {
      const parsed = JSON.parse(text) as McpJsonRpcResponse;
      if (parsed.error) {
        throw new Error(
          `DPro MCPエラー [${parsed.error.code}]: ${parsed.error.message}`
        );
      }
      return parsed.result;
    } catch {
      throw new Error(`DPro MCPレスポンスのパースに失敗: ${text.slice(0, 200)}`);
    }
  }

  /**
   * MCPツールを呼び出す（リトライ付き）
   */
  private async callTool(
    toolName: string,
    args: Record<string, unknown> = {}
  ): Promise<unknown> {
    // undefinedとnullの引数を除去
    const cleanArgs: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined && value !== null) {
        cleanArgs[key] = value;
      }
    }

    const body = {
      jsonrpc: "2.0" as const,
      id: this.nextId(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: cleanArgs,
      },
    };

    let lastError: Error | null = null;

    // 最大2回リトライ（1回目 + トークンリフレッシュ後1回）
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(this.mcpUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
            Accept: "application/json, text/event-stream",
          },
          body: JSON.stringify(body),
        });

        // 401の場合はトークンリフレッシュ
        if (response.status === 401 && attempt === 0) {
          console.log("[DPro] トークン期限切れ、リフレッシュ実行中...");
          await this.refreshAccessToken();
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `DPro MCP HTTP ${response.status}: ${errorText.slice(0, 200)}`
          );
        }

        const responseText = await response.text();
        const result = this.parseSSEResponse(responseText);

        // MCPのcontent配列からテキストを抽出
        const resultObj = result as Record<string, unknown>;
        if (resultObj?.content && Array.isArray(resultObj.content)) {
          const textContent = resultObj.content.find(
            (c: { type: string }) => c.type === "text"
          );
          if (textContent && typeof (textContent as { text: string }).text === "string") {
            try {
              return JSON.parse((textContent as { text: string }).text);
            } catch {
              return (textContent as { text: string }).text;
            }
          }
        }

        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt === 0 && lastError.message.includes("401")) {
          await this.refreshAccessToken();
          continue;
        }
      }
    }

    throw lastError || new Error("DPro MCPの呼び出しに失敗しました");
  }

  /**
   * OAuth2トークンリフレッシュ
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken || !this.clientId) {
      throw new Error("[DPro] リフレッシュトークンまたはクライアントIDが未設定");
    }

    try {
      const tokenUrl = `${this.mcpUrl.replace(/\/mcp$/, "")}/oauth/token`;
      const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: this.refreshToken,
          client_id: this.clientId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`トークンリフレッシュ失敗 HTTP ${response.status}: ${errorText}`);
      }

      const tokenData = await response.json() as {
        access_token: string;
        refresh_token?: string;
      };

      this.accessToken = tokenData.access_token;
      if (tokenData.refresh_token) {
        this.refreshToken = tokenData.refresh_token;
      }
      console.log("[DPro] トークンリフレッシュ成功");
    } catch (error) {
      console.error("[DPro] トークンリフレッシュ失敗:", error);
      throw error;
    }
  }

  // --- 公開メソッド ---

  /** アプリ（広告媒体）一覧を取得 */
  async getApps(): Promise<DproApp[]> {
    const result = await this.callTool("read_apps_api_v1_apps_get");
    // レスポンス形式に応じて配列を抽出
    if (Array.isArray(result)) return result as DproApp[];
    const obj = result as Record<string, unknown>;
    if (obj?.result && Array.isArray(obj.result)) return obj.result as DproApp[];
    return [];
  }

  /** 動画広告データを検索 */
  async searchItems(params: DproSearchItemsParams = {}): Promise<{
    items: DproItem[];
    next: string | null;
  }> {
    const result = await this.callTool("get_items_by_rds_api_v1_items_get", params as Record<string, unknown>);
    const obj = result as Record<string, unknown>;

    // レスポンス構造に対応
    if (Array.isArray(obj?.items)) {
      return { items: obj.items as DproItem[], next: (obj.next as string) || null };
    }
    if (Array.isArray(result)) {
      return { items: result as DproItem[], next: null };
    }
    return { items: [], next: null };
  }

  /** ジャンルを検索 */
  async searchGenres(params: DproSearchGenresParams = {}): Promise<{
    results: DproGenre[];
    next: string | null;
  }> {
    const result = await this.callTool("search_genres_api_v1_genres_get", params as Record<string, unknown>);
    const obj = result as Record<string, unknown>;

    if (Array.isArray(obj?.results)) {
      return { results: obj.results as DproGenre[], next: (obj.next as string) || null };
    }
    if (Array.isArray(result)) {
      return { results: result as DproGenre[], next: null };
    }
    return { results: [], next: null };
  }

  /** 商材を検索 */
  async searchProducts(params: DproSearchProductsParams = {}): Promise<{
    results: DproProduct[];
    next: string | null;
  }> {
    const result = await this.callTool("search_products_with_relevance_api_v1_products_get", params as Record<string, unknown>);
    const obj = result as Record<string, unknown>;

    if (Array.isArray(obj?.results)) {
      return { results: obj.results as DproProduct[], next: (obj.next as string) || null };
    }
    if (Array.isArray(result)) {
      return { results: result as DproProduct[], next: null };
    }
    return { results: [], next: null };
  }

  /** 遷移先URLを検索 */
  async searchTransitionUrls(params: DproSearchTransitionUrlsParams = {}): Promise<{
    results: DproTransitionUrl[];
    next: string | null;
  }> {
    const result = await this.callTool("search_transition_urls_api_v1_transition_urls_get", params as Record<string, unknown>);
    const obj = result as Record<string, unknown>;

    if (Array.isArray(obj?.results)) {
      return { results: obj.results as DproTransitionUrl[], next: (obj.next as string) || null };
    }
    if (Array.isArray(result)) {
      return { results: result as DproTransitionUrl[], next: null };
    }
    return { results: [], next: null };
  }

  /** 遷移先URLのテキストコンテンツを取得 */
  async getTransitionUrlContent(transitionUrlId: string): Promise<DproTransitionUrlContent | null> {
    const result = await this.callTool(
      "read_transition_url_text_content_api_v1_transition_urls",
      { transition_url_id: transitionUrlId }
    );
    if (!result) return null;
    return result as DproTransitionUrlContent;
  }
}

// --- シングルトンインスタンス ---
const globalForDpro = globalThis as unknown as { __dproClient?: DproClient };

export function getDproClient(): DproClient {
  if (!globalForDpro.__dproClient) {
    globalForDpro.__dproClient = new DproClient();
  }
  return globalForDpro.__dproClient;
}

export default getDproClient;
