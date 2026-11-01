import { CarFront, Dices, Map as MapIcon, Package, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CarTile } from "./components/car-tile";
import { cn } from "./lib/cn";
import { getCars } from "./lib/cars";
import repoLogo from "./repo.svg";

const title = "The CDID Database (Unofficial)";
const description =
  "The unofficial Car Driving Indonesia (CDID) database for Roblox. Browse every car by price, dealership, gamepass and limited status.";

const RECENT_CAR_LIMIT = 6;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: { absolute: title },
  description,
  keywords: ["CDID", "Car Driving Indonesia", "Roblox", "CDID database", "car list", "car prices"],
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

type SectionTileProps = {
  icon: LucideIcon;
  name: string;
  detail: string;
  size: "large" | "small";
  href?: string;
};

// A tile without an `href` is a section that hasn't shipped yet.
function SectionTile({ icon: Icon, name, detail, size, href }: SectionTileProps) {
  const large = size === "large";
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <Icon size={large ? 32 : 20} aria-hidden="true" className={href ? "text-accent" : "text-zinc-500"} />
        {href ? null : (
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">Soon</span>
        )}
      </div>
      <div>
        <h2 className={cn("font-bold", large ? "text-2xl" : "text-base")}>{name}</h2>
        <p className="text-sm text-zinc-400">{detail}</p>
      </div>
    </>
  );
  const className = cn(
    "flex flex-col justify-between gap-4 rounded-lg border bg-zinc-950 p-4",
    large && "min-h-44 md:min-h-56 md:p-6"
  );

  return href ? (
    <Link href={href} className={cn(className, "border-zinc-700 hover:border-accent")}>
      {content}
    </Link>
  ) : (
    <div className={cn(className, "border-zinc-800")}>{content}</div>
  );
}

export default async function HomePage() {
  const cars = await getCars();
  const recentCars = cars.filter((car) => car.New).slice(0, RECENT_CAR_LIMIT);
  const dealershipCount = new Set(cars.map((car) => car.Dealership).filter(Boolean)).size;

  const stats = [
    { label: "Cars", value: cars.length },
    { label: "Dealerships", value: dealershipCount },
    { label: "New cars", value: cars.filter((car) => car.New).length },
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10 md:py-16">
      <header className="space-y-6">
        <div className="space-y-2">
          <h1>
            <Image src={repoLogo} alt="The CDID database" width={128} height={128} className="md:size-40" />
          </h1>
          <p className="text-zinc-400">
            An up-to-date unofficial wiki (car database) for Roblox Car Driving Indonesia.
          </p>
        </div>

        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          {stats.map(({ label, value }) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</dt>
              <dd className="text-2xl font-bold text-accent">{value.toLocaleString("de-DE")}</dd>
            </div>
          ))}
        </dl>
      </header>

      <section aria-label="Sections" className="grid grid-cols-2 gap-3">
        <SectionTile icon={CarFront} name="Cars" detail="Search and filter every car" size="large" href="/car" />
        <SectionTile icon={Package} name="Boxes" detail="Contents and drop rates" size="large" />
        <SectionTile icon={MapIcon} name="Map" detail="Jobs and gas stations" size="small" />
        <SectionTile icon={Dices} name="Simulator" detail="Try your luck on boxes" size="small" />
      </section>

      {recentCars.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400">Recently added</h2>
            <Link href="/car" className="text-sm text-accent hover:underline">
              View all cars
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
            {recentCars.map((card) => (
              <CarTile key={card._id} card={card} />
            ))}
          </div>
        </section>
      ) : null}

      <a
        href="https://discord.gg/QPMguJNTsG"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-950 p-4 hover:border-accent"
      >
        <span className="space-y-1">
          <span className="block font-bold">Join the Discord</span>
          <span className="block text-sm text-zinc-400">Hear about new sections as they ship.</span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-bold text-black">
          <img src="/discord.svg" alt="" width="16" height="16" className="brightness-0" />
          Join server
        </span>
      </a>
    </main>
  );
}
