"use client";

import { useEffect, useRef } from "react";
import type { CardItem } from "./card";
import { CarTile } from "./car-tile";

type CardsGridProps = {
  cards: CardItem[];
  onOpenCard: (card: CardItem) => void;
};

export function CardsGrid({ cards, onOpenCard }: CardsGridProps) {
  const gridRef = useRef<HTMLElement>(null);

  // Keyed on the rows rather than the page number, so a filter change on page 1 also scrolls to the top.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gridRef.current?.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
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
          <CarTile key={card._id} card={card} onOpen={onOpenCard} />
        ))}
      </div>
    </section>
  );
}
