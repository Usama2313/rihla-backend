import type { Metadata } from "next";
import "./globals.css";
import "./auth.css";
import "./flight-enhancements.css";

export const metadata: Metadata = {
  title: "Rihla — Free AI Travel & Umrah Companion",
  description: "Plan meaningful holidays and supported Umrah journeys, request personal quotes, and share travel offers on WhatsApp.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
