import type { Metadata } from "next";
import Image from "next/image";
import { PageTabs } from "../components/page-tabs";
import { formatBoxPrice, formatOdds, ITEM_ICONS, TIER_COLORS } from "../lib/box-display";
import { getBoxes, getBoxItemImage, type Box, type BoxItem } from "../lib/boxes";
import { cn } from "../lib/cn";

const title = "The CDID Database (Unofficial)";
const description =
  "Every box in Car Driving Indonesia (CDID) on Roblox, with prices, contents and in-game drop rates.";

export const metadata: Metadata = {
  alternates: { canonical: "/box" },
  title: { absolute: title },
  description,
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

function ItemRow({ item, odds }: { item: BoxItem; odds: string }) {
  const Icon = ITEM_ICONS[item.itemType];
  const name = item.car?.CarName ?? item.name ?? "Unknown car";
  const image = getBoxItemImage(item);
  const content = (
    <>
      <div className="relative flex size-10 shrink-0 items-center justify-center">
        {image ? (
          <Image src={image} alt="" fill sizes="40px" className="object-contain" />
        ) : (
          <Icon size={20} aria-hidden="true" className="text-zinc-500" />
        )}
      </div>
      <span className="min-w-0 flex-1 text-sm">{name}</span>
      <span className="shrink-0 text-sm text-zinc-400">{odds}</span>
    </>
  );
  const className = "flex items-center gap-3 px-3 py-1.5";

  return item.car ? (
    // A plain <a>, not next/link: car pages are opened by a full page load only (see app/car/[token]).
    <a href={`/car/${item.car.token}`} className={cn(className, "hover:bg-zinc-900 hover:text-accent")}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}

function BoxPanel({ box }: { box: Box }) {
  return (
    <>
      <h2 className="sr-only">{box.name}</h2>

      <div className="grid items-start gap-3 lg:grid-cols-4">
        {box.tiers.map((tier) => (
          <section
            key={tier.name}
            className="divide-y divide-zinc-800 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950"
          >
            <div
              className="flex items-baseline justify-between gap-4 bg-zinc-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: TIER_COLORS[tier.name] }}
            >
              <h3>{tier.name}</h3>
              <p className="tracking-normal">{formatOdds(tier.rate)}</p>
            </div>
            {tier.items.map((item) => (
              <ItemRow
                key={`${item.itemType}-${item.carId ?? item.name}`}
                item={item}
                odds={formatOdds(tier.rate / tier.items.length)}
              />
            ))}
          </section>
        ))}
      </div>
    </>
  );
}

export default async function BoxesPage() {
  const boxes = await getBoxes();
  const heading = <h1 className="text-2xl font-bold">Boxes</h1>;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 lg:py-4">
      {boxes.length > 0 ? (
        <PageTabs
          heading={heading}
          label="Boxes"
          tabs={boxes.map((box) => ({
            slug: box.slug,
            label: box.name.replace(/ Box$/, ""),
            aside: formatBoxPrice(box),
            content: <BoxPanel box={box} />,
          }))}
        />
      ) : (
        <>
          {heading}
          <p className="text-zinc-400">No boxes to show right now.</p>
        </>
      )}

      <p className="mt-auto text-sm text-zinc-500">
        Prices and drop rates are as shown in-game. This site is unofficial and isn&apos;t affiliated with the game.
      </p>
    </main>
  );
}
