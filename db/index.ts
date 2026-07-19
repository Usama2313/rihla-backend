import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

export async function ensureDb() {
  if (!env.DB) throw new Error("Database is unavailable.");
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS booking_records (id TEXT PRIMARY KEY, type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', customer_name TEXT NOT NULL, email TEXT, phone TEXT, details_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS booking_records_created_idx ON booking_records (created_at DESC)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS site_settings (id INTEGER PRIMARY KEY DEFAULT 1, business_name TEXT NOT NULL DEFAULT 'Rihla', whatsapp TEXT NOT NULL DEFAULT '', facebook TEXT NOT NULL DEFAULT '', instagram TEXT NOT NULL DEFAULT '', x TEXT NOT NULL DEFAULT '', linkedin TEXT NOT NULL DEFAULT '', tiktok TEXT NOT NULL DEFAULT '', youtube TEXT NOT NULL DEFAULT '', snapchat TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL)"),
    env.DB.prepare("INSERT OR IGNORE INTO site_settings (id, business_name, updated_at) VALUES (1, 'Rihla', datetime('now'))"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS umrah_templates (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, badge TEXT NOT NULL DEFAULT 'Umrah package', nights TEXT NOT NULL, hotel TEXT NOT NULL, price TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL)"),
    env.DB.prepare("INSERT OR IGNORE INTO umrah_templates (id, name, badge, nights, hotel, price, active, sort_order, updated_at) VALUES (1, 'Essential Umrah', 'Best value', '7 nights', 'Value stays in Makkah & Madinah', 'from BHD 329', 1, 1, datetime('now'))"),
    env.DB.prepare("INSERT OR IGNORE INTO umrah_templates (id, name, badge, nights, hotel, price, active, sort_order, updated_at) VALUES (2, 'Family Comfort', 'Most popular', '10 nights', 'Family rooms & private transfers', 'from BHD 495', 1, 2, datetime('now'))"),
    env.DB.prepare("INSERT OR IGNORE INTO umrah_templates (id, name, badge, nights, hotel, price, active, sort_order, updated_at) VALUES (3, 'Premium Haramain', 'Premium', '12 nights', 'Premium stays close to the Haramain', 'from BHD 795', 1, 3, datetime('now'))"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS portal_users (id TEXT PRIMARY KEY, phone TEXT NOT NULL UNIQUE, role TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, last_login_at TEXT)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS portal_users_role_status_idx ON portal_users (role, status)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS auth_challenges (token_hash TEXT PRIMARY KEY, phone TEXT NOT NULL, role TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS auth_challenges_phone_idx ON auth_challenges (phone, expires_at)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS auth_sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions (user_id, expires_at)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS auth_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, phone TEXT NOT NULL, action TEXT NOT NULL, created_at TEXT NOT NULL)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS auth_attempts_rate_idx ON auth_attempts (phone, action, created_at)"),
  ]);
  return env.DB;
}
