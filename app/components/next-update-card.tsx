"use client";

import { useSyncExternalStore } from "react";
import { cn } from "../lib/cn";
import { FINE_PRINT, getNextUpdate } from "../lib/updates";

const MINUTE_MS = 60_000;

// The card depends on the visitor's clock, so it is worked out in the browser. The current minute is the
// "store": it ticks once a minute, so the card rolls over to a new day on its own. The server has no clock
// to use, so it renders a placeholder that the browser replaces right after the page loads.
const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, MINUTE_MS);
  return () => clearInterval(id);
};
const currentMinute = () => Math.floor(Date.now() / MINUTE_MS);
const noMinute = () => null;

export function NextUpdateCard() {
  const minute = useSyncExternalStore(subscribe, currentMinute, noMinute);
  const nextUpdate = minute === null ? null : getNextUpdate(minute * MINUTE_MS);

  return (
    <section aria-label="Next update" aria-busy={nextUpdate === null} className="flex flex-col gap-3 rounded-lg border border-zinc-700 bg-zinc-950 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400">Next update</h2>
        {nextUpdate ? (
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">{nextUpdate.badge}</span>
        ) : (
          <span className="h-5 w-20 animate-pulse rounded-full bg-zinc-800" />
        )}
      </div>
      {nextUpdate ? (
        <p className="text-xl font-bold text-accent md:text-2xl">{nextUpdate.headline}</p>
      ) : (
        <p className="h-7 w-56 max-w-full animate-pulse rounded bg-zinc-800 md:h-8" />
      )}
      <div className="space-y-1" aria-hidden="true">
        <div className="relative h-2 rounded-full bg-zinc-800">
          {nextUpdate ? (
            <>
              <div
                className={cn("absolute inset-y-0 rounded-full", nextUpdate.timeline.muted ? "bg-zinc-600" : "bg-accent")}
                style={{ left: `${nextUpdate.timeline.from}%`, width: `${nextUpdate.timeline.to - nextUpdate.timeline.from}%` }}
              />
              {nextUpdate.timeline.nowAt === null ? null : (
                <div
                  className="absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-white"
                  style={{ left: `${nextUpdate.timeline.nowAt}%` }}
                />
              )}
            </>
          ) : null}
        </div>
        <div className="relative h-4 text-xs text-zinc-500">
          {nextUpdate?.timeline.ticks.map(({ label, at }) => (
            <span key={label} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${at}%` }}>
              {label}
            </span>
          ))}
        </div>
      </div>
      {nextUpdate?.method ? (
        <details className="text-xs text-zinc-500">
          <summary className="cursor-pointer hover:text-zinc-300">How is this calculated?</summary>
          <p className="mt-2 text-zinc-400">{nextUpdate.method}</p>
        </details>
      ) : null}
      {/* Pinned to the bottom when the card is stretched to match the histogram beside it. */}
      <p className="mt-auto text-xs text-zinc-500">{nextUpdate?.fineprint ?? FINE_PRINT}</p>
    </section>
  );
}
