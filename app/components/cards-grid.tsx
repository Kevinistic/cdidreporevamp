"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [serverTotal, setServerTotal] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCards = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        if (search && search.trim() !== "") params.set("q", search.trim());
        if (filters) {
          if (filters.limiteds && filters.limiteds.length > 0) params.set("limiteds", filters.limiteds.join(","));
          if (filters.gamepasses && filters.gamepasses.length > 0) params.set("gamepasses", filters.gamepasses.join(","));
          if (filters.dealerships && filters.dealerships.length > 0) params.set("dealerships", filters.dealerships.join(","));
          if (filters.priceRange) {
            if (filters.priceRange.min) params.set("minPrice", String(filters.priceRange.min));
            if (filters.priceRange.max) params.set("maxPrice", String(filters.priceRange.max));
          }
          if (filters.sortBy) params.set("sortBy", filters.sortBy);
        }

        const resp = await fetch(`/api/data?${params.toString()}`);
        const json = await resp.json();
        if (!isMounted) return;
        if (!resp.ok) {
          setLoadError(json?.error ?? "Failed to load cards");
          setIsLoading(false);
          return;
        }

        const allRows = (json.data ?? []) as SupabaseRow[];
        setServerTotal(typeof json.total === "number" ? json.total : null);
        setRows(
          allRows.map((card) => ({
            _id: String((card as any)._id),
            CarName: String((card as any).CarName ?? ""),
            Price: Number((card as any).Cost ?? 0),
            CarImageUrl: String((card as any).CarImageUrl ?? ""),
            Dealership: String((card as any).Dealership ?? ""),
            Limited: String((card as any).Limited ?? ""),
            Gamepass: String((card as any).Gamepass ?? ""),
            Engine: String((card as any).Engine ?? ""),
            RimsUrl: String((card as any).RimsUrl ?? ""),
            rgb_0: String((card as any).rgb_0 ?? "0"),
            rgb_1: String((card as any).rgb_1 ?? "0"),
            rgb_2: String((card as any).rgb_2 ?? "0"),
            Legacy: Boolean((card as any).Legacy),
            Inaccurate: Boolean((card as any).Inaccurate),
            Rims: String((card as any).Rims ?? ""),
            New: Boolean((card as any).New),
          })),
        );
      } catch (err: any) {
        setLoadError(err?.message ?? String(err));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadCards();

    return () => {
      isMounted = false;
    };
  }, [page, pageSize, search, filters]);

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
    onTotalItemsChange?.(serverTotal ?? filteredRows.length);
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