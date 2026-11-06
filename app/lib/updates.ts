// Confirmed update dates (WIB, UTC+7), copied from updates.csv. Weekly drops go live Friday 19:00 WIB;
// other rows are the announcement time. Add a line whenever a new update ships.
// An empty time means it is unknown and is treated as 19:00 WIB.
export const UPDATES: ReadonlyArray<readonly [date: string, time: string]> = [
  ["2025-08-01", "19:00"],
  ["2025-08-08", "19:00"],
  ["2025-08-15", "19:00"],
  ["2025-08-16", "22:23"],
  ["2025-08-18", "12:21"],
  ["2025-08-22", "19:00"],
  ["2025-08-29", "19:00"],
  ["2025-09-05", "19:00"],
  ["2025-09-12", "19:00"],
  ["2025-09-26", "19:00"],
  ["2025-10-03", "19:00"],
  ["2025-10-10", "19:00"],
  ["2025-10-17", "19:00"],
  ["2025-10-31", "22:08"],
  ["2025-11-02", ""],
  ["2025-11-07", "19:00"],
  ["2025-11-14", "19:00"],
  ["2025-11-21", "19:00"],
  ["2025-11-28", "19:00"],
  ["2025-12-30", "00:00"],
  ["2026-01-02", "22:04"],
  ["2026-01-09", "19:00"],
  ["2026-01-16", "19:00"],
  ["2026-01-23", "19:00"],
  ["2026-01-30", "19:00"],
  ["2026-02-18", "21:40"],
  ["2026-02-20", "20:51"],
  ["2026-02-27", "19:00"],
  ["2026-03-07", "19:01"],
  ["2026-03-13", "19:00"],
  ["2026-03-20", "20:12"],
  ["2026-03-21", "23:07"],
  ["2026-03-27", "19:00"],
  ["2026-04-03", "19:00"],
  ["2026-04-17", "19:00"],
  ["2026-04-24", "19:00"],
  ["2026-05-01", "19:00"],
  ["2026-05-15", "19:00"],
  ["2026-05-27", "23:10"],
  ["2026-06-05", "19:00"],
  ["2026-06-12", "19:00"],
  ["2026-06-19", "19:00"],
  ["2026-06-26", "19:00"],
  ["2026-07-24", "22:43"],
  ["2026-07-31", "19:00"],
  ["2026-08-01", "01:40"],
  ["2026-08-07", "19:00"],
  ["2026-08-17", "21:04"],
  ["2026-08-21", "19:00"],
  ["2026-08-28", "19:00"],
  ["2026-09-04", "19:00"],
  ["2026-09-18", "19:00"],
  ["2026-09-25", "19:00"],
  ["2026-10-02", "19:00"],
  ["2026-10-09", "19:00"],
  ["2026-10-16", "19:00"],
  ["2026-11-01", "19:06"],
  ["2026-11-06", "19:00"],
];

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const WIB_OFFSET_MS = 7 * HOUR_MS;
const WEEKLY_HOUR = 19;

// Turns a WIB wall-clock date and time into a real instant.
function wibInstant(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = (time || `${WEEKLY_HOUR}:00`).split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute) - WIB_OFFSET_MS;
}

const formatWib = (instant: number, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "Asia/Jakarta" }).format(instant);

export type NextUpdate = {
  title: string;
  headline: string;
  detail: string;
};

// Later gaps count more: a gap loses half its weight for every HALF_LIFE_GAPS gaps before the latest one.
const HALF_LIFE_GAPS = 12;
const MIN_GAPS = 5;
const LOW_QUANTILE = 0.15;
const HIGH_QUANTILE = 0.85;
const CONFIDENCE = Math.round((HIGH_QUANTILE - LOW_QUANTILE) * 100);

function weightedQuantile(items: { value: number; weight: number }[], quantile: number) {
  const sorted = [...items].sort((a, b) => a.value - b.value);
  const total = sorted.reduce((sum, item) => sum + item.weight, 0);
  let running = 0;
  for (const item of sorted) {
    running += item.weight;
    if (running / total >= quantile) return item.value;
  }
  return sorted[sorted.length - 1].value;
}

const shortDay = (instant: number) => formatWib(instant, { weekday: "short", day: "numeric", month: "short" });

// Interval model: how long past updates were apart (in days), weighted toward recent ones. The next update
// lands between the 15th and 85th percentile of those gaps after the last update, so about 70% of the time.
// Gaps shorter than the time already waited are ruled out. An update already scheduled by a posted restart
// notice (a row dated in the future) is shown as-is instead of predicted.
export function getNextUpdate(now = Date.now()): NextUpdate {
  const instants = UPDATES.map(([date, time]) => wibInstant(date, time));
  const last = instants[instants.length - 1];

  if (last > now) {
    return {
      title: "Next update",
      headline: `${shortDay(last)}, ${formatWib(last, { hour: "2-digit", minute: "2-digit", hour12: false })} WIB`,
      detail: "A restart notice is up, so the update is on the way.",
    };
  }

  const gaps = instants.slice(1).map((instant, i) => ({
    value: (instant - instants[i]) / DAY_MS,
    weight: 0.5 ** ((instants.length - 2 - i) / HALF_LIFE_GAPS),
  }));
  const elapsed = (now - last) / DAY_MS;
  const stillPossible = gaps.filter((gap) => gap.value >= elapsed);
  const pool = stillPossible.length >= MIN_GAPS ? stillPossible : gaps;

  const early = Math.max(last + weightedQuantile(pool, LOW_QUANTILE) * DAY_MS, now);
  const late = Math.max(last + weightedQuantile(pool, HIGH_QUANTILE) * DAY_MS, early);
  const from = shortDay(early);
  const to = shortDay(late);

  return {
    title: "Next update (predicted)",
    headline: from === to ? `Likely ${from}` : `Likely ${from} – ${to}`,
    detail: `${CONFIDENCE}% confidence, from ${gaps.length} past gaps. A restart notice is the real confirmation.`,
  };
}
