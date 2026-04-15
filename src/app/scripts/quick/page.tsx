"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getVideoEmbedUrl } from "@/lib/video-preview";

// --- 型定義 ---

interface Persona {
  age: string;
  gender: string;
  occupation: string;
  income: string;
  pain: string;
  dailyStress: string;
  triggerMoment: string;
}

interface Appeal {
  core: string;
  emotionalTrigger: string;
  beforeAfter: string;
}

interface HookStrategy {
  bestPatterns: string[];
  reasoning: string;
  exampleHooks: string[];
}

interface StructureStrategy {
  recommendedFormat: string;
  reasoning: string;
  idealDuration: string;
  keyScenes: string;
}

interface CtaStrategy {
  type: string;
  psychologicalBarrier: string;
  barrierRemoval: string;
}

interface AnalysisResult {
  persona: Persona;
  appeal: Appeal;
  winningPatterns: string[];
  hookStrategy: HookStrategy;
  structureStrategy: StructureStrategy;
  ngPatterns: string[];
  ctaStrategy: CtaStrategy;
  dproInsights: string;
}

interface Variant {
  category?: string;
  type: string;
  title: string;
  hookPattern: string;
  format: string;
  estimatedDuration: string;
  hook: string;
  script: string;
  reasoning: string;
}

interface DproItem {
  costDifference: string;
  playCount: string;
  duration: string;
  streamingPeriod: string;
  videoType: string;
  videoUrl: string;
  hook: string;
  script: string;
  source: "dpro" | "reference";
}

function parseDproData(raw: string): DproItem[] {
  if (!raw) return [];
  const blocks = raw.split("---").map(b => b.trim()).filter(Boolean);
  return blocks.map(block => {
    const get = (label: string) => {
      const m = block.match(new RegExp(`${label}[:：]\\s*(.+)`));
      return m ? m[1].trim() : "";
    };
    const scriptMatch = block.match(/台本全文[:：]\n([\s\S]*?)$/);
    const narrationMatch = block.match(/ナレーション[:：]\n([\s\S]*?)$/);
    // ヘッダーに「参考台本」を含むかで元データを判定
    const isReference = block.includes("### 参考台本");
    return {
      costDifference: get("推定広告費"),
      playCount: get("再生数"),
      duration: get("尺"),
      streamingPeriod: get("配信期間"),
      videoType: get("タイプ"),
      videoUrl: get("動画URL"),
      hook: get("フック"),
      script: scriptMatch?.[1]?.trim() || narrationMatch?.[1]?.trim() || "",
      source: isReference ? "reference" as const : "dpro" as const,
    };
  });
}

