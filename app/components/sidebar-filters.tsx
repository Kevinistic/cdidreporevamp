"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Car, ChevronDown, Cog } from "lucide-react";

type DropdownOption = {
  label: string;
  value: string;
};

type SectionKey = "type" | "limited" | "gamepass" | "dealership" | "price" | "sortBy";

type PriceRange = {
  min: string;
  max: string;
};

export type SearchMode = "name" | "engine";

const DEFAULT_SEARCH_MODE: SearchMode = "name";

const SEARCH_MODE_OPTIONS: { value: SearchMode; label: string; Icon: typeof Car }[] = [
  { value: "name", label: "name", Icon: Car },
  { value: "engine", label: "engine", Icon: Cog },
];

const DEFAULT_SORT_BY = "price-desc";

const CAR_LIST_PATH = "/car";

// Waits for a pause in typing: Safari throws if history.replaceState is called too often.
const URL_WRITE_DELAY_MS = 300;

const FILTER_PARAM_KEYS = [
  "q",
  "by",
  "type",
  "type_not",
  "limited",
  "limited_not",
  "gamepass",
  "gamepass_not",
  "dealership",
  "dealership_not",
  "min",
  "max",
  "sort",
];

const DEFAULT_OPEN_SECTIONS: Record<SectionKey, boolean> = {
  type: true,
  limited: false,
  gamepass: false,
  dealership: false,
  price: false,
  sortBy: false,
};

const TYPE_OPTIONS: DropdownOption[] = [
  { label: "New", value: "new" },
  { label: "Event", value: "event" },
  { label: "Minigame", value: "minigame" },
  { label: "Removed", value: "removed" },
];

type SortOption = DropdownOption & {
  field: string;
  direction: "asc" | "desc";
};

const SORT_OPTIONS: SortOption[] = [
  { label: "Name: A to Z", value: "name-asc", field: "Name", direction: "asc" },
  { label: "Name: Z to A", value: "name-desc", field: "Name", direction: "desc" },
  { label: "Price: Low to High", value: "price-asc", field: "Price", direction: "asc" },
  { label: "Price: High to Low", value: "price-desc", field: "Price", direction: "desc" },
];

function formatPrice(value: string) {
  if (value === "") return "";

  const digits = value.replace(/\D/g, "");
  if (digits === "") return "";

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function normalizePriceInput(value: string) {
  return value.replace(/\D/g, "");
}

// a min above the max would match nothing, so treat it as the same range typed the other way round
function orderPriceRange(range: PriceRange): PriceRange {
  return Number(range.min) > Number(range.max) ? { min: range.max, max: range.min } : range;
}

function PriceInput({
  label,
  value,
  placeholder,
  onChange,
  onFocus,
  onBlur,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-zinc-300">{label}</span>
      <span className="relative block">
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">
          Rp.
        </span>
        <input
          type="text"
          inputMode="numeric"
          enterKeyHint="done"
          autoComplete="off"
          value={value}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(event) => onChange(normalizePriceInput(event.target.value))}
          // the range is applied on blur, so Enter blurs to apply it (and closes the phone keyboard)
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          placeholder={placeholder}
          className="w-full rounded-md border border-zinc-700 bg-zinc-800 py-2 pl-10 pr-3 text-white tabular-nums placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </span>
    </label>
  );
}

export type FilterState = {
  included: string[];
  excluded: string[];
};

export type Filters = {
  search: string;
  searchMode: SearchMode;
  limiteds: FilterState;
  gamepasses: FilterState;
  dealerships: FilterState;
  priceRange: PriceRange;
  sortBy: string;
  types: FilterState;
};

