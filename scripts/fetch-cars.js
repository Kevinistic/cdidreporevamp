const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

let supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let viewName = process.env.NEXT_PUBLIC_SUPABASE_VIEW_NAME || "test";

// If env vars are not in process.env, try to parse .env file (for local development)
if (!supabaseUrl || !supabaseKey) {
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      for (const line of envContent.split("\n")) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith("#")) continue;
        const parts = trimmedLine.split("=");
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, ""); // remove wrapping quotes
          if (key === "NEXT_PUBLIC_SUPABASE_URL" && !supabaseUrl) supabaseUrl = val;
          if ((key === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" || key === "NEXT_PUBLIC_SUPABASE_ANON_KEY") && !supabaseKey) supabaseKey = val;
          if (key === "NEXT_PUBLIC_SUPABASE_VIEW_NAME") viewName = val;
        }
      }
    }
  } catch (e) {
    console.warn("Could not read .env file:", e.message);
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing Supabase URL or Key environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const CARD_SELECT_COLUMNS = `_id,CarName,Cost,CarImageUrl,Dealership,Limited,Gamepass,Engine,RimsUrl,rgb_0,rgb_1,rgb_2,Legacy,Inaccurate,Rims,New`;

async function fetchAllCars() {
  console.log("Starting build-time cars data fetch...");
  console.log(`Connecting to: ${supabaseUrl}`);
  console.log(`Targeting view: ${viewName}`);

  let allData = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const start = page * pageSize;
    const end = start + pageSize - 1;

    console.log(`Fetching page ${page + 1} (rows ${start} to ${end})...`);
    const { data, error } = await supabase
      .from(viewName)
      .select(CARD_SELECT_COLUMNS)
      .range(start, end);

    if (error) {
      console.error("Database query failed:");
      console.error(error);
      process.exit(1);
    }

    if (data && data.length > 0) {
      allData = allData.concat(data);
      console.log(`Fetched ${data.length} rows. Total loaded: ${allData.length}`);
      page++;
    } else {
      hasMore = false;
    }
  }

  return allData;
}

async function run() {
  try {
    const cars = await fetchAllCars();

    if (cars.length === 0) {
      console.warn("Warning: Fetched 0 cars from Supabase.");
    }

    const normalizedCars = cars.map((car) => {
      const priceValue = car.Price ?? car.Cost ?? 0;
      return {
        ...car,
        Price: typeof priceValue === "number" ? priceValue : Number(String(priceValue).replace(/[^0-9.-]/g, "")) || 0,
      };
    });

    const dir = path.join(process.cwd(), "public", "data");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, "cars.json");
    // Write minified JSON to save space
    fs.writeFileSync(filePath, JSON.stringify(normalizedCars), "utf-8");
    console.log(`Successfully wrote ${normalizedCars.length} records to ${filePath}`);

    const stats = fs.statSync(filePath);
    console.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);
  } catch (err) {
    console.error("Fatal error during build-time data fetch:", err);
    process.exit(1);
  }
}

run();
