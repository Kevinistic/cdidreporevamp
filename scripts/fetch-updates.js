const fs = require("fs");
const path = require("path");
const { fetchAll } = require("./lib/supabase");

// Update history for the home page's next-update card. The Supabase `updates` table holds only a WIB
// `date` and `time` per update (time defaults to 19:00). Written outside public/ because it is only read
// by next.config.ts at build time, never served.
const TABLE = "updates";
const OUT_PATH = path.join(process.cwd(), "data", "updates.json");

async function run() {
  try {
    console.log("Starting build-time update history fetch...");
    const rows = await fetchAll(TABLE, "date");

    if (rows.length === 0) {
      console.error(`Error: Fetched 0 rows from ${TABLE}. The next-update card needs at least two.`);
      process.exit(1);
    }

    // Supabase returns times as "19:00:00"; the card only needs "19:00".
    const updates = rows
      .map((row) => [String(row.date), String(row.time ?? "19:00").slice(0, 5)])
      .sort(([dateA, timeA], [dateB, timeB]) => dateA.localeCompare(dateB) || timeA.localeCompare(timeB));

    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(updates), "utf-8");
    console.log(`Successfully wrote ${updates.length} updates to ${OUT_PATH}`);
  } catch (err) {
    console.error("Fatal error during build-time update fetch:", err);
    process.exit(1);
  }
}

run();
