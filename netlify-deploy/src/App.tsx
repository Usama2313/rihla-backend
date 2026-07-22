import { useEffect, useState } from "react";

const trips = [
  { place: "AlUla", country: "Saudi Arabia", tag: "Desert wonder", days: "4 days", color: "sunset" },
  { place: "Istanbul", country: "Türkiye", tag: "Culture & cuisine", days: "5 days", color: "blue" },
  { place: "Bali", country: "Indonesia", tag: "Island reset", days: "7 days", color: "green" },
];

const navItems = ["Home", "Offers"];
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

export default function App() {
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
    { from: "bot", text: "Assalamu alaikum! I'm Noor, your free travel guide. Ask me about Umrah, destinations, budgets or family travel." },
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
        ? `Your personalised ${tripType === "umrah" ? "Umrah journey" : "trip"} is being shaped around "${prompt.trim()}".`
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
      const raw = await response.text();
      let data: { error?: string; offers?: FlightOffer[]; supplier?: string; currency?: string; resultCount?: number; searchGuid?: string; sources?: FlightSource[] };
      try { data = JSON.parse(raw); } catch { throw new Error("The flight supplier returned an invalid response. Please try again."); }
      if (response.status === 404) {
        setFlightResults({ offers: [], supplier: "No connected fare source", currency: flightSearch.currency, resultCount: 0, searchGuid: "", sources: [], testMode: true });
        setFlightStatus("No connected supplier returned a fare. Compare the same route with Baba Air and the external providers below.");
        return;
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
      const paxCount = Number(flightSearch.adults) + Number(flightSearch.children) + Number(flightSearch.infants);
      const paxTemplate = { givenName: bookingForm.fullName, surname: bookingForm.surname, birthDate: bookingForm.birthDate, nationality: bookingForm.nationality, passport: bookingForm.passport, passportExpiry: bookingForm.passportExpiry, gender: bookingForm.gender };
      const passengers = Array(paxCount).fill(null).map((_, i) => ({ ...paxTemplate, givenName: i === 0 ? bookingForm.fullName : `${bookingForm.fullName} ${i}`, passport: i === 0 ? bookingForm.passport : `${bookingForm.passport}${i}` }));
      const response = await fetch("/api/flights/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...selectedFlight, email: bookingForm.email, phone: bookingForm.phone, passengers }) });
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
      // Convert PDF to image if needed
      let imageSource: File | Blob = file;
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        setStatus("Converting PDF to image…");
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).href;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 3.0 }); // 3x scale for sharper MRZ text
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx as CanvasRenderingContext2D, canvas, viewport }).promise;
        imageSource = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))), "image/png")
        );
        setStatus("PDF converted. Reading MRZ…");
      }

      // Load browser ESM build from CDN — the npm package bundles Node.js worker_threads which breaks in browsers
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
      const lines = (data.text as string).toUpperCase().split(/\r?\n/).map((line: string) => line.replace(/\s/g, "")).filter((line: string) => line.length >= 40);
      const mrz1 = lines.find((line: string) => /^P[<A-Z]/.test(line));
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
      const sanitizeDate = (d: string) => d.replace(/O/g, "0").replace(/I/g, "1").replace(/L/g, "1").replace(/Z/g, "2").replace(/S/g, "5").replace(/B/g, "8").replace(/G/g, "6").replace(/</g, "0");
      let nationality = mrz2.slice(10, 13).replace(/0/g, "O").replace(/1/g, "I").replace(/2/g, "Z").replace(/5/g, "S").replace(/8/g, "B");
      if (nationality.startsWith("D<")) nationality = "DEU";
      nationality = nationality.replace(/</g, "");
      const dob = sanitizeDate(mrz2.slice(13, 19)), gender = mrz2.slice(20, 21) === "F" ? "Female" : "Male", expiry = sanitizeDate(mrz2.slice(21, 27));
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

  // Silence unused variable warnings (variables used in JSX below)
  void trips; void siteUrl; void socialPlatforms;

  return (
    <main className={selectedFlight ? bookingStage === "fare" ? "fareDetailsView" : bookingStage === "trip" ? "tripSelectionView" : "partnerBookingView" : flightResults ? "flightResultsView" : "searchHomeView"}>
      <div className="promoBar"><span>Limited Umrah offer</span> Save up to 15% on selected packages <a href="#offers">View offer →</a></div>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Rihla home">
          <span className="brandMark">R</span>
          <span>Rihla</span>
        </a>
        <nav className="desktopNav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button className={activeNav === item ? "active" : ""} key={item} onClick={() => { setActiveNav(item); if (item === "Offers") document.getElementById("offers")?.scrollIntoView(); }}>{item}</button>
          ))}
        </nav>
        <div className="headerActions">
          <label className="currencyPicker" aria-label="Display and search currency"><span>Currency</span><select value={flightSearch.currency} onChange={(e) => setFlightSearch({ ...flightSearch, currency: e.target.value })}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
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

        {activeService === "flights" && <div className="servicePanel"><div className="panelTitle"><div className="journeyTypeTabs" role="group" aria-label="Journey type">{(["Round trip", "One way", "Multi-city"] as const).map((mode) => <button type="button" key={mode} className={flightMode === mode ? "selected" : ""} onClick={() => { setFlightMode(mode); if (mode !== "Round trip") setFlightSearch({ ...flightSearch, returnDate: "" }); }}>{mode}</button>)}</div></div><form className="flightForm enhancedFlightForm" onSubmit={searchFlights}>
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
      {selectedBooking && !bookingSubmitted && <section className="genericMrzPanel" aria-label="Passport MRZ scanner"><div><p className="eyebrow">Fast passenger entry</p><h2>Scan passport MRZ</h2><p>Choose a photo or PDF scan of the passport information page. Processing stays in this browser and the file is never uploaded.</p><label className="mrzUpload"><input type="file" accept="image/*,application/pdf" onChange={(e) => scanPassport(e.target.files?.[0], "booking")} /><span>📷 Choose passport photo or PDF</span></label>{scanStatus && <p className="scanStatus">{scanStatus}</p>}</div></section>}

      {selectedFlight && !bookingSubmitted && <section className="fareSelection" id="fare-details" aria-label="Selected fare details">
        <div className="fareNav"><button type="button" className={bookingStage === "fare" ? "active" : ""} onClick={() => setBookingStage("fare")}>01 Fare</button><button type="button" className={bookingStage === "trip" ? "active" : ""} onClick={() => setBookingStage("trip")}>02 Trip type</button><button type="button" className={bookingStage === "passenger" ? "active" : ""} onClick={() => setBookingStage("passenger")}>03 Passenger</button></div>
        {bookingStage === "fare" && <div className="fareCard"><p className="eyebrow">Selected fare</p><h2>{selectedFlight.offer.airline}</h2><p>{selectedFlight.summary}</p><div className="fareActions"><button type="button" onClick={() => setBookingStage("trip")}>Continue to trip type →</button><button type="button" className="secondaryBtn" onClick={() => { setSelectedFlight(null); setBookingStage("fare"); }}>Choose a different fare</button></div></div>}
        {bookingStage === "trip" && <div className="fareCard"><p className="eyebrow">Trip type</p><h2>How would you like to book?</h2><div className="tripTypeOptions"><button type="button" className="tripTypeCard" onClick={() => setBookingStage("passenger")}><strong>Direct XML booking</strong><p>Book directly through the connected XML agency. One adult passenger per reservation.</p></button><button type="button" className="tripTypeCard" onClick={() => { setSelectedFlight(null); window.open("https://b2b.babaair.com/", "_blank"); }}><strong>Baba Air B2B portal</strong><p>Open the B2B portal to complete this booking with full agent functionality.</p></button></div></div>}
        {bookingStage === "passenger" && <form className="passengerForm" onSubmit={submitBooking}><p className="eyebrow">Passenger details</p><h2>Complete your reservation</h2><div className="passengerFields"><label>Given name(s)<input required value={bookingForm.fullName} onChange={(e) => setBookingForm({ ...bookingForm, fullName: e.target.value })} /></label><label>Surname<input required value={bookingForm.surname} onChange={(e) => setBookingForm({ ...bookingForm, surname: e.target.value })} /></label><label>Date of birth<input required type="date" value={bookingForm.birthDate} onChange={(e) => setBookingForm({ ...bookingForm, birthDate: e.target.value })} /></label><label>Gender<select value={bookingForm.gender} onChange={(e) => setBookingForm({ ...bookingForm, gender: e.target.value })}><option>Male</option><option>Female</option></select></label><label>Nationality (ISO 3)<input required maxLength={3} value={bookingForm.nationality} onChange={(e) => setBookingForm({ ...bookingForm, nationality: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") })} /></label><label>Passport number<input required value={bookingForm.passport} onChange={(e) => setBookingForm({ ...bookingForm, passport: e.target.value })} /></label><label>Passport expiry<input required type="date" value={bookingForm.passportExpiry} onChange={(e) => setBookingForm({ ...bookingForm, passportExpiry: e.target.value })} /></label><label>Email<input required type="email" value={bookingForm.email} onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} /></label><label>Phone (with country code)<input required value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} placeholder="+97334451249" /></label></div>{bookingError && <p className="bookingError" role="alert">{bookingError}</p>}<button type="submit" disabled={bookingLoading}>{bookingLoading ? "Creating reservation…" : "Book this fare →"}</button></form>}
      </section>}

      {(selectedBooking || selectedFlight) && !bookingSubmitted && !selectedFlight && <section className="bookingSection" id="booking-request" aria-label="Booking request form">
        <div className="bookingCard"><p className="eyebrow">Booking request</p><h2>Complete your booking</h2><p className="bookingDetail">{selectedBooking}</p><form className="bookingForm" onSubmit={submitBooking}><label>Given name(s)<input required value={bookingForm.fullName} onChange={(e) => setBookingForm({ ...bookingForm, fullName: e.target.value })} /></label><label>Surname<input required value={bookingForm.surname} onChange={(e) => setBookingForm({ ...bookingForm, surname: e.target.value })} /></label><label>Email<input required type="email" value={bookingForm.email} onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })} /></label><label>Phone<input required value={bookingForm.phone} onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })} /></label><label>Nationality<input required value={bookingForm.nationality} onChange={(e) => setBookingForm({ ...bookingForm, nationality: e.target.value })} /></label><label>Passport number<input required value={bookingForm.passport} onChange={(e) => setBookingForm({ ...bookingForm, passport: e.target.value })} /></label><label>Passport expiry<input required type="date" value={bookingForm.passportExpiry} onChange={(e) => setBookingForm({ ...bookingForm, passportExpiry: e.target.value })} /></label><label>Date of birth<input required type="date" value={bookingForm.birthDate} onChange={(e) => setBookingForm({ ...bookingForm, birthDate: e.target.value })} /></label><label>Gender<select value={bookingForm.gender} onChange={(e) => setBookingForm({ ...bookingForm, gender: e.target.value })}><option>Male</option><option>Female</option></select></label><label>Notes<textarea value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} /></label>{bookingError && <p className="bookingError" role="alert">{bookingError}</p>}<button type="submit" disabled={bookingLoading}>{bookingLoading ? "Submitting…" : "Submit booking request →"}</button></form></div>
      </section>}

      {bookingSubmitted && <section className="confirmationSection" aria-label="Booking confirmation">
        <div className="confirmationCard"><span className="confirmIcon">✓</span><p className="eyebrow">Booking confirmed</p><h2>Your reference is {bookingRef}</h2>{supplierStatus && <div className="supplierStatusBlock"><p><strong>Supplier status:</strong> {supplierStatus.status}</p>{supplierStatus.pnr && <p><strong>PNR:</strong> {supplierStatus.pnr}</p>}{supplierStatus.ticketNumber && <p><strong>Ticket:</strong> {supplierStatus.ticketNumber}</p>}{bookingMeta && <button type="button" onClick={checkBookingStatus} disabled={statusLoading}>{statusLoading ? "Checking…" : "Check booking status"}</button>}</div>}<p>A copy of your booking details has been saved. Use the button below to download a backup.</p><div className="confirmActions"><button type="button" onClick={downloadBookingBackup}>Download backup JSON</button><button type="button" onClick={() => { setBookingSubmitted(false); setSelectedFlight(null); setSelectedBooking(""); setBookingRef(""); setBookingMeta(null); setSupplierStatus(null); localStorage.removeItem("rihla-booking-backup"); }}>Start a new booking</button><a href={whatsappLink(`My Rihla booking reference is ${bookingRef}. Details: ${selectedBooking || selectedFlight?.summary || "flight booking"}`)} target="_blank" rel="noreferrer">Share via WhatsApp</a></div></div>
      </section>}

      <section className="featuredTrips" aria-label="Featured destinations">
        <div className="sectionHead"><p className="eyebrow">Curated journeys</p><h2>Destinations our travellers love</h2></div>
        <div className="tripGrid">
          {trips.map((trip) => <article key={trip.place} className={`tripCard tripCard--${trip.color}`}><div className="tripMeta"><span className="tripTag">{trip.tag}</span><button className={`saveBtn ${saved.includes(trip.place) ? "saved" : ""}`} onClick={() => toggleSaved(trip.place)} aria-label={saved.includes(trip.place) ? `Remove ${trip.place} from saved` : `Save ${trip.place}`}>{saved.includes(trip.place) ? "♥" : "♡"}</button></div><h3>{trip.place}</h3><p>{trip.country}</p><span className="tripDays">{trip.days}</span></article>)}
        </div>
      </section>

      <section className="noorSection" aria-label="AI trip planner">
        <div className="noorCard"><div className="noorHeader"><div className="noorAvatar">N</div><div><strong>Noor</strong><small>Free AI travel assistant</small></div></div>
          <div className="tripTypeSelector"><button className={tripType === "travel" ? "active" : ""} onClick={() => setTripType("travel")}>✈ Travel</button><button className={tripType === "umrah" ? "active" : ""} onClick={() => setTripType("umrah")}>☾ Umrah</button></div>
          <textarea className="noorInput" placeholder={tripType === "umrah" ? "Describe your Umrah journey — dates, group size, any mobility needs…" : "Describe your ideal trip — destination, budget, who's travelling…"} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          {message && <p className="noorReply">{message}</p>}
          <button className="noorBtn" onClick={planTrip}>Plan my {tripType === "umrah" ? "Umrah journey" : "trip"} →</button>
        </div>
      </section>

      <section className="umrahSection" id="offers" aria-label="Umrah enquiry form">
        <div className="umrahContent"><p className="eyebrow">Umrah packages</p><h2>Your sacred journey, planned with care</h2><p>Fill in the form for a personalised Umrah quote. Our team will contact you within one business day.</p></div>
        {!leadSent ? <form className="umrahLeadForm" onSubmit={submitLead}>
          <div className="umrahMrzUpload"><label className="mrzUpload"><input type="file" accept="image/*" onChange={(e) => scanPassport(e.target.files?.[0], "umrah")} /><span>📷 Scan passport MRZ (optional)</span></label>{umrahScanStatus && <p className="scanStatus">{umrahScanStatus}</p>}</div>
          <label>Given name(s)<input required value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} /></label>
          <label>Surname<input required value={lead.surname} onChange={(e) => setLead({ ...lead, surname: e.target.value })} /></label>
          <label>Phone<input required value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} /></label>
          <label>Email<input required type="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} /></label>
          <label>Interest<select value={lead.interest} onChange={(e) => setLead({ ...lead, interest: e.target.value })}><option>Umrah package</option><option>Flights only</option><option>Hotel only</option><option>Full package</option></select></label>
          <label>Nationality (ISO 3)<input required maxLength={3} value={lead.nationality} onChange={(e) => setLead({ ...lead, nationality: e.target.value.toUpperCase().replace(/[^A-Z]/g, "") })} /></label>
          <label>Passport number<input value={lead.passport} onChange={(e) => setLead({ ...lead, passport: e.target.value })} /></label>
          <label>Date of birth<input type="date" value={lead.birthDate} onChange={(e) => setLead({ ...lead, birthDate: e.target.value })} /></label>
          <label>Passport expiry<input type="date" value={lead.passportExpiry} onChange={(e) => setLead({ ...lead, passportExpiry: e.target.value })} /></label>
          <label>Gender<select value={lead.gender} onChange={(e) => setLead({ ...lead, gender: e.target.value })}><option>Male</option><option>Female</option></select></label>
          <button type="submit">Request Umrah quote →</button>
        </form> : <div className="leadThanks"><span>✓</span><h3>Thank you, {lead.name}!</h3><p>We'll be in touch at {lead.email || lead.phone} within one business day.</p></div>}
      </section>

      <section className="chatWidget" aria-label="Chat with Noor">
        <button className="chatToggle" onClick={() => setChatOpen((open) => !open)} aria-expanded={chatOpen}>{chatOpen ? "✕ Close" : "💬 Chat with Noor"}</button>
        {chatOpen && <div className="chatWindow"><div className="chatMessages" aria-live="polite">{chatMessages.map((message, index) => <div key={index} className={`chatMsg chatMsg--${message.from}`}>{message.text}</div>)}</div><form className="chatForm" onSubmit={sendChat}><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask Noor anything…" /><button type="submit">Send</button></form></div>}
      </section>

      <footer className="siteFooter">
        <div className="footerBrand"><span className="brandMark">R</span><span>Rihla</span></div>
        <p>AI-powered travel search · Flights · Hotels · Umrah</p>
        <p><small>Rihla is a travel search and booking enquiry platform. Fares are sourced from connected suppliers. All prices are indicative until confirmed by the supplier.</small></p>
        <div className="footerLinks">
          <a href="#top">Home</a>
          <a href="#book">Search</a>
          <a href="#offers">Umrah</a>
          {socialAccounts.whatsapp && <a href={`https://wa.me/${socialAccounts.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a>}
        </div>
      </footer>
    </main>
  );
}
