# Project audit: UX, SOLID and bugs

Audited on 2026-11-02 at commit `240cc9e`, and updated on 2026-11-04 for commit `7864313`, on the `vin` branch. That update reviewed the three commits in between, which changed `app/not-found.tsx`, `app/page.tsx` and `app/arlestare.jpg`.

**Totals: 4 high, 21 medium and 21 low.** The most urgent issue is that a bad data fetch can silently deploy an empty site.

**How this was checked:** the app wasn't run, as `AGENTS.md` instructs, so layout findings come from reading the code and CSS. The data figures come from the local `public/data` files and the `.next` build from Nov 1. Contrast ratios use Tailwind's default palette values from memory.

## High

1. **[Bug] A bad fetch can deploy an empty site.** If Supabase returns 0 rows (for example, blocked by row-level security), `scripts/fetch-cars.js:10` only warns and writes `[]`, and the build still passes. `scripts/fetch-boxes.js:45` does the same.

   **Impact:** the live site would show no cars, and every car link would 404.

   **Also:** `app/lib/cars.ts:15` and `app/lib/boxes.ts:45` turn read errors into empty lists, and `scripts/lib/supabase.js:7` falls back to a table called `"test"`.

   **Fix:** fail the build on 0 cars or a missing file, and remove the fallback.

2. **[UX] Search is hidden on phones.** The search box exists only inside the filter sheet (`app/components/sidebar-filters.tsx:651`), which starts closed on mobile (`app/components/home-client.tsx:29`). The only way in is an unlabelled icon, and the open sheet covers 70% of the results.

   **Fix:** keep search visible above the grid on mobile.

3. **[UX] Every car page ships the whole database.** `car.html` is 1.37 MB, against 21 KB for `box.html`, because all 2,787 cars are passed to the client (`app/(browser)/car/[token]/page.tsx:54`). That's about 154 KB gzipped for the JSON alone, and a single shared car link pays the same cost.

   **Fix:** remove unused columns first: `Cost` always equals `Price`, and `lostmedia` is always false. Then consider rendering the first page on the server and loading the rest afterwards.

4. **[SOLID: SRP] `SidebarFilters` does too much.** At 693 lines it handles UI, filter state, URL reading and writing, debounced history updates and price input logic. It also pushes state to its parent through an effect (`app/components/sidebar-filters.tsx:604`), so `HomeClient` keeps a second copy.

   **Why it matters:** this structure contributes to several of the filter and URL issues below.

   **Fix:** split it into a `useCarFilters` hook, a `filter-url.ts` module and a presentational panel.

## Medium

### Bugs

5. **Car URL obfuscation doesn't hide anything:** the readable `_id` (such as `1959356a1600super`) is in the client payload and in the public `/data/cars.json`. Either remove it from both or drop the token system.
6. **Car images may expire, with no fallback:** 2,773 of 2,787 image URLs start with `tr.rbxcdn.com/180DAY-`, which suggests a retention limit, though this isn't confirmed. `app/components/car-tile.tsx:21` has no fallback if an image fails.
7. **Car modal content can be cut off:** `md:items-center` in a scrolling container (`app/components/maincard.tsx:13`) makes the top unreachable when content overflows, likely around 1024×600. At 768px wide, each column is only about 156px.
8. **No error page:** the new `app/not-found.tsx` covers 404s, but there is still no `error.tsx` or `global-error.tsx`, so a client crash gets Next's stock error screen.

### UX

9. **Filtered links show the wrong list first:** filters apply only after mount (`app/components/sidebar-filters.tsx:611`), so "View all new cars" flashes the full list and loads its images. `/box#slug` has a similar flash of the first tab (`app/components/page-tabs.tsx:22`).
10. **Active filters are invisible when the sheet is closed:** a phone user on a filtered link sees fewer cars with no explanation. Add a count badge to the filter button.
11. **Desktop pagination is slow across 70 pages:** page 1 offers only `1 2 .. 70`, and the page picker is phone-only (`app/components/pagination-bar.tsx:276`). Showing the picker on desktop would still respect the no Prev/Next decision in `PLAN.md`.
12. **Page and scroll position get lost:** the page number isn't in the URL (`app/components/home-client.tsx:25`), so reloading or leaving and coming back returns to page 1.
13. **Inputs and controls are awkward on phones:** inputs under 16px trigger iOS zoom (`app/components/price-calculator.tsx:84`, `app/components/box-odds.tsx:66`, the price fields). The search-mode buttons are only about 20px tall (`app/components/sidebar-filters.tsx:671`).
14. **The calculator slows down multi-car lists:** search closes after every add (`app/components/price-calculator.tsx:42`), and keyboard focus is lost on add and remove. The list is also lost on reload.
15. **Duplicate car names can't be told apart in the calculator:** two of the five duplicate-name pairs also have the same price.
16. **The background scrolls behind modals:** `app/components/modal.tsx:77` doesn't lock scrolling on `/`, `/box` or `/tool`.
17. **The mobile filter sheet doesn't behave like a dialog:** it has no close button, Escape handling or focus management (`app/components/home-client.tsx:110`).
18. **Four pages share one title:** `/`, `/car`, `/box` and `/tool` all use "The CDID Database (Unofficial)", so browser tabs look identical. The site also goes by three different names, and the new donate card adds a fourth spelling, "CDIDRepo" (`app/page.tsx:155`).
19. **Some text has low contrast (AA needs 4.5:1):**

    | Text | Contrast |
    | --- | --- |
    | Reset button | 3.39:1 |
    | Rare tier header | 3.95:1 |
    | `zinc-500` on `zinc-950` | 4.12:1 |
    | `zinc-500` on black | 4.35:1 |

