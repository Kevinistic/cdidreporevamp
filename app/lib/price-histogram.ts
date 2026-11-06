export type PriceBin = {
  from: number;
  to: number;
  count: number;
};

export type PriceHistogram = {
  bins: PriceBin[];
  maxCount: number;
  // The exponents (powers of 10) at each decade boundary, with their position along the axis from 0 to 1.
  decades: { exponent: number; position: number }[];
};

// Logarithmic bins: every decade (10M to 100M, 100M to 1B, ...) is split into `binsPerDecade` equal steps in log
// space, so each bin is a constant ratio wider than the last. Edges line up with powers of 10.
export function getPriceHistogram(prices: readonly number[], binsPerDecade = 6): PriceHistogram | null {
  const valid = prices.filter((price) => Number.isFinite(price) && price > 0);
  if (valid.length === 0) return null;

  // Integer bin indexes avoid floating point drift at the edges. The epsilon keeps exact powers of 10 in the bin
  // they start.
  const indexOf = (price: number) => Math.floor(Math.log10(price) * binsPerDecade + 1e-9);

  const indexes = valid.map(indexOf);
  const firstDecade = Math.floor(Math.min(...indexes) / binsPerDecade);
  const startIndex = firstDecade * binsPerDecade;
  const endIndex = Math.max(...indexes);
  const binCount = endIndex - startIndex + 1;

  const counts = new Array<number>(binCount).fill(0);
  for (const index of indexes) counts[index - startIndex]++;

  const edge = (index: number) => 10 ** (index / binsPerDecade);
  const bins = counts.map((count, i) => ({ from: edge(startIndex + i), to: edge(startIndex + i + 1), count }));

  const decades: PriceHistogram["decades"] = [];
  for (let index = startIndex; index <= endIndex + 1; index += binsPerDecade) {
    decades.push({ exponent: index / binsPerDecade, position: (index - startIndex) / binCount });
  }

  return { bins, maxCount: Math.max(...counts), decades };
}

const UNITS: ReadonlyArray<readonly [size: number, suffix: string]> = [
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
];

// 14677993 -> "14.7M", 1e9 -> "1B".
export function formatCompact(value: number) {
  const unit = UNITS.find(([size]) => value >= size);
  if (!unit) return String(Math.round(value));
  return `${parseFloat((value / unit[0]).toPrecision(3))}${unit[1]}`;
}
