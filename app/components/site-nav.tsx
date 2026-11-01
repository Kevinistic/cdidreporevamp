"use client";

import { ScrollText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Credits } from "./credits";
import { cn } from "../lib/cn";
import repoLogo from "../repo.svg";

const NAV_LINKS = [
  {
    href: "/car",
    label: "Cars",
    isActive: (pathname: string) => pathname === "/car" || pathname.startsWith("/car/"),
  },
];

export function SiteNav() {
  const pathname = usePathname();
  const [isCreditsVisible, setIsCreditsVisible] = useState(false);

  return (
    <>
      <nav
        aria-label="Main"
        className="sticky top-0 z-30 flex h-[var(--nav-h)] shrink-0 items-center gap-4 border-b border-zinc-700 bg-black px-3 text-sm"
      >
        <Link href="/" className="shrink-0">
          <Image src={repoLogo} alt="CDID Repo" width={32} height={32} />
        </Link>

        {NAV_LINKS.map(({ href, label, isActive }) => {
          const active = isActive(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn("hover:text-white", active ? "text-accent" : "text-zinc-400")}
            >
              {label}
            </Link>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://discord.gg/QPMguJNTsG"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join the Discord server"
            className="inline-flex aspect-square items-center justify-center rounded-md border border-zinc-500 p-1.5 text-white hover:bg-zinc-800"
          >
            <img
              src="/discord.svg"
              alt=""
              width="16"
              height="16"
            />
          </a>

          <button
            type="button"
            onClick={() => setIsCreditsVisible(true)}
            aria-haspopup="dialog"
            aria-label="Open credits"
            className="rounded-md border border-zinc-500 p-1.5 text-white hover:bg-zinc-800"
          >
            <ScrollText size={16} aria-hidden="true" />
          </button>
        </div>
      </nav>

      {/* Outside the nav: its z-index would otherwise trap the modal below the filter sidebar. */}
      {isCreditsVisible ? <Credits onBack={() => setIsCreditsVisible(false)} /> : null}
    </>
  );
}
