import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CardItem } from "../components/card";
import { carToken } from "./car-token";

// Written by scripts/fetch-cars.js before `next build`, so the page is prerendered with real data.
const CARS_PATH = path.join(process.cwd(), "public", "data", "cars.json");

let carsPromise: Promise<CardItem[]> | undefined;

async function readRawCars(): Promise<Omit<CardItem, "token">[]> {
  try {
    const file = await readFile(CARS_PATH, "utf-8");
    return JSON.parse(file) as Omit<CardItem, "token">[];
  } catch (error) {
    console.error("Could not read public/data/cars.json. Run `node scripts/fetch-cars.js` first.", error);
    return [];
  }
}

async function loadCars(): Promise<CardItem[]> {
  const raw = await readRawCars();
  const seen = new Map<string, string>();
  return raw.map((car) => {
    const token = carToken(car._id);
    const clash = seen.get(token);
    if (clash) throw new Error(`Car token collision between "${clash}" and "${car._id}".`);
    seen.set(token, car._id);
    return { ...car, token };
  });
}

export function getCars(): Promise<CardItem[]> {
  carsPromise ??= loadCars();
  return carsPromise;
}

export async function getCarByToken(token: string): Promise<CardItem | undefined> {
  const cars = await getCars();
  return cars.find((car) => car.token === token);
}
