import { NextResponse } from "next/server";
import { listProjects, createProject } from "@/lib/db/queries";

export async function GET() {
  const all = listProjects();
  return NextResponse.json(all);
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "名前は必須です" }, { status: 400 });
  }
  const project = createProject({
    name,
    description: body.description || null,
    color: body.color || "#6366f1",
  });
  return NextResponse.json(project);
}
