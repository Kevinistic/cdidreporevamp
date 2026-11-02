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
- `npm run build`: fetch car and box data, then build for production
- `npm run start`: serve the production build
- `npm run lint`: run ESLint

## Project layout

- `app/layout.tsx`: root layout with the site nav; the page scrolls by default
- `app/page.tsx`: homepage
- `app/(browser)/`: the `/car` list and `/car/<token>` pages, in a fixed-height shell that scrolls internally
- `app/box/`: the `/box` page, with a tab for each box
- `app/tool/`: the `/tool` page, with the price calculator, box simulator, and box odds
- `app/@modal/`: the car modal, shown when a `/car/<token>` link is followed from inside the site
- `app/components/`: UI components (sidebar filters, grid, pagination, modals)
- `app/lib/`: data loading, the `useFilteredCars` hook and small helpers
- `scripts/fetch-cars.js`, `scripts/fetch-boxes.js`: build-time data fetches from Supabase
