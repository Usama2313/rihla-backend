import { NextRequest, NextResponse } from "next/server";

const SOAP_URL = process.env.FLIGHT_API_URL || "http://test-api.xml.agency/SiteCity";
const escapeXml = (value: string) => value.replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char] || char);
const tag = (xml: string, name: string) => xml.match(new RegExp(`<(?:\\w+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:\\w+:)?${name}>`, "i"))?.[1]?.trim() || "";
const supplierDate = (value: string) => { const [year, month, day] = value.split("-"); return `${day}.${month}.${year}`; };
type Passenger = { givenName?: string; surname?: string; birthDate?: string; nationality?: string; passport?: string; passportExpiry?: string; gender?: string };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { offerCode?: string; searchGuid?: string; currency?: string; email?: string; phone?: string; passengers?: Passenger[] };
    const displayCurrency = String(body.currency || "USD").toUpperCase();
    // XML Agency accepts AeroBook reservations in EUR even when AeroSearch and
    // AeroPrebook returned a fare in another display currency.
    const currency = "EUR";
    if (!body.offerCode || !/^[0-9a-f-]{36}$/i.test(body.searchGuid || "") || !body.email || !body.phone || !body.passengers?.length) return NextResponse.json({ error: "Complete all passenger and contact details." }, { status: 400 });
    body.phone = body.phone.replace(/[\s()-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(body.phone)) return NextResponse.json({ error: "Phone must include the international country code, for example +97334451249." }, { status: 400 });
    if (body.passengers.some((p) => !p.givenName || !p.surname || !p.birthDate || !/^[A-Z]{3}$/i.test(p.nationality || "") || !p.passport || !p.passportExpiry || !["Male", "Female"].includes(p.gender || ""))) return NextResponse.json({ error: "Passenger names, dates, passport, gender and three-letter nationality code are required." }, { status: 400 });
    const login = process.env.FLIGHT_API_LOGIN || "test", password = process.env.FLIGHT_API_PASSWORD || "test", token = process.env.FLIGHT_API_TOKEN || "00000000-0000-0000-0000-000000000000", device = process.env.FLIGHT_API_DEVICE_ID || "test";
    const pax = body.passengers.map((p) => `<b:PaxData><b:AgeType>Adult</b:AgeType><b:BirthDay>${supplierDate(p.birthDate!)}</b:BirthDay><b:BirthISO>${escapeXml(p.nationality!.toUpperCase())}</b:BirthISO><b:Document>${escapeXml(p.passport!)}</b:Document><b:DocumentExDate>${supplierDate(p.passportExpiry!)}</b:DocumentExDate><b:GenderType>${p.gender}</b:GenderType><b:MiddleName i:nil="true"/><b:Name>${escapeXml(p.givenName!)}</b:Name><b:Surname>${escapeXml(p.surname!)}</b:Surname></b:PaxData>`).join("");
    const reference = `RHL-${Date.now().toString().slice(-8)}`;
    const envelope = `<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"><s:Body><AeroBook xmlns="http://tempuri.org/"><credentials xmlns:a="http://schemas.datacontract.org/2004/07/SiteCity.Common" xmlns:i="http://www.w3.org/2001/XMLSchema-instance"><a:ApiLogin>${escapeXml(login)}</a:ApiLogin><a:ApiPassword>${escapeXml(password)}</a:ApiPassword><a:AuthExtendedData i:nil="true"/><a:Currency>${escapeXml(currency)}</a:Currency><a:DeviceId>${escapeXml(device)}</a:DeviceId><a:Language>EN</a:Language><a:TokenGuid>${escapeXml(token)}</a:TokenGuid></credentials><aeroBookParams xmlns:a="http://schemas.datacontract.org/2004/07/SiteCity.Avia.Booking" xmlns:i="http://www.w3.org/2001/XMLSchema-instance"><a:ClientReference>${reference}</a:ClientReference><a:CustomerFIO>${escapeXml(`${body.passengers[0].givenName} ${body.passengers[0].surname}`)}</a:CustomerFIO><a:Email>${escapeXml(body.email)}</a:Email><a:ExtendedParams i:nil="true"/><a:Marker i:nil="true"/><a:OfferCode>${escapeXml(body.offerCode)}</a:OfferCode><a:Partner i:nil="true"/><a:PaxList xmlns:b="http://schemas.datacontract.org/2004/07/SiteCity.Common">${pax}</a:PaxList><a:Phone>${escapeXml(body.phone)}</a:Phone><a:SearchGuid>${escapeXml(body.searchGuid || "")}</a:SearchGuid><a:SelectedServices i:nil="true" xmlns:b="http://schemas.microsoft.com/2003/10/Serialization/Arrays"/><a:SelectedTariffs i:nil="true" xmlns:b="http://schemas.microsoft.com/2003/10/Serialization/Arrays"/><a:Utm i:nil="true"/></aeroBookParams></AeroBook></s:Body></s:Envelope>`;
    const response = await fetch(SOAP_URL, { method: "POST", headers: { "Content-Type": 'application/soap+xml; charset=utf-8; action="http://tempuri.org/ISiteAvia/AeroBook"', Accept: "application/soap+xml" }, body: envelope });
    const xml = await response.text(), fault = tag(xml, "Fault");
    if (fault) return NextResponse.json({ error: tag(fault, "Description") || tag(fault, "Text") || "The supplier could not create the reservation." }, { status: 502 });
    if (tag(xml, "Success").toLowerCase() !== "true") return NextResponse.json({ error: tag(xml, "ErrorString") || "The supplier did not accept this reservation." }, { status: 409 });
    return NextResponse.json({ reference, bookId: tag(xml, "BookId"), bookGuid: tag(xml, "BookGuid"), supplierBookingId: tag(xml, "BookId") || tag(xml, "BookGuid"), pnr: tag(xml, "OriginPNR") || tag(xml, "PNR"), price: Number(tag(xml, "Price") || tag(xml, "FullPrice")), currency: tag(xml, "Currency") || currency, displayCurrency, paymentUrl: tag(xml, "PaymentUrl") });
  } catch { return NextResponse.json({ error: "The supplier booking service is temporarily unavailable." }, { status: 502 }); }
}
