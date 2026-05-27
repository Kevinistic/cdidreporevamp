"use client";

import { useEffect, useState, useRef } from "react";
import { getSupabaseClient } from "../lib/supabase";

type DropdownOption = {
  label: string;
  value: string;
};

type SectionKey = "limiteds" | "gamepasses" | "dealerships" | "price" | "sortBy" | "other";

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

export type Filters = {
  limiteds: string[];
  gamepasses: string[];
  dealerships: string[];
  priceRange: PriceRange;
  sortBy: string;
  other: string[];
  newCars: boolean;
};

function getAllOptionValues(options: DropdownOption[]) {
  return options.map((option) => option.value);
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

function CheckboxPanel({
  options,
  selectedValues,
  onToggle,
  onSelectAll,
}: {
  options: DropdownOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  onSelectAll: (selected: boolean) => void;
}) {
  const allSelected = options.length > 0 && selectedValues.length === options.length;

  return (
    <div className="grid grid-cols-2 gap-2 p-1">
      <label className="col-span-2 flex cursor-pointer items-center gap-3 rounded px-2 py-1 text-sm text-white hover:bg-gray-800">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={() => onSelectAll(!allSelected)}
          className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-blue-500 focus:ring-blue-500"
        />
        <span>Select all</span>
      </label>

      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-3 rounded px-2 py-1 text-sm text-white hover:bg-gray-800"
        >
          <input
            type="checkbox"
            checked={selectedValues.includes(option.value)}
            onChange={() => onToggle(option.value)}
            className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-blue-500 focus:ring-blue-500"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function PricePanel({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
}: {
  minPrice: string;
  maxPrice: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}) {
  return (
    <div className="space-y-3 p-1 text-sm text-white">
      <label className="block space-y-2">
        <span className="block text-gray-300">Min:</span>
        <input
          type="text"
          value={minPrice}
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

export function SidebarFilters({
  onChange,
  carCount = 0,
  buildSeconds = 0,
}: { onChange?: (filters: Filters) => void; carCount?: number; buildSeconds?: number }) {
  const [activeSection, setActiveSection] = useState<SectionKey>("limiteds");

  const [limitedOptions, setLimitedOptions] = useState<DropdownOption[]>([]);
  const [gamepassOptions, setGamepassOptions] = useState<DropdownOption[]>([]);
  const [dealershipOptions, setDealershipOptions] = useState<DropdownOption[]>([]);

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

  const other = buildDropdown({
    label: "Other",
    options: [],
  });

  const limiteds = buildDropdown({ label: "Limited", options: limitedOptions });
  const gamepasses = buildDropdown({ label: "Gamepass", options: gamepassOptions });
  const dealerships = buildDropdown({ label: "Dealership", options: dealershipOptions });

  const [limitedValues, setLimitedValues] = useState<string[]>([]);
  const [gamepassValues, setGamepassValues] = useState<string[]>([]);
  const [dealershipValues, setDealershipValues] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: "0", max: "180000000000" });
  const [sortByValue, setSortByValue] = useState<string>(sortBy.options[3].value);
  const [otherValues, setOtherValues] = useState<string[]>([]);
  const [newCarsOnly, setNewCarsOnly] = useState(false);

  function getViewName() {
    return process.env.NEXT_PUBLIC_SUPABASE_VIEW_NAME ?? "test";
  }

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let isMounted = true;

    const load = async () => {
      const viewName = getViewName();
      const batchSize = 1000;
      const rows: Record<string, any>[] = [];
      let startIndex = 0;

      while (true) {
        const endIndex = startIndex + batchSize - 1;
        const { data, error } = await supabase.from(viewName).select("*").range(startIndex, endIndex);

        if (!isMounted) return;

        if (error) return;

        if (!data || data.length === 0) {
          break;
        }

        rows.push(...(data as Record<string, any>[]));

        if (data.length < batchSize) {
          break;
        }

        startIndex += batchSize;
      }

      if (rows.length === 0) return;

      const columns = Object.keys(rows[0]);

      const findColumn = (patterns: string[]) =>
        columns.find((c) => patterns.some((p) => c.toLowerCase().includes(p)));

      const dealershipCol = findColumn(["dealership", "dealer"]);
      const limitedCol = findColumn(["limited", "limiteds"]);
      const gamepassCol = findColumn(["gamepass"]);

      if (dealershipCol) {
        const vals = Array.from(new Set(rows.map((r) => r[dealershipCol]).filter(Boolean))).map((v) => ({ label: String(v), value: String(v) }));
        setDealershipOptions(vals);
        setDealershipValues(vals.map((o) => o.value));
      }

      if (limitedCol) {
        const vals = Array.from(new Set(rows.map((r) => r[limitedCol]).filter(Boolean))).map((v) => ({ label: String(v), value: String(v) }));
        setLimitedOptions(vals);
        setLimitedValues(vals.map((o) => o.value));
      }

      if (gamepassCol) {
        const vals = Array.from(new Set(rows.map((r) => r[gamepassCol]).filter(Boolean))).map((v) => ({ label: String(v), value: String(v) }));
        setGamepassOptions(vals);
        setGamepassValues(vals.map((o) => o.value));
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeContent = (() => {
    switch (activeSection) {
      case "limiteds":
        return (
          <CheckboxPanel
            options={limitedOptions}
            selectedValues={limitedValues}
            onSelectAll={(selected) => setLimitedValues(selected ? limitedOptions.map((o) => o.value) : [])}
            onToggle={(value) =>
              setLimitedValues((current) =>
                current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
              )
            }
          />
        );
      case "gamepasses":
        return (
          <CheckboxPanel
            options={gamepassOptions}
            selectedValues={gamepassValues}
            onSelectAll={(selected) => setGamepassValues(selected ? gamepassOptions.map((o) => o.value) : [])}
            onToggle={(value) =>
              setGamepassValues((current) =>
                current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
              )
            }
          />
        );
      case "dealerships":
        return (
          <CheckboxPanel
            options={dealershipOptions}
            selectedValues={dealershipValues}
            onSelectAll={(selected) => setDealershipValues(selected ? dealershipOptions.map((o) => o.value) : [])}
            onToggle={(value) =>
              setDealershipValues((current) =>
                current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
              )
            }
          />
        );
      case "price":
        return (
          <PricePanel
            minPrice={formatPrice(priceRange.min)}
            maxPrice={formatPrice(priceRange.max)}
            onMinChange={(value) => setPriceRange((current) => ({ ...current, min: value }))}
            onMaxChange={(value) => setPriceRange((current) => ({ ...current, max: value }))}
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
      case "other":
        return (
          <div className="p-1 text-sm text-white">
            <label className="flex cursor-pointer items-center gap-3 rounded px-2 py-1 text-sm text-white hover:bg-gray-800">
              <input
                type="checkbox"
                checked={newCarsOnly}
                onChange={(event) => setNewCarsOnly(event.target.checked)}
                className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-blue-500 focus:ring-blue-500"
              />
              <span>New cars</span>
            </label>
          </div>
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
    onChangeRef.current?.({ limiteds: limitedValues, gamepasses: gamepassValues, dealerships: dealershipValues, priceRange, sortBy: sortByValue, other: otherValues, newCars: newCarsOnly });
  }, [limitedValues, gamepassValues, dealershipValues, priceRange, sortByValue, otherValues, newCarsOnly]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mt-6 flex max-w-full flex-wrap gap-[2px]">
        <SectionButton
          label={limiteds.label}
          active={activeSection === "limiteds"}
          onClick={() => setActiveSection("limiteds")}
        />
        <SectionButton
          label={gamepasses.label}
          active={activeSection === "gamepasses"}
          onClick={() => setActiveSection("gamepasses")}
        />
        <SectionButton
          label={dealerships.label}
          active={activeSection === "dealerships"}
          onClick={() => setActiveSection("dealerships")}
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
        <SectionButton
          label={other.label}
          active={activeSection === "other"}
          onClick={() => setActiveSection("other")}
        />
      </div>

      <div className="mt-6 flex-1 min-h-0 border-t border-gray-700 pt-4">{activeContent}</div>


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