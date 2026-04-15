"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusLabels: Record<string, string> = {
  draft: "下書き",
  analyzing: "分析中",
  analyzed: "分析済",
  generating: "生成中",
  completed: "完了",
};

interface ScriptItem {
  id: number;
  title: string;
  originalScript: string;
  status: string;
  projectId: number | null;
  createdAt: string;
}

interface ProjectItem {
  id: number;
  name: string;
  color: string;
}

export function ScriptsList({
  initialScripts,
  initialProjects,
}: {
  initialScripts: ScriptItem[];
  initialProjects: ProjectItem[];
}) {
  const router = useRouter();
  const [scripts, setScripts] = useState(initialScripts);
  const [projects] = useState(initialProjects);
  const [changingId, setChangingId] = useState<number | null>(null);

  async function handleProjectChange(scriptId: number, projectId: number | null) {
    setChangingId(null);
    // 楽観的更新
    setScripts(prev =>
      prev.map(s => s.id === scriptId ? { ...s, projectId } : s)
    );
    await fetch(`/api/scripts/${scriptId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    router.refresh();
  }

  // プロジェクト別にグルーピング
  const scriptsByProject = new Map<number | null, ScriptItem[]>();
  for (const s of scripts) {
    const key = s.projectId ?? null;
    if (!scriptsByProject.has(key)) scriptsByProject.set(key, []);
    scriptsByProject.get(key)!.push(s);
  }

  const projectOrder: { id: number | null; name: string; color: string }[] = [];
  for (const p of projects) {
    if (scriptsByProject.has(p.id)) {
      projectOrder.push({ id: p.id, name: p.name, color: p.color });
    }
  }
  // プロジェクトに台本がないものも空セクションとして表示
  for (const p of projects) {
    if (!projectOrder.find(o => o.id === p.id)) {
      projectOrder.push({ id: p.id, name: p.name, color: p.color });
    }
  }
  if (scriptsByProject.has(null)) {
    projectOrder.push({ id: null, name: "未分類", color: "#94a3b8" });
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">台本一覧</h1>
        <Link href="/scripts/quick">
          <Button>B案生成</Button>
        </Link>
      </div>

      {scripts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <p className="text-sm">まだ台本がありません</p>
            <p className="text-xs mt-2">B案生成で台本を作成してください</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {projectOrder.map((proj) => {
            const items = scriptsByProject.get(proj.id) || [];
            return (
              <div key={proj.id ?? "null"}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: proj.color }}
                  />
                  <h2 className="font-bold text-lg">{proj.name}</h2>
                  <span className="text-sm text-muted-foreground">{items.length}件</span>
                </div>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-6">台本なし</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((s) => (
                      <Card key={s.id} className="border-0 shadow-sm hover:shadow-md transition-shadow h-full relative group">
                        <CardContent className="py-5 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <Link href={`/scripts/${s.id}`} className="min-w-0 flex-1">
                              <h3 className="font-medium line-clamp-2 text-sm hover:underline">{s.title}</h3>
                            </Link>
                            <Badge variant={s.status === "completed" ? "default" : "secondary"} className="shrink-0 text-xs">
                              {statusLabels[s.status] ?? s.status}
                            </Badge>
                          </div>
                          <Link href={`/scripts/${s.id}`}>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {s.originalScript.slice(0, 100)}...
                            </p>
                          </Link>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {new Date(s.createdAt).toLocaleDateString("ja-JP")}
                            </span>

                            {/* プロジェクト変更ボタン */}
                            {changingId === s.id ? (
                              <div className="flex flex-wrap gap-1">
                                <button
                                  onClick={() => handleProjectChange(s.id, null)}
                                  className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                                    s.projectId === null
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "border-border hover:border-primary/50"
                                  }`}
                                >
                                  未分類
                                </button>
                                {projects.map((p) => (
                                  <button
                                    key={p.id}
                                    onClick={() => handleProjectChange(s.id, p.id)}
                                    className={`px-2 py-0.5 text-xs rounded border transition-colors flex items-center gap-1 ${
                                      s.projectId === p.id
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "border-border hover:border-primary/50"
                                    }`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                                    {p.name}
                                  </button>
                                ))}
                                <button
                                  onClick={() => setChangingId(null)}
                                  className="px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                                >
                                  閉じる
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setChangingId(s.id)}
                                className="text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                分類変更
                              </button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
