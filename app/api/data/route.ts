import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: "Server misconfiguration: missing Supabase server key" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "cards";
  const viewName = process.env.SUPABASE_VIEW_NAME ?? process.env.NEXT_PUBLIC_SUPABASE_VIEW_NAME ?? "test";

  try {
    if (mode === "filters") {
      // Only select the small set of columns needed for filter generation
      const { data, error } = await supabase.from(viewName).select("Dealership,Limited,Gamepass");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const rows = (data ?? []) as Record<string, any>[];

      const unique = (col: string) =>
        Array.from(new Set(rows.map((r) => r[col]).filter(Boolean))).map((v) => String(v)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

      return NextResponse.json({ dealerships: unique("Dealership"), limiteds: unique("Limited"), gamepasses: unique("Gamepass") });
    }

    // default: cards mode with pagination and optional filters/search
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get("pageSize") ?? "40")));
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const q = url.searchParams.get("q") ?? "";
    const limiteds = (url.searchParams.get("limiteds") ?? "").split(",").filter(Boolean);
    const gamepasses = (url.searchParams.get("gamepasses") ?? "").split(",").filter(Boolean);
    const dealerships = (url.searchParams.get("dealerships") ?? "").split(",").filter(Boolean);
    const minPrice = Number(url.searchParams.get("minPrice") ?? "0");
    const maxPrice = Number(url.searchParams.get("maxPrice") ?? "0");
    const sortBy = url.searchParams.get("sortBy") ?? "price-desc";

    // Select only the columns the client needs — avoid select('*') here
    const selectCols = `\"_id\",CarName,Cost,CarImageUrl,Dealership,Limited,Gamepass,Engine,RimsUrl,rgb_0,rgb_1,rgb_2,Legacy,Inaccurate,Rims,New`;

    let builder = supabase.from(viewName).select(selectCols, { count: "exact" });

    // apply search
    if (q.trim() !== "") {
      // case-insensitive contains for CarName
      builder = builder.ilike("CarName", `%${q}%`);
    }

    // apply filters (use .in when multiple values provided)
    if (limiteds.length > 0) {
      builder = builder.in("Limited", limiteds as string[]);
    }

    if (gamepasses.length > 0) {
      builder = builder.in("Gamepass", gamepasses as string[]);
    }

    if (dealerships.length > 0) {
      builder = builder.in("Dealership", dealerships as string[]);
    }

    // price filtering (Cost column)
    if (!Number.isNaN(minPrice) && minPrice > 0) {
      builder = builder.gte("Cost", minPrice);
    }
    if (!Number.isNaN(maxPrice) && maxPrice > 0) {
      builder = builder.lte("Cost", maxPrice);
    }

    // sorting
    switch (sortBy) {
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

    const { data, error, count } = await builder.range(start, end);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data: data ?? [], total: typeof count === "number" ? count : null });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
