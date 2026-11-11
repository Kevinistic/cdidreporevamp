// Update dates and times (WIB, UTC+7) from the Supabase `updates` table, fetched before each build and
// inlined by next.config.ts. Weekly drops and restart-notice-only Fridays go live Friday 19:00 WIB; other
// rows are the announcement time. Insert a row in Supabase (time defaults to 19:00) whenever a new update
// ships, then redeploy.
export const UPDATES: ReadonlyArray<readonly [date: string, time: string]> = JSON.parse(
  process.env.UPDATE_ROWS ?? "[]",
);

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const WIB_OFFSET_MS = 7 * HOUR_MS;
const WEEKLY_HOUR = 19;

// Updates before this date came every month or two. Only the weekly era after it is used for predictions.
const WEEKLY_ERA_START = "2025-07-26";

// Turns a WIB wall-clock date and time into a real instant.
function wibInstant(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = (time || `${WEEKLY_HOUR}:00`).split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute) - WIB_OFFSET_MS;
}

const formatWib = (instant: number, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "Asia/Jakarta" }).format(instant);

// Whole WIB calendar days since 1970-01-01, which was a Thursday.
const dayOf = (instant: number) => Math.floor((instant + WIB_OFFSET_MS) / DAY_MS);
const noonOf = (day: number) => day * DAY_MS - WIB_OFFSET_MS + 12 * HOUR_MS;
const FRIDAY = 4; // Monday = 0
const weekdayOf = (day: number) => (day + 3) % 7;
// The first Friday strictly after `day`: the weekly slot an update is aiming for.
const nextFriday = (day: number) => day + ((FRIDAY - weekdayOf(day) + 7) % 7 || 7);

export type NextUpdate = {
  headline: string;
  badge: string;
  // Two weeks starting today; positions are percentages across that span.
  // `muted` greys out a window that has already passed; `nowAt` marks today on it.
  timeline: { from: number; to: number; muted: boolean; nowAt: number | null; ticks: { label: string; at: number }[] };
  // How the estimate is calculated, shown behind a toggle. Only on predicted cards.
  method?: string;
  fineprint: string;
};

export const FINE_PRINT = "Unofficial estimate. Dates may shift.";

const TIMELINE_DAYS = 14;
const MIN_WINDOW_PERCENT = 2;
// The headline window is the shortest run of days holding at least this share of the possible outcomes.
const TARGET_LIKELIHOOD = 0.8;

// With fewer past waits this long than this, there is too little history to estimate from.
const MIN_SAMPLES = 5;

const shortDay = (day: number) => formatWib(noonOf(day), { weekday: "short", day: "numeric", month: "short" });
const percentText = (likelihood: number) => `${Math.round(likelihood * 100)}%`;

function buildTimeline(
  start: number,
  window: { from: number; to: number },
  options: { muted?: boolean; today?: number; firstTick?: number; cumulative?: (day: number) => number } = {},
): NextUpdate["timeline"] {
  const percent = (day: number) => Math.min(100, Math.max(0, ((day - start) / TIMELINE_DAYS) * 100));
  const from = percent(window.from);
  const to = Math.max(percent(window.to + 1), Math.min(100, from + MIN_WINDOW_PERCENT));
  const ticks: { label: string; at: number }[] = [];
  for (let day = Math.max(start, options.firstTick ?? start); day < start + TIMELINE_DAYS; day++) {
    if (weekdayOf(day) !== FRIDAY) continue;
    const label = formatWib(noonOf(day), { weekday: "short", day: "numeric" });
    // Each Friday shows the chance an update is out by the end of that day.
    ticks.push({
      label: options.cumulative ? `${label} · ${percentText(options.cumulative(day))}` : label,
      at: percent(day + 0.5),
    });
  }
  const muted = options.muted ?? false;
  return { from, to, muted, nowAt: muted && options.today !== undefined ? percent(options.today + 0.5) : null, ticks };
}

// Friday-slot model. Each past update in the weekly era is measured from the first Friday after the update
// before it: 0 means it landed on that Friday, 7 a week late, -6 a hotfix the next day. Offsets that today
// has already passed are ruled out, and the rest are simple counts, so "79%" means 79% of the past waits
// that lasted at least this long ended inside the window. Restart-notice-only Fridays count as updates.
// An update already scheduled by a posted restart notice (a row dated in the future) is shown as-is.
export function getNextUpdate(now = Date.now()): NextUpdate {
  const rows = UPDATES.filter(([date]) => date >= WEEKLY_ERA_START);
  const lastRow = rows[rows.length - 1];
  const last = wibInstant(lastRow[0], lastRow[1]);
  const today = dayOf(now);

  // A confirmed update (its row is already in the CSV) stays on the card for the rest of its WIB day,
  // even after its time has passed, before the prediction moves on to the one after it.
  if (dayOf(last) >= today) {
    const day = dayOf(last);
    return {
      headline: `${shortDay(day)}, ${formatWib(last, { hour: "2-digit", minute: "2-digit", hour12: false })} WIB`,
      badge: "100% likely",
      timeline: buildTimeline(today, { from: day, to: day }),
      fineprint: FINE_PRINT,
    };
  }

  const days = rows.map(([date, time]) => dayOf(wibInstant(date, time)));
  const offsets = days.slice(1).map((day, i) => day - nextFriday(days[i]));
  const anchor = nextFriday(days[days.length - 1]);
  const pool = offsets.filter((offset) => offset >= today - anchor);
  const share = (test: (day: number) => boolean) => pool.filter((offset) => test(anchor + offset)).length / pool.length;

  if (pool.length < MIN_SAMPLES) {
    return {
      headline: "Later than usual",
      badge: "No update yet",
      timeline: buildTimeline(Math.max(anchor, today - TIMELINE_DAYS + 1), { from: anchor, to: today }, { muted: true, today }),
      fineprint: FINE_PRINT,
    };
  }

  // The shortest window reaching the target always starts and ends on a day some past update landed on,
  // so only those days are tried. Ties go to the likelier window, then the earlier one.
  const landingDays = [...new Set(pool.map((offset) => anchor + offset))].sort((a, b) => a - b);
  let window = { from: landingDays[0], to: landingDays[landingDays.length - 1], likelihood: 1 };
  for (const [i, from] of landingDays.entries()) {
    for (const to of landingDays.slice(i)) {
      if (to - from > window.to - window.from) break;
      const likelihood = share((day) => day >= from && day <= to);
      if (likelihood < TARGET_LIKELIHOOD) continue;
      const shorter = to - from < window.to - window.from;
      if (shorter || likelihood > window.likelihood) window = { from, to, likelihood };
      break;
    }
  }

  return {
    headline: window.from === window.to ? shortDay(window.from) : `${shortDay(window.from)} – ${shortDay(window.to)}`,
    badge: `${percentText(window.likelihood)} likely`,
    // Ticks start at the Friday being aimed for, so the last update's own Friday never shows as 0%.
    timeline: buildTimeline(today, window, {
      firstTick: anchor,
      cumulative: (day) => share((updateDay) => updateDay <= day),
    }),
    // Built from the target above, so it stays true if that changes.
    method: `Empirical survival analysis, ${percentText(TARGET_LIKELIHOOD)} HDI. (Thanks Statprob)`,
    fineprint: FINE_PRINT,
  };
}
