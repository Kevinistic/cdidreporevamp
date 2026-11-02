import { Banknote, CarFront, Ticket } from "lucide-react";

// The in-game colour of each tier.
export const TIER_COLORS: Record<string, string> = {
  Legendary: "#FF7F3F",
  Epic: "#F94892",
  Rare: "#277BC0",
  Common: "#7FB77E",
};

export const ITEM_ICONS = {
  car: CarFront,
  cash: Banknote,
  gamepass: Ticket,
};

export function formatBoxPrice({ price, currency }: { price: number | null; currency: string | null }): string | null {
  if (price === null) return null;
  if (currency === "Rp") return `Rp. ${price.toLocaleString("de-DE")}`;
  return `${price.toLocaleString("de-DE")} ${currency ?? ""}`.trim();
}

// Rounded to 3 decimals, the same as the game.
export function formatOdds(rate: number): string {
  return `${Math.round(rate * 100_000) / 1000}%`;
}
