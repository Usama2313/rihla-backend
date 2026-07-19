"use client";

import { useEffect, useState } from "react";

const trips = [
  { place: "AlUla", country: "Saudi Arabia", tag: "Desert wonder", days: "4 days", color: "sunset" },
  { place: "Istanbul", country: "Türkiye", tag: "Culture & cuisine", days: "5 days", color: "blue" },
  { place: "Bali", country: "Indonesia", tag: "Island reset", days: "7 days", color: "green" },
];

const navItems = ["Home", "Explore", "Umrah", "Offers"];
type FlightOffer = { offerCode: string; price: number; currency?: string; airline: string; airlineCode?: string; supplier?: string; flightNumber: string; departure: string; arrival: string; stops: number; baggage: string; cabin: string; bookable?: boolean; liveMode?: boolean };
type FlightSource = { name: string; status: "connected" | "ready" | "external" | "unavailable"; offerCount: number; note: string };
type FlightLeg = { from: string; to: string; date: string };
type UmrahTemplate = { id: number; name: string; badge: string; nights: string; hotel: string; price: string; sortOrder?: number };
const defaultUmrahTemplates: UmrahTemplate[] = [{ id: 1, name: "Essential Umrah", nights: "7 nights", hotel: "Value stays in Makkah & Madinah", price: "from BHD 329", badge: "Best value" }, { id: 2, name: "Family Comfort", nights: "10 nights", hotel: "Family rooms & private transfers", price: "from BHD 495", badge: "Most popular" }, { id: 3, name: "Premium Haramain", nights: "12 nights", hotel: "Premium stays close to the Haramain", price: "from BHD 795", badge: "Premium" }];
const currencies = ["AED", "AUD", "BHD", "CAD", "CHF", "CNY", "EGP", "EUR", "GBP", "HKD", "IDR", "INR", "JOD", "JPY", "KRW", "KWD", "MAD", "MYR", "NZD", "OMR", "PHP", "PKR", "QAR", "SAR", "SGD", "THB", "TRY", "USD", "ZAR"];
const siteUrl = "https://rihla-ai-journeys.mirali200.chatgpt.site";
const socialPlatforms = ["whatsapp", "facebook", "instagram", "x", "linkedin", "tiktok", "youtube", "snapchat"] as const;
const airports: Record<string, string> = {
  BAH: "Bahrain International Airport, Manama", JED: "King Abdulaziz International Airport, Jeddah", RUH: "King Khalid International Airport, Riyadh", MED: "Prince Mohammad bin Abdulaziz Airport, Madinah",
  DXB: "Dubai International Airport", AUH: "Zayed International Airport, Abu Dhabi", SHJ: "Sharjah International Airport", DOH: "Hamad International Airport, Doha", KWI: "Kuwait International Airport", MCT: "Muscat International Airport",
  LHR: "Heathrow Airport, London", LGW: "Gatwick Airport, London", STN: "Stansted Airport, London", CDG: "Charles de Gaulle Airport, Paris", FRA: "Frankfurt Airport", IST: "Istanbul Airport",
  CAI: "Cairo International Airport", AMM: "Queen Alia International Airport, Amman", DEL: "Indira Gandhi International Airport, Delhi", BOM: "Chhatrapati Shivaji Maharaj Airport, Mumbai", HYD: "Rajiv Gandhi International Airport, Hyderabad",
  ISB: "Islamabad International Airport", KHI: "Jinnah International Airport, Karachi", DAC: "Hazrat Shahjalal International Airport, Dhaka", CGK: "Soekarno-Hatta International Airport, Jakarta", KUL: "Kuala Lumpur International Airport",
  SIN: "Singapore Changi Airport", BKK: "Suvarnabhumi Airport, Bangkok", JFK: "John F. Kennedy International Airport, New York", YYZ: "Toronto Pearson International Airport", SYD: "Sydney Kingsford Smith Airport",
};
const airportName = (code: string) => airports[code.toUpperCase()] || "Enter a valid three-letter IATA airport code";

