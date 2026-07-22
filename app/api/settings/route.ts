import { NextResponse } from "next/server";
import { ensureDb } from "../../../db";

export async function GET() {
  try {
    const db = await ensureDb();
    const [row, templates, destinations] = await Promise.all([
      db.prepare("SELECT business_name AS businessName, whatsapp, facebook, instagram, x, linkedin, tiktok, youtube, snapchat FROM site_settings WHERE id = 1").first(),
      db.prepare("SELECT id, name, badge, nights, hotel, price, sort_order AS sortOrder FROM umrah_templates WHERE active = 1 ORDER BY sort_order, id").all(),
      db.prepare("SELECT place, country, tag, days, color, sort_order AS sortOrder FROM destinations ORDER BY sort_order, id").all(),
    ]);
    return NextResponse.json({ ...(row || {}), umrahTemplates: templates.results, destinations: destinations.results });
  } catch {
    return NextResponse.json({ businessName: "Rihla" });
  }
}
