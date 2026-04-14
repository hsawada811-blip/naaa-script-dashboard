import Link from "next/link";
import { getDashboardStats, listScripts, getAppealAnalytics } from "@/lib/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const statusLabels: Record<string, string> = {
  draft: "下書き",
  analyzing: "分析中",
  analyzed: "分析済",
  generating: "生成中",
  completed: "完了",
};

const categoryLabels: Record<string, string> = {
  pain: "痛み",
  benefit: "ベネフィット",
  fear: "恐怖",
  social_proof: "社会的証明",
  authority: "権威性",
  scarcity: "希少性",
  curiosity: "好奇心",
  other: "その他",
};

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const stats = getDashboardStats();
  const recentScripts = listScripts({ limit: 5 });
  const appealAnalytics = getAppealAnalytics();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <Link href="/scripts/new">
          <Button>+ 新規台本</Button>
        </Link>
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: "台本総数", value: stats.total },
          { label: "下書き", value: stats.draft },
          { label: "分析済", value: stats.analyzed },
          { label: "完了", value: stats.completed },
          { label: "生成済み", value: stats.generatedCount },
          { label: "訴求数", value: stats.appealsCount },
          { label: "LP数", value: stats.lpsCount },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最新台本 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>最新の台本</CardTitle>
              <Link href="/scripts" className="text-sm text-primary hover:underline">
                すべて表示
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentScripts.length === 0 ? (
              <p className="text-muted-foreground text-sm">まだ台本がありません</p>
            ) : (
              <div className="space-y-2">
                {recentScripts.map((s) => (
                  <Link
                    key={s.id}
                    href={`/scripts/${s.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                    <Badge variant={s.status === "completed" ? "default" : "secondary"} className="ml-2 shrink-0">
                      {statusLabels[s.status] ?? s.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 訴求パターン別スコア */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>訴求パターン別スコア</CardTitle>
              <Link href="/appeals" className="text-sm text-primary hover:underline">
                管理
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {appealAnalytics.length === 0 ? (
              <p className="text-muted-foreground text-sm">訴求パターンがありません</p>
            ) : (
              <div className="space-y-3">
                {appealAnalytics.map((a) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {categoryLabels[a.category] ?? a.category}
                      </Badge>
                      <span className="text-sm truncate">{a.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">{a.scriptCount}件</span>
                      {a.avgScore ? (
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                a.avgScore >= 7 ? "bg-green-500" : a.avgScore >= 5 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${a.avgScore * 10}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold w-8 text-right">{a.avgScore}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">未分析</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* クイックアクション */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/scripts/new">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <p className="font-medium">新規台本入力</p>
              <p className="text-xs text-muted-foreground mt-1">台本+ペルソナ+訴求</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/appeals">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <p className="font-medium">訴求管理</p>
              <p className="text-xs text-muted-foreground mt-1">パターン追加・編集</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/lp">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <p className="font-medium">記事LP一覧</p>
              <p className="text-xs text-muted-foreground mt-1">生成LP + プレビュー</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/scripts">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardContent className="pt-6 text-center">
              <p className="font-medium">台本一覧</p>
              <p className="text-xs text-muted-foreground mt-1">全台本の管理</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
