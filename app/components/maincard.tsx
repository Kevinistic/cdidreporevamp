"use client";

import Image from "next/image";
import type { CardItem } from "./card";
import { Modal } from "./modal";

type MainCardProps = {
  card: CardItem;
  onBack: () => void;
};

export function MainCard({ card, onBack }: MainCardProps) {
  return (
    <Modal
      label={card.CarName}
      onClose={onBack}
      className="max-w-4xl"
      contentClassName="gap-6 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex-1 space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Car Details</p>
        <h2 className="text-3xl font-bold">{card.CarName}</h2>

        {card.Legacy || card.Inaccurate ? (
          <div className="flex flex-wrap gap-2">
            {card.Legacy ? (
              <span className="rounded-full border border-rose-600 bg-rose-950/20 px-3 py-1 text-xs font-medium text-rose-400">
                No longer in-game
              </span>
            ) : null}
            {card.Inaccurate ? (
              <span className="rounded-full border border-amber-600 bg-amber-950/20 px-3 py-1 text-xs font-medium text-amber-400">
                May be inaccurate
              </span>
            ) : null}
          </div>
        ) : null}

        <p className="text-xl text-zinc-200">Rp. {card.Price.toLocaleString("de-DE")}</p>

        <div className="space-y-2 text-sm text-zinc-300">
          <p><span className="text-zinc-500">Dealership:</span> {card.Dealership || "N/A"}</p>
          <p><span className="text-zinc-500">Limited:</span> {card.Limited ?? "No"}</p>
          <p><span className="text-zinc-500">Gamepass:</span> {card.Gamepass ?? "No"}</p>
          <p><span className="text-zinc-500">Engine:</span> {card.Engine || "N/A"}</p>
        </div>
      </div>

      {card.CarImageUrl ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex h-full w-full max-w-[420px] flex-col">
            <div className="relative aspect-square w-full">
              <Image
                src={card.CarImageUrl}
                alt={card.CarName}
                fill
                sizes="(max-width: 768px) 90vw, 420px"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
