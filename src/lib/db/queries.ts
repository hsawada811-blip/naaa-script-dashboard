import { eq, desc, count, and } from "drizzle-orm";
import { db } from "./client";
import {
  users, scripts, generatedScripts, analyses, appeals, articleLps,
  type NewUser, type NewScript, type NewGeneratedScript, type NewAnalysis,
  type NewAppeal, type NewArticleLp, type Script,
} from "./schema";
import type { ScriptStatus } from "@/types";

// --- Users ---
export function getUserByName(name: string) {
  return db.select().from(users).where(eq(users.name, name)).get();
}

export function createUser(data: NewUser) {
  return db.insert(users).values(data).returning().get();
}

// --- Scripts ---
export function listScripts(filter?: { status?: ScriptStatus; limit?: number }) {
  const conditions = [];
  if (filter?.status) conditions.push(eq(scripts.status, filter.status));

  const query = db.select().from(scripts)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(scripts.createdAt));

  if (filter?.limit) return query.limit(filter.limit).all();
  return query.all();
}

export function getScript(id: number) {
  return db.select().from(scripts).where(eq(scripts.id, id)).get();
}

export function createScript(data: NewScript) {
  return db.insert(scripts).values(data).returning().get();
}

export function updateScript(id: number, data: Partial<Script>) {
  return db.update(scripts)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(scripts.id, id))
    .run();
}

export function deleteScript(id: number) {
  return db.delete(scripts).where(eq(scripts.id, id)).run();
}

export function countScripts(status?: ScriptStatus) {
  const condition = status ? eq(scripts.status, status) : undefined;
  return db.select({ count: count() }).from(scripts).where(condition).get()?.count ?? 0;
}

// --- Generated Scripts ---
export function listGeneratedScripts(scriptId: number) {
  return db.select().from(generatedScripts)
    .where(eq(generatedScripts.scriptId, scriptId))
    .orderBy(desc(generatedScripts.createdAt))
    .all();
}

export function createGeneratedScript(data: NewGeneratedScript) {
  return db.insert(generatedScripts).values(data).returning().get();
}

// --- Analyses ---
export function getAnalysis(scriptId: number) {
  return db.select().from(analyses)
    .where(eq(analyses.scriptId, scriptId))
    .orderBy(desc(analyses.createdAt))
    .limit(1)
    .get();
}

export function createAnalysis(data: NewAnalysis) {
  return db.insert(analyses).values(data).returning().get();
}

// --- Appeals ---
export function listAppeals() {
  return db.select().from(appeals).orderBy(desc(appeals.updatedAt)).all();
}

export function getAppeal(id: number) {
  return db.select().from(appeals).where(eq(appeals.id, id)).get();
}

export function createAppeal(data: NewAppeal) {
  return db.insert(appeals).values(data).returning().get();
}

export function updateAppeal(id: number, data: Partial<NewAppeal>) {
  return db.update(appeals)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(appeals.id, id))
    .run();
}

export function deleteAppeal(id: number) {
  return db.delete(appeals).where(eq(appeals.id, id)).run();
}

// --- Article LPs ---
export function listArticleLps(scriptId?: number) {
  const condition = scriptId ? eq(articleLps.scriptId, scriptId) : undefined;
  return db.select().from(articleLps).where(condition).orderBy(desc(articleLps.createdAt)).all();
}

export function createArticleLp(data: NewArticleLp) {
  return db.insert(articleLps).values(data).returning().get();
}

// --- Dashboard Stats ---
export function getDashboardStats() {
  const total = countScripts();
  const analyzed = countScripts("analyzed");
  const completed = countScripts("completed");
  const draft = countScripts("draft");
  const appealsCount = db.select({ count: count() }).from(appeals).get()?.count ?? 0;
  const generatedCount = db.select({ count: count() }).from(generatedScripts).get()?.count ?? 0;
  const lpsCount = db.select({ count: count() }).from(articleLps).get()?.count ?? 0;

  return { total, analyzed, completed, draft, appealsCount, generatedCount, lpsCount };
}

// --- Analytics: 訴求パターン別スコア ---
export function getAppealAnalytics() {
  // 全分析結果を取得し、台本の訴求IDと紐付け
  const allAnalyses = db.select({
    scriptId: analyses.scriptId,
    overallScore: analyses.overallScore,
    appealPattern: analyses.appealPattern,
    buzzFactors: analyses.buzzFactors,
    conversionFactors: analyses.conversionFactors,
  }).from(analyses).all();

  const allScriptsData = db.select({
    id: scripts.id,
    appealId: scripts.appealId,
  }).from(scripts).all();

  const allAppeals = db.select().from(appeals).all();

  // 訴求ID→分析結果をマッピング
  const appealMap = new Map<number, { scores: number[]; count: number; name: string; category: string }>();

  for (const a of allAppeals) {
    appealMap.set(a.id, { scores: [], count: 0, name: a.name, category: a.category });
  }

  for (const an of allAnalyses) {
    const script = allScriptsData.find((s) => s.id === an.scriptId);
    if (script?.appealId && appealMap.has(script.appealId) && an.overallScore) {
      const entry = appealMap.get(script.appealId)!;
      entry.scores.push(an.overallScore);
      entry.count++;
    }
  }

  return Array.from(appealMap.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    category: data.category,
    scriptCount: data.count,
    avgScore: data.scores.length > 0
      ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10
      : null,
    maxScore: data.scores.length > 0 ? Math.max(...data.scores) : null,
  }));
}

// --- 全分析結果取得 ---
export function listAllAnalyses() {
  return db.select().from(analyses).orderBy(desc(analyses.createdAt)).all();
}
