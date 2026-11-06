const fs = require("fs");
const path = require("path");
const { fetchAll, viewName } = require("./lib/supabase");
const { usePinned } = require("./lib/pinned");

async function run() {
  if (usePinned("cars.json")) return;

  try {
    console.log("Starting build-time cars data fetch...");
    const cars = await fetchAll(viewName, "_id");

    if (cars.length === 0) {
      console.warn("Warning: Fetched 0 cars from Supabase.");
    }

    const normalizedCars = cars
      .filter((car) => !car.lostmedia)
      .map((car) => {
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
