"use client";

import { useEffect, useRef, useState } from "react";
import { BoxPicker, ItemImage } from "./box-controls";
import { formatBoxPrice, TIER_COLORS } from "../lib/box-display";
import { buildReel, getNextPity, getPityLimit, rollBox, type SimBox, type SimRoll } from "../lib/box-sim";
import { cn } from "../lib/cn";

type BoxStats = {
  opens: number;
  pity: number;
  tierCounts: Record<string, number>;
  itemCounts: Record<string, number>;
  latest: SimRoll[];
};

type SpinReel = {
  winner: SimRoll;
  rolls: SimRoll[];
  // Where the reel stops within the winning square, from -0.5 to 0.5 of its width.
  landing: number;
};

type Spin = {
  slug: string;
  reels: SpinReel[];
};

const EMPTY_STATS: BoxStats = { opens: 0, pity: 0, tierCounts: {}, itemCounts: {}, latest: [] };

const REEL_LENGTH = 60;
const WINNER_INDEX = 52;
const SPIN_MS = 5000;
// Ten reels stop one after another rather than all at once.
const SPIN_STAGGER_MS = 150;

const LARGE_REEL = { square: 96, gap: 8 };
const SMALL_REEL = { square: 56, gap: 4 };

const getReelSize = (reelCount: number) => (reelCount > 1 ? SMALL_REEL : LARGE_REEL);

function addRolls(stats: BoxStats, rolls: SimRoll[]): BoxStats {
  const next = { ...stats, tierCounts: { ...stats.tierCounts }, itemCounts: { ...stats.itemCounts }, latest: rolls };
  for (const roll of rolls) {
    next.opens += 1;
    next.pity = getNextPity(roll, next.pity);
    next.tierCounts[roll.tierName] = (next.tierCounts[roll.tierName] ?? 0) + 1;
    next.itemCounts[roll.item.key] = (next.itemCounts[roll.item.key] ?? 0) + 1;
  }
  return next;
}

function getIdleReel(box: SimBox): SimRoll[] {
  const rolls = box.tiers.flatMap((tier) => tier.items.map((item) => ({ tierName: tier.name, item })));
  return Array.from({ length: 4 }, () => rolls).flat();
}

// The same items count together, in the order the box lists them.
function groupRolls(box: SimBox, rolls: SimRoll[]): { roll: SimRoll; count: number }[] {
  return box.tiers.flatMap((tier) =>
    tier.items.flatMap((item) => {
      const count = rolls.filter((roll) => roll.tierName === tier.name && roll.item.key === item.key).length;
      return count > 0 ? [{ roll: { tierName: tier.name, item }, count }] : [];
    })
  );
}

function RollSquare({ roll, size, count }: { roll: SimRoll; size: number; count?: number }) {
  return (
    <div
      title={roll.item.name}
      style={{ width: size, height: size, borderColor: TIER_COLORS[roll.tierName] }}
      className="relative flex shrink-0 items-center justify-center rounded-md border-2 bg-zinc-900"
    >
      <ItemImage item={roll.item} size={size} iconSize={size / 2} />
      {count ? (
        <span className="absolute bottom-0 right-0 rounded-sm bg-black/80 px-1 text-xs font-bold">x{count}</span>
      ) : null}
    </div>
  );
}

