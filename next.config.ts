import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import type { NextConfig } from "next";

// Release commits to main are named like "Release v0.8.3: ...", so the site version is read from there.
// Vercel provides the commit message; locally it falls back to the latest matching commit, then package.json.
const VERSION_PATTERN = /v(\d+\.\d+\.\d+[a-z]?)/;

function getVersion() {
  const fromEnv = process.env.VERCEL_GIT_COMMIT_MESSAGE?.match(VERSION_PATTERN);
  if (fromEnv) return fromEnv[1];
  try {
    const subject = execSync('git log -1 -E --grep="v[0-9]+\\.[0-9]+\\.[0-9]+" --format=%s', {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const fromGit = subject.match(VERSION_PATTERN);
    if (fromGit) return fromGit[1];
  } catch {}
  return JSON.parse(readFileSync("package.json", "utf8")).version as string;
}

// Update history for the home page's next-update card. scripts/fetch-updates.js copies it from the Supabase
// `updates` table into data/updates.json before each build; it is inlined into the code here, so the page
// never queries anything at runtime. Insert a row in Supabase and redeploy to update the card.
const UPDATES_PATH = "data/updates.json";

function getUpdateRows() {
  if (!existsSync(UPDATES_PATH)) {
    throw new Error(`${UPDATES_PATH} is missing. Run \`node scripts/fetch-updates.js\` first.`);
  }
  return readFileSync(UPDATES_PATH, "utf8");
}

const nextConfig: NextConfig = {
  // Car and box data is fetched as part of each build, so this is also when the data was last refreshed.
  env: {
    BUILD_DATE: new Date().toISOString(),
    APP_VERSION: getVersion(),
    UPDATE_ROWS: getUpdateRows(),
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
