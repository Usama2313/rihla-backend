// Use standard environment variables for Vercel
const env = process.env as any;
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

const mockStore = {
  settings: [{ id: 1, business_name: 'Rihla', whatsapp: '', facebook: '', instagram: '', x: '', linkedin: '', tiktok: '', youtube: '', snapchat: '', admin_email: 'mirali200@gmail.com', admin_password: 'password', admin_avatar: '', updated_at: new Date().toISOString() }],
  records: [] as any[],
  templates: [] as any[],
  accounts: [] as any[],
  destinations: [
    { id: 1, place: "AlUla", country: "Saudi Arabia", tag: "Desert wonder", days: "4 days", color: "sunset", sortOrder: 1 },
    { id: 2, place: "Istanbul", country: "Türkiye", tag: "Culture & cuisine", days: "5 days", color: "blue", sortOrder: 2 },
    { id: 3, place: "Bali", country: "Indonesia", tag: "Island reset", days: "7 days", color: "green", sortOrder: 3 }
  ],
  passengers: [] as any[],
  visaApplications: [] as any[],
  inventory: [] as any[],
  suppliers: [] as any[],
  integrations: [] as any[]
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
          } else if (query.includes('INSERT INTO destinations')) {
             mockStore.destinations.push({ id: mockStore.destinations.length + 1, place: args[0], country: args[1], tag: args[2], days: args[3], color: args[4], sortOrder: args[5] });
          } else if (query.includes('UPDATE destinations')) {
             const id = args[args.length - 1];
             const idx = mockStore.destinations.findIndex(d => d.id === id);
             if (idx >= 0) mockStore.destinations[idx] = { id, place: args[0], country: args[1], tag: args[2], days: args[3], color: args[4], sortOrder: args[5] };
          } else if (query.includes('DELETE FROM destinations')) {
             mockStore.destinations = mockStore.destinations.filter(d => d.id !== args[0]);
          } else if (query.includes('UPDATE site_settings')) {
             if (args.length > 11) {
               mockStore.settings[0] = { ...mockStore.settings[0], business_name: args[0], whatsapp: args[1], facebook: args[2], instagram: args[3], x: args[4], linkedin: args[5], tiktok: args[6], youtube: args[7], snapchat: args[8], admin_email: args[9], admin_password: args[10], admin_avatar: args[11], updated_at: args[12] };
             } else {
               mockStore.settings[0] = { ...mockStore.settings[0], business_name: args[0], whatsapp: args[1], facebook: args[2], instagram: args[3], x: args[4], linkedin: args[5], tiktok: args[6], youtube: args[7], snapchat: args[8], updated_at: args[9] };
             }
          } else if (query.includes('INSERT INTO passengers')) {
             mockStore.passengers.push({ id: mockStore.passengers.length + 1, booking_id: args[0], name: args[1], passport: args[2], nationality: args[3], created_at: args[4] });
          } else if (query.includes('UPDATE passengers')) {
             const id = args[args.length - 1]; const idx = mockStore.passengers.findIndex(x => x.id === id);
             if (idx >= 0) mockStore.passengers[idx] = { ...mockStore.passengers[idx], booking_id: args[0], name: args[1], passport: args[2], nationality: args[3], created_at: args[4] };
          } else if (query.includes('DELETE FROM passengers')) {
             mockStore.passengers = mockStore.passengers.filter(x => x.id !== args[0]);
          } else if (query.includes('INSERT INTO visa_applications')) {
             mockStore.visaApplications.push({ id: mockStore.visaApplications.length + 1, passenger_id: args[0], status: args[1], type: args[2], submitted_at: args[3] });
          } else if (query.includes('UPDATE visa_applications')) {
             const id = args[args.length - 1]; const idx = mockStore.visaApplications.findIndex(x => x.id === id);
             if (idx >= 0) mockStore.visaApplications[idx] = { ...mockStore.visaApplications[idx], passenger_id: args[0], status: args[1], type: args[2], submitted_at: args[3] };
          } else if (query.includes('DELETE FROM visa_applications')) {
             mockStore.visaApplications = mockStore.visaApplications.filter(x => x.id !== args[0]);
          } else if (query.includes('INSERT INTO inventory')) {
             mockStore.inventory.push({ id: mockStore.inventory.length + 1, type: args[0], name: args[1], stock: args[2], details: args[3] });
          } else if (query.includes('UPDATE inventory')) {
             const id = args[args.length - 1]; const idx = mockStore.inventory.findIndex(x => x.id === id);
             if (idx >= 0) mockStore.inventory[idx] = { ...mockStore.inventory[idx], type: args[0], name: args[1], stock: args[2], details: args[3] };
          } else if (query.includes('DELETE FROM inventory')) {
             mockStore.inventory = mockStore.inventory.filter(x => x.id !== args[0]);
          } else if (query.includes('INSERT INTO suppliers')) {
             mockStore.suppliers.push({ id: mockStore.suppliers.length + 1, name: args[0], type: args[1], balance: args[2], status: args[3] });
          } else if (query.includes('UPDATE suppliers')) {
             const id = args[args.length - 1]; const idx = mockStore.suppliers.findIndex(x => x.id === id);
             if (idx >= 0) mockStore.suppliers[idx] = { ...mockStore.suppliers[idx], name: args[0], type: args[1], balance: args[2], status: args[3] };
          } else if (query.includes('DELETE FROM suppliers')) {
             mockStore.suppliers = mockStore.suppliers.filter(x => x.id !== args[0]);
          } else if (query.includes('INSERT INTO integrations')) {
             mockStore.integrations.push({ id: mockStore.integrations.length + 1, name: args[0], status: args[1], api_key: args[2] });
          } else if (query.includes('UPDATE integrations')) {
             const id = args[args.length - 1]; const idx = mockStore.integrations.findIndex(x => x.id === id);
             if (idx >= 0) mockStore.integrations[idx] = { ...mockStore.integrations[idx], name: args[0], status: args[1], api_key: args[2] };
          } else if (query.includes('DELETE FROM integrations')) {
             mockStore.integrations = mockStore.integrations.filter(x => x.id !== args[0]);
          }
          return { success: true, meta: { last_row_id: 1 } };
        },
        all: async () => {
          if (query.includes('site_settings')) return { results: mockStore.settings };
          if (query.includes('booking_records')) return { results: mockStore.records };
          if (query.includes('umrah_templates')) return { results: mockStore.templates };
          if (query.includes('portal_users')) return { results: mockStore.accounts };
          if (query.includes('destinations')) return { results: mockStore.destinations };
          if (query.includes('passengers')) return { results: mockStore.passengers };
          if (query.includes('visa_applications')) return { results: mockStore.visaApplications };
          if (query.includes('inventory')) return { results: mockStore.inventory };
          if (query.includes('suppliers')) return { results: mockStore.suppliers };
          if (query.includes('integrations')) return { results: mockStore.integrations };
          return { results: [] };
        },
        first: async () => {
          if (query.includes('site_settings')) {
            const s = mockStore.settings[0];
            return {
              ...s,
              businessName: s.business_name,
              adminEmail: s.admin_email,
              adminPassword: s.admin_password,
              adminAvatar: s.admin_avatar
            };
          }
          return null;
        }
      }),
      run: async () => ({ success: true }),
      all: async () => {
        if (query.includes('site_settings')) return { results: mockStore.settings };
        if (query.includes('booking_records')) return { results: mockStore.records };
        if (query.includes('umrah_templates')) return { results: mockStore.templates };
        if (query.includes('portal_users')) return { results: mockStore.accounts };
        if (query.includes('destinations')) return { results: mockStore.destinations };
        if (query.includes('passengers')) return { results: mockStore.passengers };
        if (query.includes('visa_applications')) return { results: mockStore.visaApplications };
        if (query.includes('inventory')) return { results: mockStore.inventory };
        if (query.includes('suppliers')) return { results: mockStore.suppliers };
        if (query.includes('integrations')) return { results: mockStore.integrations };
        return { results: [] };
      },
      first: async () => {
        if (query.includes('site_settings')) {
          const s = mockStore.settings[0];
          return {
            ...s,
            businessName: s.business_name,
            adminEmail: s.admin_email,
            adminPassword: s.admin_password,
            adminAvatar: s.admin_avatar
          };
        }
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
    env.DB.prepare("CREATE TABLE IF NOT EXISTS passengers (id INTEGER PRIMARY KEY AUTOINCREMENT, booking_id TEXT NOT NULL, name TEXT NOT NULL, passport TEXT NOT NULL, nationality TEXT NOT NULL, created_at TEXT NOT NULL)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS visa_applications (id INTEGER PRIMARY KEY AUTOINCREMENT, passenger_id INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', type TEXT NOT NULL, submitted_at TEXT NOT NULL)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, name TEXT NOT NULL, stock INTEGER NOT NULL DEFAULT 0, details TEXT NOT NULL)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS suppliers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL, balance TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active')"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS integrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'disconnected', api_key TEXT)"),
  ]);
  try {
    await env.DB.prepare("ALTER TABLE site_settings ADD COLUMN admin_email TEXT NOT NULL DEFAULT 'mirali200@gmail.com'").run();
  } catch (e) {}
  try {
    await env.DB.prepare("ALTER TABLE site_settings ADD COLUMN admin_password TEXT NOT NULL DEFAULT 'password'").run();
  } catch (e) {}
  try {
    await env.DB.prepare("ALTER TABLE site_settings ADD COLUMN admin_avatar TEXT NOT NULL DEFAULT ''").run();
  } catch (e) {}
  return env.DB;
}
