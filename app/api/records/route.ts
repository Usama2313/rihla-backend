import { NextResponse } from "next/server";
import { ensureDb } from "../../../db";

const allowedTypes = new Set(["flight", "umrah", "hotel", "travel"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = String(body.type || "");
    const customerName = String(body.customerName || "").trim().slice(0, 160);
    if (!allowedTypes.has(type) || !customerName) return NextResponse.json({ error: "A valid booking type and customer name are required." }, { status: 400 });
    const id = String(body.reference || `RHL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`).slice(0, 80);
    const now = new Date().toISOString();
    const details = JSON.stringify(body.details ?? {}).slice(0, 24000);
    const db = await ensureDb();
    await db.prepare("INSERT OR REPLACE INTO booking_records (id, type, status, customer_name, email, phone, details_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM booking_records WHERE id = ?), ?), ?)")
      .bind(id, type, "new", customerName, String(body.email || "").slice(0, 240), String(body.phone || "").slice(0, 80), details, id, now, now).run();

    const detailsObj = body.details ?? {};
    if (detailsObj.passport) {
      await db.prepare("INSERT INTO passengers (booking_id, name, passport, nationality, created_at) VALUES (?, ?, ?, ?, ?)")
        .bind(id, customerName, String(detailsObj.passport), String(detailsObj.nationality || "BHR"), now).run();

      const passenger = await db.prepare("SELECT id FROM passengers ORDER BY id DESC LIMIT 1").first();
      const passengerId = passenger ? passenger.id : 1;

      await db.prepare("INSERT INTO visa_applications (passenger_id, status, type, submitted_at) VALUES (?, ?, ?, ?)")
        .bind(passengerId, "pending", type === "umrah" ? "umrah" : "tourist", now).run();
    }

    return NextResponse.json({ id, saved: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Record could not be saved." }, { status: 500 });
  }
}
