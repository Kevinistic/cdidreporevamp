"use client";

import { useEffect, useMemo, useState } from "react";
import type { Filters } from "./sidebar-filters";
import type { CardItem } from "./card";

type SupabaseRow = Record<string, unknown>;

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  return Boolean(value);
}

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
          if (filters.newCars) params.set("newCars", "true");
          if (filters.priceRange) {
            if (filters.priceRange.min) params.set("minPrice", String(filters.priceRange.min));
            if (filters.priceRange.max) params.set("maxPrice", String(filters.priceRange.max));
          }
          if (filters.sortBy) params.set("sortBy", filters.sortBy);
        }

        const resp = await fetch(`/api/data?${params.toString()}`, { cache: "no-store" });
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
            Legacy: toBoolean((card as any).Legacy),
            Inaccurate: toBoolean((card as any).Inaccurate),
            Rims: String((card as any).Rims ?? ""),
            New: toBoolean((card as any).New),
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

  // Server applies filtering, sorting and paging. `rows` represents the current page returned by the server.

  useEffect(() => {
    onTotalItemsChange?.(serverTotal ?? rows.length);
  }, [serverTotal, rows.length, onTotalItemsChange]);

  const totalPages = Math.max(1, Math.ceil((serverTotal ?? rows.length) / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  // rows are already paged by the server; render them directly
  const pagedRows = rows;

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