"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "../lib/cn";

type PaginationItem = number | "ellipsis";

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  const items = buildPaginationItems(currentPage, totalPages);

  // Drop any ellipsis that sits between consecutive pages and so hides nothing (e.g. page 4 of 6)
  return items.filter((item, index) => {
    if (item !== "ellipsis") return true;
    const prev = items[index - 1];
    const next = items[index + 1];
    return typeof prev !== "number" || typeof next !== "number" || next - prev > 1;
  });
}

function buildPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 1) {
    return [1];
  }

  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage === 1) {
    return [1, 2, "ellipsis", totalPages];
  }

  if (currentPage === 2) {
    return [1, 2, 3, "ellipsis", totalPages];
  }

  if (currentPage === 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages];
  }

  if (currentPage === 4) {
    return [1, "ellipsis", 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage === totalPages - 3) {
    return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, "ellipsis", totalPages];
  }

  if (currentPage === totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  if (currentPage === totalPages - 1) {
    return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }

  if (currentPage === totalPages) {
    return [1, "ellipsis", totalPages - 1, totalPages];
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];
}

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const MIN_THUMB_HEIGHT = 24;

function getScrollbarMetrics(list: HTMLElement | null, track: HTMLElement | null) {
  if (!list || !track) return null;
  const trackHeight = track.clientHeight;
  const thumbHeight = Math.max(MIN_THUMB_HEIGHT, (list.clientHeight / list.scrollHeight) * trackHeight);
  return {
    list,
    maxScroll: list.scrollHeight - list.clientHeight,
    thumbHeight,
    thumbTravel: trackHeight - thumbHeight,
  };
}

// Written straight to the DOM on every scroll event instead of through state, so the thumb
// keeps up with the list without re-rendering every page button.
function syncScrollbar(list: HTMLElement | null, track: HTMLElement | null, thumb: HTMLElement | null) {
  const metrics = getScrollbarMetrics(list, track);
  if (!metrics || !track || !thumb) return;

  const { maxScroll, thumbHeight, thumbTravel } = metrics;
  // Few enough pages to fit without scrolling, so there's nothing to show.
  track.style.visibility = maxScroll > 0 ? "visible" : "hidden";
  if (maxScroll <= 0) return;

  thumb.style.height = `${thumbHeight}px`;
  thumb.style.transform = `translateY(${(metrics.list.scrollTop / maxScroll) * thumbTravel}px)`;
}

const ARROW_BUTTON_CLASS =
  "rounded-md border border-zinc-500 p-1.5 text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent";

