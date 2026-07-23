import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { ensureDb } from "../../../db";

const OWNER_EMAIL = "mirali200@gmail.com";
const socialFields = ["whatsapp", "facebook", "instagram", "x", "linkedin", "tiktok", "youtube", "snapchat"] as const;

async function authorized() {
  const cookieStore = await headers();
  // We use headers().get("cookie") to check cookies securely in route handlers
  const cookieHeader = cookieStore.get("cookie") || "";
  return cookieHeader.includes("rihla_admin_auth=true");
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  // @ts-ignore
const db: any = await ensureDb();
  const [settings, records, templates, accounts, destinations, passengers, visaApplications, inventory, suppliers, integrations] = await Promise.all([
    db.prepare("SELECT business_name AS businessName, whatsapp, facebook, instagram, x, linkedin, tiktok, youtube, snapchat, admin_email AS adminEmail, admin_password AS adminPassword, admin_avatar AS adminAvatar, updated_at AS updatedAt FROM site_settings WHERE id = 1").first(),
    db.prepare("SELECT id, type, status, customer_name AS customerName, email, phone, details_json AS detailsJson, created_at AS createdAt FROM booking_records ORDER BY created_at DESC LIMIT 500").all(),
    db.prepare("SELECT id, name, badge, nights, hotel, price, active, sort_order AS sortOrder, updated_at AS updatedAt FROM umrah_templates ORDER BY sort_order, id").all(),
    db.prepare("SELECT id, phone, role, status, created_at AS createdAt, last_login_at AS lastLoginAt FROM portal_users ORDER BY created_at DESC LIMIT 500").all(),
    db.prepare("SELECT id, place, country, tag, days, color, sort_order AS sortOrder FROM destinations ORDER BY sort_order, id").all(),
    db.prepare("SELECT * FROM passengers ORDER BY created_at DESC").all(),
    db.prepare("SELECT * FROM visa_applications ORDER BY submitted_at DESC").all(),
    db.prepare("SELECT * FROM inventory").all(),
    db.prepare("SELECT * FROM suppliers").all(),
    db.prepare("SELECT * FROM integrations").all(),
  ]);
  return NextResponse.json({ settings, records: records.results, templates: templates.results, accounts: accounts.results, destinations: destinations.results, passengers: passengers.results, visaApplications: visaApplications.results, inventory: inventory.results, suppliers: suppliers.results, integrations: integrations.results });
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  const body = await request.json();
  const db = await ensureDb();
  
  if (body.resource === "destination") {
    if (body.id) {
      await db.prepare("UPDATE destinations SET place = ?, country = ?, tag = ?, days = ?, color = ?, sort_order = ? WHERE id = ?")
        .bind(body.place, body.country, body.tag, body.days, body.color, Number(body.sortOrder || 0), Number(body.id)).run();
      return NextResponse.json({ id: Number(body.id), saved: true });
    }
    const result = await db.prepare("INSERT INTO destinations (place, country, tag, days, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(body.place, body.country, body.tag, body.days, body.color, Number(body.sortOrder || 0)).run();
    return NextResponse.json({ id: result.meta.last_row_id, saved: true });
  }

  if (body.resource === "passenger") {
    if (body.id) {
      await db.prepare("UPDATE passengers SET booking_id = ?, name = ?, passport = ?, nationality = ?, created_at = ? WHERE id = ?")
        .bind(body.booking_id, body.name, body.passport, body.nationality, body.created_at, Number(body.id)).run();
      return NextResponse.json({ id: Number(body.id), saved: true });
    }
    const result = await db.prepare("INSERT INTO passengers (booking_id, name, passport, nationality, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(body.booking_id, body.name, body.passport, body.nationality, new Date().toISOString()).run();
    return NextResponse.json({ id: result.meta.last_row_id, saved: true });
  }

  if (body.resource === "visa_application") {
    if (body.id) {
      await db.prepare("UPDATE visa_applications SET passenger_id = ?, status = ?, type = ?, submitted_at = ? WHERE id = ?")
        .bind(Number(body.passenger_id), body.status, body.type, body.submitted_at, Number(body.id)).run();
      return NextResponse.json({ id: Number(body.id), saved: true });
    }
    const result = await db.prepare("INSERT INTO visa_applications (passenger_id, status, type, submitted_at) VALUES (?, ?, ?, ?)")
      .bind(Number(body.passenger_id), body.status, body.type, new Date().toISOString()).run();
    return NextResponse.json({ id: result.meta.last_row_id, saved: true });
  }

  if (body.resource === "inventory") {
    if (body.id) {
      await db.prepare("UPDATE inventory SET type = ?, name = ?, stock = ?, details = ? WHERE id = ?")
        .bind(body.type, body.name, Number(body.stock), body.details, Number(body.id)).run();
      return NextResponse.json({ id: Number(body.id), saved: true });
    }
    const result = await db.prepare("INSERT INTO inventory (type, name, stock, details) VALUES (?, ?, ?, ?)")
      .bind(body.type, body.name, Number(body.stock), body.details).run();
    return NextResponse.json({ id: result.meta.last_row_id, saved: true });
  }

  if (body.resource === "supplier") {
    if (body.id) {
      await db.prepare("UPDATE suppliers SET name = ?, type = ?, balance = ?, status = ? WHERE id = ?")
        .bind(body.name, body.type, body.balance, body.status, Number(body.id)).run();
      return NextResponse.json({ id: Number(body.id), saved: true });
    }
    const result = await db.prepare("INSERT INTO suppliers (name, type, balance, status) VALUES (?, ?, ?, ?)")
      .bind(body.name, body.type, body.balance, body.status).run();
    return NextResponse.json({ id: result.meta.last_row_id, saved: true });
  }

  if (body.resource === "integration") {
    if (body.id) {
      await db.prepare("UPDATE integrations SET name = ?, status = ?, api_key = ? WHERE id = ?")
        .bind(body.name, body.status, body.api_key, Number(body.id)).run();
      return NextResponse.json({ id: Number(body.id), saved: true });
    }
    const result = await db.prepare("INSERT INTO integrations (name, status, api_key) VALUES (?, ?, ?)")
      .bind(body.name, body.status, body.api_key).run();
    return NextResponse.json({ id: result.meta.last_row_id, saved: true });
  }

  // Otherwise handle template
  const name = String(body.name || "").trim().slice(0, 120);
  if (!name) return NextResponse.json({ error: "Template name is required." }, { status: 400 });
  const now = new Date().toISOString();
  if (body.id) {
    await db.prepare("UPDATE umrah_templates SET name = ?, badge = ?, nights = ?, hotel = ?, price = ?, active = ?, sort_order = ?, updated_at = ? WHERE id = ?")
      .bind(name, String(body.badge || "Umrah package").slice(0, 80), String(body.nights || "").slice(0, 80), String(body.hotel || "").slice(0, 400), String(body.price || "").slice(0, 80), body.active === false || body.active === 0 ? 0 : 1, Number(body.sortOrder || 0), now, Number(body.id)).run();
    return NextResponse.json({ id: Number(body.id), saved: true });
  }
  const result = await db.prepare("INSERT INTO umrah_templates (name, badge, nights, hotel, price, active, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(name, String(body.badge || "Umrah package").slice(0, 80), String(body.nights || "").slice(0, 80), String(body.hotel || "").slice(0, 400), String(body.price || "").slice(0, 80), body.active === false ? 0 : 1, Number(body.sortOrder || 0), now).run();
  return NextResponse.json({ id: result.meta.last_row_id, saved: true });
}

export async function PUT(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  const body = await request.json();
  const clean = Object.fromEntries(socialFields.map((field) => [field, String(body[field] || "").trim().slice(0, 500)]));
  const adminEmail = String(body.adminEmail || "mirali200@gmail.com").trim().slice(0, 240);
  const adminPassword = String(body.adminPassword || "password").slice(0, 100);
  const adminAvatar = String(body.adminAvatar || "").slice(0, 300000);
  const db = await ensureDb();
  await db.prepare("UPDATE site_settings SET business_name = ?, whatsapp = ?, facebook = ?, instagram = ?, x = ?, linkedin = ?, tiktok = ?, youtube = ?, snapchat = ?, admin_email = ?, admin_password = ?, admin_avatar = ?, updated_at = ? WHERE id = 1")
    .bind(String(body.businessName || "Rihla").trim().slice(0, 100), clean.whatsapp, clean.facebook, clean.instagram, clean.x, clean.linkedin, clean.tiktok, clean.youtube, clean.snapchat, adminEmail, adminPassword, adminAvatar, new Date().toISOString()).run();
  return NextResponse.json({ saved: true });
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  const body = await request.json();
  const status = String(body.status || "new");
  if (!new Set(["new", "contacted", "confirmed", "closed"]).has(status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  const db = await ensureDb();
  if (body.resource === "account") {
    const accountStatus = String(body.status || "pending");
    if (!new Set(["pending", "active", "suspended"]).has(accountStatus)) return NextResponse.json({ error: "Invalid account status." }, { status: 400 });
    await db.prepare("UPDATE portal_users SET status = ?, updated_at = ? WHERE id = ?").bind(accountStatus, new Date().toISOString(), String(body.id || "")).run();
    return NextResponse.json({ saved: true });
  }
  if (body.resource === "booking") {
    await db.prepare("UPDATE booking_records SET type = ?, status = ?, customer_name = ?, email = ?, phone = ?, details_json = ?, updated_at = ? WHERE id = ?")
      .bind(String(body.type || "travel").slice(0, 30), status, String(body.customerName || "").trim().slice(0, 160), String(body.email || "").slice(0, 240), String(body.phone || "").slice(0, 80), String(body.detailsJson || "{}").slice(0, 24000), new Date().toISOString(), String(body.id || "")).run();
  } else {
    await db.prepare("UPDATE booking_records SET status = ?, updated_at = ? WHERE id = ?").bind(status, new Date().toISOString(), String(body.id || "")).run();
  }
  return NextResponse.json({ saved: true });
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  const body = await request.json();
  const db = await ensureDb();
  if (body.resource === "template") await db.prepare("DELETE FROM umrah_templates WHERE id = ?").bind(Number(body.id)).run();
  else if (body.resource === "destination") await db.prepare("DELETE FROM destinations WHERE id = ?").bind(Number(body.id)).run();
  else if (body.resource === "booking") await db.prepare("DELETE FROM booking_records WHERE id = ?").bind(String(body.id || "")).run();
  else if (body.resource === "passenger") await db.prepare("DELETE FROM passengers WHERE id = ?").bind(Number(body.id)).run();
  else if (body.resource === "visa_application") await db.prepare("DELETE FROM visa_applications WHERE id = ?").bind(Number(body.id)).run();
  else if (body.resource === "inventory") await db.prepare("DELETE FROM inventory WHERE id = ?").bind(Number(body.id)).run();
  else if (body.resource === "supplier") await db.prepare("DELETE FROM suppliers WHERE id = ?").bind(Number(body.id)).run();
  else if (body.resource === "integration") await db.prepare("DELETE FROM integrations WHERE id = ?").bind(Number(body.id)).run();
  else return NextResponse.json({ error: "Invalid resource." }, { status: 400 });
  return NextResponse.json({ deleted: true });
}
