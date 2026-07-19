import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { ensureDb } from "../../../db";

const OWNER_EMAIL = "mirali200@gmail.com";
const socialFields = ["whatsapp", "facebook", "instagram", "x", "linkedin", "tiktok", "youtube", "snapchat"] as const;

async function authorized() {
  return (await headers()).get("oai-authenticated-user-email")?.toLowerCase() === OWNER_EMAIL;
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  // @ts-ignore
const db: any = await ensureDb();
  const [settings, records, templates, accounts] = await Promise.all([
    db.prepare("SELECT business_name AS businessName, whatsapp, facebook, instagram, x, linkedin, tiktok, youtube, snapchat, updated_at AS updatedAt FROM site_settings WHERE id = 1").first(),
    db.prepare("SELECT id, type, status, customer_name AS customerName, email, phone, details_json AS detailsJson, created_at AS createdAt FROM booking_records ORDER BY created_at DESC LIMIT 500").all(),
    db.prepare("SELECT id, name, badge, nights, hotel, price, active, sort_order AS sortOrder, updated_at AS updatedAt FROM umrah_templates ORDER BY sort_order, id").all(),
    db.prepare("SELECT id, phone, role, status, created_at AS createdAt, last_login_at AS lastLoginAt FROM portal_users ORDER BY created_at DESC LIMIT 500").all(),
  ]);
  return NextResponse.json({ settings, records: records.results, templates: templates.results, accounts: accounts.results });
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  const body = await request.json();
  const name = String(body.name || "").trim().slice(0, 120);
  if (!name) return NextResponse.json({ error: "Template name is required." }, { status: 400 });
  const db = await ensureDb();
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
  const db = await ensureDb();
  await db.prepare("UPDATE site_settings SET business_name = ?, whatsapp = ?, facebook = ?, instagram = ?, x = ?, linkedin = ?, tiktok = ?, youtube = ?, snapchat = ?, updated_at = ? WHERE id = 1")
    .bind(String(body.businessName || "Rihla").trim().slice(0, 100), clean.whatsapp, clean.facebook, clean.instagram, clean.x, clean.linkedin, clean.tiktok, clean.youtube, clean.snapchat, new Date().toISOString()).run();
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
  else if (body.resource === "booking") await db.prepare("DELETE FROM booking_records WHERE id = ?").bind(String(body.id || "")).run();
  else return NextResponse.json({ error: "Invalid resource." }, { status: 400 });
  return NextResponse.json({ deleted: true });
}