export function BoxSimulator({ boxes }: { boxes: SimBox[] }) {
  const [activeSlug, setActiveSlug] = useState(boxes[0]?.slug);
  const [statsBySlug, setStatsBySlug] = useState<Record<string, BoxStats>>({});
  const [spin, setSpin] = useState<Spin | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [skipAnimation, setSkipAnimation] = useState(false);
  const reelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewports = reelsRef.current?.children;
    if (!spin || !viewports) return;

    const { square, gap } = getReelSize(spin.reels.length);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animations = spin.reels.flatMap((reel, index) => {
      const viewport = viewports[index];
      const strip = viewport?.firstElementChild;
      if (!strip) return [];

      const distance =
        WINNER_INDEX * (square + gap) + square / 2 + reel.landing * square - viewport.clientWidth / 2;
      return strip.animate(
        [{ transform: "translateX(0)" }, { transform: `translateX(-${distance}px)` }],
        {
          duration: reducedMotion ? 0 : SPIN_MS + index * SPIN_STAGGER_MS,
          easing: "cubic-bezier(0.1, 0.7, 0.1, 1)",
          fill: "forwards",
        }
      );
    });

    Promise.all(animations.map((animation) => animation.finished))
      .then(() => {
        setStatsBySlug((current) => ({
          ...current,
          [spin.slug]: addRolls(current[spin.slug] ?? EMPTY_STATS, spin.reels.map((reel) => reel.winner)),
        }));
        setIsSpinning(false);
      })
      // Cancelled by the next spin or by leaving the page, so the rolls are dropped.
      .catch(() => {});

    return () => animations.forEach((animation) => animation.cancel());
  }, [spin]);

  const box = boxes.find(({ slug }) => slug === activeSlug);
  if (!box) return <p className="text-zinc-400">No boxes to show right now.</p>;

  const stats = statsBySlug[box.slug] ?? EMPTY_STATS;
  const pityLimit = getPityLimit(box);
  const spent = box.price === null ? null : formatBoxPrice({ price: box.price * stats.opens, currency: box.currency });
  const reels = spin?.slug === box.slug ? spin.reels.map((reel) => reel.rolls) : [getIdleReel(box)];
  const reelSize = getReelSize(reels.length);
  const latest = isSpinning ? [] : groupRolls(box, stats.latest);
  const openedTiers = box.tiers.filter((tier) => stats.tierCounts[tier.name]);

  const selectBox = (slug: string) => {
    setActiveSlug(slug);
    setSpin(null);
  };

  const open = (count: number) => {
    const rolls: SimRoll[] = [];
    let pity = stats.pity;
    for (let index = 0; index < count; index += 1) {
      const roll = rollBox(box, pity);
      rolls.push(roll);
      pity = getNextPity(roll, pity);
    }

    if (skipAnimation) {
      setStatsBySlug((current) => ({ ...current, [box.slug]: addRolls(stats, rolls) }));
      setSpin(null);
      return;
    }

    setSpin({
      slug: box.slug,
      reels: rolls.map((winner) => ({
        winner,
        rolls: buildReel(box, winner, REEL_LENGTH, WINNER_INDEX),
        landing: (Math.random() - 0.5) * 0.8,
      })),
    });
    setIsSpinning(true);
  };

  const reset = () => {
    setStatsBySlug((current) => ({ ...current, [box.slug]: EMPTY_STATS }));
    setSpin(null);
  };

  return (
    <div className="space-y-3">
      <BoxPicker boxes={boxes} activeBox={box} onSelect={selectBox} disabled={isSpinning} />

      <div ref={reelsRef} className={cn("grid gap-2", reels.length > 1 ? "grid-cols-2 md:grid-cols-5" : "grid-cols-1")}>
        {reels.map((rolls, reelIndex) => (
          <div
            key={reelIndex}
            className="relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950 py-2"
          >
            <div className="flex w-max" style={{ gap: reelSize.gap }}>
              {rolls.map((roll, index) => (
                <RollSquare key={index} roll={roll} size={reelSize.square} />
              ))}
            </div>
            <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-accent" />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => open(1)}
            disabled={isSpinning}
            className="rounded-md bg-accent px-3 py-2 text-sm font-bold text-black hover:bg-accent/85 disabled:opacity-40"
          >
            Open 1
          </button>
          <button
            type="button"
            onClick={() => open(10)}
            disabled={isSpinning}
            className="rounded-md border border-accent px-3 py-2 text-sm font-bold text-accent hover:bg-zinc-900 disabled:opacity-40"
          >
            Open 10
          </button>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={skipAnimation}
          onClick={() => setSkipAnimation((current) => !current)}
          className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white"
        >
          <span
            className={cn(
              "flex h-5 w-9 items-center rounded-full p-0.5 transition-colors",
              skipAnimation ? "justify-end bg-accent" : "justify-start bg-zinc-700"
            )}
          >
            <span className="size-4 rounded-full bg-white" />
          </span>
          Skip animation
        </button>

        <button
          type="button"
          onClick={reset}
          disabled={isSpinning || stats.opens === 0}
          className="ml-auto rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Reset
        </button>
      </div>

      {latest.length > 0 ? (
        <div aria-live="polite" className="flex flex-wrap items-center gap-1">
          {latest.map(({ roll, count }) => (
            <RollSquare key={`${roll.tierName}-${roll.item.key}`} roll={roll} size={40} count={count} />
          ))}
          {stats.latest.length === 1 && latest.length === 1 ? (
            <p className="ml-2 text-sm" style={{ color: TIER_COLORS[latest[0].roll.tierName] }}>
              {latest[0].roll.item.name}
            </p>
          ) : null}
        </div>
      ) : null}

      <dl className="flex flex-wrap gap-x-6 gap-y-2">
        <div className="flex flex-col-reverse">
          <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">Opens</dt>
          <dd className="font-bold text-accent">{stats.opens}</dd>
        </div>
        {spent ? (
          <div className="flex flex-col-reverse">
            <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">Spent</dt>
            <dd className="font-bold text-accent">{spent}</dd>
          </div>
        ) : null}
        {pityLimit !== undefined ? (
          <div className="flex flex-col-reverse">
            <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">Pity</dt>
            <dd className="font-bold text-accent">
              {stats.pity} / {pityLimit}
            </dd>
          </div>
        ) : null}
      </dl>

      {stats.opens === 0 ? <p className="text-sm text-zinc-400">Open a box to see what you get.</p> : null}

      <div className="grid items-start gap-3 lg:grid-cols-4">
        {openedTiers.map((tier) => {
          const tierCount = stats.tierCounts[tier.name] ?? 0;
          return (
            <section
              key={tier.name}
              className="divide-y divide-zinc-800 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950"
            >
              <div
                className="flex items-baseline justify-between gap-4 bg-zinc-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: TIER_COLORS[tier.name] }}
              >
                <h3>{tier.name}</h3>
                <p className="tracking-normal">
                  {tierCount} ({Math.round((tierCount / stats.opens) * 1000) / 10}%)
                </p>
              </div>
              {tier.items.map((item) => {
                const itemCount = stats.itemCounts[item.key] ?? 0;
                if (itemCount === 0) return null;
                return (
                  <div key={item.key} className="flex items-center gap-2 px-3 py-1">
                    <div className="relative flex size-7 shrink-0 items-center justify-center">
                      <ItemImage item={item} size={28} iconSize={16} />
                    </div>
                    <span className="min-w-0 flex-1 text-sm">{item.name}</span>
                    <span className="shrink-0 text-sm font-bold">x{itemCount}</span>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}
