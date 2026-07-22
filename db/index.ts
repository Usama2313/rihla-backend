// Use standard environment variables for Vercel
const env = process.env as any;
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

const mockStore = {
  settings: [{ id: 1, business_name: 'Rihla', whatsapp: '', facebook: '', instagram: '', x: '', linkedin: '', tiktok: '', youtube: '', snapchat: '', updated_at: new Date().toISOString() }],
  records: [] as any[],
  templates: [] as any[],
  accounts: [] as any[]
};

const mockDB = {
  prepare: (query: string) => {
    return {
      bind: (...args: any[]) => ({
        run: async () => {
          if (query.includes('INSERT INTO umrah_templates')) {
             mockStore.templates.push({ id: mockStore.templates.length + 1, name: args[0], badge: args[1], nights: args[2], hotel: args[3], price: args[4], active: args[5], sort_order: args[6], updated_at: args[7] });
          } else if (query.includes('UPDATE umrah_templates')) {
             const id = args[args.length - 1];
             const idx = mockStore.templates.findIndex(t => t.id === id);
             if (idx >= 0) mockStore.templates[idx] = { ...mockStore.templates[idx], name: args[0], badge: args[1], nights: args[2], hotel: args[3], price: args[4], active: args[5], sort_order: args[6], updated_at: args[7] };
          } else if (query.includes('INSERT OR REPLACE INTO booking_records')) {
             const existing = mockStore.records.findIndex(r => r.id === args[0]);
             const record = { id: args[0], type: args[1], status: args[2], customer_name: args[3], email: args[4], phone: args[5], details_json: args[6], created_at: args[7], updated_at: args[8] };
             if (existing >= 0) mockStore.records[existing] = record; else mockStore.records.unshift(record);
          } else if (query.includes('UPDATE booking_records SET type = ?')) {
             const id = args[args.length - 1];
             const idx = mockStore.records.findIndex(r => r.id === id);
             if (idx >= 0) mockStore.records[idx] = { ...mockStore.records[idx], type: args[0], status: args[1], customer_name: args[2], email: args[3], phone: args[4], details_json: args[5], updated_at: args[6] };
          } else if (query.includes('UPDATE booking_records SET status = ?')) {
             const id = args[args.length - 1];
             const idx = mockStore.records.findIndex(r => r.id === id);
             if (idx >= 0) mockStore.records[idx] = { ...mockStore.records[idx], status: args[0], updated_at: args[1] };
          } else if (query.includes('DELETE FROM booking_records')) {
             mockStore.records = mockStore.records.filter(r => r.id !== args[0]);
          } else if (query.includes('DELETE FROM umrah_templates')) {
             mockStore.templates = mockStore.templates.filter(r => r.id !== args[0]);
          } else if (query.includes('UPDATE site_settings')) {
             mockStore.settings[0] = { ...mockStore.settings[0], business_name: args[0], whatsapp: args[1], facebook: args[2], instagram: args[3], x: args[4], linkedin: args[5], tiktok: args[6], youtube: args[7], snapchat: args[8], updated_at: args[9] };
          }
          return { success: true, meta: { last_row_id: mockStore.templates.length } };
        },
        all: async () => {
          if (query.includes('site_settings')) return { results: mockStore.settings };
          if (query.includes('booking_records')) return { results: mockStore.records };
          if (query.includes('umrah_templates')) return { results: mockStore.templates };
          if (query.includes('portal_users')) return { results: mockStore.accounts };
          return { results: [] };
        },
        first: async () => {
          if (query.includes('site_settings')) return mockStore.settings[0];
          return null;
        }
      }),
      run: async () => ({ success: true }),
      all: async () => {
        if (query.includes('site_settings')) return { results: mockStore.settings };
        if (query.includes('booking_records')) return { results: mockStore.records };
        if (query.includes('umrah_templates')) return { results: mockStore.templates };
        if (query.includes('portal_users')) return { results: mockStore.accounts };
        return { results: [] };
      },
      first: async () => {
        if (query.includes('site_settings')) return mockStore.settings[0];
        return null;
      }
    };
  },
  batch: async () => {}
};

export function getDb() {
  if (!env.DB) return drizzle(mockDB as any, { schema });
  return drizzle(env.DB, { schema });
}

export async function ensureDb(): Promise<any> {
  if (!env.DB) return mockDB;
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
