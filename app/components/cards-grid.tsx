"use client";

import Image from "next/image";
import { useEffect, useMemo } from "react";
import type { Filters } from "./sidebar-filters";
import type { CardItem } from "./card";

type SupabaseRow = Record<string, unknown>;

type CachedPage = {
  rows: CardItem[];
  total: number | null;
};

const MAX_PREFETCH_DISTANCE = 1;

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  return Boolean(value);
}

type CardsGridProps = {
  cards?: CardItem[];
  search?: string;
  filters?: Filters | undefined;
  page: number;
  pageSize: number;
  onTotalItemsChange?: (totalItems: number) => void;
  onCardClick?: (card: CardItem) => void;
  isLoading?: boolean;
};

export type { CardItem };

const EMPTY_CARDS: CardItem[] = [];

export function CardsGrid({
  cards = EMPTY_CARDS,
  search,
  filters,
  page,
  pageSize,
  onTotalItemsChange,
  onCardClick,
  isLoading = false,
}: CardsGridProps) {
  // 1. Client-side filtering and sorting
  const filteredAndSorted = useMemo(() => {
    let result = [...cards];

    // Search Query (case-insensitive includes)
    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      result = result.filter((card) =>
        card.CarName.toLowerCase().includes(q)
      );
    }

    // Sidebar Filters
    if (filters) {
      // Dealership options filter
      if (filters.dealerships) {
        const { included, excluded } = filters.dealerships;
        if (included && included.length > 0) {
          result = result.filter((card) => included.includes(card.Dealership));
        }
        if (excluded && excluded.length > 0) {
          result = result.filter((card) => !excluded.includes(card.Dealership));
        }
      }
      // Limited status filter
      if (filters.limiteds) {
        const { included, excluded } = filters.limiteds;
        if (included && included.length > 0) {
          result = result.filter((card) => included.includes(card.Limited));
        }
        if (excluded && excluded.length > 0) {
          result = result.filter((card) => !excluded.includes(card.Limited));
        }
      }
      // Gamepass options filter
      if (filters.gamepasses) {
        const { included, excluded } = filters.gamepasses;
        if (included && included.length > 0) {
          result = result.filter((card) => included.includes(card.Gamepass));
        }
        if (excluded && excluded.length > 0) {
          result = result.filter((card) => !excluded.includes(card.Gamepass));
        }
      }
      // New cars filter
      if (filters.other && filters.other.newCars) {
        const newCarsState = filters.other.newCars;
        if (newCarsState === "include") {
          result = result.filter((card) => card.New);
        } else if (newCarsState === "exclude") {
          result = result.filter((card) => !card.New);
        }
      }
      // Event cars filter
      if (filters.other && filters.other.eventCars) {
        const eventCarsState = filters.other.eventCars;
        if (eventCarsState === "include") {
          result = result.filter((card) => card.event);
        } else if (eventCarsState === "exclude") {
          result = result.filter((card) => !card.event);
        }
      }
      // Minigame cars filter
      if (filters.other && filters.other.minigameCars) {
        const minigameCarsState = filters.other.minigameCars;
        if (minigameCarsState === "include") {
          result = result.filter((card) => card.minigame);
        } else if (minigameCarsState === "exclude") {
          result = result.filter((card) => !card.minigame);
        }
      }
      // Legacy cars filter
      if (filters.other && filters.other.legacyCars) {
        const legacyCarsState = filters.other.legacyCars;
        if (legacyCarsState === "include") {
          result = result.filter((card) => card.Legacy);
        } else if (legacyCarsState === "exclude") {
          result = result.filter((card) => !card.Legacy);
        }
      }
      // Price range filter
      if (filters.priceRange) {
        const minVal = parseFloat(filters.priceRange.min);
        const maxVal = parseFloat(filters.priceRange.max);
        if (!Number.isNaN(minVal) && minVal > 0) {
          result = result.filter((card) => card.Price >= minVal);
        }
        if (!Number.isNaN(maxVal) && maxVal > 0) {
          result = result.filter((card) => card.Price <= maxVal);
        }
      }

      // Sorting
      const sortBy = filters.sortBy || "price-desc";
      result.sort((a, b) => {
        if (sortBy === "name-asc") {
          return a.CarName.localeCompare(b.CarName, undefined, { sensitivity: "base" });
        }
        if (sortBy === "name-desc") {
          return b.CarName.localeCompare(a.CarName, undefined, { sensitivity: "base" });
        }
        if (sortBy === "price-asc") {
          return a.Price - b.Price;
        }
        // price-desc or default
        return b.Price - a.Price;
      });
    }

    return result;
  }, [cards, search, filters]);

  // Notify parent of total results count
  useEffect(() => {
    onTotalItemsChange?.(filteredAndSorted.length);
  }, [filteredAndSorted.length, onTotalItemsChange]);

  // Page the rows client-side
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredAndSorted.slice(start, end);
  }, [filteredAndSorted, page, pageSize]);

  return (
    <section
      className="min-h-0 flex-1 overflow-y-auto px-2 py-2
      [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-thumb]:bg-gray-600"
    >
      {isLoading ? <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gray-500">Loading page...</p> : null}
      <div className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {pagedRows.map((card) => (
          <button
            key={card._id}
            type="button"
            onClick={() => onCardClick?.(card)}
            className="flex h-full flex-col justify-between rounded-lg border border-gray-700 p-2 text-white shadow-sm hover:bg-gray-800"
          >
            <div>
              <p className="text-sm font-bold text-center">{card.CarName}</p>
              <p className="text-xs text-center">Rp. {card.Price.toLocaleString('de-DE')}</p>
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
          </button>
        ))}
      </div>
    </section>
  );
}