type SidebarFiltersProps = {
  onChange?: (filters: Filters) => void;
  maxPrice?: number;
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
      aria-label={state === "neutral" ? label : `${label} (${state === "include" ? "included" : "excluded"})`}
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
      <PriceInput
        label="Min:"
        value={minPrice}
        placeholder="Enter minimum"
        onChange={onMinChange}
        onFocus={onMinFocus}
        onBlur={onMinBlur}
      />

      <PriceInput
        label="Max:"
        value={maxPrice}
        placeholder="Enter maximum"
        onChange={onMaxChange}
        onFocus={onMaxFocus}
        onBlur={onMaxBlur}
      />
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

function FilterSection({
  label,
  summary,
  open,
  onToggle,
  children,
}: {
  label: string;
  summary?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 py-3 text-left"
      >
        <span className="shrink-0 text-zinc-300 text-xs uppercase tracking-[0.2em]">{label}</span>
        <span className="flex min-w-0 items-center gap-2">
          {summary}
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

// collapsed headers show how many options are included/excluded so active filters stay visible
function FilterStateSummary({ states }: { states: Record<string, "include" | "exclude" | "neutral"> }) {
  const { included, excluded } = getFilterState(states);
  return (
    <>
      {included.length > 0 && (
        <span className="rounded-full bg-emerald-950/40 px-2 text-xs font-medium text-emerald-400">
          +{included.length}
          <span className="sr-only"> included</span>
        </span>
      )}
      {excluded.length > 0 && (
        <span className="rounded-full bg-rose-950/40 px-2 text-xs font-medium text-rose-400">
          −{excluded.length}
          <span className="sr-only"> excluded</span>
        </span>
      )}
    </>
  );
}

function TextSummary({ text }: { text: string }) {
  return <span className="truncate text-xs text-zinc-400">{text}</span>;
}

// svg arrows instead of unicode so they render the same on every device
function SortSummary({ option }: { option?: SortOption }) {
  if (!option) return null;
  const Arrow = option.direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <span className="flex items-center gap-1 text-xs text-zinc-400">
      <span aria-hidden="true">{option.field}</span>
      <Arrow aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      <span className="sr-only">{option.label}</span>
    </span>
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

// options that no longer exist are dropped, so an old link can't filter on something with no button to undo it
function readOptionStates(params: URLSearchParams, key: string, options: DropdownOption[]) {
  const states: Record<string, "include" | "exclude" | "neutral"> = {};
  const isOption = (value: string) => options.some((option) => option.value === value);
  for (const value of params.getAll(key).filter(isOption)) {
    states[value] = "include";
  }
  for (const value of params.getAll(`${key}_not`).filter(isOption)) {
    states[value] = "exclude";
  }
  return states;
}

function appendFilterState(params: URLSearchParams, key: string, { included, excluded }: FilterState) {
  included.forEach((value) => params.append(key, value));
  excluded.forEach((value) => params.append(`${key}_not`, value));
}

// Only filters that differ from the default go in the URL, and params that aren't ours are left alone.
function buildFilterQuery(filters: Filters, defaultMaxPrice: string) {
  const params = new URLSearchParams(window.location.search);
  FILTER_PARAM_KEYS.forEach((key) => params.delete(key));

  if (filters.search) params.set("q", filters.search);
  if (filters.searchMode !== DEFAULT_SEARCH_MODE) params.set("by", filters.searchMode);
  appendFilterState(params, "type", filters.types);
  appendFilterState(params, "limited", filters.limiteds);
  appendFilterState(params, "gamepass", filters.gamepasses);
  appendFilterState(params, "dealership", filters.dealerships);
  if (filters.priceRange.min !== "0") params.set("min", filters.priceRange.min);
  if (filters.priceRange.max !== defaultMaxPrice) params.set("max", filters.priceRange.max);
  if (filters.sortBy !== DEFAULT_SORT_BY) params.set("sort", filters.sortBy);

  return params.toString();
}

export function SidebarFilters({
  onChange,
  maxPrice = 0,
  dealershipOptions = [],
  limitedOptions = [],
  gamepassOptions = [],
}: SidebarFiltersProps) {
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>(DEFAULT_OPEN_SECTIONS);

  const defaultPriceRange = useMemo<PriceRange>(() => ({ min: "0", max: String(maxPrice) }), [maxPrice]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>(DEFAULT_SEARCH_MODE);
  const [typeStates, setTypeStates] = useState<Record<string, "include" | "exclude" | "neutral">>({});
  const [limitedStates, setLimitedStates] = useState<Record<string, "include" | "exclude" | "neutral">>({});
  const [gamepassStates, setGamepassStates] = useState<Record<string, "include" | "exclude" | "neutral">>({});
  const [dealershipStates, setDealershipStates] = useState<Record<string, "include" | "exclude" | "neutral">>({});
  const [priceRange, setPriceRange] = useState<PriceRange>(defaultPriceRange);
  const [priceInput, setPriceInput] = useState<PriceRange>(defaultPriceRange);
  const [priceFocused, setPriceFocused] = useState<{ min: boolean; max: boolean }>({ min: false, max: false });
  const [sortByValue, setSortByValue] = useState<string>(DEFAULT_SORT_BY);
  // false until the URL has been read, so the defaults from the first render can't overwrite it
  const [isUrlRead, setIsUrlRead] = useState(false);

  const handleReset = () => {
    setOpenSections(DEFAULT_OPEN_SECTIONS);
    setSearchQuery("");
    setSearchMode(DEFAULT_SEARCH_MODE);
    setTypeStates({});
    setLimitedStates({});
    setGamepassStates({});
    setDealershipStates({});
    setPriceRange(defaultPriceRange);
    setPriceInput(defaultPriceRange);
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

  const toggleSection = (key: SectionKey) => {
    setOpenSections((current) => ({ ...current, [key]: !current[key] }));
  };

  const isPriceRangeActive = priceRange.min !== "0" || priceRange.max !== defaultPriceRange.max;
  const selectedSortOption = SORT_OPTIONS.find((option) => option.value === sortByValue);

  const sections = (
    <div className="divide-y divide-zinc-800/60">
      <FilterSection
        label="Type"
        summary={<FilterStateSummary states={typeStates} />}
        open={openSections.type}
        onToggle={() => toggleSection("type")}
      >
        <MultistatePanel
          options={TYPE_OPTIONS}
          states={typeStates}
          onToggle={(value) => toggleOption(setTypeStates, value)}
        />
      </FilterSection>

      {limitedOptions.length > 0 && (
        <FilterSection
          label="Limited"
          summary={<FilterStateSummary states={limitedStates} />}
          open={openSections.limited}
          onToggle={() => toggleSection("limited")}
        >
          <MultistatePanel
            options={limitedOptions}
            states={limitedStates}
            onToggle={(value) => toggleOption(setLimitedStates, value)}
          />
        </FilterSection>
      )}

      {gamepassOptions.length > 0 && (
        <FilterSection
          label="Gamepass"
          summary={<FilterStateSummary states={gamepassStates} />}
          open={openSections.gamepass}
          onToggle={() => toggleSection("gamepass")}
        >
          <MultistatePanel
            options={gamepassOptions}
            states={gamepassStates}
            onToggle={(value) => toggleOption(setGamepassStates, value)}
          />
        </FilterSection>
      )}

      {dealershipOptions.length > 0 && (
        <FilterSection
          label="Dealership"
          summary={<FilterStateSummary states={dealershipStates} />}
          open={openSections.dealership}
          onToggle={() => toggleSection("dealership")}
        >
          <MultistatePanel
            options={dealershipOptions}
            states={dealershipStates}
            onToggle={(value) => toggleOption(setDealershipStates, value)}
          />
        </FilterSection>
      )}

      <FilterSection
        label="Price"
        summary={
          isPriceRangeActive && (
            <TextSummary text={`${formatPrice(priceRange.min) || "0"} – ${formatPrice(priceRange.max) || "0"}`} />
          )
        }
        open={openSections.price}
        onToggle={() => toggleSection("price")}
      >
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
            setPriceRange((current) => orderPriceRange({ ...current, min: priceInput.min || "0" }));
          }}
          onMaxBlur={() => {
            setPriceFocused((current) => ({ ...current, max: false }));
            setPriceRange((current) => orderPriceRange({ ...current, max: priceInput.max || defaultPriceRange.max }));
          }}
        />
      </FilterSection>

      <FilterSection
        label="Sort by"
        summary={<SortSummary option={selectedSortOption} />}
        open={openSections.sortBy}
        onToggle={() => toggleSection("sortBy")}
      >
        <RadioPanel
          options={SORT_OPTIONS}
          selectedValue={sortByValue}
          onSelect={setSortByValue}
          name="sort-by"
        />
      </FilterSection>
    </div>
  );

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const filters = useMemo<Filters>(
    () => ({
      search: searchQuery,
      searchMode,
      limiteds: getFilterState(limitedStates),
      gamepasses: getFilterState(gamepassStates),
      dealerships: getFilterState(dealershipStates),
      priceRange,
      sortBy: sortByValue,
      types: getFilterState(typeStates),
    }),
    [searchQuery, searchMode, limitedStates, gamepassStates, dealershipStates, priceRange, sortByValue, typeStates]
  );

  useEffect(() => {
    onChangeRef.current?.(filters);
  }, [filters]);

  // The page is prerendered without the query string, so the full list is the first paint and the
  // params apply once mounted. useSearchParams would need a Suspense boundary, which leaves
  // everything inside it out of the static HTML, including the grid crawlers read.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPrice = orderPriceRange({
      min: normalizePriceInput(params.get("min") ?? "") || "0",
      max: normalizePriceInput(params.get("max") ?? "") || defaultPriceRange.max,
    });
    const urlSort = SORT_OPTIONS.find((option) => option.value === params.get("sort"));

    setSearchQuery(params.get("q") ?? "");
    setSearchMode(params.get("by") === "engine" ? "engine" : DEFAULT_SEARCH_MODE);
    setTypeStates(readOptionStates(params, "type", TYPE_OPTIONS));
    setLimitedStates(readOptionStates(params, "limited", limitedOptions));
    setGamepassStates(readOptionStates(params, "gamepass", gamepassOptions));
    setDealershipStates(readOptionStates(params, "dealership", dealershipOptions));
    setPriceRange(urlPrice);
    setPriceInput(urlPrice);
    setSortByValue(urlSort?.value ?? DEFAULT_SORT_BY);
    setIsUrlRead(true);
  }, [defaultPriceRange, limitedOptions, gamepassOptions, dealershipOptions]);

  // replaceState rather than router.replace: no server request, and no history entry per keystroke.
  useEffect(() => {
    if (!isUrlRead) return;

    const timer = setTimeout(() => {
      // A car modal open over the grid has its own URL, which shouldn't pick up the filters.
      if (window.location.pathname !== CAR_LIST_PATH) return;

      const query = buildFilterQuery(filters, defaultPriceRange.max);
      if (query === window.location.search.slice(1)) return;
      window.history.replaceState(null, "", query ? `?${query}` : CAR_LIST_PATH);
    }, URL_WRITE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [filters, defaultPriceRange, isUrlRead]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* search bar */}
      <div className="mt-6 flex w-full gap-2">
        <input
          type="text"
          placeholder={`Search by ${searchMode}...`}
          aria-label={`Search cars by ${searchMode}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-w-0 flex-1 rounded-md bg-zinc-900 px-4 py-2 text-white focus:bg-zinc-800 focus:outline-none"
        />
        {/* stacked toggle picks which field the search matches; stretches to the input's height */}
        <div role="group" aria-label="Search by" className="flex shrink-0 flex-col overflow-hidden rounded-md bg-zinc-900">
          {SEARCH_MODE_OPTIONS.map(({ value, label, Icon }) => {
            const active = searchMode === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSearchMode(value)}
                aria-pressed={active}
                aria-label={`Search by ${label}`}
                title={`Search by ${label}`}
                className={`flex flex-1 items-center justify-center px-2 transition ${
                  active ? "bg-zinc-700 text-white" : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                }`}
              >
                <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center justify-center shrink-0 rounded-md bg-red-950 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-900"
        >
          Reset
        </button>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-zinc-600 border-t border-zinc-700 pt-1">{sections}</div>

      <p className="mt-auto shrink-0 pt-6 text-xs text-zinc-500">Tap to include, tap again to exclude!</p>
    </div>
  );
}