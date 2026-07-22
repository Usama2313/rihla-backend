import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Standard simple admin login
    if (username === "admin" && password === "password") {
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
