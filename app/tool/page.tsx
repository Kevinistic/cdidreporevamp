import type { Metadata } from "next";
import { BoxOdds } from "../components/box-odds";
import { BoxSimulator } from "../components/box-simulator";
import { PageTabs } from "../components/page-tabs";
import { PriceCalculator } from "../components/price-calculator";
import { getBoxes, getBoxItemImage } from "../lib/boxes";
import type { SimBox } from "../lib/box-sim";
import { getCars } from "../lib/cars";

const title = "The CDID Database (Unofficial)";
const description =
  "Tools for Car Driving Indonesia (CDID) on Roblox. Add up car prices and sell values, simulate box opens, and work out the odds of getting an item.";

export const metadata: Metadata = {
  alternates: { canonical: "/tool" },
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

export default async function ToolsPage() {
  const [cars, boxes] = await Promise.all([getCars(), getBoxes()]);

  // Only what the tools need, because everything passed here is sent to the browser.
  const calculatorCars = cars.map(({ token, CarName, Price, CarImageUrl }) => ({
    token,
    CarName,
    Price,
    CarImageUrl,
  }));
  const simBoxes: SimBox[] = boxes.map(({ slug, name, price, currency, tiers }) => ({
    slug,
    name,
    price,
    currency,
    tiers: tiers.map((tier) => ({
      name: tier.name,
      rate: tier.rate,
      items: tier.items.map((item) => ({
        key: `${item.itemType}-${item.carId ?? item.name}`,
        itemType: item.itemType,
        name: item.car?.CarName ?? item.name ?? "Unknown car",
        image: getBoxItemImage(item),
      })),
    })),
  }));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 lg:py-4">
      <PageTabs
        heading={<h1 className="text-2xl font-bold">Tools</h1>}
        label="Tools"
        tabs={[
          {
            slug: "calculator",
            label: "Price Calculator",
            content: <PriceCalculator cars={calculatorCars} />,
          },
          {
            slug: "simulator",
            label: "Box Simulator",
            content: <BoxSimulator boxes={simBoxes} />,
          },
          {
            slug: "odds",
            label: "Box Odds",
            content: <BoxOdds boxes={simBoxes} />,
          },
        ]}
      />

      <p className="mt-auto text-sm text-zinc-500">
        The simulator and odds use the drop rates shown in-game, so your real opens may differ. This site is unofficial
        and isn&apos;t affiliated with the game.
      </p>
    </main>
  );
}
