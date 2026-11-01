"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
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
            className={cn("hover:text-white", active ? "text-white" : "text-zinc-400")}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
