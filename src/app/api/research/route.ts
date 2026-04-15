import { NextResponse } from "next/server";
import { listResearchProjects, createResearchProject } from "@/lib/db/queries";

export async function GET() {
  const projects = listResearchProjects();
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const body = await request.json();

  const project = createResearchProject({
    title: body.title,
    genre: body.genre,
    conditions: JSON.stringify(body.conditions ?? {}),
    freeText: body.freeText ?? null,
  });

  return NextResponse.json(project, { status: 201 });
}
