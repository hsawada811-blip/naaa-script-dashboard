import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema";

// ESM/CJS両対応のディレクトリ取得
function getDirname(): string {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return __dirname;
  }
}

const HERE = getDirname();
const DEFAULT_DB_PATH = path.resolve(HERE, "../../../data/script-dashboard.db");
const dbPath = process.env.DATABASE_PATH ?? DEFAULT_DB_PATH;

function createDb() {
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

type DrizzleDb = ReturnType<typeof createDb>;
const globalForDb = globalThis as unknown as { __scriptDashboardDb?: DrizzleDb };

export const db: DrizzleDb = globalForDb.__scriptDashboardDb ?? createDb();
if (process.env.NODE_ENV !== "production") {
  globalForDb.__scriptDashboardDb = db;
}
