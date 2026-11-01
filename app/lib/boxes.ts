import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CardItem } from "../components/card";
import { getCars } from "./cars";

// Written by scripts/fetch-boxes.js before `next build`, so box pages are prerendered with real data.
const BOXES_PATH = path.join(process.cwd(), "public", "data", "boxes.json");

// Cash and gamepass images, named by Roblox asset ID. Cars use CarImageUrl from the car list.
const BOX_IMAGE_BASE_URL = "https://cdn.jsdelivr.net/gh/Kevinistic/images@main/boxes/";

type RawBoxItem = {
  itemType: "car" | "cash" | "gamepass";
  carId: string | null;
  name: string | null;
  imageId: string | null;
};

type RawBoxTier<Item> = {
  name: string;
  rate: number;
  items: Item[];
};

type RawBox<Item> = {
  slug: string;
  name: string;
  price: number | null;
  currency: string | null;
  tiers: RawBoxTier<Item>[];
};

// `car` is missing when the item isn't a car, or when its car isn't in the car list.
export type BoxItem = RawBoxItem & { car?: CardItem };
export type BoxTier = RawBoxTier<BoxItem>;
export type Box = RawBox<BoxItem>;
export type BoxLink = Pick<Box, "slug" | "name">;

let boxesPromise: Promise<Box[]> | undefined;

async function readRawBoxes(): Promise<RawBox<RawBoxItem>[]> {
  try {
    const file = await readFile(BOXES_PATH, "utf-8");
    return JSON.parse(file) as RawBox<RawBoxItem>[];
  } catch (error) {
    console.error("Could not read public/data/boxes.json. Run `node scripts/fetch-boxes.js` first.", error);
    return [];
  }
}

async function loadBoxes(): Promise<Box[]> {
  const [raw, cars] = await Promise.all([readRawBoxes(), getCars()]);
  const carsById = new Map(cars.map((car) => [car._id, car]));
  return raw.map((box) => ({
    ...box,
    tiers: box.tiers.map((tier) => ({
      ...tier,
      items: tier.items.map((item) => ({
        ...item,
        car: item.carId ? carsById.get(item.carId) : undefined,
      })),
    })),
  }));
}

export function getBoxes(): Promise<Box[]> {
  boxesPromise ??= loadBoxes();
  return boxesPromise;
}

export async function getBoxBySlug(slug: string): Promise<Box | undefined> {
  const boxes = await getBoxes();
  return boxes.find((box) => box.slug === slug);
}

export async function getBoxesForCar(carId: string): Promise<BoxLink[]> {
  const boxes = await getBoxes();
  return boxes
    .filter((box) => box.tiers.some((tier) => tier.items.some((item) => item.carId === carId)))
    .map(({ slug, name }) => ({ slug, name }));
}

export function getBoxItemImage(item: BoxItem): string | undefined {
  if (item.car?.CarImageUrl) return item.car.CarImageUrl;
  return item.imageId ? `${BOX_IMAGE_BASE_URL}${item.imageId}.png` : undefined;
}

export function formatBoxPrice({ price, currency }: Pick<Box, "price" | "currency">): string | null {
  if (price === null) return null;
  if (currency === "Rp") return `Rp. ${price.toLocaleString("de-DE")}`;
  return `${price.toLocaleString("de-DE")} ${currency ?? ""}`.trim();
}

// Rounded to 3 decimals, the same as the game.
export function formatOdds(rate: number): string {
  return `${Math.round(rate * 100_000) / 1000}%`;
}
