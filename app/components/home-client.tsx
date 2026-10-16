"use client";

import { SidebarFilters } from "./sidebar-filters";
import { CardsGrid } from "./cards-grid";
import { useEffect, useState, useMemo } from "react";
import type { CardItem } from "./card";
import type { Filters } from "./sidebar-filters";
import { SlidersHorizontal, ScrollText } from 'lucide-react';
import { Pagination } from "./pagination-bar";
import { MainCard } from "./maincard";
import { Credits } from "./credits";
import { cn } from "../lib/cn";
import { useFilteredCars } from "../lib/use-filtered-cars";

const PAGE_SIZE = 40;

type HomeClientProps = {
  cars: CardItem[];
};

export default function HomeClient({ cars }: HomeClientProps) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(false);
  const [filters, setFilters] = useState<Filters | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
  const [isCreditsVisible, setIsCreditsVisible] = useState(false);

  useEffect(() => {
    // 1. Closed by default on mobile (breakpoint 768px matches Tailwind md)
    if (window.innerWidth < 768) {
      setIsSidebarVisible(false);
    }
    // 2. Enable transitions after a brief delay to prevent slide on mount
    const transitionTimer = setTimeout(() => {
      setIsTransitionEnabled(true);
    }, 100);

    return () => {
      clearTimeout(transitionTimer);
    };
  }, []);

  const filteredCars = useFilteredCars(cars, filters);
  const total = filteredCars.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCars.slice(start, start + PAGE_SIZE);
  }, [filteredCars, page]);

  const maxPrice = useMemo(
    () => cars.reduce((max, car) => Math.max(max, car.Price), 0),
    [cars]
  );

  const { dealershipOptions, limitedOptions, gamepassOptions } = useMemo(() => {
    const getUnique = (col: keyof CardItem) => {
      const vals = cars
        .map((c) => c[col])
        .filter(Boolean)
        .map(String);
      return Array.from(new Set(vals)).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );
    };

    return {
      dealershipOptions: getUnique("Dealership").map((v) => ({ label: v, value: v })),
      limitedOptions: getUnique("Limited").map((v) => ({ label: v, value: v })),
      gamepassOptions: getUnique("Gamepass").map((v) => ({ label: v, value: v })),
    };
  }, [cars]);

  const handleFiltersChange = (nextFilters: Filters) => {
    setFilters(nextFilters);
    setCurrentPage(1);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
      <aside
        inert={!isSidebarVisible}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40 h-[70dvh] overflow-hidden border-t border-zinc-700 bg-black/95 p-4 backdrop-blur-md md:top-0 md:h-full md:w-80 md:border-r md:border-t-0",
          isTransitionEnabled && "transition-transform duration-200",
          !isSidebarVisible && "translate-y-full md:translate-y-0 md:-translate-x-full"
        )}
      >
        <div className="flex h-full w-full flex-col">
          <h1 className="text-xs uppercase tracking-[0.2em]">CDID Car Database (Unofficial)</h1>

          <SidebarFilters
            onChange={handleFiltersChange}
            carCount={total}
            maxPrice={maxPrice}
            dealershipOptions={dealershipOptions}
            limitedOptions={limitedOptions}
            gamepassOptions={gamepassOptions}
          />
        </div>
      </aside>

      {/* Mobile backdrop - only visible on mobile when sidebar is open */}
      {isSidebarVisible && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setIsSidebarVisible(false)}
        />
      )}

      <main
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          isTransitionEnabled && "transition-[padding-left] duration-200",
          isSidebarVisible && "md:pl-80"
        )}
      >
        <header className="flex h-16 items-center justify-between border-b border-zinc-700 px-2">
          <button
            type="button"
            onClick={() => setIsSidebarVisible((current) => !current)}
            aria-expanded={isSidebarVisible}
            aria-label={isSidebarVisible ? "Hide filters" : "Show filters"}
            className="rounded-md border border-zinc-500 px-2 py-2 text-sm text-white hover:bg-zinc-800"
          >
            <span className="relative z-10 flex items-center justify-center">
              <SlidersHorizontal size={16} aria-hidden="true" />
            </span>
          </button>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setCurrentPage} />

          <div className="flex items-center gap-2">
            <a
              href="https://discord.gg/QPMguJNTsG"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join the Discord server"
              className="inline-flex aspect-square items-center justify-center rounded-md border border-zinc-500 px-2 py-2 text-sm text-white hover:bg-zinc-800"
            >
              <img
                src="/discord.svg"
                alt=""
                width="16"
                height="16"
              />
            </a>

            <button
              type="button"
              onClick={() => {
                setSelectedCard(null);
                setIsCreditsVisible(true);
              }}
              aria-haspopup="dialog"
              aria-label="Open credits"
              className="rounded-md border border-zinc-500 px-2 py-2 text-sm text-white hover:bg-zinc-800"
            >
              <ScrollText size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        <CardsGrid cards={pagedRows} page={page} onCardClick={setSelectedCard} />

        {selectedCard ? <MainCard card={selectedCard} onBack={() => setSelectedCard(null)} /> : null}
        {isCreditsVisible ? <Credits onBack={() => setIsCreditsVisible(false)} /> : null}
      </main>
    </div>
  );
}