// A custom list rather than a native <select>, so phones get the site's scrollbar instead of
// the system picker wheel.
function PagePicker({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startScrollTop: number } | null>(null);
  const listId = useId();

  const close = (returnFocus: boolean) => {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const getThumbMetrics = () => getScrollbarMetrics(listRef.current, trackRef.current);
  const syncThumb = () => syncScrollbar(listRef.current, trackRef.current, thumbRef.current);

  const handleThumbPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const list = listRef.current;
    if (!list) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startY: event.clientY, startScrollTop: list.scrollTop };
  };

  const handleThumbPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const metrics = getThumbMetrics();
    if (!drag || !metrics || metrics.thumbTravel <= 0) return;
    const { list, maxScroll, thumbTravel } = metrics;
    list.scrollTop = drag.startScrollTop + ((event.clientY - drag.startY) / thumbTravel) * maxScroll;
  };

  const handleThumbPointerUp = () => {
    dragRef.current = null;
  };

  // A press on the bare track jumps there, centring the thumb under the finger.
  const handleTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const metrics = getThumbMetrics();
    if (!metrics || metrics.thumbTravel <= 0) return;
    const { list, maxScroll, thumbHeight, thumbTravel } = metrics;
    const offset = event.clientY - event.currentTarget.getBoundingClientRect().top - thumbHeight / 2;
    list.scrollTop = (offset / thumbTravel) * maxScroll;
  };

  useEffect(() => {
    if (!isOpen) return;

    // Open on the current page: centre it in the list and focus it. scrollTop instead of
    // scrollIntoView so the page behind the list doesn't scroll too.
    const list = listRef.current;
    const current = list?.querySelector<HTMLButtonElement>('[aria-current="page"]');
    if (list && current) {
      list.scrollTop = current.offsetTop - (list.clientHeight - current.offsetHeight) / 2;
      current.focus({ preventScroll: true });
    }
    // Setting scrollTop fires a scroll event too, but not when the list is already at the top.
    syncScrollbar(list, trackRef.current, thumbRef.current);

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  // Tab closes the list rather than a blur handler: Safari doesn't focus a tapped button, so a
  // blur would close the list before the tap on a page lands.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === "Tab") {
      setIsOpen(false);
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    if (!listRef.current?.contains(event.target as Node)) return;

    event.preventDefault();
    const active = event.target as HTMLElement;
    const sibling = event.key === "ArrowDown" ? active.nextElementSibling : active.previousElementSibling;
    (sibling as HTMLElement | null)?.focus();
  };

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-label={`Page ${currentPage} of ${totalPages}, choose a page`}
        className="flex items-center gap-1 rounded-md border border-zinc-500 py-1 pl-2 pr-1.5 tabular-nums text-white hover:bg-zinc-800"
      >
        <span>
          {currentPage} / {totalPages}
        </span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn("text-zinc-400 transition-transform motion-reduce:transition-none", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute left-1/2 top-full z-20 mt-2 flex w-36 -translate-x-1/2 gap-1 rounded-lg border border-zinc-700 bg-zinc-950 p-1 shadow-xl">
          <div
            ref={listRef}
            id={listId}
            onScroll={syncThumb}
            className="relative flex max-h-64 min-w-0 flex-1 flex-col gap-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              const isCurrent = page === currentPage;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => {
                    onPageChange(page);
                    close(true);
                  }}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "shrink-0 rounded-md px-3 py-1.5 text-left tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400",
                    isCurrent ? "bg-white text-zinc-900" : "text-white hover:bg-zinc-800"
                  )}
                >
                  {page} / {totalPages}
                </button>
              );
            })}
          </div>

          {/* Drawn scrollbar in its own column, so it sits beside the pages and never over them.
              iOS ignores ::-webkit-scrollbar styling, so the native one can't be themed there. */}
          <div
            ref={trackRef}
            aria-hidden="true"
            onPointerDown={handleTrackPointerDown}
            className="relative w-2 shrink-0 touch-none"
          >
            {/* Square thumb on a bare track, matching the site's [&::-webkit-scrollbar] styling */}
            <div
              ref={thumbRef}
              onPointerDown={handleThumbPointerDown}
              onPointerMove={handleThumbPointerMove}
              onPointerUp={handleThumbPointerUp}
              onPointerCancel={handleThumbPointerUp}
              className="absolute inset-x-0 top-0 bg-zinc-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Phones can't fit the full row of page buttons beside the header icons, so they get
// prev/next arrows around a page picker instead.
function CompactPagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center gap-2 sm:hidden">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
        className={ARROW_BUTTON_CLASS}
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      <PagePicker currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
        className={ARROW_BUTTON_CLASS}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const paginationItems = getPaginationItems(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className="flex min-w-0 flex-1 items-center justify-center px-2 text-sm text-white">
      <CompactPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />

      <div className="hidden min-w-0 items-center gap-2 overflow-x-auto sm:flex">
        {paginationItems.map((item, index) => {
          if (item === "ellipsis") {
            return (
              <span key={`ellipsis-${index}`} className="px-1 text-zinc-500">
                ..
              </span>
            );
          }

          return (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === currentPage ? "page" : undefined}
              className={`min-w-9 rounded-md border px-2 py-1 transition-colors ${
                item === currentPage
                  ? "border-white bg-white text-zinc-900"
                  : "border-zinc-500 text-white hover:bg-zinc-800"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    </nav>
  );
}