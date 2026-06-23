"use client";

import { SidebarFilters } from "./sidebar-filters-panel";
import { CardsGrid, type CardItem } from "./cards-grid";
import { useEffect, useRef, useState, useMemo } from "react";
import type { Filters } from "./sidebar-filters";
import { SlidersHorizontal, ScrollText } from 'lucide-react';
import { Pagination } from "./pagination-bar";
import { MainCard } from "./maincard";
import { Credits } from "./credits";

export default function HomeClient() {
  const pageStartRef = useRef(performance.now());
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(false);
  const [hasClickedFilter, setHasClickedFilter] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
  const [isCreditsVisible, setIsCreditsVisible] = useState(false);
  const [buildSeconds, setBuildSeconds] = useState<number | null>(null);
  const [allCars, setAllCars] = useState<CardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Closed by default on mobile (breakpoint 768px matches Tailwind md)
    if (window.innerWidth < 768) {
      setIsSidebarVisible(false);
    }
    // 2. Enable transitions after a brief delay to prevent slide on mount
    const transitionTimer = setTimeout(() => {
      setIsTransitionEnabled(true);
    }, 100);

    // 3. Read clicked status from localStorage
    const clicked = localStorage.getItem("cdid_filter_clicked");
    if (!clicked) {
      setHasClickedFilter(false);
    }

    return () => {
      clearTimeout(transitionTimer);
    };
  }, []);

  const pageSize = 40;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    let active = true;
    fetch("/data/cars.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load cars.json");
        return res.json();
      })
      .then((data) => {
        if (active) {
          const normalizedCars = data.map((car: any) => ({
            ...car,
            Price: typeof car.Price === "number"
              ? car.Price
              : Number(car.Cost ?? car.Price ?? 0),
          }));

          setAllCars(normalizedCars);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching cars:", err);
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (buildSeconds === null && totalItems > 0 && !isLoading) {
      const elapsedSeconds = (performance.now() - pageStartRef.current) / 1000;
      setBuildSeconds(Number(elapsedSeconds.toFixed(3)));
    }
  }, [buildSeconds, totalItems, isLoading]);

  const { dealershipOptions, limitedOptions, gamepassOptions } = useMemo(() => {
    const getUnique = (col: keyof CardItem) => {
      const vals = allCars
        .map((c) => c[col])
        .filter(Boolean)
        .map(String);
      return Array.from(new Set(vals)).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );
    };

    return {
      dealershipOptions: getUnique("Dealership").map((v) => ({ label: v, value: v })),
      limitedOptions: getUnique("Limited").map((v) => ({ label: v, value: v })),
      gamepassOptions: getUnique("Gamepass").map((v) => ({ label: v, value: v })),
    };
  }, [allCars]);

  const handleFilterClick = () => {
    setIsSidebarVisible((current) => !current);
    if (!hasClickedFilter) {
      setHasClickedFilter(true);
      localStorage.setItem("cdid_filter_clicked", "true");
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
      <aside
        className={
          isSidebarVisible
            ? `fixed z-40 overflow-hidden bg-black/95 p-4 backdrop-blur-md ${isTransitionEnabled ? "transition-transform duration-200" : ""} md:left-0 md:top-0 md:h-full md:w-80 md:border-r md:border-gray-700 bottom-0 left-0 right-0 h-[70vh] border-t border-gray-700 md:border-t-0`
            : `fixed z-40 overflow-hidden bg-black/95 p-4 backdrop-blur-md ${isTransitionEnabled ? "transition-transform duration-200" : ""} md:-translate-x-full md:pointer-events-none bottom-0 left-0 right-0 h-[70vh] border-t border-gray-700 translate-y-full md:translate-y-0 md:border-t-0`
        }
      >
        <div className="flex h-full w-full flex-col">
          <span className="text-xs uppercase tracking-[0.2em]">CDID Car Database (Unofficial)</span>

          {/* search bar */}
          <div className="mt-6">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 rounded-md bg-gray-900 px-4 py-2 text-white focus:bg-gray-800 focus:outline-none"
            />
          </div>

          <SidebarFilters
            onChange={(f) => setFilters(f)}
            carCount={totalItems}
            buildSeconds={buildSeconds ?? 0}
            dealershipOptions={dealershipOptions}
            limitedOptions={limitedOptions}
            gamepassOptions={gamepassOptions}
          />
        </div>
      </aside>
      
      {/* Mobile backdrop - only visible on mobile when sidebar is open */}
      {isSidebarVisible && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setIsSidebarVisible(false)}
        />
      )}
      
      <main
        className={
          isSidebarVisible
            ? `flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${isTransitionEnabled ? "transition-[padding-left,padding-bottom] duration-200" : ""} md:pl-80 md:pb-0 pl-0 pb-[70vh]`
            : `flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${isTransitionEnabled ? "transition-[padding-left,padding-bottom] duration-200" : ""} md:pl-0 md:pb-0 pl-0 pb-0`
        }
      >
        <header className="flex h-16 items-center justify-between border-b border-gray-700 px-2">
          <button
            type="button"
            onClick={handleFilterClick}
            aria-expanded={isSidebarVisible}
            className={
              hasClickedFilter
                ? "rounded-md border border-gray-500 px-2 py-2 text-sm text-white hover:bg-gray-800"
                : "golden-border-spin rounded-md px-2 py-2 text-sm text-white hover:bg-gray-800"
            }
          >
            <span className="relative z-10 flex items-center justify-center">
              <SlidersHorizontal size={16} />
            </span>
          </button>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

          <button
            type="button"
            onClick={() => {
              setSelectedCard(null);
              setIsCreditsVisible(true);
            }}
            aria-expanded={isCreditsVisible}
            className="rounded-md border border-gray-500 px-2 py-2 text-sm text-white hover:bg-gray-800"
          >
            <ScrollText size={16} />
          </button>
        </header>
        
        <CardsGrid
          cards={allCars}
          isLoading={isLoading}
          search={searchQuery}
          filters={filters}
          page={currentPage}
          pageSize={pageSize}
          onTotalItemsChange={setTotalItems}
          onCardClick={setSelectedCard}
        />

        {selectedCard ? <MainCard card={selectedCard} onBack={() => setSelectedCard(null)} /> : null}
        {isCreditsVisible ? <Credits onBack={() => setIsCreditsVisible(false)} /> : null}
      </main>
    </div>
  );
}
