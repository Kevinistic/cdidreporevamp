const fs = require("fs");
const path = require("path");

const PINNED_DIR = path.join(process.cwd(), "data-pinned");
const DATA_DIR = path.join(process.cwd(), "public", "data");

// If data-pinned/<file> exists, copy it into public/data and skip the Supabase fetch.
// Delete data-pinned/ (or build with FETCH_LIVE_DATA=1) to go back to fetching fresh data.
function usePinned(file) {
  if (process.env.FETCH_LIVE_DATA === "1") return false;
  const source = path.join(PINNED_DIR, file);
  if (!fs.existsSync(source)) return false;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.copyFileSync(source, path.join(DATA_DIR, file));
  console.log(`Using pinned ${file} from data-pinned/ (skipping Supabase fetch).`);
  return true;
}

module.exports = { usePinned };
