"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "../lib/supabase";
import type { Filters } from "./sidebar-filters";
import type { CardItem } from "./card";

type SupabaseRow = Record<string, unknown>;

function getViewName() {
  return process.env.NEXT_PUBLIC_SUPABASE_VIEW_NAME ?? "test";
}

type CardsGridProps = {
  cards?: CardItem[];
  search?: string;
  filters?: Filters | undefined;
  page: number;
  pageSize: number;
  onTotalItemsChange?: (totalItems: number) => void;
  onCardClick?: (card: CardItem) => void;
};

export type { CardItem };

const EMPTY_CARDS: CardItem[] = [];

export function CardsGrid({ cards = EMPTY_CARDS, search, filters, page, pageSize, onTotalItemsChange, onCardClick }: CardsGridProps) {
  const [rows, setRows] = useState<CardItem[]>(cards);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setLoadError("Supabase env vars are missing.");
      return;
    }

    let isMounted = true;

    const loadCards = async () => {
      const viewName = getViewName();
      setIsLoading(true);
      setLoadError(null);
      const batchSize = 1000;
      const allRows: SupabaseRow[] = [];
      let startIndex = 0;

      while (true) {
        const endIndex = startIndex + batchSize - 1;
        const { data, error } = await supabase
          .from(viewName)
          .select("*")
          .order("_id", { ascending: true })
          .range(startIndex, endIndex);

        if (!isMounted) {
          return;
        }

        if (error) {
          setLoadError(error.message);
          setIsLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          break;
        }

        allRows.push(...(data as SupabaseRow[]));

        if (data.length < batchSize) {
          break;
        }

        startIndex += batchSize;
      }

      setRows(
        allRows.map((card) => ({
          _id: String(card._id),
          CarName: String(card.CarName),
          Price: Number(card.Cost),
          CarImageUrl: String(card.CarImageUrl),
          Dealership: String(card.Dealership),
          Limited: String(card.Limited),
          Gamepass: String(card.Gamepass),
          Engine: String(card.Engine),
          RimsUrl: String(card.RimsUrl),
          rgb_0: String(card.rgb_0),
          rgb_1: String(card.rgb_1),
          rgb_2: String(card.rgb_2),
          Legacy: Boolean(card.Legacy),
          Inaccurate: Boolean(card.Inaccurate),
          Rims: String(card.Rims),
          New: Boolean(card.New),
        })),
      );
      setIsLoading(false);
    };

    void loadCards();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    return rows
      .filter((card) => {
        if (filters) {
          if (filters.newCars && !card.New) return false;

          if (filters.limiteds) {
            const limitedValue = String(card.Limited ?? "");
            if (filters.limiteds.length === 0 || !filters.limiteds.includes(limitedValue)) return false;
          }

          if (filters.gamepasses) {
            const gamepassValue = String(card.Gamepass ?? "");
            if (filters.gamepasses.length === 0 || !filters.gamepasses.includes(gamepassValue)) return false;
          }

          if (filters.dealerships) {
            const dealership = (card.Dealership ?? "").toString();
            if (filters.dealerships.length === 0 || !filters.dealerships.includes(dealership)) return false;
          }

          if (filters.priceRange) {
            const min = Number(filters.priceRange.min) || 0;
            const max = Number(filters.priceRange.max) || Infinity;
            if (!(min === 0 && max === 0) && (card.Price < min || card.Price > max)) return false;
          }
        }

        if (search && search.trim() !== "") {
          if (!card.CarName.toLowerCase().includes(search.toLowerCase())) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const sortBy = filters?.sortBy ?? "price-desc";
        switch (sortBy) {
          case "name-asc":
            return a.CarName.localeCompare(b.CarName);
          case "name-desc":
            return b.CarName.localeCompare(a.CarName);
          case "price-asc":
            return a.Price - b.Price;
          case "price-desc":
            return b.Price - a.Price;
          default:
            return 0;
        }
      });
  }, [filters, rows, search]);

  useEffect(() => {
    onTotalItemsChange?.(filteredRows.length);
  }, [filteredRows.length, onTotalItemsChange]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  return (
    <section
      className="min-h-0 flex-1 overflow-y-auto px-2 py-2
      [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-thumb]:bg-gray-600"
    >
      {loadError ? <p className="mb-2 text-sm text-red-400">{loadError}</p> : null}
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {pagedRows.map((card) => (
          <button
            key={card._id}
            type="button"
            onClick={() => onCardClick?.(card)}
            className="flex h-full flex-col justify-between rounded-lg border border-gray-700 p-4 text-white shadow-sm hover:bg-gray-800"
          >
            <div>
              <p className="mt-1 text-lg font-bold text-center">{card.CarName}</p>
              <p className="mt-1 text-lg text-center">Rp. {card.Price.toLocaleString('de-DE')}</p>
            </div>
            {card.CarImageUrl && (
              <img
                src={card.CarImageUrl}
                alt={card.CarName}
                className="mb-2 block max-h-48 w-auto max-w-full mx-auto object-contain"
              />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}