20. **Tiles get cramped on tablets:** with the sidebar open at 768px, the four columns are about 102px each, because the grid follows the viewport width instead of its container (`app/components/cards-grid.tsx:30`).

### SOLID

21. **DIP:** `lib` depends on UI files for its types (`app/lib/cars.ts:3`, `app/lib/boxes.ts:3`, `app/lib/use-filtered-cars.ts:2`). Move them to `lib/types.ts`.
22. **OCP (filters):** adding a filter type or sort means editing two files, and `DEFAULT_SORT_BY` is defined twice. Unknown values fail silently (`app/lib/use-filtered-cars.ts:7`, `app/components/sidebar-filters.tsx:59`). Use one table that holds each option's label and logic.
23. **OCP (box rules):** pity limits are keyed by slug in code (`app/lib/box-sim.ts:30`), and tier colours are keyed by name (`app/lib/box-display.ts:4`). A new box with pity or a new tier needs a code change, even though boxes and tiers already live in the database.
24. **SRP:** `BoxSimulator` mixes statistics, animation and UI (`app/components/box-simulator.tsx:42`, `:91`). Move the statistics to `lib` and the animation to a hook.
25. **ISP:** `CarTile` requires the full `CardItem` but only uses five fields (`app/components/car-tile.tsx:6`), which makes the payload harder to trim. `app/tool/page.tsx:34` already shows the better pattern.

## Low

### Bugs

26. Entering a max price of 0 shows "0 – 0" as active but applies no limit (`app/lib/use-filtered-cars.ts:61`).
27. Clicking a car within 300ms of changing a filter drops that change from the URL, and it isn't retried (`app/components/sidebar-filters.tsx:637`).
28. `CardItem` says `Dealership` is always a string, but 115 rows are null and one `Inaccurate` is null (`app/components/card.tsx:7`). The `Limited ?? "No"` fallback never applies, because the data uses `"None"`.
29. Decimal formats are mixed: "0.05%" and "12,5%" appear on the same panel (`app/lib/box-display.ts:25`, `app/components/box-odds.tsx:20`).
30. Two car names look like data-entry errors and need checking: `2023530imsporttouring` is named "2017 BMR 530i Luxury Line Touring", and `2001530itouring` is named "2002 BMR 530i".
31. Two problems could appear with future box data: an empty tier would crash the simulator (`app/lib/box-sim.ts:49`), and the same item in two tiers would merge its counts (`app/components/box-simulator.tsx:48`).
32. A `notFound()` inside the intercepted car route (`app/@modal/(.)car/[token]/page.tsx:14`) probably renders the new full-page 404 in the modal slot, after the footer (`app/layout.tsx:43`), instead of as an overlay. This needs a removed car's tile in a page opened before a redeploy, and wasn't confirmed at runtime.

### UX

33. Include and exclude filter states mostly rely on green versus red, and the third tap back to neutral isn't explained.
34. Removed cars get an unexplained red tile, while new and inaccurate cars have no marker on the tile.
35. "Recently added" is sorted by price, and the home page's car count includes 244 removed cars.
36. The footer disclaimer scrolls with no pause control (`app/components/site-footer.tsx:24`).
37. "Open 10" results are identified only by hover titles, which don't work on touch. The live region also announces no item names, because the images have empty alt text.
38. The "no cars match" message has no reset button, and price filters apply on blur while the other filters apply immediately.
39. The 404 image is only 204×204 but can display at up to 448px, so it looks blurry (`app/not-found.tsx:17`). Its alt text, "Arlestare", also tells screen reader users nothing, so `alt=""` fits better if it's decorative.
40. On the home page, the Donate button wraps under its text and the Discord button does at most widths, so they no longer line up the way the old full-width Discord card did (`app/page.tsx:136`, `:152`). This is estimated from the CSS.

### SOLID and maintenance

41. Rupiah formatting is written out in six places, and `de-DE` appears nine times. `formatRupiah` now exists as two private copies, in the calculator and in `app/page.tsx`.
42. The item key, the "Unknown car" fallback and the tier header markup are duplicated across `app/box/page.tsx:32`, `app/tool/page.tsx:50` and `app/components/box-simulator.tsx:287`. The metadata block is copied into five files, and the site URL into three.
43. `scripts/lib/supabase.js:33` calls `process.exit` from library code, runs work on import and hand-parses `.env`.
44. Dead code: `getBoxBySlug`, `BoxTier`, the exports `CAR_MODAL_CONTENT_CLASS` and `CarDetails`, and five unused SVGs in `public/`.
45. `app/not-found.tsx:16` uses `priority`, which Next 16 deprecates in favour of `preload`.
46. The donation amount is a constant in `app/page.tsx:18`, so every donation needs a code change and a rebuild. The bar is capped at 100%, but `aria-valuenow` isn't, so going over the goal reports an invalid value (`app/page.tsx:168`).

## What checked out

- **LSP:** nothing applies, because the project has no class or subtype hierarchies.
- **Build traces:** they include `public/data`, so missing files on the server aren't a problem.
- **Box data:** rates add up to 1, with no empty tiers, duplicate items or missing cars.
- **Odds maths:** the pity and average-opens calculations in `app/lib/box-odds.ts` were correct when worked through by hand.
- **Modal and page picker:** keyboard handling and focus behaviour are solid.
