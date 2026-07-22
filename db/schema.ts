import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const bookingRecords = sqliteTable("booking_records", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").notNull().default("new"),
  customerName: text("customer_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  detailsJson: text("details_json").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const siteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  businessName: text("business_name").notNull().default("Rihla"),
  whatsapp: text("whatsapp").notNull().default(""),
  facebook: text("facebook").notNull().default(""),
  instagram: text("instagram").notNull().default(""),
  x: text("x").notNull().default(""),
  linkedin: text("linkedin").notNull().default(""),
  tiktok: text("tiktok").notNull().default(""),
  youtube: text("youtube").notNull().default(""),
  snapchat: text("snapchat").notNull().default(""),
  updatedAt: text("updated_at").notNull(),
});

export const umrahTemplates = sqliteTable("umrah_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  badge: text("badge").notNull().default("Umrah package"),
  nights: text("nights").notNull(),
  hotel: text("hotel").notNull(),
  price: text("price").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const portalUsers = sqliteTable("portal_users", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  role: text("role").notNull(),
  status: text("status").notNull().default("pending"),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  lastLoginAt: text("last_login_at"),
});

export const authChallenges = sqliteTable("auth_challenges", {
  tokenHash: text("token_hash").primaryKey(),
  phone: text("phone").notNull(),
  role: text("role").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const authSessions = sqliteTable("auth_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const authAttempts = sqliteTable("auth_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phone: text("phone").notNull(),
  action: text("action").notNull(),
  createdAt: text("created_at").notNull(),
});
export const destinations = sqliteTable('destinations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  place: text('place').notNull(),
  country: text('country').notNull(),
  tag: text('tag').notNull(),
  days: text('days').notNull(),
  color: text('color').notNull(),
  sortOrder: integer('sort_order').default(0),
});
