import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

type CardQuery = {
  page: number;
  pageSize: number;
  q: string;
  limiteds: string[];
  gamepasses: string[];
  dealerships: string[];
  minPrice: number;
  maxPrice: number;
  sortBy: string;
  newCars: boolean;
};

type CardRow = Record<string, unknown>;

type CardQueryBuilder = {
  ilike(column: string, pattern: string): CardQueryBuilder;
  in(column: string, values: string[]): CardQueryBuilder;
  eq(column: string, value: boolean): CardQueryBuilder;
  gte(column: string, value: number): CardQueryBuilder;
  lte(column: string, value: number): CardQueryBuilder;
  order(column: string, options: { ascending: boolean }): CardQueryBuilder;
  range(start: number, end: number): Promise<{ data: CardRow[] | null; error: { message: string } | null }>;
};

type CardCountResult = {
  count: number | null;
  error: { message: string } | null;
};

const CARD_SELECT_COLUMNS = `"_id",CarName,Cost,CarImageUrl,Dealership,Limited,Gamepass,Engine,RimsUrl,rgb_0,rgb_1,rgb_2,Legacy,Inaccurate,Rims,New`;

function createSupabaseClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Server misconfiguration: missing Supabase server key");
  }

  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

function parseCardQuery(url: URL): CardQuery {
  const normalizeList = (value: string | null) =>
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  return {
    page: Math.max(1, Number(url.searchParams.get("page") ?? "1")),
    pageSize: Math.min(200, Math.max(1, Number(url.searchParams.get("pageSize") ?? "40"))),
    q: (url.searchParams.get("q") ?? "").trim(),
    limiteds: normalizeList(url.searchParams.get("limiteds")),
    gamepasses: normalizeList(url.searchParams.get("gamepasses")),
    dealerships: normalizeList(url.searchParams.get("dealerships")),
    minPrice: Number(url.searchParams.get("minPrice") ?? "0"),
    maxPrice: Number(url.searchParams.get("maxPrice") ?? "0"),
    sortBy: url.searchParams.get("sortBy") ?? "price-desc",
    newCars: (url.searchParams.get("newCars") ?? "false").toLowerCase() === "true",
  };
}

function buildCountKey(query: CardQuery) {
  return JSON.stringify({
    q: query.q,
    limiteds: query.limiteds,
    gamepasses: query.gamepasses,
    dealerships: query.dealerships,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    newCars: query.newCars,
  });
}

function buildPageKey(query: CardQuery) {
  return JSON.stringify({
    page: query.page,
    pageSize: query.pageSize,
    q: query.q,
    limiteds: query.limiteds,
    gamepasses: query.gamepasses,
    dealerships: query.dealerships,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    sortBy: query.sortBy,
    newCars: query.newCars,
  });
}

function applyCardFilters(builder: CardQueryBuilder, query: CardQuery) {
  let filtered = builder;

  if (query.q !== "") {
    filtered = filtered.ilike("CarName", `%${query.q}%`);
  }

  if (query.limiteds.length > 0) {
    filtered = filtered.in("Limited", query.limiteds);
  }

  if (query.gamepasses.length > 0) {
    filtered = filtered.in("Gamepass", query.gamepasses);
  }

  if (query.dealerships.length > 0) {
    filtered = filtered.in("Dealership", query.dealerships);
  }

  if (query.newCars) {
    filtered = filtered.eq("New", true);
  }

  if (!Number.isNaN(query.minPrice) && query.minPrice > 0) {
    filtered = filtered.gte("Cost", query.minPrice);
  }

  if (!Number.isNaN(query.maxPrice) && query.maxPrice > 0) {
    filtered = filtered.lte("Cost", query.maxPrice);
  }

  return filtered;
}

const getCachedFilterOptions = unstable_cache(
  async (viewName: string) => {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase.from(viewName).select("Dealership,Limited,Gamepass");
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as Record<string, unknown>[];

    const unique = (col: string) =>
      Array.from(new Set(rows.map((r) => r[col]).filter(Boolean)))
        .map((v) => String(v))
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    return {
      dealerships: unique("Dealership"),
      limiteds: unique("Limited"),
      gamepasses: unique("Gamepass"),
    };
  },
  ["filter-options"],
  { revalidate: 60 * 60 * 24 },
);

const getCachedCardPage = unstable_cache(
  async (viewName: string, pageKey: string) => {
    const query = JSON.parse(pageKey) as CardQuery;
    const supabase = createSupabaseClient();
    const start = (query.page - 1) * query.pageSize;
    const end = start + query.pageSize - 1;

    let builder = supabase.from(viewName).select(CARD_SELECT_COLUMNS) as unknown as CardQueryBuilder;
    builder = applyCardFilters(builder, query);

    switch (query.sortBy) {
      case "name-asc":
        builder = builder.order("CarName", { ascending: true });
        break;
      case "name-desc":
        builder = builder.order("CarName", { ascending: false });
        break;
      case "price-asc":
        builder = builder.order("Cost", { ascending: true });
        break;
      case "price-desc":
      default:
        builder = builder.order("Cost", { ascending: false });
        break;
    }

    const { data, error } = await builder.range(start, end);

    if (error) throw new Error(error.message);

    return (data ?? []) as CardRow[];
  },
  ["cards-page"],
  { revalidate: 60 },
);

const getCachedCardTotal = unstable_cache(
  async (viewName: string, countKey: string) => {
    const query = JSON.parse(countKey) as CardQuery;
    const supabase = createSupabaseClient();

    let builder = supabase.from(viewName).select("_id", { count: "exact", head: true }) as unknown as CardQueryBuilder;
    builder = applyCardFilters(builder, query);

    const { count, error } = await (builder as unknown as Promise<CardCountResult>);

    if (error) throw new Error(error.message);

    return typeof count === "number" ? count : null;
  },
  ["cards-total"],
  { revalidate: 300 },
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "cards";
  const viewName = process.env.SUPABASE_VIEW_NAME ?? process.env.NEXT_PUBLIC_SUPABASE_VIEW_NAME ?? "test";

  try {
    if (mode === "filters") {
      const options = await getCachedFilterOptions(viewName);
      return NextResponse.json(options, {
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
        },
      });
    }

    const query = parseCardQuery(url);
    const pageKey = buildPageKey(query);
    const countKey = buildCountKey(query);

    const [data, total] = await Promise.all([getCachedCardPage(viewName, pageKey), getCachedCardTotal(viewName, countKey)]);

    return NextResponse.json(
      { data, total },
      {
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
