- **Light mode fix.** `globals.css` switches `body` to a white background when the OS is in light mode, but the header, pagination and icons are hardcoded `text-white` with no fill, so they vanish. Remove the `prefers-color-scheme` block and give `<body>` an explicit black background, since the app is dark-only by design.

- **Add `.order()` to the build fetch.** `scripts/fetch-cars.js` pages through Supabase with `.range()` but no ordering, and Postgres doesn't guarantee row order between queries, so pages can overlap or skip rows. Add `.order("_id")` before `.range()` so every build pulls each car exactly once.

- **Search traffic.** The page currently renders an empty client shell and fetches `cars.json` after load, so crawlers see no content. Read the data in a server component so the first page ships as real HTML, and give the site a proper description and Open Graph metadata. Check `node_modules/next/dist/docs/01-app` before writing this, since this Next.js version has breaking changes.

- **Move filtering into a `useFilteredCars(allCars, filters)` hook in `HomeClient`.** Right now filtering lives in `CardsGrid`, which reports the count back up through an effect, and that triggers a chain of extra renders on every keystroke. Computing `total` and `pagedRows` in the hook and passing them down removes `totalItems` state and the `onTotalItemsChange` effect, and `CardsGrid` becomes a plain presentational component.

- **Normalize price in one place.** The build script uses `Price ?? Cost` and strips non-digits, while `home-client.tsx` re-normalizes with `Cost ?? Price` and no stripping, which is a different precedence. The script output is already clean, so delete the client-side normalization and its `any` type.

- **Remove dead code.** Unused items: `toBoolean`, `CachedPage`, `SupabaseRow` and `MAX_PREFETCH_DISTANCE` in `cards-grid.tsx`; the unused `useRef` import in `home-client.tsx`; `app/lib/supabase.ts` (nothing imports it); the empty `loading.tsx`; `export default null` in `card.tsx`; the one-line re-export file `sidebar-filters-panel.tsx`; and the identity helpers `buildDropdown` / `buildPriceDropdown`.

- **Make boolean handling consistent.** The grid checks flags by truthiness, while `maincard.tsx` uses `String(v).toLowerCase() === "true"`. The data already contains real booleans, so use plain truthiness everywhere.

- **Deduplicate markup.** The sidebar and main `className` ternaries in `home-client.tsx` repeat long strings that differ by only a few tokens; collapse them with a small `cn()` helper. `MainCard` and `Credits` copy the same modal shell, so extract a shared `<Modal>` component.

- **Fix the pagination ellipsis bug.** With exactly 6 pages, page 4 renders `1 … 3 4 5 … 6`, where the second ellipsis hides nothing. Keep the current layout and button model with no Prev/Next buttons; just make sure an ellipsis only appears when it actually skips at least one page.

- **Hygiene.** Make indentation consistent (tabs and spaces are mixed in `credits.tsx` and `maincard.tsx`), replace the create-next-app README with a real one, bump `package.json` from `0.1.0` to match the release tags, remove the `--font-geist-*` variables that point at fonts that are never loaded, and add a lint step to CI.

- **Derive the default max price from the data.** The 180,000,000,000 default is hardcoded in `sidebar-filters.tsx` and exactly equals the current most expensive car, so any pricier car added later is hidden by default. Compute the max from `allCars` and use it for both the default and the reset/blur fallback.

- **Accessibility.** Add `aria-label`s to the three icon-only header buttons and `alt` to the Discord image. Give the modal `role="dialog"`, `aria-modal`, Escape-to-close and focus handling. Mark the hidden sidebar `inert` so keyboard users can't Tab into it, and show the "No longer in-game / May be inaccurate" warnings as visible badges instead of a hover-only tooltip.

- **Mobile layout.** The bottom sheet uses `h-[70vh]`, which jumps as the mobile browser's address bar shows and hides; switch to `dvh`. Drop the `pb-[70vh]` on `<main>`, since the backdrop already covers the content and the padding only squeezes it.
