import { NextRequest, NextResponse } from "next/server";

const SOAP_URL = process.env.FLIGHT_API_URL || "http://test-api.xml.agency/SiteCity";
const DUFFEL_URL = "https://api.duffel.com/air/offer_requests?return_offers=true&supplier_timeout=12000";
const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char] || char);
const tag = (xml: string, name: string) => xml.match(new RegExp(`<(?:\\w+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:\\w+:)?${name}>`, "i"))?.[1]?.trim() || "";
const blocks = (xml: string, name: string) => [...xml.matchAll(new RegExp(`<(?:\\w+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:\\w+:)?${name}>`, "gi"))].map((match) => match[1]);
const flightOfferBlocks = (xml: string) => [...xml.matchAll(/<(?:\w+:)?FlightData>(?=[\s\S]{0,1000}<(?:\w+:)?OfferCode>)[\s\S]*?<\/(?:\w+:)?FlightData>/gi)].map((match) => match[0]);
const supplierDate = (value: string) => { const [year, month, day] = value.split("-"); return `${day}.${month}.${year}`; };

type SearchBody = { from?: string; to?: string; departure?: string; returnDate?: string; journeyType?: string; segments?: Array<{ from?: string; to?: string; date?: string }>; adults?: number; children?: number; infants?: number; cabin?: string; currency?: string };
type Offer = { offerCode: string; price: number; currency: string; airline: string; airlineCode?: string; supplier: string; flightNumber: string; departure: string; arrival: string; stops: number; baggage: string; cabin: string; bookable: boolean; liveMode: boolean };
type SourceStatus = { name: string; status: "connected" | "ready" | "external" | "unavailable"; offerCount: number; note: string };

const buildSlices = (body: SearchBody) => {
  if (body.journeyType === "Multi-city") return (body.segments || []).map((segment) => ({ origin: String(segment.from || "").toUpperCase(), destination: String(segment.to || "").toUpperCase(), departure_date: String(segment.date || "") }));
  const from = String(body.from || "").toUpperCase(); const to = String(body.to || "").toUpperCase();
  const slices = [{ origin: from, destination: to, departure_date: String(body.departure || "") }];
  if (body.journeyType === "Round trip" && body.returnDate) slices.push({ origin: to, destination: from, departure_date: body.returnDate });
  return slices;
};

async function searchXml(body: SearchBody): Promise<{ offers: Offer[]; currency: string; searchGuid: string; source: SourceStatus }> {
  try {
    const from = String(body.from || "").toUpperCase(); const to = String(body.to || "").toUpperCase();
    const adults = Number(body.adults || 1); const children = Number(body.children || 0); const infants = Number(body.infants || 0);
    const cabin = ["Econom", "Business", "PremiumEconomy", "First"].includes(body.cabin || "") ? body.cabin! : "Econom";
    const slices = buildSlices(body);
    const legs = slices.map((slice) => `<a:SearchFlight><a:Date>${supplierDate(slice.departure_date)}</a:Date><a:IATAFrom>${slice.origin}</a:IATAFrom><a:IATATo>${slice.destination}</a:IATATo></a:SearchFlight>`).join("");
    const envelope = `<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"><s:Body><AeroSearch xmlns="http://tempuri.org/"><credentials xmlns:a="http://schemas.datacontract.org/2004/07/SiteCity.Common" xmlns:i="http://www.w3.org/2001/XMLSchema-instance"><a:ApiLogin>test</a:ApiLogin><a:ApiPassword>test</a:ApiPassword><a:AuthExtendedData i:nil="true"/><a:Currency>${escapeXml(body.currency || "USD")}</a:Currency><a:DeviceId>test</a:DeviceId><a:Language>EN</a:Language><a:TokenGuid>00000000-0000-0000-0000-000000000000</a:TokenGuid></credentials><aeroSearchParams xmlns:a="http://schemas.datacontract.org/2004/07/SiteCity.Avia.Search" xmlns:i="http://www.w3.org/2001/XMLSchema-instance"><a:Adults>${adults}</a:Adults><a:Childs>${children}</a:Childs><a:ExtendedParams i:nil="true"/><a:FlightClass>${cabin}</a:FlightClass><a:Infants>${infants}</a:Infants><a:PartnerName i:nil="true"/><a:SearchFlights>${legs}</a:SearchFlights></aeroSearchParams></AeroSearch></s:Body></s:Envelope>`;
    const response = await fetch(SOAP_URL, { method: "POST", headers: { "Content-Type": 'application/soap+xml; charset=utf-8; action="http://tempuri.org/ISiteAvia/AeroSearch"', Accept: "application/soap+xml" }, body: envelope, signal: AbortSignal.timeout(25000) });
    const xml = await response.text();
    if (tag(xml, "Fault") || tag(xml, "Success").toLowerCase() !== "true") return { offers: [], currency: body.currency || "USD", searchGuid: "", source: { name: "XML Agency", status: "unavailable", offerCount: 0, note: tag(xml, "ErrorString") || "No XML fare returned" } };
    const currency = tag(xml, "Currency") || body.currency || "USD";
    const airlines = Object.fromEntries(blocks(tag(xml, "AirCompany"), "CodeValue").map((item) => [tag(item, "Code"), tag(item, "Value")]));
    const offers = flightOfferBlocks(xml).slice(0, 100).map((item) => { const offerSegments = blocks(item, "OfferSegment"); const first = offerSegments[0] || ""; const outbound = offerSegments.filter((segment) => tag(segment, "Rph") === "1"); const last = (outbound.length ? outbound : offerSegments).at(-1) || ""; const airlineCode = tag(first, "MarketingAirline"); return { offerCode: tag(item, "OfferCode"), price: Number(tag(item, "TotalPrice")), currency, airline: airlines[airlineCode] || airlineCode || "Airline", airlineCode, supplier: "XML Agency", flightNumber: tag(first, "FlightNum"), departure: tag(tag(first, "Departure"), "Date"), arrival: tag(tag(last, "Arrival"), "Date"), stops: Math.max(0, outbound.length - 1), baggage: `${tag(tag(first, "Baggage"), "Count") || "—"} ${tag(tag(first, "Baggage"), "BaggageType") || ""}`.trim(), cabin: tag(first, "FlightClass"), bookable: true, liveMode: true }; }).filter((offer) => offer.offerCode && offer.price);
    return { offers, currency, searchGuid: tag(xml, "SearchGuid"), source: { name: "XML Agency", status: "connected", offerCount: offers.length, note: offers.length ? "Live XML fares" : "No XML fare returned" } };
  } catch { return { offers: [], currency: body.currency || "USD", searchGuid: "", source: { name: "XML Agency", status: "unavailable", offerCount: 0, note: "XML supplier unavailable" } }; }
}

