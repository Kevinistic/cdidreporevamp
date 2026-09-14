"use client";

import { useEffect, useRef, useState } from "react";

type DropdownOption = {
  label: string;
  value: string;
};

type SectionKey = "types" | "filters" | "price" | "sortBy";

type PriceRange = {
  min: string;
  max: string;
};

const DEFAULT_PRICE_RANGE: PriceRange = { min: "0", max: "180000000000" };
const DEFAULT_SORT_BY = "price-desc";

type DropdownConfig = {
  label: string;
  options: DropdownOption[];
};

function formatPrice(value: string) {
  if (value === "") return "";

  const digits = value.replace(/\D/g, "");
  if (digits === "") return "";

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function normalizePriceInput(value: string) {
  return value.replace(/\D/g, "");
}

export type FilterState = {
  included: string[];
  excluded: string[];
};

export type Filters = {
  search: string;
  limiteds: FilterState;
  gamepasses: FilterState;
  dealerships: FilterState;
  priceRange: PriceRange;
  sortBy: string;
  type: string;
};

type SidebarFiltersProps = {
  onChange?: (filters: Filters) => void;
  carCount?: number;
  dealershipOptions?: DropdownOption[];
  limitedOptions?: DropdownOption[];
  gamepassOptions?: DropdownOption[];
};

function FilterOptionButton({
  label,
  state,
  onClick,
}: {
  label: string;
  state: "include" | "exclude" | "neutral";
  onClick: () => void;
}) {
  let styleClass = "";
  if (state === "include") {
    styleClass = "border-emerald-600 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/30";
  } else if (state === "exclude") {
    styleClass = "border-rose-600 bg-rose-950/20 text-rose-400 hover:bg-rose-900/30";
  } else {
    styleClass = "border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 w-fit items-center rounded-full border px-3 py-1 text-left text-sm font-medium whitespace-nowrap transition ${styleClass}`}
    >
      <span>{label}</span>
    </button>
  );
}

function MultistatePanel({
  options,
  states,
  onToggle,
}: {
  options: DropdownOption[];
  states: Record<string, "include" | "exclude" | "neutral">;
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 p-1">
      {options.map((option) => (
        <FilterOptionButton
          key={option.value}
          label={option.label}
          state={states[option.value] || "neutral"}
          onClick={() => onToggle(option.value)}
        />
      ))}
    </div>
  );
}

function PricePanel({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
  onMinFocus,
  onMinBlur,
  onMaxFocus,
  onMaxBlur,
}: {
  minPrice: string;
  maxPrice: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onMinFocus: () => void;
  onMinBlur: () => void;
  onMaxFocus: () => void;
  onMaxBlur: () => void;
}) {
  return (
    <div className="space-y-3 p-1 text-sm text-white">
      <label className="block space-y-2">
        <span className="block text-zinc-300">Min:</span>
        <input
          type="text"
          value={minPrice}
          onFocus={onMinFocus}
          onBlur={onMinBlur}
          onChange={(event) => onMinChange(normalizePriceInput(event.target.value))}
          placeholder="Enter minimum"
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="block text-zinc-300">Max:</span>
        <input
          type="text"
          value={maxPrice}
          onFocus={onMaxFocus}
          onBlur={onMaxBlur}
          onChange={(event) => onMaxChange(normalizePriceInput(event.target.value))}
          placeholder="Enter maximum"
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
    </div>
  );
}

function RadioPanel({
  options,
  selectedValue,
  onSelect,
  name = "radio-group",
}: {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  name?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 p-1">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-3 rounded px-2 py-1 text-sm text-white hover:bg-zinc-800"
        >
          <input
            type="radio"
            name={name}
            checked={selectedValue === option.value}
            onChange={() => onSelect(option.value)}
            className="h-4 w-4 border-zinc-500 bg-zinc-800 text-blue-500 focus:ring-blue-500"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function buildDropdown({ label, options }: DropdownConfig) {
  return { label, options };
}

function buildPriceDropdown(label: string) {
  return { label };
}

function SectionButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 w-full items-center px-2 py-2 text-center text-xs font-medium whitespace-nowrap transition ${
        active
          ? "bg-zinc-700 text-white"
          : "bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
      }`}
    >
      <span>{label}</span>
    </button>
  );
}

function getFilterState(states: Record<string, "include" | "exclude" | "neutral">) {
  const included: string[] = [];
  const excluded: string[] = [];
  for (const [key, value] of Object.entries(states)) {
    if (value === "include") {
      included.push(key);
    } else if (value === "exclude") {
      excluded.push(key);
    }
  }
  return { included, excluded };
}

export function SidebarFilters({
  onChange,
  carCount = 0,
  dealershipOptions = [],
  limitedOptions = [],
  gamepassOptions = [],
}: SidebarFiltersProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>("types");

  const types = buildDropdown({
    label: "Types",
    options: [
      { label: "All Cars", value: "all" },
      { label: "New Cars", value: "new" },
      { label: "Event Cars", value: "event" },
      { label: "Minigame Cars", value: "minigame" },
      { label: "Removed Cars", value: "removed" },
    ],
  });

  const price = buildPriceDropdown("Price");

  const sortBy = buildDropdown({
    label: "Sort by",
    options: [
      { label: "Name: A to Z", value: "name-asc" },
      { label: "Name: Z to A", value: "name-desc" },
      { label: "Price: Low to High", value: "price-asc" },
      { label: "Price: High to Low", value: "price-desc" },
    ],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [limitedStates, setLimitedStates] = useState<Record<string, "include" | "exclude" | "neutral">>({});
  const [gamepassStates, setGamepassStates] = useState<Record<string, "include" | "exclude" | "neutral">>({});
  const [dealershipStates, setDealershipStates] = useState<Record<string, "include" | "exclude" | "neutral">>({});
  const [priceRange, setPriceRange] = useState<PriceRange>(DEFAULT_PRICE_RANGE);
  const [priceInput, setPriceInput] = useState<PriceRange>(DEFAULT_PRICE_RANGE);
  const [priceFocused, setPriceFocused] = useState<{ min: boolean; max: boolean }>({ min: false, max: false });
  const [sortByValue, setSortByValue] = useState<string>(DEFAULT_SORT_BY);

  const handleReset = () => {
    setActiveSection("types");
    setSearchQuery("");
    setSelectedType("all");
    setLimitedStates({});
    setGamepassStates({});
    setDealershipStates({});
    setPriceRange(DEFAULT_PRICE_RANGE);
    setPriceInput(DEFAULT_PRICE_RANGE);
    setPriceFocused({ min: false, max: false });
    setSortByValue(DEFAULT_SORT_BY);
  };

  const toggleOption = (
    setStates: React.Dispatch<React.SetStateAction<Record<string, "include" | "exclude" | "neutral">>>,
    value: string
  ) => {
    setStates((current) => {
      const currentState = current[value] || "neutral";
      let nextState: "include" | "exclude" | "neutral" = "neutral";
      if (currentState === "neutral") {
        nextState = "include";
      } else if (currentState === "include") {
        nextState = "exclude";
      } else {
        nextState = "neutral";
      }
      return { ...current, [value]: nextState };
    });
  };

  const activeContent = (() => {
    switch (activeSection) {
      case "types":
        return (
          <RadioPanel
            options={types.options}
            selectedValue={selectedType}
            onSelect={setSelectedType}
            name="types"
          />
        );
      case "filters":
        return (
          <div className="space-y-6">
            {limitedOptions.length > 0 && (
              <div>
                <span className="block text-zinc-300 text-xs uppercase tracking-[0.2em] mb-2">Limited</span>
                <MultistatePanel
                  options={limitedOptions}
                  states={limitedStates}
                  onToggle={(value) => toggleOption(setLimitedStates, value)}
                />
              </div>
            )}

            {gamepassOptions.length > 0 && (
              <div className="border-t border-zinc-800/60 pt-4">
                <span className="block text-zinc-300 text-xs uppercase tracking-[0.2em] mb-2">Gamepass</span>
                <MultistatePanel
                  options={gamepassOptions}
                  states={gamepassStates}
                  onToggle={(value) => toggleOption(setGamepassStates, value)}
                />
              </div>
            )}

            {dealershipOptions.length > 0 && (
              <div className="border-t border-zinc-800/60 pt-4">
                <span className="block text-zinc-300 text-xs uppercase tracking-[0.2em] mb-2">Dealership</span>
                <MultistatePanel
                  options={dealershipOptions}
                  states={dealershipStates}
                  onToggle={(value) => toggleOption(setDealershipStates, value)}
                />
              </div>
            )}
          </div>
        );
      case "price":
        return (
          <PricePanel
            minPrice={priceFocused.min ? priceInput.min : formatPrice(priceRange.min)}
            maxPrice={priceFocused.max ? priceInput.max : formatPrice(priceRange.max)}
            onMinChange={(value) => setPriceInput((current) => ({ ...current, min: value }))}
            onMaxChange={(value) => setPriceInput((current) => ({ ...current, max: value }))}
            onMinFocus={() => {
              setPriceFocused((current) => ({ ...current, min: true }));
              setPriceInput((current) => ({ ...current, min: priceRange.min }));
            }}
            onMaxFocus={() => {
              setPriceFocused((current) => ({ ...current, max: true }));
              setPriceInput((current) => ({ ...current, max: priceRange.max }));
            }}
            onMinBlur={() => {
              setPriceFocused((current) => ({ ...current, min: false }));
              setPriceRange((current) => ({ ...current, min: priceInput.min || "0" }));
            }}
            onMaxBlur={() => {
              setPriceFocused((current) => ({ ...current, max: false }));
              setPriceRange((current) => ({ ...current, max: priceInput.max || "180000000000" }));
            }}
          />
        );
      case "sortBy":
        return (
          <RadioPanel
            options={sortBy.options}
            selectedValue={sortByValue}
            onSelect={setSortByValue}
            name="sort-by"
          />
        );
      default:
        return null;
    }
  })();

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onChangeRef.current?.({
      search: searchQuery,
      limiteds: getFilterState(limitedStates),
      gamepasses: getFilterState(gamepassStates),
      dealerships: getFilterState(dealershipStates),
      priceRange,
      sortBy: sortByValue,
      type: selectedType,
    });
  }, [searchQuery, limitedStates, gamepassStates, dealershipStates, priceRange, sortByValue, selectedType]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* search bar */}
      <div className="mt-6 flex w-full gap-2">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-w-0 flex-1 rounded-md bg-zinc-900 px-4 py-2 text-white focus:bg-zinc-800 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center justify-center shrink-0 rounded-md bg-red-950 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-900"
        >
          Reset
        </button>
      </div>

      <div className="mt-6 grid grid-cols-4">
        <SectionButton
          label={types.label}
          active={activeSection === "types"}
          onClick={() => setActiveSection("types")}
        />
        <SectionButton
          label="Filters"
          active={activeSection === "filters"}
          onClick={() => setActiveSection("filters")}
        />
        <SectionButton
          label={price.label}
          active={activeSection === "price"}
          onClick={() => setActiveSection("price")}
        />
        <SectionButton
          label={sortBy.label}
          active={activeSection === "sortBy"}
          onClick={() => setActiveSection("sortBy")}
        />
      </div>

      <div className="mt-6 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-zinc-600 border-t border-zinc-700 pt-4">{activeContent}</div>

      {/* Footer ticker */}
      <div className="mt-auto shrink-0 pt-6 text-xs text-zinc-500">
        <div className="overflow-hidden whitespace-nowrap">
          <div
            className="flex w-max items-center gap-6"
            style={{ animation: "sidebar-footer-ticker 18s linear infinite" }}
          >
            <span>Made with ❤️ by aoderu</span>
            <span>Built since Aug 2025!</span>
            <span>{`Showing ${carCount} cars right now!`}</span>
            <span aria-hidden="true">Made with ❤️ by aoderu</span>
            <span aria-hidden="true">Built since Aug 2025!</span>
            <span aria-hidden="true">{`Showing ${carCount} cars right now!`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}