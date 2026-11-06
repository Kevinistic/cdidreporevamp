import type { Metadata } from "next";
import { PriceHistogramExplorer } from "../components/price-histogram-explorer";
import { getCars } from "../lib/cars";
import { formatCompact, getPriceStats } from "../lib/price-histogram";

const title = "Car price distribution | The CDID Database (Unofficial)";
const description =
  "A histogram of every Car Driving Indonesia (CDID) car price on a logarithmic scale, with the mean, median, standard deviation and more.";

export const metadata: Metadata = {
  alternates: { canonical: "/histogram" },
  title: { absolute: title },
  description,
  openGraph: {
    title,
    description,
    type: "website",
    siteName: "The CDID Database (Unofficial)",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

const formatRupiah = (value: number) => `Rp. ${Math.round(value).toLocaleString("de-DE")}`;

export default async function HistogramPage() {
  const cars = await getCars();
  const prices = cars.map((car) => car.Price).filter((price) => price > 0);
  const stats = getPriceStats(prices);

  if (!stats) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
        <h1 className="text-2xl font-bold">Price distribution</h1>
        <p className="text-zinc-400">There are no car prices to show yet.</p>
      </main>
    );
  }

  const tiles: { label: string; value: string; hint?: string }[] = [
    { label: "Cars", value: stats.count.toLocaleString("de-DE") },
    { label: "Min", value: formatRupiah(stats.min), hint: formatCompact(stats.min) },
    { label: "Median", value: formatRupiah(stats.median), hint: formatCompact(stats.median) },
    { label: "Mean", value: formatRupiah(stats.mean), hint: formatCompact(stats.mean) },
    { label: "Max", value: formatRupiah(stats.max), hint: formatCompact(stats.max) },
    {
      label: "Mode",
      value: formatRupiah(stats.mode),
      hint: `${stats.modeCount} cars share this price`,
    },
    { label: "Geometric mean", value: formatRupiah(stats.geometricMean), hint: "Typical price on a log scale" },
    { label: "Std. deviation", value: formatRupiah(stats.stdev), hint: "Sample (n - 1)" },
    { label: "Variation", value: `${stats.variationPercent.toFixed(0)}%`, hint: "Std. deviation / mean" },
    { label: "Skewness", value: stats.skewness.toFixed(2), hint: "Above 0: a long tail of expensive cars" },
    { label: "5th percentile", value: formatRupiah(stats.p5), hint: formatCompact(stats.p5) },
    { label: "Q1 (25th)", value: formatRupiah(stats.q1), hint: formatCompact(stats.q1) },
    { label: "Q3 (75th)", value: formatRupiah(stats.q3), hint: formatCompact(stats.q3) },
    { label: "95th percentile", value: formatRupiah(stats.p95), hint: formatCompact(stats.p95) },
    { label: "IQR", value: formatRupiah(stats.iqr), hint: "Q3 minus Q1" },
    { label: "Range", value: formatRupiah(stats.range), hint: "Max minus min" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Price distribution</h1>
        <p className="text-sm text-zinc-400">
          Every car price on a logarithmic scale, because prices run from {formatCompact(stats.min)} to{" "}
          {formatCompact(stats.max)}. Each bin covers the same ratio of prices, not the same width.
        </p>
      </header>

      <section aria-label="Histogram" className="rounded-lg border border-zinc-700 bg-zinc-950 p-4">
        <PriceHistogramExplorer prices={prices} mean={stats.mean} median={stats.median} />
      </section>

      <section aria-label="Statistics" className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400">Statistics</h2>
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {tiles.map(({ label, value, hint }) => (
            <div key={label} className="flex flex-col-reverse rounded-lg border border-zinc-700 bg-zinc-950 p-3">
              {hint ? <dd className="text-xs text-zinc-500">{hint}</dd> : null}
              <dd className="break-words font-bold text-accent">{value}</dd>
              <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</dt>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
