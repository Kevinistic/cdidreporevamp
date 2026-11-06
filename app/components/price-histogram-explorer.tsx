"use client";

import { useId, useMemo, useRef, useState } from "react";
import { formatCompact, getPriceHistogramByCount } from "../lib/price-histogram";

const MIN_BINS = 10;
const MAX_BINS = 80;
const DEFAULT_BINS = 40;

const WIDTH = 960;
const HEIGHT = 420;
const PAD = { left: 56, right: 16, top: 12, bottom: 56 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

type PriceHistogramExplorerProps = {
  prices: number[];
  mean: number;
  median: number;
};

type Hover = { index: number; x: number; y: number };

const formatRupiah = (value: number) => `Rp. ${Math.round(value).toLocaleString("de-DE")}`;

export function PriceHistogramExplorer({ prices, mean, median }: PriceHistogramExplorerProps) {
  const sliderId = useId();
  const [binCount, setBinCount] = useState(DEFAULT_BINS);
  const [hover, setHover] = useState<Hover | null>(null);
  const frame = useRef<HTMLDivElement>(null);

  const histogram = useMemo(() => getPriceHistogramByCount(prices, binCount), [prices, binCount]);
  if (!histogram) return null;

  const { bins, maxCount, lo, hi } = histogram;
  const yMax = Math.max(5, Math.ceil((maxCount * 1.05) / 5) * 5);
  const barWidth = PLOT_W / bins.length;
  const x = (price: number) => PAD.left + (PLOT_W * (Math.log10(price) - lo)) / (hi - lo);
  const y = (count: number) => PAD.top + PLOT_H * (1 - count / yMax);

  const yTicks = Array.from({ length: 6 }, (_, k) => Math.round((yMax * k) / 5));
  const xTicks: number[] = [];
  for (let power = Math.floor(lo); power <= Math.ceil(hi); power++) {
    for (const multiplier of [1, 2, 5]) {
      const value = multiplier * 10 ** power;
      if (Math.log10(value) >= lo - 1e-9 && Math.log10(value) <= hi + 1e-9) xTicks.push(value);
    }
  }

  const hovered = hover ? bins[hover.index] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
        <label htmlFor={sliderId}>Bins</label>
        <input
          id={sliderId}
          type="range"
          min={MIN_BINS}
          max={MAX_BINS}
          step={1}
          value={binCount}
          onChange={(event) => setBinCount(Number(event.target.value))}
          className="w-48 accent-accent"
        />
        <output htmlFor={sliderId} className="w-6 font-bold tabular-nums text-white">
          {binCount}
        </output>
        <span className="ml-auto flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-0.5 w-4 bg-white" /> Median
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-0 w-4 border-t-2 border-dashed border-amber-400" /> Mean
          </span>
        </span>
      </div>

      <div ref={frame} className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Histogram of car prices in ${bins.length} logarithmic bins`}
          className="block h-auto w-full"
        >
          {yTicks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} className="stroke-zinc-800" />
              <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" className="fill-zinc-500 text-[12px]">
                {tick}
              </text>
            </g>
          ))}

          {bins.map((bin, i) => (
            <rect
              key={i}
              x={PAD.left + i * barWidth + 0.5}
              y={y(bin.count)}
              width={Math.max(1, barWidth - 1)}
              height={y(0) - y(bin.count)}
              rx={1}
              className={hover?.index === i ? "fill-emerald-300" : "fill-accent"}
              onMouseMove={(event) => {
                const box = frame.current?.getBoundingClientRect();
                if (box) setHover({ index: i, x: event.clientX - box.left, y: event.clientY - box.top });
              }}
              onMouseLeave={() => setHover(null)}
            >
              <title>{`${formatCompact(bin.from)} – ${formatCompact(bin.to)}: ${bin.count} cars`}</title>
            </rect>
          ))}

          {xTicks.map((tick) => (
            <g key={tick}>
              <line x1={x(tick)} x2={x(tick)} y1={y(0)} y2={y(0) + 5} className="stroke-zinc-500" />
              <text x={x(tick)} y={y(0) + 20} textAnchor="middle" className="fill-zinc-500 text-[12px]">
                {formatCompact(tick)}
              </text>
            </g>
          ))}

          <line x1={x(median)} x2={x(median)} y1={PAD.top} y2={y(0)} className="stroke-white" strokeWidth={1.5} />
          <line
            x1={x(mean)}
            x2={x(mean)}
            y1={PAD.top}
            y2={y(0)}
            className="stroke-amber-400"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />

          <text
            x={PAD.left + PLOT_W / 2}
            y={HEIGHT - 12}
            textAnchor="middle"
            className="fill-zinc-500 text-[12px]"
          >
            Price (Rp., log scale)
          </text>
          <text
            transform={`translate(16 ${PAD.top + PLOT_H / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-zinc-500 text-[12px]"
          >
            Number of cars
          </text>
        </svg>

        {hover && hovered ? (
          <div
            role="presentation"
            className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-zinc-700 bg-black px-2.5 py-1.5 text-sm"
            style={{ left: Math.min(hover.x + 12, (frame.current?.clientWidth ?? 0) - 180), top: hover.y + 12 }}
          >
            <p className="text-zinc-300">
              {formatRupiah(hovered.from)} – {formatRupiah(hovered.to)}
            </p>
            <p className="font-bold text-accent">
              {hovered.count} {hovered.count === 1 ? "car" : "cars"}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
