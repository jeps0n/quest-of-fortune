export const SYMBOL_IDS = [
  'RING', 'SCROLL', 'COIN', 'CHEST', 'CROWN', 'GEM',
  'ARCHER', 'KNIGHT', 'MAGE', 'DRAGON',
] as const
export type SymbolId = typeof SYMBOL_IDS[number]
export interface SpinResult { reels: SymbolId[][] }
/*
 * Quest of Fortune — locked 200-stop Row #6 symbol-count matrix.
 * Counts on every reel: RING 33, SCROLL 47, COIN 39, CHEST 22, CROWN 13, GEM 14,
 * ARCHER 11, KNIGHT 9, MAGE 7, DRAGON 5. Total = 200.
 *
 * IMPORTANT: Row #6 (WHAT) is represented here. The ordering below is a validated
 * Row #7 soft-locked candidate sequence. R5 includes the controlled Archer swap
 * (stop 6 COIN -> ARCHER; stop 14 ARCHER -> COIN). Final hard lock follows
 * full-game validation; locked Row #6 counts remain unchanged.
 */
export const REEL_STRIPS: readonly (readonly SymbolId[])[] = [
  // Reel 1 — 200 stops
  [
    'SCROLL', 'CHEST', 'SCROLL', 'SCROLL', 'ARCHER', 'SCROLL', 'RING', 'COIN',
    'RING', 'SCROLL', 'GEM', 'GEM', 'MAGE', 'SCROLL', 'CHEST', 'CROWN',
    'COIN', 'COIN', 'GEM', 'RING', 'COIN', 'CHEST', 'GEM', 'SCROLL',
    'RING', 'CROWN', 'COIN', 'CROWN', 'CHEST', 'KNIGHT', 'RING', 'COIN',
    'MAGE', 'ARCHER', 'RING', 'GEM', 'RING', 'RING', 'COIN', 'DRAGON',
    'SCROLL', 'RING', 'SCROLL', 'CHEST', 'SCROLL', 'COIN', 'SCROLL', 'COIN',
    'SCROLL', 'SCROLL', 'SCROLL', 'RING', 'RING', 'COIN', 'CROWN', 'CHEST',
    'ARCHER', 'GEM', 'RING', 'ARCHER', 'COIN', 'COIN', 'SCROLL', 'COIN',
    'GEM', 'MAGE', 'GEM', 'MAGE', 'COIN', 'KNIGHT', 'SCROLL', 'SCROLL',
    'SCROLL', 'SCROLL', 'COIN', 'KNIGHT', 'SCROLL', 'SCROLL', 'COIN', 'COIN',
    'SCROLL', 'CROWN', 'CHEST', 'COIN', 'CHEST', 'RING', 'KNIGHT', 'DRAGON',
    'RING', 'MAGE', 'COIN', 'COIN', 'COIN', 'SCROLL', 'CROWN', 'CROWN',
    'GEM', 'COIN', 'CHEST', 'COIN', 'CHEST', 'RING', 'RING', 'ARCHER',
    'SCROLL', 'RING', 'SCROLL', 'RING', 'GEM', 'RING', 'CROWN', 'COIN',
    'CROWN', 'ARCHER', 'SCROLL', 'CHEST', 'RING', 'CHEST', 'CHEST', 'COIN',
    'SCROLL', 'MAGE', 'CHEST', 'CHEST', 'MAGE', 'GEM', 'DRAGON', 'CROWN',
    'KNIGHT', 'CHEST', 'COIN', 'COIN', 'RING', 'COIN', 'SCROLL', 'CROWN',
    'RING', 'SCROLL', 'RING', 'CHEST', 'ARCHER', 'SCROLL', 'KNIGHT', 'RING',
    'SCROLL', 'RING', 'SCROLL', 'RING', 'SCROLL', 'CROWN', 'GEM', 'COIN',
    'COIN', 'DRAGON', 'COIN', 'COIN', 'ARCHER', 'SCROLL', 'COIN', 'SCROLL',
    'RING', 'SCROLL', 'COIN', 'COIN', 'COIN', 'SCROLL', 'SCROLL', 'CHEST',
    'ARCHER', 'COIN', 'SCROLL', 'RING', 'GEM', 'CROWN', 'RING', 'SCROLL',
    'CHEST', 'CHEST', 'KNIGHT', 'RING', 'SCROLL', 'GEM', 'KNIGHT', 'SCROLL',
    'RING', 'ARCHER', 'SCROLL', 'CHEST', 'RING', 'SCROLL', 'SCROLL', 'RING',
    'KNIGHT', 'COIN', 'DRAGON', 'CHEST', 'ARCHER', 'COIN', 'SCROLL', 'SCROLL',
  ],
  // Reel 2 — 200 stops
  [
    'SCROLL', 'COIN', 'MAGE', 'SCROLL', 'COIN', 'CHEST', 'SCROLL', 'RING',
    'SCROLL', 'SCROLL', 'SCROLL', 'KNIGHT', 'RING', 'GEM', 'CROWN', 'ARCHER',
    'COIN', 'CHEST', 'RING', 'CROWN', 'SCROLL', 'GEM', 'GEM', 'RING',
    'SCROLL', 'ARCHER', 'CHEST', 'COIN', 'DRAGON', 'GEM', 'COIN', 'COIN',
    'KNIGHT', 'RING', 'RING', 'KNIGHT', 'COIN', 'SCROLL', 'GEM', 'SCROLL',
    'GEM', 'CHEST', 'SCROLL', 'COIN', 'COIN', 'GEM', 'RING', 'CROWN',
    'MAGE', 'CHEST', 'SCROLL', 'MAGE', 'RING', 'COIN', 'CROWN', 'CHEST',
    'KNIGHT', 'CHEST', 'SCROLL', 'SCROLL', 'SCROLL', 'RING', 'COIN', 'RING',
    'CHEST', 'RING', 'SCROLL', 'COIN', 'ARCHER', 'RING', 'RING', 'ARCHER',
    'CHEST', 'SCROLL', 'RING', 'SCROLL', 'COIN', 'SCROLL', 'RING', 'KNIGHT',
    'SCROLL', 'KNIGHT', 'RING', 'RING', 'COIN', 'COIN', 'SCROLL', 'SCROLL',
    'RING', 'ARCHER', 'CROWN', 'SCROLL', 'SCROLL', 'COIN', 'COIN', 'COIN',
    'COIN', 'COIN', 'RING', 'DRAGON', 'SCROLL', 'CHEST', 'DRAGON', 'ARCHER',
    'RING', 'SCROLL', 'ARCHER', 'COIN', 'COIN', 'RING', 'ARCHER', 'COIN',
    'ARCHER', 'SCROLL', 'KNIGHT', 'GEM', 'MAGE', 'SCROLL', 'GEM', 'COIN',
    'COIN', 'CROWN', 'RING', 'SCROLL', 'SCROLL', 'SCROLL', 'CHEST', 'SCROLL',
    'SCROLL', 'GEM', 'MAGE', 'SCROLL', 'SCROLL', 'RING', 'CHEST', 'GEM',
    'MAGE', 'RING', 'CROWN', 'CHEST', 'COIN', 'GEM', 'RING', 'COIN',
    'RING', 'CHEST', 'CHEST', 'RING', 'GEM', 'CROWN', 'COIN', 'COIN',
    'CROWN', 'SCROLL', 'SCROLL', 'KNIGHT', 'CHEST', 'SCROLL', 'CHEST', 'COIN',
    'ARCHER', 'COIN', 'SCROLL', 'COIN', 'MAGE', 'SCROLL', 'DRAGON', 'CHEST',
    'SCROLL', 'CHEST', 'SCROLL', 'COIN', 'CROWN', 'GEM', 'SCROLL', 'RING',
    'COIN', 'KNIGHT', 'CHEST', 'RING', 'RING', 'RING', 'COIN', 'ARCHER',
    'CROWN', 'CROWN', 'CHEST', 'CHEST', 'SCROLL', 'SCROLL', 'COIN', 'RING',
    'DRAGON', 'SCROLL', 'COIN', 'SCROLL', 'COIN', 'RING', 'CROWN', 'COIN',
  ],
  // Reel 3 — 200 stops
  [
    'GEM', 'RING', 'DRAGON', 'CHEST', 'RING', 'KNIGHT', 'SCROLL', 'COIN',
    'SCROLL', 'GEM', 'ARCHER', 'COIN', 'SCROLL', 'COIN', 'SCROLL', 'RING',
    'RING', 'KNIGHT', 'RING', 'RING', 'CHEST', 'GEM', 'CROWN', 'SCROLL',
    'CROWN', 'COIN', 'SCROLL', 'MAGE', 'CHEST', 'MAGE', 'SCROLL', 'SCROLL',
    'ARCHER', 'SCROLL', 'RING', 'SCROLL', 'RING', 'SCROLL', 'CROWN', 'ARCHER',
    'RING', 'CHEST', 'COIN', 'DRAGON', 'GEM', 'SCROLL', 'KNIGHT', 'RING',
    'COIN', 'CHEST', 'RING', 'RING', 'COIN', 'SCROLL', 'SCROLL', 'MAGE',
    'ARCHER', 'CHEST', 'COIN', 'CHEST', 'KNIGHT', 'SCROLL', 'MAGE', 'SCROLL',
    'COIN', 'RING', 'GEM', 'RING', 'SCROLL', 'COIN', 'SCROLL', 'GEM',
    'SCROLL', 'CROWN', 'COIN', 'COIN', 'RING', 'RING', 'COIN', 'SCROLL',
    'COIN', 'GEM', 'RING', 'MAGE', 'RING', 'SCROLL', 'RING', 'SCROLL',
    'GEM', 'CROWN', 'CHEST', 'CHEST', 'KNIGHT', 'COIN', 'KNIGHT', 'RING',
    'GEM', 'GEM', 'RING', 'SCROLL', 'COIN', 'GEM', 'KNIGHT', 'SCROLL',
    'SCROLL', 'COIN', 'CHEST', 'ARCHER', 'CHEST', 'ARCHER', 'KNIGHT', 'CROWN',
    'CROWN', 'MAGE', 'DRAGON', 'ARCHER', 'CHEST', 'COIN', 'GEM', 'CROWN',
    'COIN', 'CHEST', 'COIN', 'SCROLL', 'COIN', 'CHEST', 'CROWN', 'COIN',
    'SCROLL', 'CROWN', 'RING', 'SCROLL', 'ARCHER', 'COIN', 'SCROLL', 'COIN',
    'ARCHER', 'SCROLL', 'COIN', 'SCROLL', 'COIN', 'CROWN', 'COIN', 'GEM',
    'RING', 'SCROLL', 'SCROLL', 'RING', 'CHEST', 'RING', 'SCROLL', 'MAGE',
    'SCROLL', 'SCROLL', 'CHEST', 'SCROLL', 'SCROLL', 'COIN', 'CHEST', 'SCROLL',
    'COIN', 'COIN', 'ARCHER', 'CHEST', 'CROWN', 'SCROLL', 'SCROLL', 'SCROLL',
    'SCROLL', 'GEM', 'RING', 'COIN', 'COIN', 'CROWN', 'SCROLL', 'SCROLL',
    'RING', 'CHEST', 'RING', 'COIN', 'RING', 'COIN', 'CHEST', 'KNIGHT',
    'DRAGON', 'COIN', 'COIN', 'RING', 'DRAGON', 'RING', 'COIN', 'RING',
    'CHEST', 'ARCHER', 'COIN', 'SCROLL', 'SCROLL', 'COIN', 'CHEST', 'RING',
  ],
  // Reel 4 — 200 stops
  [
    'COIN', 'SCROLL', 'SCROLL', 'ARCHER', 'GEM', 'ARCHER', 'RING', 'SCROLL',
    'GEM', 'SCROLL', 'SCROLL', 'RING', 'COIN', 'COIN', 'CHEST', 'RING',
    'KNIGHT', 'SCROLL', 'RING', 'COIN', 'SCROLL', 'CHEST', 'ARCHER', 'SCROLL',
    'COIN', 'GEM', 'CHEST', 'SCROLL', 'MAGE', 'CHEST', 'KNIGHT', 'CROWN',
    'KNIGHT', 'GEM', 'COIN', 'SCROLL', 'RING', 'SCROLL', 'SCROLL', 'RING',
    'RING', 'CHEST', 'COIN', 'CHEST', 'GEM', 'CROWN', 'CHEST', 'MAGE',
    'SCROLL', 'CHEST', 'RING', 'RING', 'MAGE', 'ARCHER', 'COIN', 'RING',
    'SCROLL', 'SCROLL', 'COIN', 'SCROLL', 'CROWN', 'MAGE', 'DRAGON', 'COIN',
    'SCROLL', 'SCROLL', 'COIN', 'SCROLL', 'SCROLL', 'ARCHER', 'COIN', 'COIN',
    'COIN', 'RING', 'RING', 'COIN', 'COIN', 'KNIGHT', 'CHEST', 'COIN',
    'COIN', 'RING', 'COIN', 'RING', 'CHEST', 'KNIGHT', 'SCROLL', 'COIN',
    'COIN', 'COIN', 'CROWN', 'SCROLL', 'KNIGHT', 'RING', 'GEM', 'RING',
    'SCROLL', 'CHEST', 'SCROLL', 'CHEST', 'DRAGON', 'CHEST', 'CHEST', 'ARCHER',
    'COIN', 'RING', 'COIN', 'CROWN', 'SCROLL', 'RING', 'SCROLL', 'RING',
    'RING', 'MAGE', 'COIN', 'ARCHER', 'CROWN', 'GEM', 'SCROLL', 'SCROLL',
    'GEM', 'SCROLL', 'COIN', 'RING', 'CHEST', 'CHEST', 'SCROLL', 'CROWN',
    'COIN', 'RING', 'RING', 'SCROLL', 'DRAGON', 'CROWN', 'CHEST', 'SCROLL',
    'RING', 'SCROLL', 'SCROLL', 'SCROLL', 'COIN', 'COIN', 'COIN', 'SCROLL',
    'COIN', 'KNIGHT', 'ARCHER', 'GEM', 'CHEST', 'COIN', 'CROWN', 'RING',
    'COIN', 'SCROLL', 'SCROLL', 'SCROLL', 'SCROLL', 'CROWN', 'RING', 'GEM',
    'GEM', 'MAGE', 'RING', 'KNIGHT', 'CHEST', 'SCROLL', 'CROWN', 'COIN',
    'SCROLL', 'RING', 'GEM', 'RING', 'RING', 'CHEST', 'COIN', 'CHEST',
    'RING', 'SCROLL', 'SCROLL', 'MAGE', 'CROWN', 'SCROLL', 'ARCHER', 'DRAGON',
    'COIN', 'DRAGON', 'CHEST', 'COIN', 'SCROLL', 'ARCHER', 'SCROLL', 'COIN',
    'COIN', 'RING', 'ARCHER', 'GEM', 'RING', 'CROWN', 'KNIGHT', 'GEM',
  ],
  // Reel 5 — 200 stops
  [
    'ARCHER', 'COIN', 'ARCHER', 'KNIGHT', 'COIN', 'ARCHER', 'CHEST', 'COIN',
    'RING', 'CHEST', 'SCROLL', 'RING', 'CHEST', 'COIN', 'CROWN', 'KNIGHT',
    'COIN', 'CROWN', 'RING', 'RING', 'CROWN', 'DRAGON', 'SCROLL', 'CROWN',
    'DRAGON', 'SCROLL', 'SCROLL', 'MAGE', 'SCROLL', 'MAGE', 'SCROLL', 'COIN',
    'SCROLL', 'GEM', 'ARCHER', 'SCROLL', 'SCROLL', 'CHEST', 'KNIGHT', 'RING',
    'GEM', 'SCROLL', 'RING', 'RING', 'SCROLL', 'ARCHER', 'SCROLL', 'CROWN',
    'SCROLL', 'CHEST', 'SCROLL', 'COIN', 'RING', 'CROWN', 'CHEST', 'DRAGON',
    'RING', 'CHEST', 'SCROLL', 'RING', 'COIN', 'CROWN', 'RING', 'COIN',
    'SCROLL', 'ARCHER', 'COIN', 'CHEST', 'COIN', 'SCROLL', 'COIN', 'COIN',
    'RING', 'RING', 'GEM', 'SCROLL', 'RING', 'RING', 'CROWN', 'CHEST',
    'RING', 'CROWN', 'COIN', 'RING', 'RING', 'RING', 'COIN', 'KNIGHT',
    'RING', 'RING', 'CROWN', 'COIN', 'RING', 'COIN', 'COIN', 'COIN',
    'SCROLL', 'ARCHER', 'DRAGON', 'SCROLL', 'MAGE', 'COIN', 'COIN', 'ARCHER',
    'COIN', 'SCROLL', 'CHEST', 'COIN', 'CHEST', 'COIN', 'SCROLL', 'COIN',
    'COIN', 'GEM', 'GEM', 'SCROLL', 'KNIGHT', 'GEM', 'SCROLL', 'CHEST',
    'MAGE', 'COIN', 'SCROLL', 'CHEST', 'COIN', 'CHEST', 'RING', 'RING',
    'CHEST', 'RING', 'SCROLL', 'CHEST', 'COIN', 'COIN', 'GEM', 'SCROLL',
    'COIN', 'GEM', 'GEM', 'ARCHER', 'SCROLL', 'CHEST', 'COIN', 'CHEST',
    'SCROLL', 'CROWN', 'MAGE', 'CHEST', 'SCROLL', 'DRAGON', 'GEM', 'RING',
    'RING', 'SCROLL', 'SCROLL', 'GEM', 'COIN', 'ARCHER', 'COIN', 'SCROLL',
    'KNIGHT', 'MAGE', 'RING', 'SCROLL', 'GEM', 'RING', 'RING', 'KNIGHT',
    'SCROLL', 'MAGE', 'KNIGHT', 'RING', 'COIN', 'GEM', 'COIN', 'COIN',
    'CROWN', 'KNIGHT', 'SCROLL', 'SCROLL', 'COIN', 'CHEST', 'SCROLL', 'SCROLL',
    'SCROLL', 'RING', 'COIN', 'SCROLL', 'SCROLL', 'CROWN', 'SCROLL', 'CHEST',
    'CHEST', 'SCROLL', 'SCROLL', 'ARCHER', 'SCROLL', 'SCROLL', 'GEM', 'RING',
  ],
] as const

export function createSpinResult(reelCount = 5, rows = 4, random = Math.random): SpinResult {
  const reels = Array.from({ length: reelCount }, (_, reelIndex) => {
    const strip = REEL_STRIPS[reelIndex % REEL_STRIPS.length]
    const stop = Math.floor(random() * strip.length)
    return Array.from({ length: rows }, (_, row) => strip[(stop + row) % strip.length])
  })
  return { reels }
}
