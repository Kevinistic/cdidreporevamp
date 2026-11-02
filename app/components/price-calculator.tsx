"use client";

import { Plus, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { CardItem } from "./card";

export type CalculatorCar = Pick<CardItem, "token" | "CarName" | "Price" | "CarImageUrl">;

const MAX_MATCHES = 8;

const formatRupiah = (value: number) => `Rp. ${value.toLocaleString("de-DE")}`;

// Cars sell for 80% of their price. Multiplying by 4 / 5 keeps this in whole numbers.
const getSellValue = (price: number) => Math.floor((price * 4) / 5);

function CarImage({ car }: { car: CalculatorCar }) {
  return (
    <div className="relative size-10 shrink-0">
      {car.CarImageUrl ? <Image src={car.CarImageUrl} alt="" fill sizes="40px" className="object-contain" /> : null}
    </div>
  );
}

export function PriceCalculator({ cars }: { cars: CalculatorCar[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [list, setList] = useState<CalculatorCar[]>([]);

  const search = query.trim().toLowerCase();
  const matches = cars.filter((car) => car.CarName.toLowerCase().includes(search)).slice(0, MAX_MATCHES);
  const total = list.reduce((sum, car) => sum + car.Price, 0);

  // A player can only own one of each car, so a car already on the list can't be added again.
  const isAdded = (car: CalculatorCar) => list.some(({ token }) => token === car.token);

  const closeSearch = () => {
    setIsAdding(false);
    setQuery("");
  };

  const addCar = (car: CalculatorCar) => {
    setList((current) => [...current, car]);
    closeSearch();
  };

  const removeCar = (token: string) => {
    setList((current) => current.filter((car) => car.token !== token));
  };

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[1fr_20rem]">
      <ul className="divide-y divide-zinc-800 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950">
        {list.map((car) => (
          <li key={car.token} className="flex items-center gap-3 px-3 py-1.5">
            <CarImage car={car} />
            <span className="min-w-0 flex-1 text-sm">{car.CarName}</span>
            <span className="shrink-0 text-sm text-zinc-200">{formatRupiah(car.Price)}</span>
            <button
              type="button"
              onClick={() => removeCar(car.token)}
              aria-label={`Remove ${car.CarName}`}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </li>
        ))}

        <li>
          {isAdding ? (
            <div className="divide-y divide-zinc-800">
              <div className="flex items-center gap-3 px-3 py-1.5">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") closeSearch();
                  }}
                  autoFocus
                  placeholder="Search for a car"
                  aria-label="Search for a car"
                  className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm placeholder:text-zinc-500 focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Close search"
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              {matches.length > 0 ? (
                matches.map((car) => {
                  const added = isAdded(car);
                  return (
                    <button
                      key={car.token}
                      type="button"
                      onClick={() => addCar(car)}
                      disabled={added}
                      className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-zinc-900 hover:text-accent disabled:text-zinc-500 disabled:hover:bg-transparent"
                    >
                      <CarImage car={car} />
                      <span className="min-w-0 flex-1 text-sm">{car.CarName}</span>
                      <span className="shrink-0 text-sm text-zinc-400">{added ? "Added" : formatRupiah(car.Price)}</span>
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-2 text-sm text-zinc-400">No cars match that search.</p>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex w-full items-center gap-3 px-3 py-1.5 text-left text-zinc-400 hover:bg-zinc-900 hover:text-accent"
            >
              <span className="flex size-10 shrink-0 items-center justify-center">
                <Plus size={20} aria-hidden="true" />
              </span>
              <span className="text-sm">Add car</span>
            </button>
          )}
        </li>
      </ul>

      <section aria-label="Totals" className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950 p-4">
        <dl className="space-y-3">
          <div className="flex flex-col-reverse">
            <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total price</dt>
            <dd className="text-2xl font-bold text-accent">{formatRupiah(total)}</dd>
          </div>
          <div className="flex flex-col-reverse">
            <dt className="text-xs uppercase tracking-[0.2em] text-zinc-500">Sell value (80%)</dt>
            <dd className="text-2xl font-bold">{formatRupiah(getSellValue(total))}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={() => setList([])}
          disabled={list.length === 0}
          className="w-full rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Clear
        </button>
      </section>
    </div>
  );
}
