import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ensureDb } from "../../../../db";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const db = await ensureDb();
    const settings = await db.prepare("SELECT admin_email, admin_password FROM site_settings WHERE id = 1").first();
    const dbEmail = settings?.admin_email || "mirali200@gmail.com";
    const dbPassword = settings?.admin_password || "password";

    // Standard simple admin login
    if ((username === "admin" || username === dbEmail) && password === dbPassword) {
      const cookieStore = await cookies();
      cookieStore.set("rihla_admin_auth", "true", {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("rihla_admin_auth");
  return NextResponse.json({ success: true });
}
