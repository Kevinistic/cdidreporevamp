"use client";

import { useState } from "react";

type DropdownOption = {
  label: string;
  value: string;
};

type SectionKey = "limiteds" | "gamepasses" | "dealerships" | "price" | "sortBy";

type PriceRange = {
  min: string;
  max: string;
};

type DropdownConfig = {
  label: string;
  options: DropdownOption[];
};

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
          ? "border-blue-500 bg-blue-500/10 text-white"
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
}: {
  options: DropdownOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 p-1">
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
          onChange={(event) => onMinChange(event.target.value)}
          placeholder="Enter minimum"
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="block text-gray-300">Max:</span>
        <input
          type="text"
          value={maxPrice}
          onChange={(event) => onMaxChange(event.target.value)}
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

export function SidebarFilters() {
  const [activeSection, setActiveSection] = useState<SectionKey>("limiteds");
  const [limitedValues, setLimitedValues] = useState<string[]>([]);
  const [gamepassValues, setGamepassValues] = useState<string[]>([]);
  const [dealershipValues, setDealershipValues] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: "", max: "" });
  const [sortByValue, setSortByValue] = useState<string>("name-asc");

  const limiteds = buildDropdown({
    label: "Limiteds",
    options: [
      { label: "Option1", value: "option1" },
      { label: "Option2", value: "option2" },
      { label: "Option3", value: "option3" },
      { label: "Option4", value: "option4" },
    ],
  });

  const gamepasses = buildDropdown({
    label: "Gamepasses",
    options: [
      { label: "OptionA", value: "optionA" },
      { label: "OptionB", value: "optionB" },
      { label: "OptionC", value: "optionC" },
    ],
  });

  const dealerships = buildDropdown({
    label: "Dealerships",
    options: [
      { label: "MercedesBenz", value: "MercedesBenz" },
      { label: "MercedesBenx", value: "MercedesBenx" },
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

  const activeContent = (() => {
    switch (activeSection) {
      case "limiteds":
        return (
          <CheckboxPanel
            options={limiteds.options}
            selectedValues={limitedValues}
            onToggle={(value) =>
              setLimitedValues((current) =>
                current.includes(value)
                  ? current.filter((item) => item !== value)
                  : [...current, value],
              )
            }
          />
        );
      case "gamepasses":
        return (
          <CheckboxPanel
            options={gamepasses.options}
            selectedValues={gamepassValues}
            onToggle={(value) =>
              setGamepassValues((current) =>
                current.includes(value)
                  ? current.filter((item) => item !== value)
                  : [...current, value],
              )
            }
          />
        );
      case "dealerships":
        return (
          <CheckboxPanel
            options={dealerships.options}
            selectedValues={dealershipValues}
            onToggle={(value) =>
              setDealershipValues((current) =>
                current.includes(value)
                  ? current.filter((item) => item !== value)
                  : [...current, value],
              )
            }
          />
        );
      case "price":
        return (
          <PricePanel
            minPrice={priceRange.min}
            maxPrice={priceRange.max}
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
      default:
        return null;
    }
  })();

  return (
    <>
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
      </div>

      <div className="mt-6 border-t border-gray-700 pt-4">{activeContent}</div>
    </>
  );
}