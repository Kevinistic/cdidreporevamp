"use client";

import { SidebarFilters } from "./components/sidebar-filters-panel";
import { CardsGrid, type CardItem } from "./components/cards-grid";
import { useEffect, useRef, useState } from "react";
import type { Filters } from "./components/sidebar-filters";
import { TextAlignJustify, ScrollText } from 'lucide-react';
import { Pagination } from "./components/pagination-bar";
import { MainCard } from "./components/maincard";
import { Credits } from "./components/credits";

export default function Home() {
  const pageStartRef = useRef(performance.now());
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
  const [isCreditsVisible, setIsCreditsVisible] = useState(false);
  const [buildSeconds, setBuildSeconds] = useState<number | null>(null);

  const pageSize = 40;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (buildSeconds === null && totalItems > 0) {
      const elapsedSeconds = (performance.now() - pageStartRef.current) / 1000;
      setBuildSeconds(Number(elapsedSeconds.toFixed(3)));
    }
  }, [buildSeconds, totalItems]);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-80 overflow-hidden border-r border-gray-700 bg-black/95 p-4 backdrop-blur-md transition-transform duration-200 ${
          isSidebarVisible ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
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

          <SidebarFilters onChange={(f) => setFilters(f)} carCount={totalItems} buildSeconds={buildSeconds ?? 0} />
        </div>
      </aside>
      <main
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-[padding-left] duration-200 ${
          isSidebarVisible ? "pl-80" : "pl-0"
        }`}
      >
        <header className="flex h-16 items-center justify-between border-b border-gray-700 px-2">
          <button
            type="button"
            onClick={() => setIsSidebarVisible((current) => !current)}
            aria-expanded={isSidebarVisible}
            className="rounded-md border border-gray-500 px-2 py-2 text-sm text-white hover:bg-gray-800"
          >
            <TextAlignJustify size={16} />
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