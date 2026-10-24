"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { CardItem } from "./card";
import { cn } from "../lib/cn";

type CardsGridProps = {
  cards: CardItem[];
};

export function CardsGrid({ cards }: CardsGridProps) {
  const gridRef = useRef<HTMLElement>(null);

  // Keyed on the rows rather than the page number, so a filter change on page 1 also scrolls to the top.
  useEffect(() => {
    gridRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [cards]);

  return (
    <section
      ref={gridRef}
      className="min-h-0 flex-1 overflow-y-auto px-2 py-2
      [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-thumb]:bg-zinc-600"
    >
      {cards.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">No cars match these filters.</p>
      ) : null}
      <div className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {cards.map((card) => (
          <Link
            key={card._id}
            href={`/car/${card.token}`}
            className={cn(
              "flex h-full flex-col justify-between rounded-lg border border-zinc-700 hover:border-zinc-500 p-2 text-white shadow-sm",
              card.Legacy ? "bg-[#230405]" : "bg-zinc-950"
            )}
          >
            <div>
              <p className="text-sm font-bold text-center">{card.CarName}</p>
              <p className="text-xs text-center">Rp. {card.Price.toLocaleString("de-DE")}</p>
            </div>
            {card.CarImageUrl && (
              <div className="relative mb-1 h-24 w-full">
                <Image
                  src={card.CarImageUrl}
                  alt={card.CarName}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-contain"
                />
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
