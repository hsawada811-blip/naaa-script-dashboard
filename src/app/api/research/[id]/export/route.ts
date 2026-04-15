import { getResearchProject, listResearchResults } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = getResearchProject(parseInt(id));
  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  const results = listResearchResults(project.id);

  // CSVヘッダー
  const headers = ["ID", "タイトル", "プラットフォーム", "動画URL", "台本", "フック型", "訴求タイプ", "想定再生数", "メモ", "作成日"];

  // CSV行を生成
  const rows = results.map((r) => [
    r.id,
    escapeCsv(r.title),
    r.platform ?? "",
    r.videoUrl ?? "",
    escapeCsv(r.script ?? ""),
    r.hookType ?? "",
    r.appealType ?? "",
    r.estimatedViews ?? "",
    escapeCsv(r.notes ?? ""),
    r.createdAt,
  ].join(","));

  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n"); // BOMつきUTF-8

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="research_${project.id}_${project.genre}.csv"`,
    },
  });
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
