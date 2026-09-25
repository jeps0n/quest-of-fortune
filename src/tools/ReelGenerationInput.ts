import type { SymbolId } from '../game/math/SpinResult'
export type ReelComposition = Readonly<Record<SymbolId, number>>
/**
 * Count-based generation input for a reel-tuning cycle.
 *
 * This intentionally describes composition only. Source ordering is not part of
 * the generator contract; ReelSequenceOptimizer.ts owns all sequencing.
 *
 * LOW-symbol frequency follows payout hierarchy: CROWN is more common,
 * while the higher-paying GEM is less common.
 */
export const REEL_GENERATION_INPUT: readonly ReelComposition[] = [
  // Reel 1 — 200 stops
  { SCROLL: 47, COIN: 39, RING: 32, CHEST: 24, CROWN: 16, GEM: 10, ARCHER: 11, KNIGHT: 9, MAGE: 7, DRAGON: 5 },
  // Reel 2 — 200 stops
  { SCROLL: 47, COIN: 39, RING: 32, CHEST: 24, CROWN: 16, GEM: 10, ARCHER: 11, KNIGHT: 9, MAGE: 7, DRAGON: 5 },
  // Reel 3 — 200 stops
  { SCROLL: 47, COIN: 39, RING: 32, CHEST: 24, CROWN: 16, GEM: 10, ARCHER: 11, KNIGHT: 9, MAGE: 7, DRAGON: 5 },
  // Reel 4 — 200 stops
  { SCROLL: 47, COIN: 39, RING: 32, CHEST: 24, CROWN: 16, GEM: 10, ARCHER: 11, KNIGHT: 9, MAGE: 7, DRAGON: 5 },
  // Reel 5 — 200 stops
  { SCROLL: 47, COIN: 39, RING: 32, CHEST: 24, CROWN: 16, GEM: 10, ARCHER: 11, KNIGHT: 9, MAGE: 7, DRAGON: 5 },
] as const
