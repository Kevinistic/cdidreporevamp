import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import type { NextConfig } from "next";

// Release commits to main are named like "Release v0.8.3: ...", so the site version is read from there.
// Cloudflare Workers Builds builds from a git clone but exposes no commit message, so this reads the latest matching
// commit from git, then falls back to package.json (for example when the clone is too shallow to reach one).
const VERSION_PATTERN = /v(\d+\.\d+\.\d+[a-z]?)/;

function getVersion() {
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
  // Cloudflare serves the site as plain static files from `out/` (see wrangler.jsonc): no server, no ISR, no intercepting routes.
  // scripts/prune-export.js then trims files the site never requests, to stay under the 20,000 files per deploy.
  output: "export",
  // Car and box data is fetched as part of each build, so this is also when the data was last refreshed.
  env: {
    BUILD_DATE: new Date().toISOString(),
    APP_VERSION: getVersion(),
    UPDATE_ROWS: getUpdateRows(),
  },
  experimental: {
    // How long a tab reuses a page it already fetched before asking the CDN again (default 5 minutes). Every page
    // is static and its data only changes on redeploy, so a tab keeps pages for a week: going back and forth
    // between pages costs one CDN request per page, not one per visit. A tab left open across a deploy shows the
    // old data until it is refreshed. This is the browser's in-memory cache only; refreshes and new tabs still fetch.
    staleTimes: {
      static: 7 * 24 * 60 * 60,
    },
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
