import type { Context } from "@netlify/functions";

// In-memory store for booking records in Netlify's serverless environment.
// For production, replace with a real database (e.g., Netlify DB, PlanetScale, Supabase).
const allowedTypes = new Set(["flight", "umrah", "hotel", "travel"]);

export default async function handler(request: Request, _context: Context) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  }
  try {
    const body = await request.json() as Record<string, unknown>;
    const type = String(body.type || "");
    const customerName = String(body.customerName || "").trim().slice(0, 160);
    if (!allowedTypes.has(type) || !customerName) {
      return new Response(JSON.stringify({ error: "A valid booking type and customer name are required." }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const id = String(body.reference || `RHL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`).slice(0, 80);
    // Log the record to console (visible in Netlify function logs).
    // In production, persist this to a database.
    console.log(JSON.stringify({ id, type, status: "new", customerName, email: String(body.email || "").slice(0, 240), phone: String(body.phone || "").slice(0, 80), savedAt: new Date().toISOString() }));
    return new Response(JSON.stringify({ id, saved: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Record could not be saved." }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export const config = { path: "/api/records" };