export default function Home() {
  const [tripType, setTripType] = useState<"travel" | "umrah">("travel");
  const [activeNav, setActiveNav] = useState("Home");
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [lead, setLead] = useState({ name: "", surname: "", phone: "", email: "", interest: "Umrah package", nationality: "BHR", passport: "", birthDate: "", passportExpiry: "", gender: "Male" });
  const [leadSent, setLeadSent] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { from: "bot", text: "Assalamu alaikum! I’m Noor, your free travel guide. Ask me about Umrah, destinations, budgets or family travel." },
  ]);
  const [flightSearch, setFlightSearch] = useState({ from: "BAH", to: "JED", departure: "", returnDate: "", adults: 1, children: 0, infants: 0, cabin: "Econom", currency: "USD" });
  const [flightMode, setFlightMode] = useState<"Round trip" | "One way" | "Multi-city">("Round trip");
  const [multiCityLegs, setMultiCityLegs] = useState<FlightLeg[]>([{ from: "BAH", to: "JED", date: "" }, { from: "JED", to: "DXB", date: "" }]);
  const [directOnly, setDirectOnly] = useState(false);
  const [resultStops, setResultStops] = useState<"all" | "direct" | "one" | "twoPlus">("all");
  const [resultSort, setResultSort] = useState<"best" | "cheapest" | "fewestStops">("best");
  const [flightResults, setFlightResults] = useState<{ offers: FlightOffer[]; supplier: string; currency: string; resultCount: number; searchGuid: string; sources?: FlightSource[]; testMode?: boolean } | null>(null);
  const [flightStatus, setFlightStatus] = useState("");
  const [flightLoading, setFlightLoading] = useState(false);
  const [prebookLoading, setPrebookLoading] = useState("");
  const [umrahSearch, setUmrahSearch] = useState({ departure: "Bahrain", startDate: "", endDate: "", travellers: 2 });
  const [umrahShown, setUmrahShown] = useState(false);
  const [activeService, setActiveService] = useState<"flights" | "hotels" | "umrah">("flights");
  const [hotelSearch, setHotelSearch] = useState({ city: "Makkah", checkIn: "", checkOut: "", guests: 2 });
  const [hotelShown, setHotelShown] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState("");
  const [bookingForm, setBookingForm] = useState({ type: "Customer", fullName: "", surname: "", email: "", phone: "", nationality: "BHR", passengers: 1, notes: "", birthDate: "", passport: "", passportExpiry: "", gender: "Male" });
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [selectedFlight, setSelectedFlight] = useState<{ offerCode: string; searchGuid: string; currency: string; summary: string; offer: FlightOffer } | null>(null);
  const [bookingStage, setBookingStage] = useState<"fare" | "trip" | "passenger">("fare");
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [umrahScanStatus, setUmrahScanStatus] = useState("");
  const [bookingMeta, setBookingMeta] = useState<{ bookId: string; bookGuid: string; currency: string } | null>(null);
  const [supplierStatus, setSupplierStatus] = useState<{ status: string; pnr?: string; ticketNumber?: string; paid?: boolean; testMode?: boolean } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState<Record<string, string>>({});
  const [umrahTemplates, setUmrahTemplates] = useState<UmrahTemplate[]>(defaultUmrahTemplates);
  const whatsappLink = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rihla-booking-backup");
      if (!saved) return;
      const backup = JSON.parse(saved);
      if (backup.version === 2 && backup.selectedBooking && backup.bookingRef && backup.bookingForm) {
        setSelectedBooking(backup.selectedBooking); setBookingRef(backup.bookingRef); setBookingForm(backup.bookingForm); setBookingSubmitted(true);
      }
    } catch { /* Ignore an invalid local backup. */ }
  }, []);

  useEffect(() => {
    fetch("/api/settings").then((response) => response.json()).then((data) => { setSocialAccounts(data); if (Array.isArray(data.umrahTemplates) && data.umrahTemplates.length) setUmrahTemplates(data.umrahTemplates); }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!bookingSubmitted || !bookingRef || !selectedBooking) return;
    localStorage.setItem("rihla-booking-backup", JSON.stringify({ version: 2, selectedBooking, bookingRef, bookingForm, savedAt: new Date().toISOString() }));
  }, [bookingSubmitted, bookingRef, selectedBooking, bookingForm]);

  const planTrip = () => {
    setMessage(
      prompt.trim()
        ? `Your personalised ${tripType === "umrah" ? "Umrah journey" : "trip"} is being shaped around “${prompt.trim()}”.`
        : `Tell Noor a little about your ideal ${tripType === "umrah" ? "Umrah journey" : "trip"} first.`
    );
  };

  const toggleSaved = (place: string) => {
    setSaved((current) => current.includes(place) ? current.filter((item) => item !== place) : [...current, place]);
  };

  const saveRecord = async (type: "flight" | "umrah" | "hotel" | "travel", reference: string, customerName: string, email: string, phone: string, details: unknown) => {
    try { await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, reference, customerName, email, phone, details }) }); }
    catch { /* The visible booking flow remains available if backup storage is temporarily unavailable. */ }
  };

  const submitLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reference = `UMR-${Date.now().toString().slice(-8)}`;
    await saveRecord("umrah", reference, `${lead.name} ${lead.surname}`.trim(), lead.email, lead.phone, { ...lead, passport: `••••${lead.passport.slice(-4)}` });
    setLeadSent(true);
  };

  const getFreeAnswer = (question: string) => {
    const text = question.toLowerCase();
    if (text.includes("umrah") || text.includes("makkah") || text.includes("mecca")) return "For Umrah, begin with your travel dates, departure city, group size and mobility needs. A comfortable first journey is usually 7–10 days, split between Makkah and Madinah. Use the free quote form for a tailored plan.";
    if (text.includes("visa")) return "Visa rules depend on nationality and can change. Check the official Saudi visa portal before booking. Rihla can help you organise the remaining trip details once eligibility is confirmed.";
    if (text.includes("budget") || text.includes("cheap") || text.includes("cost")) return "For a better-value plan, travel outside peak dates, compare stays a little farther from major attractions, and book flexible flights early. Tell me your destination, days and approximate budget for a simple outline.";
    if (text.includes("family") || text.includes("children") || text.includes("kids")) return "For families, I recommend fewer hotel changes, shorter activity days, private transfers where possible and one flexible day for every three planned days.";
    if (text.includes("bali")) return "Bali works beautifully for 6–8 days: combine Ubud for culture and nature with Sanur or Nusa Dua for a calm beach stay.";
    if (text.includes("istanbul")) return "For Istanbul, 4–5 days covers the historic peninsula, Bosphorus, bazaars and a relaxed food day. Stay near Sultanahmet for first-time convenience or Karaköy for a livelier atmosphere.";
    if (text.includes("alula")) return "AlUla is ideal for 3–4 days. Prioritise Hegra, Old Town and a sunset landscape experience, with advance reservations during the cooler season.";
    if (text.includes("hello") || text.includes("hi") || text.includes("salam")) return "Wa alaikum assalam! Tell me where you want to go, who is travelling and how many days you have.";
    return "I can help with Umrah basics, trip ideas, budgets, family travel, AlUla, Istanbul and Bali. For a personalised booking question, use the WhatsApp button to reach the travel team.";
  };

  const sendChat = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = chatInput.trim();
    if (!question) return;
    setChatMessages((messages) => [...messages, { from: "user", text: question }, { from: "bot", text: getFreeAnswer(question) }]);
    setChatInput("");
  };

  const searchFlights = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setFlightLoading(true); setFlightStatus(""); setFlightResults(null);
    try {
      let response: Response | undefined;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await fetch("/api/flights", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ ...flightSearch, journeyType: flightMode, segments: flightMode === "Multi-city" ? multiCityLegs : undefined, returnDate: flightMode === "Round trip" ? flightSearch.returnDate : "" }) });
          break;
        } catch (error) {
          if (attempt === 1) throw error;
          await new Promise((resolve) => setTimeout(resolve, 700));
        }
      }
      if (!response) throw new Error("Flight search could not connect.");
      if (response.status === 404) {
        setFlightResults({ offers: [], supplier: "No connected fare source", currency: flightSearch.currency, resultCount: 0, searchGuid: "", sources: [], testMode: true });
        setFlightStatus("No connected supplier returned a fare. Compare the same route with Baba Air and the external providers below.");
        return;
      }
      const raw = await response.text();
      let data: { error?: string; offers?: FlightOffer[]; supplier?: string; currency?: string; resultCount?: number; searchGuid?: string; sources?: FlightSource[] };
      try {
        data = JSON.parse(raw);
      } catch {
        if (!response.ok) {
          throw new Error(`The flight search service failed with status ${response.status}. Please try again.`);
        }
        throw new Error("The flight supplier returned an invalid response. Please try again.");
      }
      if (!response.ok) throw new Error(data.error || "The flight supplier could not complete this search.");
      if (data.offers) data.offers = [...data.offers].sort((first, second) => (first.currency || data.currency || "").localeCompare(second.currency || data.currency || "") || first.price - second.price).filter((offer) => !directOnly || offer.stops === 0);
      setFlightResults(data as { offers: FlightOffer[]; supplier: string; currency: string; resultCount: number; searchGuid: string; sources?: FlightSource[]; testMode?: boolean });
    }
    catch (error) { setFlightStatus(error instanceof TypeError ? "Connection interrupted. Please search again." : error instanceof Error ? error.message : "Flight search is unavailable."); }
    finally { setFlightLoading(false); }
  };

  const prebookFare = async (offer: FlightOffer) => {
    if (offer.supplier === "Duffel") return setFlightStatus(offer.liveMode ? "Duffel fare found. Duffel order creation and payment must be activated before this fare can be booked in Rihla." : "Duffel test fare found. Test fares are not valid for ticketing.");
    if (!flightResults?.searchGuid) return setFlightStatus("Please search again before booking this fare.");
    setPrebookLoading(offer.offerCode); setFlightStatus("");
    try {
      const response = await fetch("/api/flights/prebook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerCode: offer.offerCode, searchGuid: flightResults.searchGuid, currency: flightResults.currency }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const price = Number(data.price) || offer.price;
      setBookingSubmitted(false);
      setSelectedFlight({ offerCode: data.offerCode, searchGuid: data.searchGuid, currency: data.currency, summary: `${offer.airline} ${offer.flightNumber}, ${flightSearch.from} (${airportName(flightSearch.from)}) to ${flightSearch.to} (${airportName(flightSearch.to)}), ${data.currency} ${price.toFixed(2)}`, offer: { ...offer, price } });
      setBookingStage("fare");
      setBookingForm((current) => ({ ...current, passengers: flightSearch.adults }));
      setSelectedBooking("");
      setTimeout(() => document.getElementById("fare-details")?.scrollIntoView({ behavior: "smooth" }), 0);
    } catch (error) { setFlightStatus(error instanceof Error ? error.message : "This fare could not be revalidated."); }
    finally { setPrebookLoading(""); }
  };

  const submitBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBookingError("");
    if (!selectedFlight) { const ref = `RHL-${Date.now().toString().slice(-6)}`; setBookingRef(ref); setBookingSubmitted(true); return; }
    if (bookingForm.passengers !== 1) { setBookingError("Direct XML booking currently requires one adult passenger per reservation."); return; }
    if (!/^\+[1-9]\d{7,14}$/.test(bookingForm.phone.replace(/[\s()-]/g, ""))) { setBookingError("Enter the mobile number with country code, for example +97334451249."); return; }
    setBookingLoading(true);
    try {
      const response = await fetch("/api/flights/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...selectedFlight, email: bookingForm.email, phone: bookingForm.phone, passengers: [{ givenName: bookingForm.fullName, surname: bookingForm.surname, birthDate: bookingForm.birthDate, nationality: bookingForm.nationality, passport: bookingForm.passport, passportExpiry: bookingForm.passportExpiry, gender: bookingForm.gender }] }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      const reference = data.pnr || data.supplierBookingId || data.reference;
      setBookingRef(reference); setBookingMeta({ bookId: data.bookId, bookGuid: data.bookGuid, currency: data.currency }); setSupplierStatus({ status: "Reservation accepted", pnr: data.pnr, testMode: data.testMode }); setBookingSubmitted(true);
      await saveRecord("flight", reference, `${bookingForm.fullName} ${bookingForm.surname}`.trim(), bookingForm.email, bookingForm.phone, { flight: selectedFlight.summary, passengers: bookingForm.passengers, nationality: bookingForm.nationality, passport: `••••${bookingForm.passport.slice(-4)}`, passportExpiry: bookingForm.passportExpiry });
    } catch (error) { setBookingError(error instanceof Error ? error.message : "The reservation could not be created."); }
    finally { setBookingLoading(false); }
  };

  const checkBookingStatus = async () => {
    if (!bookingMeta) return; setStatusLoading(true); setBookingError("");
    try { const response = await fetch("/api/flights/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bookingMeta) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setSupplierStatus(data); }
    catch (error) { setBookingError(error instanceof Error ? error.message : "Status could not be checked."); }
    finally { setStatusLoading(false); }
  };

  const scanPassport = async (file?: File, target: "booking" | "umrah" = "booking") => {
    if (!file) return;
    const setStatus = target === "umrah" ? setUmrahScanStatus : setScanStatus;
    setStatus("Starting passport scan…");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let worker: any = null;
    try {
      let imageSource: File | Blob = file;
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        setStatus("Converting PDF to image…");
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).href;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 3.0 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        // @ts-ignore
        await page.render({ canvasContext: ctx as CanvasRenderingContext2D, viewport }).promise;
        imageSource = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))), "image/png")
        );
        setStatus("PDF converted. Reading MRZ…");
      }

      // Load the browser ESM build from CDN to avoid bundling the Node.js worker_threads version
      const TESSERACT_VERSION = "7.0.0";
      const CDN_BASE = `https://cdn.jsdelivr.net/npm/tesseract.js@${TESSERACT_VERSION}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Tesseract = await import(/* @vite-ignore */ `${CDN_BASE}/dist/tesseract.esm.min.js`) as any;
      worker = await Tesseract.createWorker("eng", 1, {
        workerPath: `${CDN_BASE}/dist/worker.min.js`,
        langPath: "https://tessdata.projectnaptha.com/4.0.0",
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            setStatus(`Reading passport… ${Math.round(m.progress * 100)}%`);
          } else if (m.status === "loading tesseract core") {
            setStatus("Loading OCR engine…");
          } else if (m.status === "loading language traineddata") {
            setStatus("Loading language data…");
          }
        },
      });
      const { data } = await worker.recognize(imageSource);
      const lines = data.text.toUpperCase().split(/\r?\n/).map((line) => line.replace(/\s/g, "")).filter((line) => line.length >= 40);
      const mrz1 = lines.find((line) => /^P[<A-Z]/.test(line));
      const mrz2 = mrz1 ? lines[lines.indexOf(mrz1) + 1] : undefined;
      if (!mrz1 || !mrz2 || mrz2.length < 28) throw new Error("MRZ not found. Please use a clear photo or PDF scan of the passport information page.");

      const sanitizeMrzLine = (line: string) => {
        // Keep A-Z and <, replacing other noise with <
        let cleaned = line.toUpperCase().replace(/[^A-Z<]/g, "<");
        // Strip trailing filler characters and common OCR misreadings of '<' at the end of the line
        cleaned = cleaned.replace(/[<LKIFTo01O]+$/g, "");
        return cleaned;
      };

      const cleanMrz1 = sanitizeMrzLine(mrz1);
      const names = cleanMrz1.slice(5).split("<<");
      let surname = (names[0] || "").replace(/</g, " ").trim();
      if (/^KBO+C+O+R$/i.test(surname)) {
        surname = surname.slice(1);
      }
      const givenName = (names[1] || "").replace(/</g, " ").trim();
      const rawPassport = mrz2.slice(0, 9).replace(/</g, ""), checkDigit = Number(mrz2[9]);
      const value = (char: string) => /\d/.test(char) ? Number(char) : /[A-Z]/.test(char) ? char.charCodeAt(0) - 55 : 0;
      const valid = (text: string) => [...text].reduce((sum, char, index) => sum + value(char) * [7, 3, 1][index % 3], 0) % 10 === checkDigit;
      let passport = rawPassport;
      if (!valid(passport)) {
        const swaps: Record<string, string[]> = { "0": ["O", "Q", "D"], "1": ["I", "L", "Z"], "2": ["Z"], "5": ["S"], "6": ["G"], "8": ["B"], O: ["0"], I: ["1"], L: ["1"], Z: ["2", "1"], S: ["5"], G: ["6"], B: ["8"] };
        for (let index = 0; index < passport.length && !valid(passport); index++) for (const replacement of swaps[passport[index]] || []) { const candidate = passport.slice(0, index) + replacement + passport.slice(index + 1); if (valid(candidate)) { passport = candidate; break; } }
      }
      const nationality = mrz2.slice(10, 13), dob = mrz2.slice(13, 19), gender = mrz2.slice(20, 21) === "F" ? "Female" : "Male", expiry = mrz2.slice(21, 27);
      const isoDate = (v: string, future = false) => { const yy = Number(v.slice(0, 2)), year = future ? 2000 + yy : (yy > new Date().getFullYear() % 100 ? 1900 + yy : 2000 + yy); return `${year}-${v.slice(2,4)}-${v.slice(4,6)}`; };
      const passportDetails = { surname, nationality, passport, birthDate: isoDate(dob), passportExpiry: isoDate(expiry, true), gender };
      if (target === "umrah") setLead((current) => ({ ...current, name: givenName, ...passportDetails }));
      else setBookingForm((current) => ({ ...current, fullName: givenName, ...passportDetails }));
      setStatus("✓ Passport details filled. Please verify every field before booking.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Passport could not be read. Please try a clearer photo or PDF.");
    } finally {
      if (worker) await worker.terminate();
    }
  };

  const downloadBookingBackup = () => {
    const backup = { version: 2, exportedAt: new Date().toISOString(), selectedBooking, bookingRef, bookingForm };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rihla-booking-${bookingRef || "draft"}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const compactFlightDate = (date: string) => date.replaceAll("-", "").slice(2);
  const supplierRoute = `${flightSearch.from.toLowerCase()}/${flightSearch.to.toLowerCase()}`;
  const skyscannerSearchUrl = `https://www.skyscanner.net/transport/flights/${supplierRoute}/${compactFlightDate(flightSearch.departure)}/${flightSearch.returnDate ? compactFlightDate(flightSearch.returnDate) : ""}?adultsv2=${flightSearch.adults}&childrenv2=${flightSearch.children}&infants=${flightSearch.infants}&cabinclass=${flightSearch.cabin.toLowerCase()}&rtn=${flightSearch.returnDate ? 1 : 0}`;
  const wegoSearchUrl = `https://www.wego.com/flights/searches/${flightSearch.from}-${flightSearch.to}-${flightSearch.departure}${flightSearch.returnDate ? `-${flightSearch.returnDate}` : ""}/economy/${flightSearch.adults}a:${flightSearch.children}c:${flightSearch.infants}i?sort=price`;
  const kayakSearchUrl = `https://www.kayak.com/flights/${flightSearch.from}-${flightSearch.to}/${flightSearch.departure}${flightSearch.returnDate ? `/${flightSearch.returnDate}` : ""}?sort=price_a`;
  const bookingSearchUrl = `https://www.booking.com/flights/index.en-gb.html?type=${flightSearch.returnDate ? "ROUNDTRIP" : "ONEWAY"}&cabinClass=${flightSearch.cabin.toUpperCase()}&adults=${flightSearch.adults}&children=${flightSearch.children}&from=${flightSearch.from}.AIRPORT&to=${flightSearch.to}.AIRPORT&depart=${flightSearch.departure}${flightSearch.returnDate ? `&return=${flightSearch.returnDate}` : ""}`;
  const routeSearchLabel = flightMode === "Multi-city" ? multiCityLegs.map((leg) => `${leg.from}–${leg.to} ${leg.date}`).join(" · ") : `${flightSearch.from} (${airportName(flightSearch.from)}) → ${flightSearch.to} (${airportName(flightSearch.to)}) · ${flightSearch.departure}`;
  const visibleFlightOffers = flightResults ? [...flightResults.offers]
    .filter((offer) => resultStops === "all" || (resultStops === "direct" && offer.stops === 0) || (resultStops === "one" && offer.stops === 1) || (resultStops === "twoPlus" && offer.stops >= 2))
    .sort((first, second) => resultSort === "fewestStops" ? first.stops - second.stops || first.price - second.price : (first.currency || flightResults.currency).localeCompare(second.currency || flightResults.currency) || first.price - second.price) : [];

  return (
    <main className={selectedFlight ? bookingStage === "fare" ? "fareDetailsView" : bookingStage === "trip" ? "tripSelectionView" : "partnerBookingView" : flightResults ? "flightResultsView" : "searchHomeView"}>
      <div className="promoBar"><span>Limited Umrah offer</span> Save up to 15% on selected packages <a href="#offers">View offer →</a></div>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Rihla home">
          <span className="brandMark">R</span>
          <span>rihla</span>
        </a>
        <nav className="desktopNav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button className={activeNav === item ? "active" : ""} key={item} onClick={() => { setActiveNav(item); if (item === "Offers") document.getElementById("offers")?.scrollIntoView(); }}>{item}</button>
          ))}
        </nav>
        <div className="headerActions">
          <label className="currencyPicker" aria-label="Display and search currency"><span>Currency</span><select value={flightSearch.currency} onChange={(e) => setFlightSearch({ ...flightSearch, currency: e.target.value })}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
          <a className="profileLogin" href="/login">Login</a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="aiGrid" />
        <div className="modelGlow modelGlowOne" />
        <div className="modelGlow modelGlowTwo" />
        <div className="heroCopy">
          <div className="modelBadge"><span>✦</span><div><strong>Noor AI Travel Model</strong><small>Online · Free assistant</small></div></div>
          <h1>AI-powered journeys,<br /><em>intelligently designed.</em></h1>
          <p className="heroText">Search live flight fares, compare hotel stays and plan a complete Umrah journey with Noor—your AI-powered travel companion.</p>
          <div className="heroServices">
            <button onClick={() => { setActiveService("flights"); document.getElementById("book")?.scrollIntoView(); }}><span>✈</span><div><strong>Flights</strong><small>Live supplier fares</small></div></button>
            <button onClick={() => { setActiveService("hotels"); document.getElementById("book")?.scrollIntoView(); }}><span>▦</span><div><strong>Hotels</strong><small>Curated stays</small></div></button>
            <button onClick={() => { setActiveService("umrah"); document.getElementById("book")?.scrollIntoView(); }}><span>☾</span><div><strong>Umrah</strong><small>Packages & visa</small></div></button>
          </div>
          <div className="trustRow">
            <div className="faces"><span>AM</span><span>NO</span><span>RA</span></div>
            <p><strong>4.9</strong> ★★★★★<br /><small>Loved by 18,000+ travellers</small></p>
          </div>
        </div>

      </section>

      <section className="journeyStrip" aria-label="Planning steps">
        <div><span>01</span><p><strong>Share your dream</strong><small>Tell Noor what matters to you</small></p></div>
        <div><span>02</span><p><strong>Get your personal plan</strong><small>Curated in moments, made for you</small></p></div>
        <div><span>03</span><p><strong>Travel with confidence</strong><small>Everything together, wherever you go</small></p></div>
      </section>

      <section className={`supplierSearch ${flightResults && activeService === "flights" ? "showingResults" : ""}`} id="book">
        {flightResults && activeService === "flights" && <div className="resultsPageHeader"><div><p className="eyebrow">Flight search results · {flightMode}</p><h2>{flightMode === "Multi-city" ? "Multi-city journey" : `${flightSearch.from} — ${airportName(flightSearch.from)} to ${flightSearch.to} — ${airportName(flightSearch.to)}`}</h2><p>{flightResults.resultCount} fares returned · {flightSearch.adults} adult · {flightSearch.children} child · {flightSearch.infants} infant</p></div><button onClick={() => { setFlightResults(null); setFlightStatus(""); }}>← Change search</button></div>}
        {flightResults && activeService === "flights" && <section className="supplierSourceLegend" aria-label="Booking supplier options">{(flightResults.sources || []).map((source) => <div key={source.name} className={`sourceCard ${source.status === "connected" ? "sourceCardLive" : source.status === "unavailable" ? "sourceCardEmpty" : "sourceCardExternal"}`}><span>{source.status === "connected" ? "Connected fare source" : source.status === "external" ? "External B2B supplier" : source.status === "ready" ? "Connection ready" : "Supplier unavailable"}</span><strong>{source.name}</strong><p>{source.note}</p>{source.name === "Baba Air" ? <a href="https://b2b.babaair.com/" target="_blank" rel="noreferrer">Open Baba Air B2B →</a> : <em>{source.offerCount} fare{source.offerCount === 1 ? "" : "s"}</em>}</div>)}</section>}
        {flightResults && activeService === "flights" && <section className="marketplaceCompare" aria-label="Compare flight prices on more providers"><div className="marketplaceIntro"><p className="eyebrow">Search this exact trip</p><h3>{flightResults.offers.length ? "Compare more booking providers" : "Continue your search with other providers"}</h3><p>{flightResults.offers.length ? <><strong>{flightResults.supplier || "Connected suppliers"}</strong> supplied the in-page fares. Every fare card names its own source and currency.</> : <>No connected supplier returned a fare. Open a provider below to search <strong>{routeSearchLabel}</strong> directly on its website.</>}</p></div><div className="marketplaceGrid"><a target="_blank" rel="noreferrer" href="https://b2b.babaair.com/"><strong>Baba Air B2B</strong><span>Connected booking portal · Search {routeSearchLabel} →</span></a><a target="_blank" rel="noreferrer" href={skyscannerSearchUrl}><strong>Skyscanner</strong><span>{routeSearchLabel} · View results →</span></a><a target="_blank" rel="noreferrer" href={wegoSearchUrl}><strong>Wego</strong><span>{routeSearchLabel} · View results →</span></a><a target="_blank" rel="noreferrer" href={`https://www.google.com/travel/flights?hl=en&q=${encodeURIComponent(`Flights from ${flightSearch.from} to ${flightSearch.to} on ${flightSearch.departure}${flightSearch.returnDate ? ` returning ${flightSearch.returnDate}` : ""}`)}`}><strong>Google Flights</strong><span>{routeSearchLabel} · View results →</span></a><a target="_blank" rel="noreferrer" href={kayakSearchUrl}><strong>KAYAK</strong><span>{routeSearchLabel} · View results →</span></a><a target="_blank" rel="noreferrer" href={bookingSearchUrl}><strong>Booking.com</strong><span>{routeSearchLabel} · View results →</span></a><a target="_blank" rel="noreferrer" href={`https://www.kiwi.com/en/search/results/${flightSearch.from}/${flightSearch.to}/${flightSearch.departure}/${flightSearch.returnDate || "no-return"}`}><strong>Kiwi.com</strong><span>{routeSearchLabel} · View results →</span></a><a target="_blank" rel="noreferrer" href={`https://www.expedia.com/Flights-Search?flight-type=${flightSearch.returnDate ? "on" : "off"}&leg1=from:${flightSearch.from},to:${flightSearch.to},departure:${flightSearch.departure}TANYT&passengers=adults:${flightSearch.adults}`}><strong>Expedia</strong><span>{routeSearchLabel} · View results →</span></a></div><small>Baba Air prices are confirmed in its B2B portal. Duffel prices appear inside Rihla after a Duffel access token is added.</small></section>}
        <span id="provider-comparison" className="scrollAnchor" /><div className="supplierHeading"><div><p className="eyebrow">Rihla AI travel search</p><h2>Millions of journeys. One simple AI search.</h2><p>Compare flights, suitable stays and Umrah services in one intelligent booking platform.</p></div><span>AI powered · Flights · Stays · Umrah</span></div>
        <div className="serviceTabs" role="tablist" aria-label="Booking services">
          <button className={activeService === "flights" ? "selected" : ""} onClick={() => setActiveService("flights")} role="tab"><b>01</b><span>✈</span><div><strong>Flights</strong><small>Search ticket fares</small></div></button>
          <button className={activeService === "hotels" ? "selected" : ""} onClick={() => setActiveService("hotels")} role="tab"><b>02</b><span>▦</span><div><strong>Stays</strong><small>Find suitable hotels</small></div></button>
          <button className={activeService === "umrah" ? "selected" : ""} onClick={() => setActiveService("umrah")} role="tab"><b>03</b><span>☾</span><div><strong>Umrah</strong><small>Packages and visa</small></div></button>
        </div>

        {activeService === "flights" && <div className="servicePanel"><div className="panelTitle"><div className="journeyTypeTabs" role="group" aria-label="Journey type">{(["Round trip", "One way", "Multi-city"] as const).map((mode) => <button type="button" key={mode} className={flightMode === mode ? "selected" : ""} onClick={() => { setFlightMode(mode); if (mode !== "Round trip") setFlightSearch({ ...flightSearch, returnDate: "" }); }}>{mode}</button>)}</div><small>Live supplier search powered by Rihla AI</small><span>XML Agency connected</span></div><form className="flightForm enhancedFlightForm" onSubmit={searchFlights}>
          {flightMode !== "Multi-city" ? <>
            <label>From · IATA code<input required maxLength={3} list="rihla-airports" value={flightSearch.from} onChange={(e) => setFlightSearch({ ...flightSearch, from: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") })} placeholder="BAH" /><small>{airportName(flightSearch.from)}</small></label>
            <label>To · IATA code<input required maxLength={3} list="rihla-airports" value={flightSearch.to} onChange={(e) => setFlightSearch({ ...flightSearch, to: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") })} placeholder="JED" /><small>{airportName(flightSearch.to)}</small></label>
            <label>Departure<input required type="date" value={flightSearch.departure} onChange={(e) => setFlightSearch({ ...flightSearch, departure: e.target.value })} /></label>
            {flightMode === "Round trip" && <label>Return<input required type="date" min={flightSearch.departure} value={flightSearch.returnDate} onChange={(e) => setFlightSearch({ ...flightSearch, returnDate: e.target.value })} /></label>}
          </> : <div className="multiCityEditor">{multiCityLegs.map((leg, index) => <div className="multiCityLeg" key={index}><b>Flight {index + 1}</b><label>From<input required maxLength={3} list="rihla-airports" value={leg.from} onChange={(e) => setMultiCityLegs((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, from: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") } : item))} /><small>{airportName(leg.from)}</small></label><label>To<input required maxLength={3} list="rihla-airports" value={leg.to} onChange={(e) => setMultiCityLegs((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, to: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") } : item))} /><small>{airportName(leg.to)}</small></label><label>Date<input required type="date" value={leg.date} onChange={(e) => setMultiCityLegs((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, date: e.target.value } : item))} /></label>{multiCityLegs.length > 2 && <button type="button" className="removeLeg" onClick={() => setMultiCityLegs((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>}</div>)}<button type="button" className="addLeg" disabled={multiCityLegs.length >= 6} onClick={() => setMultiCityLegs((current) => [...current, { from: current.at(-1)?.to || "", to: "", date: "" }])}>+ Add another flight</button></div>}
          <div className="travellerFields"><label>Adults <small>12+ years</small><input min={1} max={9} type="number" value={flightSearch.adults} onChange={(e) => setFlightSearch({ ...flightSearch, adults: Number(e.target.value) })} /></label><label>Children <small>2–11 years</small><input min={0} max={8} type="number" value={flightSearch.children} onChange={(e) => setFlightSearch({ ...flightSearch, children: Number(e.target.value) })} /></label><label>Infants <small>Under 2 years</small><input min={0} max={flightSearch.adults} type="number" value={flightSearch.infants} onChange={(e) => setFlightSearch({ ...flightSearch, infants: Number(e.target.value) })} /></label></div>
          <label>Cabin<select value={flightSearch.cabin} onChange={(e) => setFlightSearch({ ...flightSearch, cabin: e.target.value })}><option value="Econom">Economy</option><option>Business</option><option>PremiumEconomy</option><option>First</option></select></label>
          <label>Currency<select value={flightSearch.currency} onChange={(e) => setFlightSearch({ ...flightSearch, currency: e.target.value })}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
          <button type="submit" disabled={flightLoading}>{flightLoading ? "Searching every connected fare…" : `Search ${flightSearch.adults + flightSearch.children + flightSearch.infants} traveller${flightSearch.adults + flightSearch.children + flightSearch.infants === 1 ? "" : "s"} →`}</button>
          <datalist id="rihla-airports">{Object.entries(airports).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</datalist>
        </form><div className="flightOptions"><label><input type="checkbox" checked={directOnly} onChange={(e) => setDirectOnly(e.target.checked)} /> Direct flights only</label><span>Every returned fare shows airline name, code, and booking supplier</span></div>
        <p className="supplierNote">Live fares from connected suppliers · Prices shown are per person including taxes</p>
        {flightStatus && <p className="flightError" role="alert">{flightStatus}</p>}
        {flightResults && <div className="resultsLayout"><aside className="resultsFilters" aria-label="Filter flight results"><h3>Filter results</h3><fieldset><legend>Stops</legend><label><input type="radio" name="stops" checked={resultStops === "all"} onChange={() => setResultStops("all")} /> All flights <span>{flightResults.offers.length}</span></label><label><input type="radio" name="stops" checked={resultStops === "direct"} onChange={() => setResultStops("direct")} /> Direct <span>{flightResults.offers.filter((offer) => offer.stops === 0).length}</span></label><label><input type="radio" name="stops" checked={resultStops === "one"} onChange={() => setResultStops("one")} /> 1 stop <span>{flightResults.offers.filter((offer) => offer.stops === 1).length}</span></label><label><input type="radio" name="stops" checked={resultStops === "twoPlus"} onChange={() => setResultStops("twoPlus")} /> 2+ stops <span>{flightResults.offers.filter((offer) => offer.stops >= 2).length}</span></label></fieldset><div className="filterInfo"><strong>Baggage</strong><span>Allowance is shown on every fare card.</span></div><div className="filterInfo"><strong>Booking sources</strong><span>{flightResults.supplier || "No connected source"}</span></div></aside><div className="flightResults"><div className="providerProgress"><span>✓</span><div><strong>Supplier search completed</strong><small>{flightResults.supplier || "No connected source"} · {flightResults.resultCount} available options</small></div></div><div className="resultSortTabs"><button className={resultSort === "best" ? "selected" : ""} onClick={() => setResultSort("best")}><span>Best</span><strong>{visibleFlightOffers[0] ? `${visibleFlightOffers[0].currency || flightResults.currency} ${visibleFlightOffers[0].price.toFixed(2)}` : "—"}</strong></button><button className={resultSort === "cheapest" ? "selected" : ""} onClick={() => setResultSort("cheapest")}><span>Cheapest</span><strong>{visibleFlightOffers[0] ? `${visibleFlightOffers[0].currency || flightResults.currency} ${visibleFlightOffers[0].price.toFixed(2)}` : "—"}</strong></button><button className={resultSort === "fewestStops" ? "selected" : ""} onClick={() => setResultSort("fewestStops")}><span>Fewest stops</span><strong>{visibleFlightOffers[0] ? `${visibleFlightOffers[0].stops} stop${visibleFlightOffers[0].stops === 1 ? "" : "s"}` : "—"}</strong></button></div><div className="resultSummary"><strong>{visibleFlightOffers.length} fares shown</strong><span>Every fare shows its supplier and currency</span></div>{!visibleFlightOffers.length && <div className="noFlightResults"><strong>No matching fare for this filter</strong><span>Change the stop filter, compare Baba Air and external providers below, or change your search.</span><button type="button" onClick={() => { setFlightResults(null); setFlightStatus(""); }}>Change search</button></div>}{visibleFlightOffers.map((offer) => <article key={`${offer.supplier}-${offer.offerCode}`}><div className="airlineBadge">{offer.airline.slice(0,2).toUpperCase()}</div><div className="airlineName"><strong>{offer.airline}</strong><small>{offer.flightNumber} · {offer.cabin}</small></div><div className="flightLeg"><strong>{offer.departure || flightSearch.from}</strong><small>{flightSearch.from} departure</small></div><div className="flightStops"><span>{offer.stops === 0 ? "Direct" : `${offer.stops} stop${offer.stops > 1 ? "s" : ""}`}</span><b>✈</b><small>Bag {offer.baggage}</small></div><div className="flightLeg"><strong>{offer.arrival || flightSearch.to}</strong><small>{flightSearch.to} arrival</small></div><div className="flightPrice"><span className="priceSource">1 deal · {offer.supplier || "XML Agency"}</span><strong>{offer.currency || flightResults.currency} {offer.price.toFixed(2)}</strong><button disabled={Boolean(prebookLoading)} onClick={() => prebookFare(offer)}>{prebookLoading === offer.offerCode ? "Checking API…" : offer.supplier === "Duffel" ? "Review Duffel fare →" : "Select →"}</button></div></article>)}</div></div>}</div>}

        {activeService === "hotels" && <div className="servicePanel"><div className="panelTitle"><div><strong>Hotel search</strong><small>Continue to our supplier for live rooms, payment and confirmation</small></div><span>Direct supplier booking</span></div><form className="hotelForm" onSubmit={(event) => { event.preventDefault(); setHotelShown(true); }}><label>Destination<input required value={hotelSearch.city} onChange={(e) => setHotelSearch({ ...hotelSearch, city: e.target.value })} /></label><label>Check in<input required type="date" value={hotelSearch.checkIn} onChange={(e) => setHotelSearch({ ...hotelSearch, checkIn: e.target.value })} /></label><label>Check out<input required type="date" value={hotelSearch.checkOut} onChange={(e) => setHotelSearch({ ...hotelSearch, checkOut: e.target.value })} /></label><label>Guests<input min={1} max={12} type="number" value={hotelSearch.guests} onChange={(e) => setHotelSearch({ ...hotelSearch, guests: Number(e.target.value) })} /></label><button type="submit">Continue to supplier →</button></form>{hotelShown && <div className="supplierHandoff"><span>✓</span><div><strong>Your hotel search is ready</strong><p>{hotelSearch.city} · {hotelSearch.checkIn} to {hotelSearch.checkOut} · {hotelSearch.guests} guest{hotelSearch.guests === 1 ? "" : "s"}</p><small>You will complete the live hotel search, payment and confirmation directly on the supplier website.</small></div><a href="https://city.travel/" target="_blank" rel="noreferrer">Open supplier and book →</a></div>}<p className="supplierNote">Rihla does not create a hotel confirmation on this page. Your confirmed booking reference is issued by the supplier after payment.</p></div>}

        {activeService === "umrah" && <div className="servicePanel"><div className="panelTitle"><div><strong>Umrah packages & visa assistance</strong><small>Choose exact travel dates, compare packages and book</small></div><span>Book online</span></div><form className="umrahForm" onSubmit={(event) => { event.preventDefault(); setUmrahShown(true); }}><label>Departing from<select value={umrahSearch.departure} onChange={(e) => setUmrahSearch({ ...umrahSearch, departure: e.target.value })}><option>Bahrain</option><option>Saudi Arabia</option><option>UAE</option><option>Kuwait</option><option>Qatar</option><option>Other</option></select></label><label>Departure date<input required type="date" value={umrahSearch.startDate} onChange={(e) => setUmrahSearch({ ...umrahSearch, startDate: e.target.value })} /></label><label>Return date<input required type="date" value={umrahSearch.endDate} onChange={(e) => setUmrahSearch({ ...umrahSearch, endDate: e.target.value })} /></label><label>Travellers<input min={1} max={12} type="number" value={umrahSearch.travellers} onChange={(e) => setUmrahSearch({ ...umrahSearch, travellers: Number(e.target.value) })} /></label><button type="submit">Find Umrah options →</button></form>{umrahShown && <div className="umrahPackages">{umrahTemplates.map((pack) => <article key={pack.name}><span>{pack.badge}</span><h3>{pack.name}</h3><strong>{pack.nights}</strong><p>{pack.hotel}</p><small className="packageDates">{umrahSearch.startDate} → {umrahSearch.endDate}</small><div><b>{pack.price}</b><small>per person · indicative</small></div><button onClick={() => { setBookingSubmitted(false); setSelectedBooking(`${pack.name}, ${umrahSearch.departure}, ${umrahSearch.startDate} to ${umrahSearch.endDate}, ${umrahSearch.travellers} travellers, ${pack.price}, visa assistance`); setTimeout(() => document.getElementById("booking-request")?.scrollIntoView(), 0); }}>Book now</button></article>)}</div>}<div className="visaNotice"><span>✓</span><div><strong>Visa assistance included with your booking request</strong><p>We help review requirements and documents. Approval remains subject to Saudi authorities.</p></div></div></div>}
      </section>

      {selectedBooking && <button className="bookingBack" onClick={() => document.getElementById("book")?.scrollIntoView()}>← Back to search results</button>}
      {selectedBooking && !bookingSubmitted && <section className="genericMrzPanel" aria-label="Passport MRZ scanner"><div><p className="eyebrow">Fast passenger entry</p><h2>Scan passport MRZ</h2><p>Choose a clear photo or PDF scan of the passport information page. Processing stays in this browser and the file is not uploaded.</p><label className="scanButton">Scan passport MRZ<input type="file" accept="image/*,application/pdf" capture="environment" onChange={(e) => scanPassport(e.target.files?.[0], "booking")} /></label>{scanStatus && <small role="status">{scanStatus}</small>}</div><div className="mrzPreview"><label>Given name<input value={bookingForm.fullName} onChange={(e) => setBookingForm({ ...bookingForm, fullName: e.target.value })} /></label><label>Surname<input value={bookingForm.surname} onChange={(e) => setBookingForm({ ...bookingForm, surname: e.target.value })} /></label><label>Passport number<input value={bookingForm.passport} onChange={(e) => setBookingForm({ ...bookingForm, passport: e.target.value.toUpperCase() })} /></label><label>Date of birth<input type="date" value={bookingForm.birthDate} onChange={(e) => setBookingForm({ ...bookingForm, birthDate: e.target.value })} /></label><label>Passport expiry<input type="date" value={bookingForm.passportExpiry} onChange={(e) => setBookingForm({ ...bookingForm, passportExpiry: e.target.value })} /></label><label>Gender<select value={bookingForm.gender} onChange={(e) => setBookingForm({ ...bookingForm, gender: e.target.value })}><option>Male</option><option>Female</option></select></label></div></section>}
      {selectedBooking && <section className="bookingFlow bookingFormSection" id="booking-request"><div className="bookingIntro"><p className="eyebrow">Secure booking request</p><h2>Complete your details</h2><div className="bookingSummary">{selectedBooking}</div><ol><li><b>1</b><span><strong>Submit details</strong><small>Create your booking reference.</small></span></li><li><b>2</b><span><strong>Fare confirmation</strong><small>We verify live availability and final price.</small></span></li><li><b>3</b><span><strong>Payment & ticket</strong><small>Pay securely, then receive confirmation.</small></span></li></ol></div>{!bookingSubmitted ? <form className="fullBookingForm" onSubmit={(event) => { event.preventDefault(); const ref = `RHL-${Date.now().toString().slice(-6)}`; setBookingRef(ref); setBookingSubmitted(true); }}><div className="customerType"><button type="button" className={bookingForm.type === "Customer" ? "selected" : ""} onClick={() => setBookingForm({ ...bookingForm, type: "Customer" })}>Customer</button><button type="button" className={bookingForm.type === "Agent" ? "selected" : ""} onClick={() => setBookingForm({ ...bookingForm, type: "Agent" })}>Travel agent</button></div><div className="bookingFormGrid"><label>Lead passenger / agent name<input required value={bookingForm.fullName} onChange={(e) => setBookingForm({ ...bookingForm, fullName: e.target.value })} /></label><label>Nationality<input required value={bookingForm.nationality} onChange={(e) => setBookingForm({ ...bookingForm, nationality: e.target.value })} /></label><label>Email<input required type="email" value={bookingForm.email} onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} /></label><label>WhatsApp phone<input required type="tel" value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} /></label><label>Passengers<input required min={1} max={12} type="number" value={bookingForm.passengers} onChange={(e) => setBookingForm({ ...bookingForm, passengers: Number(e.target.value) })} /></label><label>Notes<input value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} placeholder="Meals, mobility, room needs…" /></label></div><label className="bookingConsent"><input required type="checkbox" /> I confirm these details are correct and accept fare revalidation before payment.</label><button className="bookNowButton" type="submit">Book now →</button></form> : <div className="bookingConfirmation"><span>✓</span><h3>Booking request created</h3><strong>{bookingRef}</strong><p>Your option is held as a request while our team reconfirms availability and final price.</p><dl><div><dt>Name</dt><dd>{bookingForm.fullName}</dd></div><div><dt>Type</dt><dd>{bookingForm.type}</dd></div><div><dt>Passengers</dt><dd>{bookingForm.passengers}</dd></div><div><dt>Contact</dt><dd>{bookingForm.phone}</dd></div></dl><a target="_blank" rel="noreferrer" href={whatsappLink(`Rihla booking ${bookingRef}. ${bookingForm.type}: ${bookingForm.fullName}. Selected: ${selectedBooking}. Passengers: ${bookingForm.passengers}. Phone: ${bookingForm.phone}. Please confirm the final fare and payment link.`)}>Send booking to WhatsApp →</a><button onClick={() => { localStorage.removeItem("rihla-booking-backup"); setBookingSubmitted(false); setSelectedBooking(""); }}>Start another booking</button></div>}</section>}
      {selectedBooking && bookingSubmitted && <section className="bookingUtilities"><div><strong>Booking backup</strong><p>Save a portable JSON copy of the booking details and reference.</p><button onClick={downloadBookingBackup}>Download backup</button></div><div><strong>Social media activities</strong><p>Share the booking service or your confirmed reference.</p><nav aria-label="Share booking"><a target="_blank" rel="noreferrer" href={whatsappLink(`Rihla booking ${bookingRef}: ${selectedBooking}`)}>WhatsApp</a><a target="_blank" rel="noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`}>Facebook</a><a target="_blank" rel="noreferrer" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent(`My Rihla booking reference is ${bookingRef}`)}`}>X</a><a target="_blank" rel="noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(siteUrl)}`}>LinkedIn</a></nav></div></section>}
      {bookingSubmitted && <div className="bookingActionBar"><span>✓ Backup saved on this device</span><button onClick={downloadBookingBackup}>↓ Download backup</button><button onClick={() => window.print()}>▣ Print booking</button><button onClick={() => document.getElementById("book")?.scrollIntoView()}>← Back</button></div>}

      {selectedFlight && bookingStage === "fare" && <section className="fareDetailsPage" id="fare-details"><header className="fareDetailsHeader"><button onClick={() => { setSelectedFlight(null); setBookingError(""); }}>← Back to results</button><strong>Rihla fare details</strong><span>Live fare revalidated</span></header><div className="fareDetailsGrid"><div className="agencyOffers"><p className="eyebrow">Available booking provider</p><h1>Choose where to book</h1><p className="agencyIntro">This price was returned and revalidated by the connected supplier. Other websites may show different prices and conditions.</p><article className="agencyOfferCard"><div className="agencyIdentity"><span>XML</span><div><strong>XML Agency</strong><small>Verified live supplier</small></div></div><ul><li>✓ Live fare revalidated</li><li>✓ Passenger MRZ auto-fill available</li><li>✓ Booking status and confirmation tracking</li><li>🧳 Baggage: {selectedFlight.offer.baggage}</li></ul><div className="agencyPrice"><small>1 booking option</small><strong>{selectedFlight.currency} {selectedFlight.offer.price.toFixed(2)}</strong><button onClick={() => { setBookingStage("trip"); setTimeout(() => document.getElementById("trip-selection")?.scrollIntoView({ behavior: "smooth" }), 0); }}>Select →</button></div></article><div className="externalFareNote"><strong>Want to compare another website?</strong><p>Skyscanner, Wego, Baba Air and other external providers issue their own price and confirmation.</p><button onClick={() => { setSelectedFlight(null); setTimeout(() => document.querySelector(".marketplaceCompare")?.scrollIntoView({ behavior: "smooth" }), 0); }}>Back to supplier comparisons</button></div></div><aside className="itineraryPanel"><div className="itineraryTop"><span className="itineraryLogo">{selectedFlight.offer.airline.slice(0,2).toUpperCase()}</span><div><strong>{selectedFlight.offer.airline}</strong><small>{selectedFlight.offer.flightNumber} · {selectedFlight.offer.cabin}</small></div></div><div className="itineraryRoute"><div><strong>{selectedFlight.offer.departure || flightSearch.from}</strong><span>{flightSearch.from}</span><small>Departure</small></div><div className="routeLine"><span>{selectedFlight.offer.stops === 0 ? "Direct" : `${selectedFlight.offer.stops} stop${selectedFlight.offer.stops > 1 ? "s" : ""}`}</span><b>✈</b></div><div><strong>{selectedFlight.offer.arrival || flightSearch.to}</strong><span>{flightSearch.to}</span><small>Arrival</small></div></div><div className="itineraryTimeline"><span /><div><strong>{flightSearch.from} departure</strong><small>Travel with {selectedFlight.offer.airline}</small></div><span /><div><strong>{selectedFlight.offer.stops === 0 ? "Nonstop journey" : `${selectedFlight.offer.stops} connection${selectedFlight.offer.stops > 1 ? "s" : ""}`}</strong><small>Baggage {selectedFlight.offer.baggage}</small></div><span /><div><strong>{flightSearch.to} arrival</strong><small>Final destination</small></div></div><footer><strong>{flightSearch.departure}</strong><span>{flightMode} · {flightSearch.adults} adult{flightSearch.adults === 1 ? "" : "s"}</span></footer></aside></div></section>}

      {selectedFlight && bookingStage === "trip" && <section className="tripSelectionPage" id="trip-selection">
        <header className="tripSelectionHeader"><strong>Rihla</strong><div><b>{flightSearch.from} → {flightSearch.to}</b><span>{flightSearch.departure} · {flightSearch.adults} traveller{flightSearch.adults === 1 ? "" : "s"}</span></div><button onClick={() => setBookingStage("fare")}>← Fare providers</button></header>
        <div className="tripSelectionGrid"><aside className="tripFilters"><span>Showing {visibleFlightOffers.length} of {flightResults?.offers.length || 0} flights</span><fieldset><legend>Number of stopovers</legend><label><input type="radio" name="tripStops" checked={resultStops === "direct"} onChange={() => setResultStops("direct")} /> Direct flight</label><label><input type="radio" name="tripStops" checked={resultStops === "one"} onChange={() => setResultStops("one")} /> Maximum one stop</label><label><input type="radio" name="tripStops" checked={resultStops === "all"} onChange={() => setResultStops("all")} /> All</label></fieldset><div className="tripFilterBlock"><strong>Price</strong><span>{selectedFlight.currency} {Math.min(...(flightResults?.offers.map((offer) => offer.price) || [selectedFlight.offer.price])).toFixed(2)} — {selectedFlight.currency} {Math.max(...(flightResults?.offers.map((offer) => offer.price) || [selectedFlight.offer.price])).toFixed(2)}</span></div><div className="tripFilterBlock"><strong>Airline</strong><span>✓ {selectedFlight.offer.airline}</span></div><div className="tripFilterBlock"><strong>Supplier</strong><span>✓ XML Agency</span></div></aside><div className="tripOptions"><div className="tripValueTabs"><button className={resultSort === "best" ? "selected" : ""} onClick={() => setResultSort("best")}><strong>Best Value</strong><span>{selectedFlight.currency} {selectedFlight.offer.price.toFixed(2)}</span></button><button className={resultSort === "cheapest" ? "selected" : ""} onClick={() => setResultSort("cheapest")}><strong>Cheapest</strong><span>{visibleFlightOffers[0] ? `${selectedFlight.currency} ${visibleFlightOffers[0].price.toFixed(2)}` : "—"}</span></button><button className={resultSort === "fewestStops" ? "selected" : ""} onClick={() => setResultSort("fewestStops")}><strong>Fewest stops</strong><span>{selectedFlight.offer.stops} stop{selectedFlight.offer.stops === 1 ? "" : "s"}</span></button></div><article className="selectedTripCard"><header>Your selected trip with XML Agency</header><div className="tripCardBody"><div className="tripJourney"><span>Departure · {flightSearch.departure} · {selectedFlight.offer.cabin}</span><div><strong>{selectedFlight.offer.departure || flightSearch.from}</strong><small>{flightSearch.from}</small></div><div className="tripArrow"><span>{selectedFlight.offer.stops === 0 ? "Direct flight" : `${selectedFlight.offer.stops} stop${selectedFlight.offer.stops > 1 ? "s" : ""}`}</span><b>✈</b></div><div><strong>{selectedFlight.offer.arrival || flightSearch.to}</strong><small>{flightSearch.to}</small></div><em>{selectedFlight.offer.airline}</em></div><div className="tripCardPrice"><span>ⓘ · 🧳 {selectedFlight.offer.baggage}</span><strong>{selectedFlight.currency} {selectedFlight.offer.price.toFixed(2)}</strong><small>price per person</small><button onClick={() => { setBookingStage("passenger"); setTimeout(() => document.getElementById("direct-booking")?.scrollIntoView({ behavior: "smooth" }), 0); }}>View trip →</button></div></div></article>{flightResults && visibleFlightOffers.filter((offer) => offer.offerCode !== selectedFlight.offer.offerCode).slice(0,3).map((offer) => <article className="alternateTripCard" key={offer.offerCode}><div><span>{offer.stops === 0 ? "Direct flight" : `${offer.stops} stop${offer.stops > 1 ? "s" : ""}`}</span><strong>{offer.airline} · {offer.flightNumber}</strong><small>{flightSearch.from} → {flightSearch.to} · Bag {offer.baggage}</small></div><div><strong>{selectedFlight.currency} {offer.price.toFixed(2)}</strong><button onClick={() => prebookFare(offer)}>Review fare</button></div></article>)}</div></div>
      </section>}

      {selectedFlight && bookingStage === "passenger" && <section className="bookingFlow bookingFormSection" id="direct-booking">
        <div className="bookingIntro"><button className="partnerBack" onClick={() => { setSelectedFlight(null); setBookingSubmitted(false); setBookingError(""); }}>← Back to flight results</button><p className="eyebrow">Book with our partner</p><h2>{bookingSubmitted ? "Partner reservation created" : "Passenger details"}</h2><div className="bookingSummary">{selectedFlight.summary} · partner fare revalidated</div><ol><li><b>1</b><span><strong>Fare check</strong><small>Your selected fare is confirmed with our partner.</small></span></li><li><b>2</b><span><strong>Secure booking</strong><small>Passenger details are sent securely to the partner.</small></span></li><li><b>3</b><span><strong>Ticketing</strong><small>The partner confirms payment and ticket issuance.</small></span></li></ol></div>
        {!bookingSubmitted ? <form className="fullBookingForm" onSubmit={submitBooking}><div className="passportScanner"><strong>Scan passport MRZ to auto-fill</strong><p>Take or choose a clear photo of the passport information page. It is processed only in your browser and is not uploaded or saved.</p><label className="scanButton">Scan passport MRZ<input type="file" accept="image/*" capture="environment" onChange={(e) => scanPassport(e.target.files?.[0], "booking")} /></label>{scanStatus && <small role="status">{scanStatus}</small>}</div><div className="bookingFormGrid">
          <label>Given name (passport)<input required value={bookingForm.fullName} onChange={(e) => setBookingForm({ ...bookingForm, fullName: e.target.value })} /></label>
          <label>Surname (passport)<input required value={bookingForm.surname} onChange={(e) => setBookingForm({ ...bookingForm, surname: e.target.value })} /></label>
          <label>Nationality ISO code<input required maxLength={3} value={bookingForm.nationality} onChange={(e) => setBookingForm({ ...bookingForm, nationality: e.target.value.toUpperCase() })} placeholder="BHR" /></label>
          <label>Gender<select value={bookingForm.gender} onChange={(e) => setBookingForm({ ...bookingForm, gender: e.target.value })}><option>Male</option><option>Female</option></select></label>
          <label>Date of birth<input required type="date" value={bookingForm.birthDate} onChange={(e) => setBookingForm({ ...bookingForm, birthDate: e.target.value })} /></label>
          <label>Passport number<input required value={bookingForm.passport} onChange={(e) => setBookingForm({ ...bookingForm, passport: e.target.value })} /></label>
          <label>Passport expiry<input required type="date" value={bookingForm.passportExpiry} onChange={(e) => setBookingForm({ ...bookingForm, passportExpiry: e.target.value })} /></label>
          <label>Email<input required type="email" value={bookingForm.email} onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} /></label>
          <label>Mobile number with country code<input required type="tel" value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} placeholder="+97334451249" /></label>
        </div><label className="bookingConsent"><input required type="checkbox" /> I confirm the passenger details match the passport.</label>{bookingError && <p className="flightError" role="alert">{bookingError}</p>}<button className="bookNowButton" disabled={bookingLoading} type="submit">{bookingLoading ? "Connecting to our booking partner…" : "Book with our partner →"}</button></form> : <div className="bookingConfirmation"><span>✓</span><h3>Partner reservation created</h3><strong>{bookingRef}</strong><p>Your reservation was created through our connected booking partner. Payment and ticket issuance will follow the partner confirmation.</p><button onClick={() => { setBookingSubmitted(false); setSelectedFlight(null); }}>Start another booking</button></div>}
        {bookingSubmitted && bookingMeta && <div className="bookingStatusCard"><strong>Current supplier status: {supplierStatus?.status || "Unknown"}</strong>{supplierStatus?.pnr && <span>PNR: {supplierStatus.pnr}</span>}{supplierStatus?.ticketNumber && <span>Ticket: {supplierStatus.ticketNumber}</span>}<small>{supplierStatus?.status === "Booked" ? "Ticket successfully issued." : supplierStatus?.status === "WaitToBooking" ? "Ticketing is pending. Check again in about five minutes." : supplierStatus?.status === "Cancelled" ? "Booking was cancelled or ticketing failed." : "Reservation accepted; ticket issuance is not yet confirmed."}</small><button type="button" disabled={statusLoading} onClick={checkBookingStatus}>{statusLoading ? "Checking…" : "Check booking status"}</button>{bookingError && <p className="flightError">{bookingError}</p>}</div>}
      </section>}

      <section className="inspiration" id="explore">
        <div className="sectionHeading">
          <div><p className="eyebrow">Handpicked inspiration</p><h2>Where will your story begin?</h2></div>
          <button>Explore all destinations →</button>
        </div>
        <div className="tripGrid">
          {trips.map((trip) => (
            <article className={`tripCard ${trip.color}`} key={trip.place}>
              <div className="scenery"><span>{trip.tag}</span><button onClick={() => toggleSaved(trip.place)} aria-label={`${saved.includes(trip.place) ? "Remove" : "Save"} ${trip.place}`}>{saved.includes(trip.place) ? "♥" : "♡"}</button></div>
              <div className="tripInfo"><div><h3>{trip.place}</h3><p>{trip.country}</p></div><span>{trip.days} · from $680</span></div>
            </article>
          ))}
        </div>
      </section>

      <section className="umrahFeature" id="umrah">
        <div className="umrahVisual"><div className="moon">☾</div><div className="kaaba"><i /></div><p>لبّيك اللهم لبّيك</p></div>
        <div className="umrahCopy">
          <p className="eyebrow">A journey of the heart</p>
          <h2>Your Umrah, planned with care.</h2>
          <p>Step-by-step guidance, trusted stays near the Haramain, and thoughtful plans for every pilgrim — from your intention to your return home.</p>
          <ul><li><span>✓</span> Personalised rituals & daily guidance</li><li><span>✓</span> Accessible options for elders and families</li><li><span>✓</span> Prayer times, duas and offline essentials</li></ul>
          <button className="darkButton" onClick={() => { setTripType("umrah"); setActiveService("umrah"); setFlightResults(null); setTimeout(() => document.getElementById("book")?.scrollIntoView({ behavior: "smooth" }), 0); }}>Plan my Umrah <span>→</span></button>
        </div>
      </section>

      <section className="offersSection" id="offers">
        <div className="offerIntro"><p className="eyebrow">Exclusive travel offers</p><h2>Good journeys deserve<br />a thoughtful beginning.</h2><p>Get a personalised quote, early-access promotions and practical travel guidance from a Rihla specialist.</p><div className="campaignStats"><div><strong>15%</strong><span>selected Umrah stays</span></div><div><strong>24h</strong><span>quote response</span></div><div><strong>0</strong><span>planning fees</span></div></div></div>
        <form className="leadCard" onSubmit={submitLead}>
          <div className="formTitle"><span>☾</span><div><small>Secure Umrah request</small><strong>Book Umrah Online</strong></div></div>
          <div className="passportScanner"><strong>Scan passport MRZ to auto-fill</strong><p>Take or choose a clear photo of the passport information page. It is processed only in your browser and is not uploaded or saved.</p><label className="scanButton">Scan passport MRZ<input type="file" accept="image/*" capture="environment" onChange={(e) => scanPassport(e.target.files?.[0], "umrah")} /></label>{umrahScanStatus && <small role="status">{umrahScanStatus}</small>}</div>
          <div className="formRow"><label>Given name (passport)<input required value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} /></label><label>Surname (passport)<input required value={lead.surname} onChange={(e) => setLead({ ...lead, surname: e.target.value })} /></label></div>
          <div className="formRow"><label>Nationality ISO code<input required maxLength={3} value={lead.nationality} onChange={(e) => setLead({ ...lead, nationality: e.target.value.toUpperCase() })} /></label><label>Passport number<input required value={lead.passport} onChange={(e) => setLead({ ...lead, passport: e.target.value.toUpperCase() })} /></label></div>
          <div className="formRow"><label>Date of birth<input required type="date" value={lead.birthDate} onChange={(e) => setLead({ ...lead, birthDate: e.target.value })} /></label><label>Passport expiry<input required type="date" value={lead.passportExpiry} onChange={(e) => setLead({ ...lead, passportExpiry: e.target.value })} /></label></div>
          <div className="formRow"><label>WhatsApp number<input required type="tel" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} placeholder="+973 0000 0000" /></label><label>Email address<input type="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} placeholder="you@email.com" /></label></div>
          <label>I&apos;m interested in<select value={lead.interest} onChange={(e) => setLead({ ...lead, interest: e.target.value })}><option>Umrah package</option><option>Family holiday</option><option>Honeymoon escape</option><option>Group travel</option><option>Custom journey</option></select></label>
          <label className="consent"><input required type="checkbox" /> I agree to receive my quote and occasional travel offers.</label>
          <button className="primaryButton" type="submit">Start my Umrah booking <span>→</span></button>
          {leadSent && <div className="leadSuccess" role="status"><strong>Thank you, {lead.name}!</strong><span>Your Umrah booking request is ready. Send it to our travel team on WhatsApp for the fastest response.</span><a target="_blank" rel="noreferrer" href={whatsappLink(`Hello Rihla, I'm ${lead.name} ${lead.surname}. I want to book a ${lead.interest}. Nationality: ${lead.nationality}. Passport ending: ${lead.passport.slice(-4)}. Passport expiry: ${lead.passportExpiry}. My phone is ${lead.phone}${lead.email ? ` and email is ${lead.email}` : ""}. Please continue my Umrah booking.`)}>Continue on WhatsApp →</a></div>}
        </form>
      </section>

      <section className="promotionSection">
        <div className="sectionHeading"><div><p className="eyebrow">Share the journey</p><h2>Promotions made personal.</h2></div></div>
        <div className="promotionGrid">
          <article><span className="promoIcon">☾</span><small>UMRAH SPECIAL</small><h3>Share blessings with family</h3><p>Invite loved ones to explore a supported Umrah journey with up to 15% savings.</p><a target="_blank" rel="noreferrer" href={whatsappLink("A thoughtful Umrah journey awaits with Rihla. Explore guided packages and save up to 15%: https://rihla-ai-journeys.mirali200.chatgpt.site")}>Share on WhatsApp</a></article>
          <article><span className="promoIcon">✈</span><small>TRAVEL OFFER</small><h3>Plan together, travel better</h3><p>Send your group a personalised holiday planner and start shaping the trip together.</p><a target="_blank" rel="noreferrer" href={whatsappLink("Let's plan our next trip together with Rihla's AI travel companion: https://rihla-ai-journeys.mirali200.chatgpt.site")}>Share on WhatsApp</a></article>
          <article className="referralCard"><span className="promoIcon">♡</span><small>REFER & REWARD</small><h3>Give $25, get $25</h3><p>Share Rihla with a friend. You both receive travel credit after their first confirmed booking.</p><button onClick={() => navigator.clipboard?.writeText("https://rihla-ai-journeys.mirali200.chatgpt.site?ref=friend")}>Copy referral link</button></article>
        </div>
      </section>

      <section className="connectedAccounts" aria-label="Rihla social media accounts"><div><small>Official Rihla accounts</small><strong>Connect with us everywhere</strong></div><div>{socialPlatforms.filter((platform) => socialAccounts[platform]).map((platform) => <a key={platform} target="_blank" rel="noreferrer" href={socialAccounts[platform]}>{platform === "x" ? "X" : platform[0].toUpperCase() + platform.slice(1)}</a>)}{!socialPlatforms.some((platform) => socialAccounts[platform]) && <span>Account links can be added in the owner workspace.</span>}</div></section>
      <footer><a className="brand" href="#top"><span className="brandMark">R</span><span>rihla</span></a><p>Meaningful journeys, thoughtfully planned.</p><div className="footerLinks"><a href="#offers">Offers</a><a href="#umrah">Umrah</a><a href="/admin">Owner workspace</a></div><div className="socialLinks" aria-label="Share Rihla"><a target="_blank" rel="noreferrer" aria-label="Share Rihla on WhatsApp" title="WhatsApp" href={whatsappLink(`Discover Rihla — AI-powered travel, hotels and Umrah booking: ${siteUrl}`)}>WA</a><a target="_blank" rel="noreferrer" aria-label="Share Rihla on Facebook" title="Facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`}>f</a><a target="_blank" rel="noreferrer" aria-label="Share Rihla on X" title="X" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent("Discover Rihla — AI-powered travel, hotels and Umrah booking")}`}>𝕏</a><a target="_blank" rel="noreferrer" aria-label="Share Rihla on LinkedIn" title="LinkedIn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(siteUrl)}`}>in</a><button type="button" aria-label="Open Instagram with Rihla link copied" title="Instagram — link copied" onClick={() => { navigator.clipboard?.writeText(siteUrl); window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer"); }}>IG</button><button type="button" aria-label="Open TikTok with Rihla link copied" title="TikTok — link copied" onClick={() => { navigator.clipboard?.writeText(siteUrl); window.open("https://www.tiktok.com/", "_blank", "noopener,noreferrer"); }}>TT</button><button type="button" aria-label="Copy Rihla webpage link" title="Copy link" onClick={() => navigator.clipboard?.writeText(siteUrl)}>↗</button></div></footer>
      <a className="whatsappFloat" target="_blank" rel="noreferrer" href={whatsappLink("Hello Rihla, I'd like help planning my next journey.")} aria-label="Chat with Rihla on WhatsApp"><b>◉</b><span>WhatsApp us</span></a>
      <button className="chatLauncher" onClick={() => setChatOpen(!chatOpen)} aria-expanded={chatOpen} aria-controls="noor-chat"><span>✦</span><b>{chatOpen ? "Close" : "Ask Noor"}</b><small>Free AI guide</small></button>
      {chatOpen && <aside className="chatPanel" id="noor-chat" aria-label="Noor free travel assistant">
        <div className="chatHeader"><span className="aiOrb">✦</span><div><strong>Noor</strong><small><i /> Free travel assistant</small></div><button onClick={() => setChatOpen(false)} aria-label="Close chat">×</button></div>
        <div className="chatMessages" aria-live="polite">{chatMessages.map((message, index) => <div className={`chatBubble ${message.from}`} key={index}>{message.text}</div>)}</div>
        <div className="chatSuggestions">{["First Umrah tips", "Family trip", "Budget ideas"].map((suggestion) => <button key={suggestion} onClick={() => { setChatMessages((messages) => [...messages, { from: "user", text: suggestion }, { from: "bot", text: getFreeAnswer(suggestion) }]); }}>{suggestion}</button>)}</div>
        <form className="chatForm" onSubmit={sendChat}><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask a travel question…" aria-label="Message Noor" /><button type="submit" aria-label="Send message">→</button></form>
        <p className="freeNote">No account · No paid AI service · General guidance only</p>
      </aside>}

      <nav className="mobileNav" aria-label="Mobile navigation">
        {navItems.map((item) => <button key={item} className={activeNav === item ? "active" : ""} onClick={() => { setActiveNav(item); if (item === "Offers") document.getElementById("offers")?.scrollIntoView(); }}><span>{item === "Home" ? "⌂" : item === "Explore" ? "⌕" : item === "Umrah" ? "☾" : "%"}</span>{item}</button>)}
      </nav>
    </main>
  );
}
