const fs = require("fs");
const path = require("path");
const { fetchAll } = require("./lib/supabase");
const { usePinned } = require("./lib/pinned");

const DATA_DIR = path.join(process.cwd(), "public", "data");

const bySortOrder = (a, b) => a.sort_order - b.sort_order;

function readCarIds() {
  try {
    const cars = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "cars.json"), "utf-8"));
    return new Set(cars.map((car) => car._id));
  } catch (err) {
    console.warn("Warning: Could not read cars.json, so box cars won't be checked:", err.message);
    return null;
  }
}

function warnAboutProblems(boxes) {
  const carIds = readCarIds();

  for (const box of boxes) {
    const total = box.tiers.reduce((sum, tier) => sum + tier.rate, 0);
    if (Math.abs(total - 1) > 1e-6) {
      console.warn(`Warning: ${box.name} tier rates total ${total}, not 1.`);
    }

    for (const tier of box.tiers) {
      for (const item of tier.items) {
        if (item.carId && carIds && !carIds.has(item.carId)) {
          console.warn(`Warning: ${box.name} lists "${item.carId}", which isn't in cars.json.`);
        }
      }
    }
  }
}

async function run() {
  if (usePinned("boxes.json")) return;

  try {
    console.log("Starting build-time boxes data fetch...");
    const boxRows = await fetchAll("boxes", "id");
    const tierRows = await fetchAll("box_tiers", "id");
    const itemRows = await fetchAll("box_items", "id");

    if (boxRows.length === 0) {
      console.warn("Warning: Fetched 0 boxes from Supabase.");
    }

    const boxes = boxRows.sort(bySortOrder).map((box) => ({
      slug: box.slug,
      name: box.name,
      price: box.price === null ? null : Number(box.price),
      currency: box.currency,
      tiers: tierRows
        .filter((tier) => tier.box_id === box.id)
        .sort(bySortOrder)
        .map((tier) => ({
          name: tier.name,
          rate: Number(tier.rate),
          items: itemRows
            .filter((item) => item.tier_id === tier.id)
            .sort(bySortOrder)
            .map((item) => ({
              itemType: item.item_type,
              carId: item.car_id,
              name: item.name,
              imageId: item.image_id,
            })),
        })),
    }));

    warnAboutProblems(boxes);

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const filePath = path.join(DATA_DIR, "boxes.json");
    fs.writeFileSync(filePath, JSON.stringify(boxes), "utf-8");
    console.log(`Successfully wrote ${boxes.length} boxes to ${filePath}`);
  } catch (err) {
    console.error("Fatal error during build-time data fetch:", err);
    process.exit(1);
  }
}

run();
