import { Calculator, CalendarClock, CarFront, Heart, Map as MapIcon, Package, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CarTile } from "./components/car-tile";
import { PriceHistogram } from "./components/price-histogram";
import { cn } from "./lib/cn";
import { getCars } from "./lib/cars";
import { getPriceHistogram } from "./lib/price-histogram";
import { getNextUpdate } from "./lib/updates";
import repoLogo from "./repo.svg";

const title = "The CDID Database (Unofficial)";
const description =
  "The unofficial Car Driving Indonesia (CDID) database for Roblox. Browse every car by price, dealership, gamepass and limited status.";

const RECENT_CAR_LIMIT = 6;

// The next-update card is computed from the current time, so refresh the page hourly.
export const revalidate = 3600;

// Sociabuzz has no API, so update the raised amount by hand.
const DONATION_GOAL = 300_000;
const DONATION_RAISED = 0;
const donationPercent = Math.min(100, Math.round((DONATION_RAISED / DONATION_GOAL) * 100));
const formatRupiah = (value: number) => `Rp. ${value.toLocaleString("de-DE")}`;

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
  href?: string;
};

// A tile without an `href` is a section that hasn't shipped yet.
function SectionTile({ icon: Icon, name, detail, href }: SectionTileProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <Icon size={32} aria-hidden="true" className={href ? "text-accent" : "text-zinc-500"} />
        {href ? null : (
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">Soon</span>
        )}
      </div>
      <div>
        <h2 className="text-2xl font-bold">{name}</h2>
        <p className="text-sm text-zinc-400">{detail}</p>
      </div>
    </>
  );
  const className =
    "flex min-h-36 flex-col justify-between gap-4 rounded-lg border bg-zinc-950 p-4";

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
  // Same order as /car's default sort, most expensive first.
  const recentCars = cars
    .filter((car) => car.New)
    .sort((a, b) => b.Price - a.Price)
    .slice(0, RECENT_CAR_LIMIT);
  const nextUpdate = getNextUpdate();
  const prices = cars.map((car) => car.Price);
  const priceHistogram = getPriceHistogram(prices);
  const medianPrice = [...prices].sort((a, b) => a - b)[prices.length >> 1] ?? 0;
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
              <dd className="text-2xl font-bold text-accent">{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <section aria-label="Sections" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SectionTile icon={CarFront} name="Cars" detail="Search and filter every car" href="/car" />
        <SectionTile icon={Package} name="Boxes" detail="Contents and drop rates" href="/box" />
        <SectionTile icon={MapIcon} name="Map" detail="Jobs and places" />
        <SectionTile icon={Calculator} name="Tools" detail="Calculate car prices and simulate box opens" href="/tool" />
      </section>

      {recentCars.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400">Recently added</h2>
            <Link href="/car?type=new" className="text-sm text-accent hover:underline">
              View all new cars
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
            {recentCars.map((card) => (
              <CarTile key={card._id} card={card} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-950 p-4">
          <div className="space-y-1">
            <p className="font-bold">{nextUpdate.title}</p>
            <p className="font-bold text-accent">{nextUpdate.headline}</p>
            <p className="text-sm text-zinc-400">{nextUpdate.detail}</p>
          </div>
          <CalendarClock aria-hidden size={32} className="text-accent" />
        </div>

        {priceHistogram ? (
          <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-bold">Price distribution</p>
                <p className="text-sm text-zinc-400">
                  Log scale, {cars.length} cars. Median {formatRupiah(medianPrice)}.
                </p>
              </div>
              <Link href="/histogram" className="shrink-0 text-sm text-accent hover:underline">
                Full histogram
              </Link>
            </div>
            <PriceHistogram histogram={priceHistogram} total={cars.length} />
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-950 p-4">
          <div className="space-y-1">
            <p className="font-bold">Join the Discord</p>
            <p className="text-sm text-zinc-400">Report inaccurate info, suggest features, and hear about updates.</p>
          </div>
          <a
            href="https://discord.gg/QPMguJNTsG"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-bold text-black hover:bg-accent/85"
          >
            <img src="/discord.svg" alt="" width="16" height="16" className="brightness-0" />
            Join server
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-950 p-4">
          <div className="space-y-1">
            <p className="font-bold">Support the project</p>
            <p className="text-sm text-zinc-400">CDIDRepo is free. All money will proceed towards getting a web domain. Only donate when you&apos;re willing and able to!</p>
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Money raised</span>
                <span>
                  {formatRupiah(DONATION_RAISED)} / {formatRupiah(DONATION_GOAL)}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Money raised"
                aria-valuemin={0}
                aria-valuemax={DONATION_GOAL}
                aria-valuenow={DONATION_RAISED}
                className="h-2 overflow-hidden rounded-full bg-zinc-800"
              >
                <div className="h-full bg-accent" style={{ width: `${donationPercent}%` }} />
              </div>
            </div>
          </div>
          <a
            href="https://sociabuzz.com/cdidrepo/support"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-bold text-black hover:bg-accent/85"
          >
            <Heart aria-hidden size={16} />
            Donate
          </a>
        </div>
      </div>
    </main>
  );
}
