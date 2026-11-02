export type SimItem = {
  key: string;
  itemType: "car" | "cash" | "gamepass";
  name: string;
  image?: string;
};

export type SimTier = {
  name: string;
  rate: number;
  items: SimItem[];
};

export type SimBox = {
  slug: string;
  name: string;
  price: number | null;
  currency: string | null;
  tiers: SimTier[];
};

export type SimRoll = {
  tierName: string;
  item: SimItem;
};

export const PITY_TIER = "Legendary";

// Opens until the pity tier is guaranteed. Boxes that aren't listed have no pity.
const PITY_LIMITS: Record<string, number> = {
  "robux-box": 50,
};

export function getPityLimit(box: SimBox): number | undefined {
  return PITY_LIMITS[box.slug];
}

// The rates are the ones shown in-game. The real roll happens on the game's server.
function pickTier(box: SimBox): SimTier {
  let roll = Math.random();
  for (const tier of box.tiers) {
    roll -= tier.rate;
    if (roll < 0) return tier;
  }
  return box.tiers[box.tiers.length - 1];
}

function pickFromTier(tier: SimTier): SimRoll {
  const item = tier.items[Math.floor(Math.random() * tier.items.length)];
  return { tierName: tier.name, item };
}

// `pity` is the number of opens since the last pity-tier roll.
export function rollBox(box: SimBox, pity: number): SimRoll {
  const limit = getPityLimit(box);
  const guaranteed =
    limit !== undefined && pity + 1 >= limit ? box.tiers.find((tier) => tier.name === PITY_TIER) : undefined;
  return pickFromTier(guaranteed ?? pickTier(box));
}

export function getNextPity(roll: SimRoll, pity: number): number {
  return roll.tierName === PITY_TIER ? 0 : pity + 1;
}

export function buildReel(box: SimBox, winner: SimRoll, length: number, winnerIndex: number): SimRoll[] {
  return Array.from({ length }, (_, index) => (index === winnerIndex ? winner : pickFromTier(pickTier(box))));
}
