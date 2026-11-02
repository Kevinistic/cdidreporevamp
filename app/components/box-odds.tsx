"use client";

import { useState } from "react";
import { BoxPicker, ItemImage } from "./box-controls";
import { formatBoxPrice, formatOdds, TIER_COLORS } from "../lib/box-display";
import { getChanceWithin, getItemOdds, getOpensForChance } from "../lib/box-odds";
import { getPityLimit, PITY_TIER, type SimBox } from "../lib/box-sim";

const DEFAULT_OPENS = 10;
const MAX_OPENS = 100_000;

const formatNumber = (value: number) => value.toLocaleString("de-DE", { maximumFractionDigits: 1 });

const formatOpens = (count: number) => `${formatNumber(count)} ${count === 1 ? "open" : "opens"}`;

// The extremes stay visible as ranges, because a rounded 0% or 100% would be wrong.
function formatChance(chance: number): string {
  if (chance < 0.0001) return "<0.01%";
  if (chance > 0.9999) return ">99.99%";
  return `${(chance * 100).toLocaleString("de-DE", { maximumFractionDigits: 2 })}%`;
}

function parseOpens(input: string): number {
  return Math.min(Math.max(Math.floor(Number(input)) || 1, 1), MAX_OPENS);
}

function getFirstItemId(box?: SimBox): string | undefined {
  const tier = box?.tiers.find(({ items }) => items.length > 0);
  return tier ? `${tier.name}:${tier.items[0].key}` : undefined;
}

export function BoxOdds({ boxes }: { boxes: SimBox[] }) {
  const [activeSlug, setActiveSlug] = useState(boxes[0]?.slug);
  const [selectedId, setSelectedId] = useState(getFirstItemId(boxes[0]));
  const [opensInput, setOpensInput] = useState(String(DEFAULT_OPENS));

  const box = boxes.find(({ slug }) => slug === activeSlug);
  if (!box) return <p className="text-zinc-400">No boxes to show right now.</p>;

  const selectedTier = box.tiers.find((tier) => selectedId?.startsWith(`${tier.name}:`));
  const selectedItem = selectedTier?.items.find((item) => `${selectedTier.name}:${item.key}` === selectedId);
  const odds = selectedTier ? getItemOdds(box, selectedTier) : null;

  const opens = parseOpens(opensInput);
  const pityLimit = getPityLimit(box);

  const getCost = (count: number) =>
    box.price === null ? null : formatBoxPrice({ price: Math.round(box.price * count), currency: box.currency });

  const selectBox = (slug: string) => {
    setActiveSlug(slug);
    setSelectedId(getFirstItemId(boxes.find((candidate) => candidate.slug === slug)));
  };

  const rows = [
    { label: "On average", count: odds ? odds.averageOpens : null },
    { label: "50% chance", count: odds ? getOpensForChance(odds, 0.5) : null },
    { label: "90% chance", count: odds ? getOpensForChance(odds, 0.9) : null },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <BoxPicker boxes={boxes} activeBox={box} onSelect={selectBox} />

      <div className="flex flex-wrap gap-3">
        <label className="min-w-0 flex-1 basis-64 space-y-1 text-sm text-zinc-400">
          <span>Item</span>
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-accent focus:outline-none"
          >
            {box.tiers.map((tier) => (
              <optgroup key={tier.name} label={`${tier.name} (${formatOdds(tier.rate)})`}>
                {tier.items.map((item) => (
                  <option key={item.key} value={`${tier.name}:${item.key}`}>
                    {item.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="w-32 space-y-1 text-sm text-zinc-400">
          <span>Opens</span>
          <input
            type="number"
            min={1}
            max={MAX_OPENS}
            value={opensInput}
            onChange={(event) => setOpensInput(event.target.value)}
            onBlur={() => setOpensInput(String(opens))}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-accent focus:outline-none"
          />
        </label>
      </div>

      <section aria-label="Odds" className="divide-y divide-zinc-800 rounded-lg border border-zinc-700 bg-zinc-950">
        {selectedTier && selectedItem ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="relative flex size-12 shrink-0 items-center justify-center">
              <ItemImage item={selectedItem} size={48} iconSize={24} />
            </div>
            <div className="min-w-0">
              <p className="font-bold">{selectedItem.name}</p>
              <p className="text-sm" style={{ color: TIER_COLORS[selectedTier.name] }}>
                {selectedTier.name}, {formatOdds(selectedTier.rate / selectedTier.items.length)} per open
              </p>
            </div>
          </div>
        ) : null}

        <div className="px-4 py-3">
          <p className="text-3xl font-bold text-accent">{odds ? formatChance(getChanceWithin(odds, opens)) : "—"}</p>
          <p className="text-sm text-zinc-400">
            chance within {formatOpens(opens)}
            {getCost(opens) ? `, costing ${getCost(opens)}` : ""}
          </p>
        </div>

        <table className="w-full text-sm">
          <tbody className="divide-y divide-zinc-800">
            {rows.map(({ label, count }) => (
              <tr key={label}>
                <th scope="row" className="px-4 py-2 text-left font-normal text-zinc-400">
                  {label}
                </th>
                <td className="px-4 py-2 text-right">{count === null ? "—" : formatOpens(count)}</td>
                <td className="px-4 py-2 text-right text-zinc-400">{count === null ? "" : getCost(count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {pityLimit !== undefined ? (
        <p className="text-sm text-zinc-500">
          Includes the {PITY_TIER} pity at {pityLimit} opens, starting from 0.
        </p>
      ) : null}
    </div>
  );
}
