import { NextResponse } from "next/server";
import { ensureDb } from "../../../db";
import { consumeChallenge, createChallenge, createSession, currentPortalUser, destroySession, normalizePhone, passwordHash, rateLimit, roles, twilioCheckOtp, twilioRequestOtp, verifyPassword } from "../../auth-core";

function roleOf(value: unknown) {
  const role = String(value || "customer").toLowerCase();
  if (!roles.has(role)) throw new Error("Choose Customer, Agent, or Supplier.");
  return role;
}

function errorResponse(error: unknown, status = 400) {
  return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to complete this request." }, { status });
}

export async function GET() {
  try {
    const user = await currentPortalUser();
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return errorResponse(new Error("Invalid request.")); }
  const action = String(body.action || "");
  try {
    if (action === "request-otp") {
      const role = roleOf(body.role);
      const phone = normalizePhone(body.countryCode, body.mobile);
      await rateLimit(phone, "request-otp", 5);
      await twilioRequestOtp(phone);
      return NextResponse.json({ sent: true, phoneMasked: `${phone.slice(0, 4)}••••${phone.slice(-3)}` });
    }

    if (action === "verify-otp") {
      const role = roleOf(body.role);
      const phone = normalizePhone(body.countryCode, body.mobile);
      const code = String(body.code || "").replace(/\D/g, "");
      if (code.length < 4 || code.length > 10) throw new Error("Enter the OTP sent to your mobile.");
      await rateLimit(phone, "verify-otp", 8);
      if (!(await twilioCheckOtp(phone, code))) throw new Error("The OTP is incorrect or expired.");
      return NextResponse.json({ verified: true, setupToken: await createChallenge(phone, role) });
    }

    if (action === "set-password") {
      const phone = normalizePhone(body.countryCode, body.mobile);
      const password = String(body.password || "");
      if (password.length < 10 || password.length > 128) throw new Error("Use a password of at least 10 characters.");
      const challenge = await consumeChallenge(String(body.setupToken || ""), phone);
      const db = await ensureDb();
      const existing = await db.prepare("SELECT id, role FROM portal_users WHERE phone = ?").bind(phone).first<{ id: string; role: string }>();
      const credentials = await passwordHash(password);
      const now = new Date().toISOString();
      const userId = existing?.id || crypto.randomUUID();
      if (existing) {
        await db.prepare("UPDATE portal_users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?")
          .bind(credentials.hash, credentials.salt, now, userId).run();
      } else {
        const status = challenge.role === "customer" ? "active" : "pending";
        await db.prepare("INSERT INTO portal_users (id, phone, role, status, password_hash, password_salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
          .bind(userId, phone, challenge.role, status, credentials.hash, credentials.salt, now, now).run();
      }
      await createSession(userId);
      const status = existing ? (await db.prepare("SELECT status FROM portal_users WHERE id = ?").bind(userId).first<{ status: string }>())?.status : challenge.role === "customer" ? "active" : "pending";
      return NextResponse.json({ saved: true, role: existing?.role || challenge.role, status });
    }

    if (action === "login") {
      const phone = normalizePhone(body.countryCode, body.mobile);
      const password = String(body.password || "");
      await rateLimit(phone, "login", 8);
      const db = await ensureDb();
      const user = await db.prepare("SELECT id, phone, role, status, password_hash AS passwordHash, password_salt AS passwordSalt FROM portal_users WHERE phone = ?")
        .bind(phone).first<{ id: string; phone: string; role: string; status: string; passwordHash: string; passwordSalt: string }>();
      if (!user || !(await verifyPassword(password, user.passwordSalt, user.passwordHash))) throw new Error("Mobile number or password is incorrect.");
      if (user.status === "suspended") throw new Error("This account is suspended. Contact Rihla support.");
      await createSession(user.id);
      await db.prepare("UPDATE portal_users SET last_login_at = ?, updated_at = ? WHERE id = ?").bind(new Date().toISOString(), new Date().toISOString(), user.id).run();
      return NextResponse.json({ loggedIn: true, role: user.role, status: user.status });
    }

    if (action === "logout") {
      await destroySession();
      return NextResponse.json({ loggedOut: true });
    }

    return errorResponse(new Error("Unknown authentication action."));
  } catch (error) {
    return errorResponse(error);
  }
}
