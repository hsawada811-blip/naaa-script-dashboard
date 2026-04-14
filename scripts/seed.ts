import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "../src/lib/db/schema";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(HERE, "../data/script-dashboard.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

async function seed() {
  console.log("Seeding database...");

  // デフォルトユーザー作成
  const adminHash = await bcrypt.hash("admin123", 10);
  const memberHash = await bcrypt.hash("member123", 10);

  db.insert(schema.users).values([
    { name: "admin", passwordHash: adminHash, role: "admin" },
    { name: "naaa", passwordHash: memberHash, role: "member" },
  ]).run();

  // デフォルト訴求パターン
  db.insert(schema.appeals).values([
    { name: "痛み訴求", category: "pain", description: "ユーザーの現在の悩み・痛みを突く" },
    { name: "ベネフィット訴求", category: "benefit", description: "得られる未来・メリットを提示" },
    { name: "恐怖訴求", category: "fear", description: "放置した場合のリスクを提示" },
    { name: "社会的証明", category: "social_proof", description: "実績・口コミ・数字で信頼獲得" },
    { name: "権威性", category: "authority", description: "専門家・有名人の推薦" },
    { name: "希少性", category: "scarcity", description: "限定・期間限定で行動促進" },
    { name: "好奇心", category: "curiosity", description: "知りたい欲求を刺激して引き込む" },
  ]).run();

  console.log("Seed completed!");
  sqlite.close();
}

seed();
