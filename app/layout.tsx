import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const title = "CDID Car Database (Unofficial)";
const description =
  "Browse every car in Car Driving Indonesia (CDID) on Roblox. Search and filter by price, dealership, gamepass, limited status, and event or removed cars.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["CDID", "Car Driving Indonesia", "Roblox", "car list", "car prices", "dealership", "gamepass"],
  openGraph: {
    title,
    description,
    type: "website",
    siteName: title,
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className="flex h-full w-full overflow-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
