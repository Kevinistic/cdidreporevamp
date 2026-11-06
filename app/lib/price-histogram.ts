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

export type CountHistogram = {
  bins: PriceBin[];
  maxCount: number;
  // Log10 of the lowest and highest price: the x axis runs between them.
  lo: number;
  hi: number;
};

// `binCount` equal-width steps in log10 space between the cheapest and the most expensive price.
export function getPriceHistogramByCount(prices: readonly number[], binCount: number): CountHistogram | null {
  const valid = prices.filter((price) => Number.isFinite(price) && price > 0);
  if (valid.length === 0) return null;

  let lo = Infinity;
  let hi = -Infinity;
  for (const price of valid) {
    const value = Math.log10(price);
    if (value < lo) lo = value;
    if (value > hi) hi = value;
  }
  if (hi === lo) hi = lo + 1e-9;

  const counts = new Array<number>(binCount).fill(0);
  for (const price of valid) {
    const index = Math.floor(((Math.log10(price) - lo) / (hi - lo)) * binCount);
    counts[Math.min(binCount - 1, index)]++;
  }

  const edge = (index: number) => 10 ** (lo + ((hi - lo) * index) / binCount);
  const bins = counts.map((count, i) => ({ from: edge(i), to: edge(i + 1), count }));
  return { bins, maxCount: Math.max(...counts), lo, hi };
}

export type PriceStats = {
  count: number;
  min: number;
  max: number;
  range: number;
  mean: number;
  median: number;
  mode: number;
  modeCount: number;
  stdev: number;
  variationPercent: number;
  q1: number;
  q3: number;
  iqr: number;
  p5: number;
  p95: number;
  geometricMean: number;
  skewness: number;
};

// Linear interpolation between the closest ranks of an ascending array.
function percentile(sorted: readonly number[], fraction: number) {
  const position = (sorted.length - 1) * fraction;
  const below = Math.floor(position);
  const above = Math.ceil(position);
  return sorted[below] + (sorted[above] - sorted[below]) * (position - below);
}

export function getPriceStats(prices: readonly number[]): PriceStats | null {
  const sorted = prices.filter((price) => Number.isFinite(price) && price > 0).sort((a, b) => a - b);
  const count = sorted.length;
  if (count === 0) return null;

  const mean = sorted.reduce((sum, price) => sum + price, 0) / count;
  // Sample standard deviation (n - 1).
  const stdev = count > 1 ? Math.sqrt(sorted.reduce((sum, price) => sum + (price - mean) ** 2, 0) / (count - 1)) : 0;
  const skewness =
    stdev > 0 ? sorted.reduce((sum, price) => sum + ((price - mean) / stdev) ** 3, 0) / count : 0;
  const geometricMean = 10 ** (sorted.reduce((sum, price) => sum + Math.log10(price), 0) / count);

  const frequency = new Map<number, number>();
  for (const price of sorted) frequency.set(price, (frequency.get(price) ?? 0) + 1);
  let mode = sorted[0];
  let modeCount = 0;
  for (const [price, times] of frequency) {
    if (times > modeCount) {
      mode = price;
      modeCount = times;
    }
  }

  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  return {
    count,
    min: sorted[0],
    max: sorted[count - 1],
    range: sorted[count - 1] - sorted[0],
    mean,
    median: percentile(sorted, 0.5),
    mode,
    modeCount,
    stdev,
    variationPercent: (stdev / mean) * 100,
    q1,
    q3,
    iqr: q3 - q1,
    p5: percentile(sorted, 0.05),
    p95: percentile(sorted, 0.95),
    geometricMean,
    skewness,
  };
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
