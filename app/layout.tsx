import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CDID Car Database (Unofficial)",
  description: "haha hihi huhu hehe hoho",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className="flex h-full w-full overflow-hidden">{children}</body>
    </html>
  );
}
