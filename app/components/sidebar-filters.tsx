"use client";

import { useEffect, useState, useRef } from "react";

type DropdownOption = {
  label: string;
  value: string;
};

type SectionKey = "filters" | "price" | "sortBy";

type PriceRange = {
  min: string;
  max: string;
};

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
  limiteds: FilterState;
  gamepasses: FilterState;
  dealerships: FilterState;
  priceRange: PriceRange;
  sortBy: string;
  other: {
    newCars: "include" | "exclude" | "neutral";
  };
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
    styleClass = "border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-800";
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
        <span className="block text-gray-300">Min:</span>
        <input
          type="text"
          value={minPrice}
          onFocus={onMinFocus}
          onBlur={onMinBlur}
          onChange={(event) => onMinChange(normalizePriceInput(event.target.value))}
          placeholder="Enter minimum"
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="block text-gray-300">Max:</span>
        <input
          type="text"
          value={maxPrice}
          onFocus={onMaxFocus}
          onBlur={onMaxBlur}
          onChange={(event) => onMaxChange(normalizePriceInput(event.target.value))}
          placeholder="Enter maximum"
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>
    </div>
  );
}

function RadioPanel({
  options,
  selectedValue,
  onSelect,
}: {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 p-1">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-3 rounded px-2 py-1 text-sm text-white hover:bg-gray-800"
        >
          <input
            type="radio"
            name="sort-by"
            checked={selectedValue === option.value}
            onChange={() => onSelect(option.value)}
            className="h-4 w-4 border-gray-500 bg-gray-800 text-blue-500 focus:ring-blue-500"
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
      className={`inline-flex shrink-0 w-fit items-center rounded-full border px-3 py-1 text-left text-xs font-medium whitespace-nowrap transition ${
        active
          ? "border-gray-700 bg-gray-700 text-white"
          : "border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-800"
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
  buildSeconds = 0,
  dealershipOptions = [],
  limitedOptions = [],
  gamepassOptions = [],
}: {
  onChange?: (filters: Filters) => void;
  carCount?: number;
  buildSeconds?: number;
  dealershipOptions?: DropdownOption[];
  limitedOptions?: DropdownOption[];
  gamepassOptions?: DropdownOption[];
}) {
  const [activeSection, setActiveSection] = useState<SectionKey>("filters");

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

  const [limitedStates, setLimitedStates] = useState<Record<string, "include" | "exclude" | "neutral">>({});
  const [gamepassStates, setGamepassStates] = useState<Record<string, "include" | "exclude" | "neutral">>({});
  const [dealershipStates, setDealershipStates] = useState<Record<string, "include" | "exclude" | "neutral">>({});
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: "0", max: "180000000000" });
  const [priceInput, setPriceInput] = useState<PriceRange>({ min: "0", max: "180000000000" });
  const [priceFocused, setPriceFocused] = useState<{ min: boolean; max: boolean }>({ min: false, max: false });
  const [sortByValue, setSortByValue] = useState<string>(sortBy.options[3].value);
  const [newCarsState, setNewCarsState] = useState<"include" | "exclude" | "neutral">("neutral");

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
      case "filters":
        return (
          <div className="space-y-6">
            {limitedOptions.length > 0 && (
              <div>
                <span className="block text-gray-300 text-xs uppercase tracking-[0.2em] mb-2">Limited</span>
                <MultistatePanel
                  options={limitedOptions}
                  states={limitedStates}
                  onToggle={(value) => toggleOption(setLimitedStates, value)}
                />
              </div>
            )}

            {gamepassOptions.length > 0 && (
              <div className="border-t border-gray-800/60 pt-4">
                <span className="block text-gray-300 text-xs uppercase tracking-[0.2em] mb-2">Gamepass</span>
                <MultistatePanel
                  options={gamepassOptions}
                  states={gamepassStates}
                  onToggle={(value) => toggleOption(setGamepassStates, value)}
                />
              </div>
            )}

            {dealershipOptions.length > 0 && (
              <div className="border-t border-gray-800/60 pt-4">
                <span className="block text-gray-300 text-xs uppercase tracking-[0.2em] mb-2">Dealership</span>
                <MultistatePanel
                  options={dealershipOptions}
                  states={dealershipStates}
                  onToggle={(value) => toggleOption(setDealershipStates, value)}
                />
              </div>
            )}

            <div className="border-t border-gray-800/60 pt-4">
              <span className="block text-gray-300 text-xs uppercase tracking-[0.2em] mb-2">Other</span>
              <div className="flex flex-wrap gap-2 p-1">
                <FilterOptionButton
                  label="New"
                  state={newCarsState}
                  onClick={() => {
                    setNewCarsState((current) => {
                      if (current === "neutral") return "include";
                      if (current === "include") return "exclude";
                      return "neutral";
                    });
                  }}
                />
              </div>
            </div>
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
      limiteds: getFilterState(limitedStates),
      gamepasses: getFilterState(gamepassStates),
      dealerships: getFilterState(dealershipStates),
      priceRange,
      sortBy: sortByValue,
      other: {
        newCars: newCarsState,
      },
    });
  }, [limitedStates, gamepassStates, dealershipStates, priceRange, sortByValue, newCarsState]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mt-6 flex max-w-full flex-wrap gap-[2px]">
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

      <div className="mt-6 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-600 border-t border-gray-700 pt-4">{activeContent}</div>

      {/* Footer ticker */}
      <div className="mt-auto shrink-0 pt-6 text-xs text-gray-500">
        <div className="overflow-hidden whitespace-nowrap">
          <div
            className="flex w-max items-center gap-6"
            style={{ animation: "sidebar-footer-ticker 18s linear infinite" }}
          >
            <span>Made with ❤️ by aoderu</span>
            <span>{`Built in ${buildSeconds.toFixed(3)} seconds!`}</span>
            <span>{`Showing ${carCount} cars right now!`}</span>
            <span aria-hidden="true">Made with ❤️ by aoderu</span>
            <span aria-hidden="true">{`Built in ${buildSeconds.toFixed(3)} seconds!`}</span>
            <span aria-hidden="true">{`Showing ${carCount} cars right now!`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}