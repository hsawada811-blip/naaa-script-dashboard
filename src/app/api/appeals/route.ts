import { NextResponse } from "next/server";
import { listAppeals, createAppeal, updateAppeal, deleteAppeal } from "@/lib/db/queries";

export async function GET() {
  return NextResponse.json(listAppeals());
}

export async function POST(request: Request) {
  const body = await request.json();
  const appeal = createAppeal({
    name: body.name,
    category: body.category,
    description: body.description ?? "",
    exampleScript: body.exampleScript ?? null,
    performanceScore: body.performanceScore ?? null,
  });
  return NextResponse.json(appeal, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }
  updateAppeal(body.id, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }
  deleteAppeal(parseInt(id));
  return NextResponse.json({ ok: true });
}
