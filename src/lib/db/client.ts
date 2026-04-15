import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
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

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createDb() {
  ensureDir(dbPath);
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  // テーブルが存在しなければ自動作成
  const tableExists = sqlite.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
  ).get();

  if (tableExists) {
    // マイグレーション: appeal_text カラム追加
    const cols = sqlite.prepare("PRAGMA table_info(scripts)").all() as { name: string }[];
    if (!cols.find((c) => c.name === "appeal_text")) {
      sqlite.exec("ALTER TABLE scripts ADD COLUMN appeal_text TEXT");
    }

    // マイグレーション: projectsテーブル追加
    const projectsExists = sqlite.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='projects'"
    ).get();
    if (!projectsExists) {
      sqlite.exec(`
        CREATE TABLE projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          color TEXT NOT NULL DEFAULT '#6366f1',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
    }

    // マイグレーション: scripts.project_id カラム追加
    if (!cols.find((c) => c.name === "project_id")) {
      sqlite.exec("ALTER TABLE scripts ADD COLUMN project_id INTEGER REFERENCES projects(id)");
    }

    // マイグレーション: リサーチテーブル追加
    const researchExists = sqlite.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='research_projects'"
    ).get();
    if (!researchExists) {
      sqlite.exec(`
        CREATE TABLE research_projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          genre TEXT NOT NULL,
          conditions TEXT NOT NULL DEFAULT '{}',
          free_text TEXT,
          status TEXT NOT NULL DEFAULT 'idle',
          result_count INTEGER DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE research_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL REFERENCES research_projects(id),
          video_url TEXT,
          platform TEXT,
          title TEXT NOT NULL,
          script TEXT,
          hook_type TEXT,
          appeal_type TEXT,
          estimated_views TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
    }
  }

  if (!tableExists) {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT NOT NULL DEFAULT '#6366f1',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS appeals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        example_script TEXT,
        performance_score REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS scripts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        original_video_url TEXT,
        original_script TEXT NOT NULL,
        persona TEXT NOT NULL DEFAULT '',
        project_id INTEGER REFERENCES projects(id),
        appeal_id INTEGER REFERENCES appeals(id),
        appeal_text TEXT,
        article_lp_url TEXT,
        article_lp_text TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        created_by INTEGER REFERENCES users(id),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS generated_scripts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        script_id INTEGER NOT NULL REFERENCES scripts(id),
        variant TEXT NOT NULL,
        content TEXT NOT NULL,
        reasoning TEXT,
        score REAL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        script_id INTEGER NOT NULL REFERENCES scripts(id),
        buzz_factors TEXT NOT NULL,
        conversion_factors TEXT NOT NULL,
        appeal_pattern TEXT,
        overall_score REAL,
        summary TEXT,
        improvement_suggestions TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS article_lps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        script_id INTEGER NOT NULL REFERENCES scripts(id),
        title TEXT NOT NULL,
        source_url TEXT,
        generated_text TEXT,
        generated_html TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS ad_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        script_id INTEGER REFERENCES scripts(id),
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        cpa REAL,
        roas REAL,
        recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS research_projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        genre TEXT NOT NULL,
        conditions TEXT NOT NULL DEFAULT '{}',
        free_text TEXT,
        status TEXT NOT NULL DEFAULT 'idle',
        result_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS research_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL REFERENCES research_projects(id),
        video_url TEXT,
        platform TEXT,
        title TEXT NOT NULL,
        script TEXT,
        hook_type TEXT,
        appeal_type TEXT,
        estimated_views TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }

  return drizzle(sqlite, { schema });
}

type DrizzleDb = ReturnType<typeof createDb>;
const globalForDb = globalThis as unknown as { __scriptDashboardDb?: DrizzleDb };

export const db: DrizzleDb = globalForDb.__scriptDashboardDb ?? createDb();
if (process.env.NODE_ENV !== "production") {
  globalForDb.__scriptDashboardDb = db;
}
