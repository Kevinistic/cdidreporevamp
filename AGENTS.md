<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

You are restricted to working in a purely file-editing mode. Do not attempt to run, build, or test this application. Under no circumstances should you run 'npm run dev' or any other local server commands. Your only job is to write, review, and edit the code files.
<!-- END:nextjs-agent-rules -->

## Free-plan limits

Cloudflare Pages (free plan, static export) + Supabase free tier. The site is `output: "export"`: plain static files with no server, so no ISR/`revalidate`, intercepting routes, proxy, rewrites/redirects/headers in next.config, server actions, or route handlers that read the request. Pages allows 20,000 files per deploy, 25 MiB per file and 500 builds a month. `scripts/prune-export.js` runs after `next build`, deletes each `/car/[token]` page's RSC and segment files (keeping only its `.html`) and fails the build past 19,000 files. That's why car links are plain `<a>` tags, never `next/link`: the client router must never navigate to a car page. Per-item static params only for small pages (the `/car/[token]` pages are prebuilt because each holds one car; never embed the full car list in a per-item page), `prefetch={false}` on list links, no runtime DB queries (data is fetched at build time), no large assets in the repo. Cache headers go in `public/_headers`. Flag anything that could raise usage or the file count before doing it.