async function searchDuffel(body: SearchBody): Promise<{ offers: Offer[]; source: SourceStatus }> {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) return { offers: [], source: { name: "Duffel", status: "ready", offerCount: 0, note: "Ready for a Duffel access token" } };
  try {
    const passengers = [
      ...Array.from({ length: Number(body.adults || 1) }, () => ({ age: 30 })),
      ...Array.from({ length: Number(body.children || 0) }, () => ({ age: 8 })),
      ...Array.from({ length: Number(body.infants || 0) }, () => ({ age: 1 })),
    ];
    const cabinMap: Record<string, string> = { Econom: "economy", Business: "business", PremiumEconomy: "premium_economy", First: "first" };
    const response = await fetch(DUFFEL_URL, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", "Duffel-Version": "v2", Authorization: `Bearer ${token}` }, body: JSON.stringify({ data: { slices: buildSlices(body), passengers, cabin_class: cabinMap[body.cabin || "Econom"] || "economy", max_connections: 2 } }), signal: AbortSignal.timeout(18000) });
    const payload = await response.json() as { data?: { id?: string; live_mode?: boolean; offers?: Array<Record<string, unknown>> }; errors?: Array<{ message?: string }> };
    if (!response.ok || !payload.data) throw new Error(payload.errors?.[0]?.message || "Duffel search failed");
    const offers = (payload.data.offers || []).slice(0, 100).map((raw) => {
      const slices = (raw.slices || []) as Array<{ segments?: Array<{ marketing_carrier?: { iata_code?: string; name?: string }; operating_carrier?: { name?: string }; marketing_carrier_flight_number?: string; departing_at?: string; arriving_at?: string }> }>;
      const firstSlice = slices[0] || {}; const segments = firstSlice.segments || []; const first = segments[0] || {}; const last = segments.at(-1) || first;
      const owner = (raw.owner || {}) as { name?: string; iata_code?: string };
      const currency = String(raw.total_currency || body.currency || "USD");
      return { offerCode: String(raw.id || ""), price: Number(raw.total_amount || 0), currency, airline: first.operating_carrier?.name || owner.name || first.marketing_carrier?.name || "Airline", airlineCode: owner.iata_code || first.marketing_carrier?.iata_code || "", supplier: "Duffel", flightNumber: `${first.marketing_carrier?.iata_code || owner.iata_code || ""}${first.marketing_carrier_flight_number || ""}`, departure: String(first.departing_at || ""), arrival: String(last.arriving_at || ""), stops: Math.max(0, segments.length - 1), baggage: "Check Duffel fare details", cabin: String(raw.cabin_class || body.cabin || "Economy"), bookable: false, liveMode: Boolean(raw.live_mode ?? payload.data?.live_mode) };
    }).filter((offer) => offer.offerCode && offer.price);
    const live = offers.some((offer) => offer.liveMode);
    return { offers, source: { name: "Duffel", status: "connected", offerCount: offers.length, note: live ? "Live airline offers" : "Test offers — not ticketable" } };
  } catch (error) { return { offers: [], source: { name: "Duffel", status: "unavailable", offerCount: 0, note: error instanceof Error ? error.message : "Duffel unavailable" } }; }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SearchBody;
    const slices = buildSlices(body); const adults = Number(body.adults || 1); const children = Number(body.children || 0); const infants = Number(body.infants || 0);
    if (slices.length < 1 || slices.length > 6 || slices.some((slice) => !/^[A-Z]{3}$/.test(slice.origin) || !/^[A-Z]{3}$/.test(slice.destination) || slice.origin === slice.destination || !slice.departure_date)) return NextResponse.json({ error: "Enter valid, different three-letter IATA airport codes and dates for every flight." }, { status: 400 });
    if (adults < 1 || adults > 9 || children < 0 || children > 9 - adults || infants < 0 || infants > adults) return NextResponse.json({ error: "Please check the Adult, Child, and Infant numbers." }, { status: 400 });
    const [xml, duffel] = await Promise.all([searchXml(body), searchDuffel(body)]);
    const offers = [...xml.offers, ...duffel.offers].sort((a, b) => a.currency === b.currency ? a.price - b.price : a.currency.localeCompare(b.currency));
    const sources: SourceStatus[] = [xml.source, duffel.source, { name: "Baba Air", status: "external", offerCount: 0, note: "B2B portal connected; API credentials required for in-page rates" }];
    return NextResponse.json({ supplier: sources.filter((source) => source.status === "connected").map((source) => source.name).join(" + ") || "No connected fare source", currency: xml.currency || body.currency || "USD", searchGuid: xml.searchGuid, resultCount: offers.length, offers, sources });
  } catch { return NextResponse.json({ error: "The flight suppliers are temporarily unavailable. Please try again." }, { status: 502 }); }
}
