import { getPityLimit, PITY_TIER, type SimBox, type SimTier } from "./box-sim";

export type ItemOdds = {
  averageOpens: number;
  // The chance of still not having the item after each open, so index 0 is after the first open.
  missChances: number[];
};

// Stop once the item is all but certain. The step limit is a safeguard against tiny rates.
const NEGLIGIBLE_MISS = 1e-9;
const MAX_STEPS = 1_000_000;

// Works through opens one at a time, because pity makes the chance depend on the opens so far.
// `states[pity]` is the chance of not having the item yet, with that many opens since a Legendary.
// A box without pity has a single state, which gives the usual 1 - (1 - p)^X.
export function getItemOdds(box: SimBox, tier: SimTier): ItemOdds | null {
  const itemChance = tier.rate / tier.items.length;
  if (!(itemChance > 0)) return null;

  const limit = getPityLimit(box);
  const pityRate = box.tiers.find(({ name }) => name === PITY_TIER)?.rate ?? 0;
  const isPityItem = tier.name === PITY_TIER;
  const guaranteedChance = isPityItem ? 1 / tier.items.length : 0;

  // On a normal open that misses the item, these are the chances of each way the pity count moves.
  const resetChance = isPityItem ? pityRate - itemChance : pityRate;
  const advanceChance = isPityItem ? 1 - pityRate : 1 - pityRate - itemChance;

  let states = new Array<number>(limit ?? 1).fill(0);
  states[0] = 1;

  const missChances: number[] = [];
  let averageOpens = 1;
  let miss = 1;

  while (miss > NEGLIGIBLE_MISS && missChances.length < MAX_STEPS) {
    const next = new Array<number>(states.length).fill(0);

    states.forEach((chance, pity) => {
      if (limit !== undefined && pity + 1 >= limit) {
        next[0] += chance * (1 - guaranteedChance);
        return;
      }
      next[0] += chance * resetChance;
      next[limit === undefined ? 0 : pity + 1] += chance * advanceChance;
    });

    states = next;
    miss = states.reduce((sum, chance) => sum + chance, 0);
    missChances.push(miss);
    averageOpens += miss;
  }

  return { averageOpens, missChances };
}

export function getChanceWithin({ missChances }: ItemOdds, opens: number): number {
  return opens <= missChances.length ? 1 - missChances[opens - 1] : 1;
}

export function getOpensForChance({ missChances }: ItemOdds, chance: number): number | null {
  const index = missChances.findIndex((miss) => 1 - miss >= chance);
  return index === -1 ? null : index + 1;
}
