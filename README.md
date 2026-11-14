# CDID Car Database (Unofficial)

A searchable, filterable list of every car in [Car Driving Indonesia](https://www.roblox.com/games/6911148748/Car-Driving-Indonesia) on Roblox. Built with Next.js, React, TypeScript and Tailwind CSS.

## How it works

Car data lives in Supabase. At build time, `scripts/fetch-cars.js` pulls every row from the configured view and writes it to `public/data/cars.json`. The home page reads that file on the server, so the page is prerendered with real data. Filtering, sorting and pagination then happen in the browser.

Box data works the same way: `scripts/fetch-boxes.js` reads the `boxes`, `box_tiers` and `box_items` tables and writes `public/data/boxes.json`. An item's odds are its tier's rate divided by the number of items in that tier.

Data only updates when the site is rebuilt.

## Environment variables

Put these in `.env` (the fetch script also reads `.env` directly when run locally):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase key used to read the view |
| `NEXT_PUBLIC_SUPABASE_VIEW_NAME` | Name of the table or view holding the cars |
| `CAR_TOKEN_SECRET` | Secret used to derive the obfuscated `/car/<token>` URLs from each `_id`. Required for production builds; changing it changes every car URL |

## Local development

```bash
npm install
node scripts/fetch-cars.js
node scripts/fetch-boxes.js
npm run dev
```

Run the fetch scripts again whenever you want fresh data locally. Without the JSON files in `public/data/`, pages render with no cars or boxes.

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: fetch car and box data, build the static export into `out/`, then prune it (`scripts/prune-export.js`)
- `npm run lint`: run ESLint

## Project layout

- `app/layout.tsx`: root layout with the site nav and footer; the page scrolls by default
- `app/page.tsx`: homepage
- `app/(browser)/`: the `/car` list and `/car/<token>` pages, in a fixed-height shell that scrolls internally
- `app/box/`: the `/box` page, with a tab for each box
- `app/tool/`: the `/tool` page, with the price calculator, box simulator, and box odds
- `app/components/`: UI components (sidebar filters, grid, pagination, modals)
- `app/lib/`: data loading, the `useFilteredCars` hook and small helpers
- `scripts/fetch-cars.js`, `scripts/fetch-boxes.js`: build-time data fetches from Supabase

## Deploy

The site is a static export served by the `cdidrepo` Cloudflare Worker as static assets at <https://cdidrepo.web.id>. `wrangler.jsonc` points the Worker at `out/` and attaches the domain. Workers Builds builds from GitHub: `main` deploys to production, other branches upload preview versions.

| Setting (Worker → Settings → Build) | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Node version | from `.node-version` |
| Build variables and secrets | the ones above. `CAR_TOKEN_SECRET` must keep its old value or every shared car link breaks. Runtime "Variables and Secrets" are not seen by the build |

`scripts/prune-export.js` keeps the deploy under the 20,000-file static assets limit by deleting the car pages' client-navigation files, so car links must stay plain `<a>` tags. Cache headers for hashed assets are in `public/_headers`. To check a build locally, serve `out/` with any static server (`next start` doesn't work with a static export).

The old Vercel project only redirects now: `vercel.json` skips the install and build there and sends every `cdidrepo.vercel.app` URL to the same path on `cdidrepo.web.id` (308). Keep that project alive, or old shared links stop working.
