import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Placeholder until the homepage design is settled.
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-3xl font-bold">CDID Repo</h1>
      <p className="text-zinc-400">An unofficial database for Car Driving Indonesia on Roblox.</p>
      <Link href="/car" className="rounded-md border border-zinc-500 px-4 py-2 text-sm text-white hover:bg-zinc-800">
        Browse cars
      </Link>
    </main>
  );
}
