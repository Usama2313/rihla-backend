import type { Context } from "@netlify/functions";

// Default Umrah package templates used when no database is configured.
const defaultUmrahTemplates = [
  { id: 1, name: "Essential Umrah", badge: "Best value", nights: "7 nights", hotel: "Value stays in Makkah & Madinah", price: "from BHD 329", sortOrder: 1 },
  { id: 2, name: "Family Comfort", badge: "Most popular", nights: "10 nights", hotel: "Family rooms & private transfers", price: "from BHD 495", sortOrder: 2 },
  { id: 3, name: "Premium Haramain", badge: "Premium", nights: "12 nights", hotel: "Premium stays close to the Haramain", price: "from BHD 795", sortOrder: 3 },
];

export default async function handler(_request: Request, _context: Context) {
  // Return environment-configured social links and Umrah templates.
  // When a full database is connected, replace this with a real DB query.
  const settings = {
    businessName: process.env.BUSINESS_NAME || "Rihla",
    whatsapp: process.env.SOCIAL_WHATSAPP || "",
    facebook: process.env.SOCIAL_FACEBOOK || "",
    instagram: process.env.SOCIAL_INSTAGRAM || "",
    x: process.env.SOCIAL_X || "",
    linkedin: process.env.SOCIAL_LINKEDIN || "",
    tiktok: process.env.SOCIAL_TIKTOK || "",
    youtube: process.env.SOCIAL_YOUTUBE || "",
    snapchat: process.env.SOCIAL_SNAPCHAT || "",
    umrahTemplates: defaultUmrahTemplates,
  };
  return new Response(JSON.stringify(settings), { status: 200, headers: { "Content-Type": "application/json" } });
}

export const config = { path: "/api/settings" };
