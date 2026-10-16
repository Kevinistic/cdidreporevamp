import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CardItem } from "../components/card";

// Written by scripts/fetch-cars.js before `next build`, so the page is prerendered with real data.
const CARS_PATH = path.join(process.cwd(), "public", "data", "cars.json");

export async function getCars(): Promise<CardItem[]> {
  try {
    const file = await readFile(CARS_PATH, "utf-8");
    return JSON.parse(file) as CardItem[];
  } catch (error) {
    console.error("Could not read public/data/cars.json. Run `node scripts/fetch-cars.js` first.", error);
    return [];
  }
}
