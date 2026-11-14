const fs = require("fs");
const path = require("path");

// Runs after `next build`. Cloudflare static assets take at most 20,000 files per deploy, and the static export writes
// about 9 per car page: <token>.html, the <token>.txt RSC payload, and a <token>/ folder of __next.*.txt
// segment-prefetch files. Car pages are only ever opened by a full page load (shared link, refresh, new tab),
// never by the client router (in-site car links are plain <a> tags that open a modal), so only their .html is used.
// /car's own segment files also live in out/car/ but are named __next.*.txt, so they are kept.
const OUT_DIR = path.join(process.cwd(), "out");
const CAR_DIR = path.join(OUT_DIR, "car");
// Cloudflare's hard limit is 20,000; fail early with some room to spare instead of at upload.
const MAX_FILES = 19000;

function countFiles(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    count += entry.isDirectory() ? countFiles(path.join(dir, entry.name)) : 1;
  }
  return count;
}

function run() {
  if (!fs.existsSync(CAR_DIR)) {
    console.error(`${CAR_DIR} is missing. Run \`next build\` with output: "export" first.`);
    process.exit(1);
  }

  let removedDirs = 0;
  let removedPayloads = 0;
  for (const entry of fs.readdirSync(CAR_DIR, { withFileTypes: true })) {
    const entryPath = path.join(CAR_DIR, entry.name);
    if (entry.isDirectory()) {
      fs.rmSync(entryPath, { recursive: true, force: true });
      removedDirs++;
    } else if (entry.name.endsWith(".txt") && !entry.name.startsWith("__next")) {
      fs.rmSync(entryPath);
      removedPayloads++;
    }
  }

  const total = countFiles(OUT_DIR);
  console.log(
    `Pruned ${removedDirs} car segment folders and ${removedPayloads} car RSC payloads. out/ now holds ${total} files.`
  );
  if (total > MAX_FILES) {
    console.error(`out/ holds ${total} files, over the ${MAX_FILES} budget (Cloudflare allows 20,000).`);
    process.exit(1);
  }
}

run();
