import Link from "next/link";
import { listScripts } from "@/lib/db/queries";
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

export const dynamic = "force-dynamic";

export default function ScriptsPage() {
  const allScripts = listScripts();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">台本一覧</h1>
        <Link href="/scripts/new">
          <Button>+ 新規台本</Button>
        </Link>
      </div>

      {allScripts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            まだ台本がありません。「新規台本」から追加してください。
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allScripts.map((s) => (
            <Link key={s.id} href={`/scripts/${s.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium line-clamp-2">{s.title}</h3>
                    <Badge variant={s.status === "completed" ? "default" : "secondary"} className="shrink-0 ml-2">
                      {statusLabels[s.status] ?? s.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {s.originalScript.slice(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(s.createdAt).toLocaleDateString("ja-JP")}</span>
                    {s.persona && <span className="truncate ml-2">ペルソナ: {s.persona.slice(0, 20)}...</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
