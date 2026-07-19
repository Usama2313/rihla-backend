import type { Context } from "@netlify/functions";

const SOAP_URL = process.env.FLIGHT_API_URL || "http://test-api.xml.agency/SiteCity";
const escapeXml = (value: string) => value.replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char] || char);
const tag = (xml: string, name: string) => xml.match(new RegExp(`<(?:\\w+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:\\w+:)?${name}>`, "i"))?.[1]?.trim() || "";

export default async function handler(request: Request, _context: Context) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  }
  try {
    const body = await request.json() as { offerCode?: string; searchGuid?: string; currency?: string };
    const currency = String(body.currency || "USD").toUpperCase();
    if (!body.offerCode || !/^[0-9a-f-]{36}$/i.test(body.searchGuid || "") || !/^[A-Z]{3}$/.test(currency)) {
      return new Response(JSON.stringify({ error: "This fare is no longer linked to a valid supplier search. Please search again." }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const login = process.env.FLIGHT_API_LOGIN || "test";
    const password = process.env.FLIGHT_API_PASSWORD || "test";
    const token = process.env.FLIGHT_API_TOKEN || "00000000-0000-0000-0000-000000000000";
    const device = process.env.FLIGHT_API_DEVICE_ID || "test";
    const envelope = `<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"><s:Body><AeroPrebook xmlns="http://tempuri.org/"><credentials xmlns:a="http://schemas.datacontract.org/2004/07/SiteCity.Common" xmlns:i="http://www.w3.org/2001/XMLSchema-instance"><a:ApiLogin>${escapeXml(login)}</a:ApiLogin><a:ApiPassword>${escapeXml(password)}</a:ApiPassword><a:AuthExtendedData i:nil="true"/><a:Currency>${escapeXml(currency)}</a:Currency><a:DeviceId>${escapeXml(device)}</a:DeviceId><a:Language>EN</a:Language><a:TokenGuid>${escapeXml(token)}</a:TokenGuid></credentials><aeroPrebookParams xmlns:a="http://schemas.datacontract.org/2004/07/SiteCity.Avia.Prebook" xmlns:i="http://www.w3.org/2001/XMLSchema-instance"><a:OfferCode>${escapeXml(body.offerCode)}</a:OfferCode><a:SearchGuid>${escapeXml(body.searchGuid || "")}</a:SearchGuid></aeroPrebookParams></AeroPrebook></s:Body></s:Envelope>`;
    const response = await fetch(SOAP_URL, { method: "POST", headers: { "Content-Type": 'application/soap+xml; charset=utf-8; action="http://tempuri.org/ISiteAvia/AeroPrebook"', Accept: "application/soap+xml" }, body: envelope });
    const xml = await response.text();
    const fault = tag(xml, "Fault");
    if (fault) return new Response(JSON.stringify({ error: tag(fault, "Description") || tag(fault, "Text") || "The supplier could not revalidate this fare." }), { status: 502, headers: { "Content-Type": "application/json" } });
    if (tag(xml, "Success").toLowerCase() !== "true") return new Response(JSON.stringify({ error: tag(xml, "ErrorString") || "This fare is no longer available. Please search again." }), { status: 409, headers: { "Content-Type": "application/json" } });
    const result = {
      available: true,
      currency: tag(xml, "Currency") || currency,
      price: Number(tag(xml, "FullPrice")),
      offerCode: tag(xml, "OfferCode") || body.offerCode,
      searchGuid: tag(xml, "SearchGuid") || body.searchGuid,
    };
    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ error: "The supplier is temporarily unavailable. Please try again." }), { status: 502, headers: { "Content-Type": "application/json" } });
  }
}

export const config = { path: "/api/flights/prebook" };
