import type { Metadata } from "next";
import { SiteFooter } from "./components/site-footer";
import { SiteNav } from "./components/site-nav";
import { SITE_URL } from "./lib/site";
import "./globals.css";

const title = "CDID Repo (Unofficial)";
const description = "An unofficial database for Car Driving Indonesia (CDID) on Roblox.";

// No canonical here: child pages inherit it, so each page sets its own.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: { google: "o-9If2ceDADp2A5IdRoaaJIveYK97SMG3QWfYUq0Ri8" },
  title: { default: title, template: "%s | CDID Repo" },
  description,
  keywords: ["CDID", "Car Driving Indonesia", "Roblox"],
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
    <html lang="en">
      <body className="flex min-h-dvh w-full flex-col">
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
