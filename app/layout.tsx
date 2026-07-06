import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

export const metadata: Metadata = {
  title: "CDID Car Database (Unofficial)",
  description: "essentially a wiki but cooler",
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
