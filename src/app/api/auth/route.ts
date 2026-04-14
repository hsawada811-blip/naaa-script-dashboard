import { NextResponse } from "next/server";
import { getUserByName } from "@/lib/db/queries";
import { verifyPassword, createToken, getTokenCookieOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const { name, password } = await request.json();

  if (!name || !password) {
    return NextResponse.json({ error: "名前とパスワードを入力してください" }, { status: 400 });
  }

  const user = getUserByName(name);
  if (!user) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  const token = await createToken(user.id, user.name, user.role);
  const response = NextResponse.json({ ok: true, name: user.name, role: user.role });
  response.cookies.set(getTokenCookieOptions(token));
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("sd-token", "", { maxAge: 0, path: "/" });
  return response;
}