function DproItemRow({ item, index, copiedField, onCopy }: {
  item: DproItem; index: number;
  copiedField: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasScript = item.script && item.script.length > 5;
  return (
    <div className="border rounded-md overflow-hidden">
      <div
        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors text-sm"
        onClick={() => setOpen(!open)}
      >
        <span className="text-xs text-muted-foreground w-5 shrink-0">#{index + 1}</span>
        <Badge variant={item.source === "reference" ? "default" : "secondary"} className="text-xs shrink-0">
          {item.source === "reference" ? "参考台本" : "DPro"}
        </Badge>
        {item.costDifference && <Badge variant="secondary" className="text-xs shrink-0">{item.costDifference}</Badge>}
        {item.playCount && <span className="text-xs text-muted-foreground shrink-0">{item.playCount}再生</span>}
        {item.duration && <span className="text-xs text-muted-foreground shrink-0">{item.duration}</span>}
        {item.streamingPeriod && <span className="text-xs text-muted-foreground shrink-0">{item.streamingPeriod}</span>}
        {item.videoType && <Badge variant="outline" className="text-xs shrink-0">{item.videoType}</Badge>}
        {item.hook && <span className="text-xs truncate">{item.hook.slice(0, 40)}</span>}
        <span className="ml-auto text-xs text-muted-foreground shrink-0">{open ? "▲" : "▼"}</span>
      </div>
      {open && hasScript && (
        <div className="border-t px-3 py-2 space-y-2">
          {item.videoUrl && (() => {
            const embed = getVideoEmbedUrl(item.videoUrl);
            return (
              <div>
                <p className="text-xs text-muted-foreground mb-1">動画プレビュー</p>
                {embed ? (
                  <div className="rounded overflow-hidden border bg-black max-w-sm">
                    <iframe src={embed.embedUrl} className="w-full aspect-video" allow="autoplay" allowFullScreen />
                  </div>
                ) : (
                  <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all">
                    {item.videoUrl}
                  </a>
                )}
              </div>
            );
          })()}
          {item.hook && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">フック</p>
              <p className="text-sm font-medium bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">{item.hook}</p>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">台本</p>
              <Button variant="ghost" size="sm" className="text-xs h-6 px-2"
                onClick={(e) => { e.stopPropagation(); onCopy(item.script, `dpro-${index}`); }}>
                {copiedField === `dpro-${index}` ? "コピー済" : "コピー"}
              </Button>
            </div>
            <div className="text-sm whitespace-pre-wrap bg-muted/50 p-2 rounded max-h-40 overflow-y-auto">
              {item.script}
            </div>
          </div>
        </div>
      )}
      {open && !hasScript && (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground">台本データなし</div>
      )}
    </div>
  );
}

function VariantCard({ variant, idx, expandedVariant, setExpandedVariant, copiedField, handleCopy, onUpdate }: {
  variant: Variant; idx: number;
  expandedVariant: number | null; setExpandedVariant: (v: number | null) => void;
  copiedField: string | null; handleCopy: (text: string, key: string) => void;
  onUpdate?: (idx: number, field: keyof Variant, value: string) => void;
}) {
  const [editingScript, setEditingScript] = useState(false);
  const [editingHook, setEditingHook] = useState(false);
  const [draftScript, setDraftScript] = useState(variant.script);
  const [draftHook, setDraftHook] = useState(variant.hook);

  return (
    <Card className="overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpandedVariant(expandedVariant === idx ? null : idx)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Badge variant="outline" className="shrink-0 text-base px-2">
            {String.fromCharCode(65 + idx)}
          </Badge>
          <Badge variant={variant.category === "新規フォーマット" ? "default" : "secondary"} className="shrink-0 text-xs">{variant.type}</Badge>
          <span className="font-medium text-sm truncate">{variant.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
          <span>{variant.hookPattern}</span>
          <span>{variant.format}</span>
          <span>{variant.estimatedDuration}</span>
        </div>
      </div>

      {expandedVariant === idx && (
        <div className="border-t px-4 py-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground">フック（クリックで編集）</p>
              <Button variant="ghost" size="sm" className="text-xs h-6 px-2"
                onClick={() => handleCopy(variant.hook, `hook-${idx}`)}>
                {copiedField === `hook-${idx}` ? "コピー済" : "コピー"}
              </Button>
            </div>
            {editingHook ? (
              <textarea
                className="w-full p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                value={draftHook}
                onChange={(e) => setDraftHook(e.target.value)}
                onBlur={() => { onUpdate?.(idx, "hook", draftHook); setEditingHook(false); }}
                rows={2}
                autoFocus
              />
            ) : (
              <div
                className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm font-medium cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all"
                onClick={(e) => { e.stopPropagation(); setDraftHook(variant.hook); setEditingHook(true); }}
              >
                {variant.hook}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground">台本（クリックで編集）</p>
              <Button variant="ghost" size="sm" className="text-xs h-6 px-2"
                onClick={() => handleCopy(variant.script, `script-${idx}`)}>
                {copiedField === `script-${idx}` ? "コピー済" : "コピー"}
              </Button>
            </div>
            {editingScript ? (
              <textarea
                className="w-full p-3 bg-background border rounded-md text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[200px]"
                value={draftScript}
                onChange={(e) => setDraftScript(e.target.value)}
                onBlur={() => { onUpdate?.(idx, "script", draftScript); setEditingScript(false); }}
                rows={12}
                autoFocus
              />
            ) : (
              <div
                className="p-3 bg-background border rounded-md text-sm whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all"
                onClick={(e) => { e.stopPropagation(); setDraftScript(variant.script); setEditingScript(true); }}
              >
                {variant.script}
              </div>
            )}
          </div>

          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-xs font-medium text-muted-foreground mb-1">なぜこの台本が刺さるか</p>
            <p className="text-sm">{variant.reasoning}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"
              onClick={() => handleCopy(variant.script, `full-${idx}`)}>
              {copiedField === `full-${idx}` ? "コピー済" : "台本をコピー"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

type Step = "input" | "researching" | "review" | "generating" | "result";

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

// 編集可能フィールド: クリックでinput/textareaに切り替え
function EditableField({ value, onChange, label, multiline }: {
  value: string; onChange: (v: string) => void; label?: string; multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function save() {
    onChange(draft);
    setEditing(false);
  }

  if (editing) {
    return multiline ? (
      <textarea
        className="w-full text-sm bg-background border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[60px]"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        autoFocus
        rows={3}
      />
    ) : (
      <input
        className="w-full text-sm bg-background border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        autoFocus
      />
    );
  }

  return (
    <span
      className="cursor-pointer hover:bg-primary/10 rounded px-0.5 -mx-0.5 transition-colors border border-transparent hover:border-primary/20"
      onClick={() => { setDraft(value); setEditing(true); }}
      title="クリックで編集"
    >
      {value}
    </span>
  );
}

// 編集可能リスト（勝ちパターン、NGパターンなど）
function EditableList({ items, onChange, addLabel }: {
  items: string[]; onChange: (items: string[]) => void; addLabel: string;
}) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  function saveItem(idx: number) {
    if (!draft.trim()) {
      onChange(items.filter((_, i) => i !== idx));
    } else {
      onChange(items.map((item, i) => i === idx ? draft.trim() : item));
    }
    setEditingIdx(null);
  }

  function addItem() {
    onChange([...items, "新しい項目"]);
    setEditingIdx(items.length);
    setDraft("新しい項目");
  }

  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="text-sm">
          {editingIdx === i ? (
            <input
              className="w-full text-sm bg-background border rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => saveItem(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveItem(i);
                if (e.key === "Escape") setEditingIdx(null);
              }}
              autoFocus
            />
          ) : (
            <span
              className="cursor-pointer hover:bg-primary/10 rounded px-0.5 transition-colors"
              onClick={() => { setDraft(item); setEditingIdx(i); }}
            >
              {item}
            </span>
          )}
        </li>
      ))}
      <li>
        <button onClick={addItem} className="text-xs text-muted-foreground hover:text-foreground">
          + {addLabel}
        </button>
      </li>
    </ul>
  );
}

interface ProjectItem {
  id: number;
  name: string;
  color: string;
}

export default function QuickGeneratePage() {
  // 入力
  const [scripts, setScripts] = useState<string[]>([""]);
  const [genre, setGenre] = useState("");
  const [genreList, setGenreList] = useState<{ genres: string[]; dbGenres: string[]; presets: string[] }>({ genres: [], dbGenres: [], presets: [] });
  const [isCustomGenre, setIsCustomGenre] = useState(false);
  const [customGenre, setCustomGenre] = useState("");
  const [articleLpText, setArticleLpText] = useState("");
  const [articleLpUrl, setArticleLpUrl] = useState("");
  const [instructions, setInstructions] = useState("");

  // プロジェクト
  const [projectList, setProjectList] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, genreRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/genres"),
        ]);
        setProjectList(await projRes.json());
        setGenreList(await genreRes.json());
      } catch { /* ignore */ }
    };
    load();
  }, []);

  async function handleCreateProject() {
    if (!newProjectName.trim()) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newProjectName.trim() }),
    });
    if (res.ok) {
      const p = await res.json();
      setProjectList(prev => [p, ...prev]);
      setSelectedProjectId(p.id);
      setNewProjectName("");
      setShowNewProject(false);
    }
  }

  // ステップ管理
  const [step, setStep] = useState<Step>("input");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [dproData, setDproData] = useState("");
  const [dproItemCount, setDproItemCount] = useState(0);
  const [embeddingUsed, setEmbeddingUsed] = useState(false);
  const [dproSearchInfo, setDproSearchInfo] = useState("");
  const [referenceScriptCount, setReferenceScriptCount] = useState(0);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedVariant, setExpandedVariant] = useState<number | null>(null);
  const [savedScriptId, setSavedScriptId] = useState<number | null>(null);
  const [regenerateInstructions, setRegenerateInstructions] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  // 台本入力管理
  function updateScript(idx: number, value: string) {
    setScripts(prev => prev.map((s, i) => i === idx ? value : s));
  }
  function addScript() {
    setScripts(prev => [...prev, ""]);
  }
  function removeScript(idx: number) {
    if (scripts.length <= 1) return;
    setScripts(prev => prev.filter((_, i) => i !== idx));
  }

  const validScripts = scripts.filter(s => s.trim().length >= 10);

  // ステップ1: リサーチ+分析
  async function handleResearch() {
    setStep("researching");
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch("/api/generate/quick?step=research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scripts: validScripts.map(s => s.trim()),
          genre: genre || undefined,
          articleLpText: articleLpText || undefined,
          instructions: instructions || undefined,
        }),
        signal: AbortSignal.timeout(600000), // 10分タイムアウト
      });

      if (!res.ok) {
        let errorMessage = "リサーチに失敗";
        try {
          const text = await res.text();
          if (text) {
            const data = JSON.parse(text);
            errorMessage = data.error || errorMessage;
          }
        } catch { /* パース失敗はデフォルトメッセージを使用 */ }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setAnalysis(data.analysis);
      setDproData(data.dproData || "");
      setDproItemCount(data.dproItemCount || 0);
      setEmbeddingUsed(data.embeddingUsed || false);
      setDproSearchInfo(data.dproSearchInfo || "");
      setReferenceScriptCount(data.referenceScriptCount || 0);
      setStep("review");
    } catch (err) {
      const msg = err instanceof Error
        ? (err.name === "TimeoutError" ? "リサーチがタイムアウトしました。再度お試しください" : err.message)
        : "エラー";
      setError(msg);
      setStep("input");
    }
  }

  // ステップ2: 台本生成
  async function handleGenerate() {
    setStep("generating");
    setError(null);

    try {
      const res = await fetch("/api/generate/quick?step=generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scripts: validScripts.map(s => s.trim()),
          analysisResult: JSON.stringify(analysis),
          dproData,
          genre: genre || undefined,
          articleLpText: articleLpText || undefined,
          instructions: instructions || undefined,
          projectId: selectedProjectId,
        }),
        signal: AbortSignal.timeout(600000), // 10分タイムアウト
      });

      if (!res.ok) {
        let errorMessage = "生成に失敗";
        try {
          const text = await res.text();
          if (text) {
            const data = JSON.parse(text);
            errorMessage = data.error || errorMessage;
          }
        } catch { /* パース失敗はデフォルトメッセージを使用 */ }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setVariants(data.variants || []);
      if (data.scriptId) setSavedScriptId(data.scriptId);
      setStep("result");
      setExpandedVariant(0);
    } catch (err) {
      const msg = err instanceof Error
        ? (err.name === "TimeoutError" ? "台本生成がタイムアウトしました。再度お試しください" : err.message)
        : "エラー";
      setError(msg);
      setStep("review");
    }
  }

  // 再生成
  async function handleRegenerate() {
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate/quick?step=generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scripts: validScripts.map(s => s.trim()),
          analysisResult: JSON.stringify(analysis),
          dproData,
          genre: genre || undefined,
          articleLpText: articleLpText || undefined,
          instructions: [instructions, regenerateInstructions].filter(Boolean).join("\n\n追加指示:\n"),
          projectId: selectedProjectId,
          previousVariants: variants.map(v => ({ type: v.type, title: v.title, hook: v.hook, script: v.script })),
        }),
        signal: AbortSignal.timeout(600000),
      });

      if (!res.ok) {
        let errorMessage = "再生成に失敗";
        try {
          const text = await res.text();
          if (text) {
            const data = JSON.parse(text);
            errorMessage = data.error || errorMessage;
          }
        } catch { /* パース失敗はデフォルトメッセージを使用 */ }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setVariants(data.variants || []);
      if (data.scriptId) setSavedScriptId(data.scriptId);
      setExpandedVariant(0);
      setRegenerateInstructions("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "エラー";
      setError(msg);
    }
    setRegenerating(false);
  }

  function handleCopy(text: string, key: string) {
    copyToClipboard(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1500);
  }

  // variant編集
  function handleVariantUpdate(idx: number, field: keyof Variant, value: string) {
    setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  }

  // （個別保存は廃止 → 生成時に全台本を自動保存）

  function handleReset() {
    setStep("input");
    setAnalysis(null);
    setVariants([]);
    setDproData("");
    setError(null);
    setSavedScriptId(null);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">B案生成</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "input" && "参考台本+ジャンルを入力 → DProリサーチ → ペルソナ確認 → 台本生成"}
            {step === "researching" && "DProリサーチ+ペルソナ分析中..."}
            {step === "review" && "分析結果を確認して、問題なければ台本を生成"}
            {step === "generating" && "台本を生成中..."}
            {step === "result" && "生成完了。台本をコピーして使ってください"}
          </p>
        </div>
        {(step === "review" || step === "result") && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            最初から
          </Button>
        )}
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={step === "input" || step === "researching" ? "default" : "secondary"}>1. 入力</Badge>
        <span className="text-muted-foreground">→</span>
        <Badge variant={step === "researching" ? "default" : step === "review" || step === "generating" || step === "result" ? "secondary" : "outline"}>2. リサーチ</Badge>
        <span className="text-muted-foreground">→</span>
        <Badge variant={step === "review" ? "default" : step === "generating" || step === "result" ? "secondary" : "outline"}>3. 確認</Badge>
        <span className="text-muted-foreground">→</span>
        <Badge variant={step === "generating" ? "default" : step === "result" ? "secondary" : "outline"}>4. 生成</Badge>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}

      {/* ===== ステップ1: 入力 ===== */}
      {(step === "input" || step === "researching") && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            {/* プロジェクト選択 */}
            <div className="space-y-2">
              <Label>プロジェクト</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProjectId(null)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    selectedProjectId === null
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  未分類
                </button>
                {projectList.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      selectedProjectId === p.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </button>
                ))}
                {showNewProject ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="プロジェクト名"
                      className="h-8 w-36 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                    />
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleCreateProject}>
                      追加
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setShowNewProject(false); setNewProjectName(""); }}>
                      取消
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewProject(true)}
                    className="px-3 py-1.5 text-sm rounded-md border border-dashed border-border text-muted-foreground hover:border-primary/50 transition-colors"
                  >
                    + 新規
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">生成した台本をプロジェクト別に管理できます</p>
            </div>

            <Separator />

            {/* ジャンル（重要） */}
            <div className="space-y-1">
              <Label>ジャンル</Label>
              <Select
                value={isCustomGenre ? "__custom__" : (genre || "__none__")}
                onValueChange={(v) => {
                  if (!v) return;
                  if (v === "__none__") {
                    setIsCustomGenre(false);
                    setCustomGenre("");
                    setGenre("");
                  } else if (v === "__custom__") {
                    setIsCustomGenre(true);
                    setGenre(customGenre);
                  } else {
                    setIsCustomGenre(false);
                    setCustomGenre("");
                    setGenre(v);
                  }
                }}
              >
                <SelectTrigger className="text-base">
                  <SelectValue>
                    {isCustomGenre ? "その他（カスタム入力）" : (genre || "未選択")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">未選択</SelectItem>
                  {genreList.genres.length > 0 && <SelectSeparator />}
                  {genreList.genres.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value="__custom__">その他（カスタム入力）</SelectItem>
                </SelectContent>
              </Select>
              {isCustomGenre && (
                <Input
                  value={customGenre}
                  onChange={(e) => {
                    setCustomGenre(e.target.value);
                    setGenre(e.target.value);
                  }}
                  placeholder="ジャンル名を入力"
                  className="text-base mt-2"
                  autoFocus
                />
              )}
              <p className="text-xs text-muted-foreground">DProで同ジャンルの好調広告を自動リサーチします</p>
            </div>

            <Separator />

            {/* 参考台本（任意・複数） */}
            <div className="space-y-2">
              <Label>参考台本（任意）</Label>
              <p className="text-xs text-muted-foreground">好調な台本があれば貼り付け。複数入力するほど精度UP。なくてもDProデータだけで生成可能</p>
              {scripts.map((script, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {scripts.length > 1 ? `台本${idx + 1}` : "台本"}
                      {script.length > 0 && ` (${script.length}文字)`}
                    </span>
                    {scripts.length > 1 && (
                      <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => removeScript(idx)}>
                        削除
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={script}
                    onChange={(e) => updateScript(idx, e.target.value)}
                    placeholder="好調な広告台本を貼り付け..."
                    rows={5}
                    className="font-mono text-sm"
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addScript} className="w-full border-dashed text-xs">
                + 参考台本を追加
              </Button>
            </div>

            <Separator />

            {/* 記事LP（任意） */}
            <div className="space-y-2">
              <Label>記事LP（任意）</Label>
              <p className="text-xs text-muted-foreground">遷移先のLPテキストがあれば、台本→LP→CVの流れを意識した台本を生成</p>
              <Input
                value={articleLpUrl}
                onChange={(e) => setArticleLpUrl(e.target.value)}
                placeholder="LP URL（参考用）"
                className="h-9 text-sm"
              />
              <Textarea
                value={articleLpText}
                onChange={(e) => setArticleLpText(e.target.value)}
                placeholder="LPのテキスト内容を貼り付け（任意）"
                rows={3}
                className="text-sm"
              />
            </div>

            {/* 追加指示（任意） */}
            <div className="space-y-1">
              <Label>追加指示（任意）</Label>
              <Input
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="例: 女性向け、ストリートインタビュー形式で、フロー型メインで"
                className="h-9 text-sm"
              />
            </div>

            <Button
              onClick={handleResearch}
              disabled={step === "researching" || (!genre && validScripts.length === 0)}
              className="w-full h-12 text-base"
            >
              {step === "researching" ? "DProリサーチ+ペルソナ分析中...（1〜3分）" : "リサーチ開始"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ===== ステップ2: リサーチ中 ===== */}
      {step === "researching" && (
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-2">
            <div className="animate-pulse text-muted-foreground">
              <p className="text-lg font-medium">リサーチ中...</p>
              <p className="text-sm">DProで同ジャンルの好調広告を検索 → ペルソナ・勝ちパターンを分析</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== ステップ3: 分析結果レビュー ===== */}
      {step === "review" && analysis && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            {dproItemCount > 0
              ? `DProから${dproItemCount}件の好調広告データを取得して分析に反映${referenceScriptCount > 0 ? `（参考台本${referenceScriptCount}件も検索対象）` : ""}`
              : `DProデータなし${dproSearchInfo ? `（${dproSearchInfo}）` : ""}${referenceScriptCount > 0 ? ` / 参考台本${referenceScriptCount}件を検索対象に使用` : ""}`
            }
            {embeddingUsed && (
              <Badge variant="secondary" className="ml-2 text-xs">Embedding類似検索</Badge>
            )}
          </div>

          {/* ペルソナ */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">ターゲットペルソナ</h2>
                <span className="text-xs text-muted-foreground">クリックで編集</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">年齢</p>
                  <p className="font-medium text-sm"><EditableField value={analysis.persona.age} onChange={(v) => setAnalysis({ ...analysis, persona: { ...analysis.persona, age: v } })} /></p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">性別</p>
                  <p className="font-medium text-sm"><EditableField value={analysis.persona.gender} onChange={(v) => setAnalysis({ ...analysis, persona: { ...analysis.persona, gender: v } })} /></p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">職業・状況</p>
                  <p className="font-medium text-sm"><EditableField value={analysis.persona.occupation} onChange={(v) => setAnalysis({ ...analysis, persona: { ...analysis.persona, occupation: v } })} /></p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">年収帯</p>
                  <p className="font-medium text-sm"><EditableField value={analysis.persona.income} onChange={(v) => setAnalysis({ ...analysis, persona: { ...analysis.persona, income: v } })} /></p>
                </div>
                <div className="p-2 bg-muted rounded col-span-2">
                  <p className="text-xs text-muted-foreground">最も深い悩み</p>
                  <p className="font-medium text-sm"><EditableField value={analysis.persona.pain} onChange={(v) => setAnalysis({ ...analysis, persona: { ...analysis.persona, pain: v } })} multiline /></p>
                </div>
                <div className="p-2 bg-muted rounded col-span-2 md:col-span-2">
                  <p className="text-xs text-muted-foreground">日常のストレス</p>
                  <p className="text-sm"><EditableField value={analysis.persona.dailyStress} onChange={(v) => setAnalysis({ ...analysis, persona: { ...analysis.persona, dailyStress: v } })} multiline /></p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">行動のきっかけ</p>
                  <p className="text-sm"><EditableField value={analysis.persona.triggerMoment} onChange={(v) => setAnalysis({ ...analysis, persona: { ...analysis.persona, triggerMoment: v } })} /></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 訴求・戦略 */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <h2 className="font-bold text-lg">訴求戦略</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <p className="text-xs text-muted-foreground">訴求の核心</p>
                  <p className="font-bold"><EditableField value={analysis.appeal.core} onChange={(v) => setAnalysis({ ...analysis, appeal: { ...analysis.appeal, core: v } })} /></p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">感情トリガー</p>
                  <p className="font-medium text-sm"><EditableField value={analysis.appeal.emotionalTrigger} onChange={(v) => setAnalysis({ ...analysis, appeal: { ...analysis.appeal, emotionalTrigger: v } })} /></p>
                </div>
                <div className="p-3 bg-muted rounded">
                  <p className="text-xs text-muted-foreground">ビフォーアフター</p>
                  <p className="text-sm"><EditableField value={analysis.appeal.beforeAfter} onChange={(v) => setAnalysis({ ...analysis, appeal: { ...analysis.appeal, beforeAfter: v } })} /></p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">勝ちパターン</p>
                  <EditableList
                    items={analysis.winningPatterns}
                    onChange={(items) => setAnalysis({ ...analysis, winningPatterns: items })}
                    addLabel="パターン追加"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">NGパターン</p>
                  <EditableList
                    items={analysis.ngPatterns}
                    onChange={(items) => setAnalysis({ ...analysis, ngPatterns: items })}
                    addLabel="パターン追加"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">フック戦略</p>
                  <EditableList
                    items={analysis.hookStrategy.bestPatterns}
                    onChange={(items) => setAnalysis({ ...analysis, hookStrategy: { ...analysis.hookStrategy, bestPatterns: items } })}
                    addLabel="パターン追加"
                  />
                  <p className="text-xs text-muted-foreground mt-1"><EditableField value={analysis.hookStrategy.reasoning} onChange={(v) => setAnalysis({ ...analysis, hookStrategy: { ...analysis.hookStrategy, reasoning: v } })} multiline /></p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">構成戦略</p>
                  <p className="text-sm"><EditableField value={analysis.structureStrategy.recommendedFormat} onChange={(v) => setAnalysis({ ...analysis, structureStrategy: { ...analysis.structureStrategy, recommendedFormat: v } })} /></p>
                  <p className="text-xs text-muted-foreground mt-1"><EditableField value={analysis.structureStrategy.reasoning} onChange={(v) => setAnalysis({ ...analysis, structureStrategy: { ...analysis.structureStrategy, reasoning: v } })} multiline /></p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">CTA戦略</p>
                  <p className="text-sm font-medium"><EditableField value={analysis.ctaStrategy.type} onChange={(v) => setAnalysis({ ...analysis, ctaStrategy: { ...analysis.ctaStrategy, type: v } })} /></p>
                  <p className="text-xs text-muted-foreground">障壁: <EditableField value={analysis.ctaStrategy.psychologicalBarrier} onChange={(v) => setAnalysis({ ...analysis, ctaStrategy: { ...analysis.ctaStrategy, psychologicalBarrier: v } })} /></p>
                </div>
              </div>

              {analysis.dproInsights && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">DProインサイト</p>
                    <p className="text-sm"><EditableField value={analysis.dproInsights} onChange={(v) => setAnalysis({ ...analysis, dproInsights: v })} multiline /></p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* フック例 */}
          {analysis.hookStrategy.exampleHooks.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">提案フック例</p>
                <EditableList
                  items={analysis.hookStrategy.exampleHooks}
                  onChange={(items) => setAnalysis({ ...analysis, hookStrategy: { ...analysis.hookStrategy, exampleHooks: items } })}
                  addLabel="フック追加"
                />
              </CardContent>
            </Card>
          )}

          {/* DPro収集データ */}
          {dproData && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">リサーチデータ（{dproItemCount}件）</h2>
                  {embeddingUsed && <Badge variant="outline" className="text-xs">エンベディング検索</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">同ジャンルの好調広告+参考台本。台本生成の参考データとして自動的に使用されます</p>
                <div className="space-y-2">
                  {parseDproData(dproData).map((item, i) => (
                    <DproItemRow key={i} item={item} index={i} copiedField={copiedField} onCopy={handleCopy} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 生成ボタン */}
          <Button onClick={handleGenerate} className="w-full h-12 text-base">
            この分析結果で5パターンの台本を生成する（3〜5分）
          </Button>
        </div>
      )}

      {/* ===== ステップ4: 生成中 ===== */}
      {step === "generating" && (
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-2">
            <div className="animate-pulse text-muted-foreground">
              <p className="text-lg font-medium">台本を生成中...</p>
              <p className="text-sm">分析結果+DProデータを元に5パターンの台本を作成</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===== ステップ5: 生成結果 ===== */}
      {step === "result" && variants.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">生成台本 {variants.length}パターン</h2>
              {savedScriptId && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  自動保存済み（<a href={`/scripts/${savedScriptId}`} className="text-primary hover:underline">詳細を見る</a>）
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const all = variants.map((v, i) =>
                  `【${String.fromCharCode(65 + i)}. ${v.type}】${v.title}\n${v.hookPattern} / ${v.format} / ${v.estimatedDuration}\n\n${v.script}\n\n---`
                ).join("\n\n");
                handleCopy(all, "all");
              }}
            >
              {copiedField === "all" ? "コピー済" : "全てコピー"}
            </Button>
          </div>

          {/* 類似展開（B案） */}
          {variants.some(v => v.category === "類似展開") && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground">類似展開（B案）— 同じ訴求・フォーマットのバリエーション</h3>
              {variants.filter(v => v.category === "類似展開").map((variant) => {
                const idx = variants.indexOf(variant);
                return <VariantCard key={idx} variant={variant} idx={idx} expandedVariant={expandedVariant} setExpandedVariant={setExpandedVariant} copiedField={copiedField} handleCopy={handleCopy} onUpdate={handleVariantUpdate} />;
              })}
            </div>
          )}

          {/* 新規フォーマット */}
          {variants.some(v => v.category === "新規フォーマット") && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground">新規フォーマット — DPro参考・訴求/構成変更</h3>
              {variants.filter(v => v.category === "新規フォーマット").map((variant) => {
                const idx = variants.indexOf(variant);
                return <VariantCard key={idx} variant={variant} idx={idx} expandedVariant={expandedVariant} setExpandedVariant={setExpandedVariant} copiedField={copiedField} handleCopy={handleCopy} onUpdate={handleVariantUpdate} />;
              })}
            </div>
          )}

          {/* categoryが無い場合のフォールバック */}
          {!variants.some(v => v.category) && variants.map((variant, idx) => (
            <VariantCard key={idx} variant={variant} idx={idx} expandedVariant={expandedVariant} setExpandedVariant={setExpandedVariant} copiedField={copiedField} handleCopy={handleCopy} onUpdate={handleVariantUpdate} />
          ))}

          {/* 再生成 */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <h3 className="font-bold text-sm">再生成</h3>
              <Textarea
                placeholder="修正指示を入力（例: フックをもっと短くして、恐怖訴求を強めて）"
                value={regenerateInstructions}
                onChange={e => setRegenerateInstructions(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <Button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="w-full"
              >
                {regenerating ? "再生成中..." : "この指示で再生成する"}
              </Button>
            </CardContent>
          </Card>

          {/* リサーチデータ */}
          {dproData && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
                リサーチデータ（{dproItemCount}件）
              </summary>
              <div className="mt-2 space-y-2">
                {parseDproData(dproData).map((item, i) => (
                  <DproItemRow key={i} item={item} index={i} copiedField={copiedField} onCopy={handleCopy} />
                ))}
              </div>
            </details>
          )}

          {/* 分析結果も表示 */}
          {analysis && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                リサーチ分析結果を見る
              </summary>
              <div className="mt-2 p-3 bg-muted rounded-md text-xs whitespace-pre-wrap">
                {JSON.stringify(analysis, null, 2)}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
