const lastUpdated = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
}).format(new Date(process.env.BUILD_DATE ?? Date.now()));

const LINES = [
  "Made with ❤️ by aoderu",
  "Built since Aug 2025!",
  `Last updated ${lastUpdated}`,
  "Unofficial fan site, not affiliated with Car Driving Indonesia or Roblox.",
];

// The ticker slides by half of its width to loop, so half of the copies must be wider than the
// widest screen. Five copies of these lines cover about 4300px.
const COPIES = 10;

export function SiteFooter() {
  return (
    <footer className="flex h-[var(--footer-h)] shrink-0 items-center overflow-hidden whitespace-nowrap border-t border-zinc-700 bg-black text-xs text-zinc-500 motion-reduce:overflow-x-auto motion-reduce:[scrollbar-width:none]">
      {/* pr-6 adds the missing last gap, so -50% lands exactly on the start of the second half.
          With reduced motion the ticker stops and one copy can be scrolled by hand instead. */}
      <div className="flex w-max animate-[footer-ticker_140s_linear_infinite] items-center gap-6 pr-6 motion-reduce:animate-none motion-reduce:pl-3">
        {Array.from({ length: COPIES }, (_, copy) =>
          LINES.map((line) => (
            <span
              key={`${copy}-${line}`}
              aria-hidden={copy > 0 ? true : undefined}
              className={copy > 0 ? "motion-reduce:hidden" : undefined}
            >
              {line}
            </span>
          ))
        )}
      </div>
    </footer>
  );
}
