"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
};

export type { CardItem };

const EMPTY_CARDS: CardItem[] = [];

function normalizeFilterValues(values: string[] | undefined) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function buildRequestKey({
  search,
  filters,
  page,
  pageSize,
}: {
  search?: string;
  filters?: Filters;
  page: number;
  pageSize: number;
}) {
  return JSON.stringify({
    search: search?.trim() ?? "",
    limiteds: normalizeFilterValues(filters?.limiteds),
    gamepasses: normalizeFilterValues(filters?.gamepasses),
    dealerships: normalizeFilterValues(filters?.dealerships),
    minPrice: filters?.priceRange?.min ?? "",
    maxPrice: filters?.priceRange?.max ?? "",
    sortBy: filters?.sortBy ?? "",
    newCars: filters?.newCars ?? false,
    page,
    pageSize,
  });
}

function buildRequestParams({
  search,
  filters,
  page,
  pageSize,
}: {
  search?: string;
  filters?: Filters;
  page: number;
  pageSize: number;
}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  if (search && search.trim() !== "") params.set("q", search.trim());

  if (filters) {
    const limiteds = normalizeFilterValues(filters.limiteds);
    const gamepasses = normalizeFilterValues(filters.gamepasses);
    const dealerships = normalizeFilterValues(filters.dealerships);

    if (limiteds.length > 0) params.set("limiteds", limiteds.join(","));
    if (gamepasses.length > 0) params.set("gamepasses", gamepasses.join(","));
    if (dealerships.length > 0) params.set("dealerships", dealerships.join(","));
    if (filters.newCars) params.set("newCars", "true");
    if (filters.priceRange) {
      if (filters.priceRange.min) params.set("minPrice", String(filters.priceRange.min));
      if (filters.priceRange.max) params.set("maxPrice", String(filters.priceRange.max));
    }
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
  }

  return params;
}

function toCardItem(card: SupabaseRow): CardItem {
  const row = card as Record<string, unknown>;

  return {
    _id: String(row._id ?? ""),
    CarName: String(row.CarName ?? ""),
    Price: Number(row.Cost ?? 0),
    CarImageUrl: String(row.CarImageUrl ?? ""),
    Dealership: String(row.Dealership ?? ""),
    Limited: String(row.Limited ?? ""),
    Gamepass: String(row.Gamepass ?? ""),
    Engine: String(row.Engine ?? ""),
    RimsUrl: String(row.RimsUrl ?? ""),
    rgb_0: String(row.rgb_0 ?? "0"),
    rgb_1: String(row.rgb_1 ?? "0"),
    rgb_2: String(row.rgb_2 ?? "0"),
    Legacy: toBoolean(row.Legacy),
    Inaccurate: toBoolean(row.Inaccurate),
    Rims: String(row.Rims ?? ""),
    New: toBoolean(row.New),
  };
}

async function requestPageData({
  search,
  filters,
  page,
  pageSize,
  signal,
  pageCacheRef,
  inFlightRef,
}: {
  search?: string;
  filters?: Filters;
  page: number;
  pageSize: number;
  signal?: AbortSignal;
  pageCacheRef: React.RefObject<Map<string, CachedPage>>;
  inFlightRef: React.RefObject<Map<string, Promise<CachedPage>>>;
}) {
  const cacheKey = buildRequestKey({ search, filters, page, pageSize });
  const cached = pageCacheRef.current.get(cacheKey);

  if (cached) {
    return cached;
  }

  const inFlight = inFlightRef.current.get(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    const params = buildRequestParams({ search, filters, page, pageSize });
    const resp = await fetch(`/api/data?${params.toString()}`, { cache: "no-store", signal });
    const json = await resp.json();

    if (!resp.ok) {
      throw new Error(json?.error ?? "Failed to load cards");
    }

    const cachedPage: CachedPage = {
      total: typeof json.total === "number" ? json.total : null,
      rows: ((json.data ?? []) as SupabaseRow[]).map(toCardItem),
    };

    pageCacheRef.current.set(cacheKey, cachedPage);
    return cachedPage;
  })();

  inFlightRef.current.set(cacheKey, request);

  try {
    return await request;
  } finally {
    inFlightRef.current.delete(cacheKey);
  }
}

async function prefetchPageData({
  search,
  filters,
  pageToLoad,
  pageSize,
  currentPage,
  pageCacheRef,
  inFlightRef,
}: {
  search?: string;
  filters?: Filters;
  pageToLoad: number;
  pageSize: number;
  currentPage: number;
  pageCacheRef: React.RefObject<Map<string, CachedPage>>;
  inFlightRef: React.RefObject<Map<string, Promise<CachedPage>>>;
}) {
  if (pageToLoad < 1) {
    return;
  }

  if (Math.abs(pageToLoad - currentPage) > MAX_PREFETCH_DISTANCE) {
    return;
  }

  const cacheKey = buildRequestKey({ search, filters, page: pageToLoad, pageSize });
  if (pageCacheRef.current.has(cacheKey) || inFlightRef.current.has(cacheKey)) {
    return;
  }

  try {
    await requestPageData({ search, filters, page: pageToLoad, pageSize, pageCacheRef, inFlightRef });
  } catch {
    // prefetch is best-effort.
  }
}

export function CardsGrid({ cards = EMPTY_CARDS, search, filters, page, pageSize, onTotalItemsChange, onCardClick }: CardsGridProps) {
  const [rows, setRows] = useState<CardItem[]>(cards);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const pageCacheRef = useRef(new Map<string, CachedPage>());
  const inFlightRef = useRef(new Map<string, Promise<CachedPage>>());

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const loadCards = async () => {
      setLoadError(null);

      try {
        const cacheKey = buildRequestKey({ search, filters, page, pageSize });
        const cached = pageCacheRef.current.get(cacheKey);

        if (cached) {
          setRows(cached.rows);
          setServerTotal(cached.total);
          setIsLoading(false);
        } else {
          setIsLoading(true);
        }

        const payload = await requestPageData({
          search,
          filters,
          page,
          pageSize,
          signal: controller.signal,
          pageCacheRef,
          inFlightRef,
        });
        if (!isActive) return;

        setServerTotal(payload.total);
        setRows(payload.rows);
        setIsLoading(false);

        void prefetchPageData({
          search,
          filters,
          pageToLoad: page + 1,
          pageSize,
          currentPage: page,
          pageCacheRef,
          inFlightRef,
        });
        void prefetchPageData({
          search,
          filters,
          pageToLoad: page - 1,
          pageSize,
          currentPage: page,
          pageCacheRef,
          inFlightRef,
        });
      } catch (err: unknown) {
        if (!isActive || controller.signal.aborted) return;

        setLoadError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      } finally {
      }
    };

    void loadCards();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [page, pageSize, search, filters]);

  // server applies filtering, sorting and paging. 'rows' represents the current page returned by the server

  useEffect(() => {
    onTotalItemsChange?.(serverTotal ?? rows.length);
  }, [serverTotal, rows.length, onTotalItemsChange]);

  // rows are already paged by the server, render them directly
  const pagedRows = rows;

  return (
    <section
      className="min-h-0 flex-1 overflow-y-auto px-2 py-2
      [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-thumb]:bg-gray-600"
    >
      {loadError ? <p className="mb-2 text-sm text-red-400">{loadError}</p> : null}
      {isLoading ? <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gray-500">Loading page...</p> : null}
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
              <div className="relative mb-2 h-48 w-full">
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