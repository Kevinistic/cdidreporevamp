import { useMemo } from "react";
import type { CardItem } from "../components/card";
import type { FilterState, Filters } from "../components/sidebar-filters";

const DEFAULT_SORT_BY = "price-desc";

const TYPE_PREDICATES: Record<string, (card: CardItem) => boolean> = {
  new: (card) => card.New,
  event: (card) => card.event,
  minigame: (card) => card.minigame,
  removed: (card) => card.Legacy,
};

function matchesFilterState(value: string, { included, excluded }: FilterState) {
  if (included.length > 0 && !included.includes(value)) return false;
  return !excluded.includes(value);
}

function compareCars(sortBy: string) {
  return (a: CardItem, b: CardItem) => {
    if (sortBy === "name-asc") {
      return a.CarName.localeCompare(b.CarName, undefined, { sensitivity: "base" });
    }
    if (sortBy === "name-desc") {
      return b.CarName.localeCompare(a.CarName, undefined, { sensitivity: "base" });
    }
    if (sortBy === "price-asc") {
      return a.Price - b.Price;
    }
    // price-desc or default
    return b.Price - a.Price;
  };
}

function filterAndSortCars(cars: CardItem[], filters: Filters | undefined) {
  if (!filters) {
    return [...cars].sort(compareCars(DEFAULT_SORT_BY));
  }

  const query = filters.search.trim().toLowerCase();
  const typePredicate = TYPE_PREDICATES[filters.type];
  const minPrice = parseFloat(filters.priceRange.min);
  const maxPrice = parseFloat(filters.priceRange.max);

  return cars
    .filter((card) => {
      if (query && !card.CarName.toLowerCase().includes(query)) return false;
      if (!matchesFilterState(card.Dealership, filters.dealerships)) return false;
      if (!matchesFilterState(card.Limited, filters.limiteds)) return false;
      if (!matchesFilterState(card.Gamepass, filters.gamepasses)) return false;
      if (typePredicate && !typePredicate(card)) return false;
      if (!Number.isNaN(minPrice) && minPrice > 0 && card.Price < minPrice) return false;
      if (!Number.isNaN(maxPrice) && maxPrice > 0 && card.Price > maxPrice) return false;
      return true;
    })
    .sort(compareCars(filters.sortBy || DEFAULT_SORT_BY));
}

export function useFilteredCars(allCars: CardItem[], filters: Filters | undefined) {
  return useMemo(() => filterAndSortCars(allCars, filters), [allCars, filters]);
}
