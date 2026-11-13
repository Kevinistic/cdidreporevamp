import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import arlestare from "./arlestare.jpg";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <Image
        src={arlestare}
        alt="Arlestare"
        priority
        className="h-auto w-full max-w-md rounded-lg"
      />
      <h1 className="text-2xl font-bold">404 – Page not found</h1>
      <p className="text-zinc-400">This page doesn&apos;t exist, or the car has been removed.</p>
      <Link href="/" prefetch={false} className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium hover:bg-zinc-700">
        Back to the database
      </Link>
    </main>
  );
}
