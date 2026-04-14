import Link from "next/link";
import { getDashboardStats, listScripts } from "@/lib/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const recentScripts = listScripts({ limit: 5 });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <Link href="/scripts/new">
          <Button>+ 新規台本</Button>
        </Link>
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "台本総数", value: stats.total },
          { label: "下書き", value: stats.draft },
          { label: "分析済", value: stats.analyzed },
          { label: "完了", value: stats.completed },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

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
            <div className="space-y-3">
              {recentScripts.map((s) => (
                <Link
                  key={s.id}
                  href={`/scripts/${s.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <Badge variant={s.status === "completed" ? "default" : "secondary"}>
                    {statusLabels[s.status] ?? s.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* クイックアクション */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/scripts/new">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <p className="font-medium">新規台本入力</p>
              <p className="text-sm text-muted-foreground mt-1">台本+ペルソナ+訴求を入力</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/appeals">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <p className="font-medium">訴求パターン管理</p>
              <p className="text-sm text-muted-foreground mt-1">好調訴求のCRUD</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/lp">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6 text-center">
              <p className="font-medium">記事LP一覧</p>
              <p className="text-sm text-muted-foreground mt-1">生成LP + プレビュー</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
