"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "../lib/cn";

type BoxTab = {
  slug: string;
  label: string;
  price: string | null;
  content: React.ReactNode;
};

export function BoxTabs({ heading, tabs }: { heading: React.ReactNode; tabs: BoxTab[] }) {
  const pathname = usePathname();
  const [activeSlug, setActiveSlug] = useState(tabs[0]?.slug);

  // Next's client navigation doesn't fire hashchange, so a link from the car modal is picked up
  // through the pathname. The URL has no box hash while the modal is open, and that leaves the
  // current tab alone.
  useEffect(() => {
    const syncFromHash = () => {
      const slug = window.location.hash.slice(1);
      if (tabs.some((tab) => tab.slug === slug)) setActiveSlug(slug);
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [tabs, pathname]);

  const selectTab = (slug: string) => {
    setActiveSlug(slug);
    window.history.replaceState(null, "", `#${slug}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    selectTab(next.slug);
    document.getElementById(`box-tab-${next.slug}`)?.focus();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 lg:justify-start">
        {heading}
        <p className="text-zinc-200 lg:order-last lg:ml-auto">
          {tabs.find((tab) => tab.slug === activeSlug)?.price}
        </p>
        <div role="tablist" aria-label="Boxes" className="flex w-full gap-2 lg:w-auto">
          {tabs.map(({ slug, label }, index) => {
            const active = slug === activeSlug;
            return (
              <button
                key={slug}
                id={`box-tab-${slug}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`box-panel-${slug}`}
                tabIndex={active ? 0 : -1}
                onClick={() => selectTab(slug)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={cn(
                  "min-w-0 flex-1 rounded-md border px-1 py-2 text-sm lg:flex-none lg:px-4",
                  active ? "border-accent text-accent" : "border-zinc-700 text-zinc-400 hover:text-white"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Every panel stays in the HTML so search engines can read all of the boxes. */}
      {tabs.map(({ slug, content }) => (
        <div
          key={slug}
          id={`box-panel-${slug}`}
          role="tabpanel"
          aria-labelledby={`box-tab-${slug}`}
          hidden={slug !== activeSlug}
        >
          {content}
        </div>
      ))}
    </div>
  );
}
