import { NextRequest, NextResponse } from "next/server";
const SOAP_URL = process.env.FLIGHT_API_URL || "http://test-api.xml.agency/SiteCity";
const escapeXml = (value: string) => value.replace(/[<>&'"]/g, (c) => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", "'":"&apos;", '"':"&quot;" })[c] || c);
const tag = (xml: string, name: string) => xml.match(new RegExp(`<(?:\\w+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:\\w+:)?${name}>`, "i"))?.[1]?.trim() || "";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { bookId?: string; bookGuid?: string; currency?: string };
    if (!body.bookId && !body.bookGuid) return NextResponse.json({ error: "Supplier booking identifiers are unavailable." }, { status: 400 });
    const login=process.env.FLIGHT_API_LOGIN||"test", password=process.env.FLIGHT_API_PASSWORD||"test", token=process.env.FLIGHT_API_TOKEN||"00000000-0000-0000-0000-000000000000", device=process.env.FLIGHT_API_DEVICE_ID||"test";
    const envelope=`<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"><s:Body><OrderInfo xmlns="http://tempuri.org/"><credentials xmlns:a="http://schemas.datacontract.org/2004/07/SiteCity.Common"><a:ApiLogin>${escapeXml(login)}</a:ApiLogin><a:ApiPassword>${escapeXml(password)}</a:ApiPassword><a:Currency>${escapeXml(body.currency||"USD")}</a:Currency><a:DeviceId>${escapeXml(device)}</a:DeviceId><a:Language>EN</a:Language><a:TokenGuid>${escapeXml(token)}</a:TokenGuid></credentials><orderInfoParams xmlns:a="http://schemas.datacontract.org/2004/07/SiteCity.BookInfo.OrderInfo"><a:BookGuid>${escapeXml(body.bookGuid||"00000000-0000-0000-0000-000000000000")}</a:BookGuid><a:BookId>${escapeXml(body.bookId||"0")}</a:BookId></orderInfoParams></OrderInfo></s:Body></s:Envelope>`;
    const response=await fetch(SOAP_URL,{method:"POST",headers:{"Content-Type":'application/soap+xml; charset=utf-8; action="http://tempuri.org/ISiteBookInfo/OrderInfo"'},body:envelope}); const xml=await response.text();
    if(tag(xml,"Success").toLowerCase()!=="true") return NextResponse.json({error:tag(xml,"ErrorString")||"Booking status is not available yet."},{status:409});
    return NextResponse.json({status:tag(xml,"BookingStatus")||"Unknown",pnr:tag(xml,"OriginPnr")||tag(xml,"PNR"),ticketNumber:tag(xml,"TicketNumber"),paid:tag(xml,"Payed").toLowerCase()==="true",deadline:tag(xml,"DeadLineDate")});
  } catch { return NextResponse.json({error:"Could not check the supplier booking status."},{status:502}); }
}
