import { formatCompact, type PriceHistogram as PriceHistogramData } from "../lib/price-histogram";

type PriceHistogramProps = {
  histogram: PriceHistogramData;
  total: number;
};

// Server-rendered bars: no client JavaScript or chart library needed.
export function PriceHistogram({ histogram, total }: PriceHistogramProps) {
  const { bins, maxCount, decades } = histogram;

  return (
    <div>
      <div
        role="img"
        aria-label={`Histogram of ${total} car prices on a logarithmic scale, from ${formatCompact(bins[0].from)} to ${formatCompact(bins[bins.length - 1].to)}`}
        className="flex h-32 items-end gap-px border-b border-zinc-700"
      >
        {bins.map((bin) => (
          <div
            key={bin.from}
            title={`Rp. ${formatCompact(bin.from)} – ${formatCompact(bin.to)}: ${bin.count} ${bin.count === 1 ? "car" : "cars"}`}
            className="flex-1 rounded-t-sm bg-accent hover:bg-accent/70"
            style={{ height: bin.count > 0 ? `max(2px, ${(bin.count / maxCount) * 100}%)` : 0 }}
          />
        ))}
      </div>
      <div aria-hidden className="relative mt-1 h-4 text-xs text-zinc-500">
        {decades.map(({ exponent, position }) => (
          <span
            key={exponent}
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${position * 100}%` }}
          >
            {formatCompact(10 ** exponent)}
          </span>
        ))}
      </div>
    </div>
  );
}
