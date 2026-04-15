import Link from "next/link";
import { listScripts, countDproEmbeddings, getDashboardStats, listProjects } from "@/lib/db/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, string> = {
  draft: "下書き",
  analyzing: "分析中",
  analyzed: "分析済",
  generating: "生成中",
  completed: "完了",
};

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const stats = getDashboardStats();
  const recentScripts = listScripts({ limit: 8 });
  const embeddingCount = countDproEmbeddings();
  const allProjects = listProjects();
  const projectMap = new Map(allProjects.map(p => [p.id, p]));

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* メインCTA: B案生成 */}
      <Link href="/scripts/quick">
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white hover:shadow-lg transition-shadow cursor-pointer p-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">B案生成</h1>
            <p className="text-sm text-white/70 mt-1.5">
              参考台本+ジャンル入力 → DProリサーチ → AI分析 → 5パターン台本生成
            </p>
          </div>
          <span className="bg-white text-primary font-semibold px-5 py-2 rounded-lg text-sm shrink-0">
            生成する
          </span>
        </div>
      </Link>

      {/* 統計カード */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="px-6 py-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">台本</p>
            <p className="text-3xl font-bold mt-2 text-primary">{stats.total}</p>
            {stats.generatedCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">生成済み {stats.generatedCount}件</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="px-6 py-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">DPro蓄積台本</p>
            <p className="text-3xl font-bold mt-2 text-primary">{embeddingCount}</p>
            <p className="text-xs text-muted-foreground mt-2">Embedding済み</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="px-6 py-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">エンベディング</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={embeddingCount > 0 ? "default" : "secondary"} className="text-xs">
                {embeddingCount > 0 ? "Gemini 稼働中" : "未使用"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">768次元ベクトル</p>
          </CardContent>
        </Card>
      </div>

      {/* 最新の台本 */}
      <Card className="border-0 shadow-sm">
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base">台本一覧</h2>
            <Link href="/scripts" className="text-sm text-primary hover:underline">
              すべて表示
            </Link>
          </div>
          {recentScripts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">まだ台本がありません</p>
              <p className="text-xs mt-2">B案生成で台本を作成してください</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentScripts.map((s) => (
                <Link
                  key={s.id}
                  href={`/scripts/${s.id}`}
                  className="flex items-center justify-between py-3.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{s.title}</p>
                      {s.projectId && projectMap.has(s.projectId) && (
                        <span
                          className="inline-block w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: projectMap.get(s.projectId)!.color }}
                          title={projectMap.get(s.projectId)!.name}
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(s.createdAt).toLocaleDateString("ja-JP")}
                      {s.projectId && projectMap.has(s.projectId) && (
                        <span className="ml-2">{projectMap.get(s.projectId)!.name}</span>
                      )}
                    </p>
                  </div>
                  <Badge variant={s.status === "completed" ? "default" : "secondary"} className="ml-3 shrink-0 text-xs">
                    {statusLabels[s.status] ?? s.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
