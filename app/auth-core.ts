// Use standard Node environment variables for Vercel
const env = process.env;
import { cookies } from "next/headers";
import { ensureDb } from "../db";

export const SESSION_COOKIE = "rihla_session";
export const roles = new Set(["customer", "agent", "supplier"]);

type PortalUser = { id: string; phone: string; role: string; status: string; lastLoginAt?: string | null };

const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomToken(size = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return bytesToHex(bytes);
}

export async function sha256(value: string) {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

export function normalizePhone(countryCode: unknown, mobile: unknown) {
  const country = String(countryCode || "").replace(/\D/g, "");
  let number = String(mobile || "").replace(/\D/g, "");
  if (!number) throw new Error("Enter your mobile number.");
  if (number.startsWith("00")) number = number.slice(2);
  if (country && !number.startsWith(country)) number = `${country}${number.replace(/^0+/, "")}`;
  if (number.length < 8 || number.length > 15) throw new Error("Enter a valid mobile number with country code.");
  return `+${number}`;
}

export async function passwordHash(password: string, salt = randomToken(16)) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 210_000 }, key, 256);
  return { salt, hash: bytesToHex(new Uint8Array(bits)) };
}

export async function verifyPassword(password: string, salt: string, expected: string) {
  const actual = (await passwordHash(password, salt)).hash;
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index++) difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  return difference === 0;
}

export async function createChallenge(phone: string, role: string) {
  const db = await ensureDb();
  const token = randomToken();
  const now = new Date();
  const expires = new Date(now.getTime() + 10 * 60_000).toISOString();
  await db.prepare("DELETE FROM auth_challenges WHERE phone = ? OR expires_at < ?").bind(phone, now.toISOString()).run();
  await db.prepare("INSERT INTO auth_challenges (token_hash, phone, role, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(await sha256(token), phone, role, expires, now.toISOString()).run();
  return token;
}

export async function consumeChallenge(token: string, phone: string) {
  const db = await ensureDb();
  const tokenHash = await sha256(token);
  const row = await db.prepare("SELECT phone, role, expires_at AS expiresAt FROM auth_challenges WHERE token_hash = ?").bind(tokenHash).first<{ phone: string; role: string; expiresAt: string }>();
  if (!row || row.phone !== phone || row.expiresAt < new Date().toISOString()) throw new Error("Verification expired. Request a new OTP.");
  await db.prepare("DELETE FROM auth_challenges WHERE token_hash = ?").bind(tokenHash).run();
  return row;
}

export async function rateLimit(phone: string, action: string, maximum: number) {
  const db = await ensureDb();
  const cutoff = new Date(Date.now() - 15 * 60_000).toISOString();
  const row = await db.prepare("SELECT COUNT(*) AS count FROM auth_attempts WHERE phone = ? AND action = ? AND created_at > ?").bind(phone, action, cutoff).first<{ count: number }>();
  if (Number(row?.count || 0) >= maximum) throw new Error("Too many attempts. Please wait 15 minutes and try again.");
  await db.prepare("INSERT INTO auth_attempts (phone, action, created_at) VALUES (?, ?, ?)").bind(phone, action, new Date().toISOString()).run();
  await db.prepare("DELETE FROM auth_attempts WHERE created_at < ?").bind(new Date(Date.now() - 86_400_000).toISOString()).run();
}

export async function createSession(userId: string) {
  const db = await ensureDb();
  const token = randomToken();
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 86_400_000);
  await db.prepare("INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256(token), userId, expires.toISOString(), now.toISOString()).run();
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", expires });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await ensureDb();
    await db.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  }
  store.set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", expires: new Date(0) });
}

export async function currentPortalUser(): Promise<PortalUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await ensureDb();
  const user = await db.prepare("SELECT u.id, u.phone, u.role, u.status, u.last_login_at AS lastLoginAt FROM auth_sessions s JOIN portal_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?")
    .bind(await sha256(token), new Date().toISOString()).first<PortalUser>();
  return user || null;
}

export function twilioConfig() {
  const values = env as unknown as Record<string, string | undefined>;
  const accountSid = values.TWILIO_ACCOUNT_SID;
  const authToken = values.TWILIO_AUTH_TOKEN;
  const serviceSid = values.TWILIO_VERIFY_SERVICE_SID;
  if (!accountSid || !authToken || !serviceSid) throw new Error("Mobile OTP is being activated. Please contact Rihla support.");
  return { accountSid, authToken, serviceSid };
}

export async function twilioRequestOtp(phone: string) {
  const config = twilioConfig();
  const response = await fetch(`https://verify.twilio.com/v2/Services/${encodeURIComponent(config.serviceSid)}/Verifications`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${config.accountSid}:${config.authToken}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: phone, Channel: "sms" }),
  });
  if (!response.ok) throw new Error("OTP could not be sent. Check the number and try again.");
}

export async function twilioCheckOtp(phone: string, code: string) {
  const config = twilioConfig();
  const response = await fetch(`https://verify.twilio.com/v2/Services/${encodeURIComponent(config.serviceSid)}/VerificationCheck`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${config.accountSid}:${config.authToken}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: phone, Code: code }),
  });
  if (!response.ok) return false;
  const result = await response.json() as { status?: string };
  return result.status === "approved";
}
