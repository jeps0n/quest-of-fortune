export const SYMBOL_IDS = [
  'RING', 'SCROLL', 'COIN', 'CHEST', 'CROWN', 'GEM',
  'ARCHER', 'KNIGHT', 'MAGE', 'DRAGON',
] as const
export type SymbolId = typeof SYMBOL_IDS[number]
export interface SpinResult {
  reels: SymbolId[][]
  /** Authoritative stop index for each reel when the result came from REEL_STRIPS. */
  stops?: readonly number[]
}
/*
 * Production reel set QOF-7D39B3CA. Each reel contains 201 stops; exact
 * per-reel composition is encoded below and validated by the math tooling.
 */
// IMPORTANT: strip order is math, not decoration. Reordering symbols while
// preserving counts changes visible-window adjacency and therefore game behavior.
// Regenerate/audit strips with the tooling rather than hand-sorting this data.
export const REEL_STRIPS: readonly (readonly SymbolId[])[] = [
  // Reel 1 — 201 stops
  [
    'COIN', 'KNIGHT', 'GEM', 'RING', 'MAGE', 'SCROLL', 'MAGE', 'COIN',
    'CROWN', 'SCROLL', 'SCROLL', 'KNIGHT', 'CHEST', 'RING', 'GEM', 'MAGE',
    'RING', 'MAGE', 'RING', 'CROWN', 'SCROLL', 'RING', 'ARCHER', 'COIN',
    'KNIGHT', 'SCROLL', 'SCROLL', 'RING', 'CHEST', 'SCROLL', 'COIN', 'CHEST',
    'SCROLL', 'CHEST', 'CROWN', 'DRAGON', 'COIN', 'RING', 'COIN', 'CHEST',
    'RING', 'SCROLL', 'COIN', 'ARCHER', 'MAGE', 'ARCHER', 'RING', 'CROWN',
    'SCROLL', 'COIN', 'RING', 'SCROLL', 'CROWN', 'CHEST', 'COIN', 'DRAGON',
    'CHEST', 'SCROLL', 'RING', 'RING', 'SCROLL', 'SCROLL', 'RING', 'GEM',
    'SCROLL', 'SCROLL', 'MAGE', 'CROWN', 'SCROLL', 'GEM', 'KNIGHT', 'CHEST',
    'SCROLL', 'SCROLL', 'RING', 'ARCHER', 'SCROLL', 'COIN', 'CHEST', 'GEM',
    'SCROLL', 'COIN', 'COIN', 'RING', 'RING', 'COIN', 'CHEST', 'DRAGON',
    'CHEST', 'SCROLL', 'ARCHER', 'KNIGHT', 'MAGE', 'KNIGHT', 'CROWN', 'SCROLL',
    'COIN', 'CHEST', 'RING', 'CHEST', 'SCROLL', 'CROWN', 'COIN', 'RING',
    'COIN', 'COIN', 'RING', 'CHEST', 'CROWN', 'CROWN', 'COIN', 'SCROLL',
    'SCROLL', 'CROWN', 'SCROLL', 'SCROLL', 'COIN', 'RING', 'CHEST', 'KNIGHT',
    'CHEST', 'COIN', 'RING', 'CROWN', 'ARCHER', 'COIN', 'DRAGON', 'SCROLL',
    'COIN', 'ARCHER', 'COIN', 'CHEST', 'COIN', 'SCROLL', 'COIN', 'SCROLL',
    'ARCHER', 'CHEST', 'KNIGHT', 'RING', 'GEM', 'RING', 'CROWN', 'SCROLL',
    'CHEST', 'DRAGON', 'COIN', 'SCROLL', 'RING', 'SCROLL', 'COIN', 'SCROLL',
    'KNIGHT', 'CROWN', 'COIN', 'CHEST', 'SCROLL', 'COIN', 'SCROLL', 'COIN',
    'SCROLL', 'RING', 'SCROLL', 'COIN', 'MAGE', 'COIN', 'COIN', 'SCROLL',
    'CROWN', 'RING', 'DRAGON', 'GEM', 'GEM', 'SCROLL', 'RING', 'COIN',
    'CHEST', 'GEM', 'CHEST', 'COIN', 'SCROLL', 'COIN', 'COIN', 'RING',
    'RING', 'ARCHER', 'GEM', 'ARCHER', 'COIN', 'SCROLL', 'RING', 'CHEST',
    'RING', 'RING', 'ARCHER', 'DRAGON', 'SCROLL', 'COIN', 'SCROLL', 'CHEST',
    'CROWN',
  ],
  // Reel 2 — 201 stops
  [
    'SCROLL', 'SCROLL', 'CHEST', 'GEM', 'COIN', 'COIN', 'CROWN', 'CHEST',
    'GEM', 'KNIGHT', 'COIN', 'SCROLL', 'COIN', 'COIN', 'MAGE', 'RING',
    'COIN', 'COIN', 'RING', 'COIN', 'CHEST', 'RING', 'COIN', 'SCROLL',
    'SCROLL', 'RING', 'RING', 'CHEST', 'SCROLL', 'CROWN', 'CROWN', 'ARCHER',
    'RING', 'KNIGHT', 'COIN', 'COIN', 'CHEST', 'GEM', 'SCROLL', 'CROWN',
    'SCROLL', 'COIN', 'RING', 'RING', 'SCROLL', 'ARCHER', 'DRAGON', 'ARCHER',
    'SCROLL', 'SCROLL', 'GEM', 'SCROLL', 'SCROLL', 'RING', 'CHEST', 'COIN',
    'SCROLL', 'RING', 'CROWN', 'COIN', 'SCROLL', 'COIN', 'CHEST', 'RING',
    'CROWN', 'MAGE', 'RING', 'CHEST', 'SCROLL', 'GEM', 'RING', 'CHEST',
    'COIN', 'SCROLL', 'SCROLL', 'RING', 'COIN', 'MAGE', 'COIN', 'KNIGHT',
    'CHEST', 'KNIGHT', 'COIN', 'GEM', 'COIN', 'KNIGHT', 'SCROLL', 'COIN',
    'COIN', 'RING', 'COIN', 'CHEST', 'SCROLL', 'MAGE', 'SCROLL', 'CHEST',
    'COIN', 'SCROLL', 'CROWN', 'COIN', 'CHEST', 'RING', 'RING', 'SCROLL',
    'RING', 'COIN', 'CROWN', 'SCROLL', 'CROWN', 'RING', 'ARCHER', 'RING',
    'DRAGON', 'ARCHER', 'CHEST', 'DRAGON', 'SCROLL', 'KNIGHT', 'CHEST', 'MAGE',
    'RING', 'CHEST', 'SCROLL', 'CHEST', 'CROWN', 'SCROLL', 'COIN', 'SCROLL',
    'SCROLL', 'ARCHER', 'COIN', 'COIN', 'RING', 'COIN', 'CHEST', 'ARCHER',
    'KNIGHT', 'RING', 'CROWN', 'SCROLL', 'DRAGON', 'SCROLL', 'SCROLL', 'CROWN',
    'CHEST', 'SCROLL', 'COIN', 'RING', 'SCROLL', 'SCROLL', 'CHEST', 'COIN',
    'KNIGHT', 'CROWN', 'RING', 'SCROLL', 'CHEST', 'COIN', 'ARCHER', 'GEM',
    'SCROLL', 'CHEST', 'COIN', 'GEM', 'SCROLL', 'SCROLL', 'COIN', 'CROWN',
    'KNIGHT', 'RING', 'COIN', 'SCROLL', 'CROWN', 'CROWN', 'SCROLL', 'RING',
    'RING', 'DRAGON', 'COIN', 'SCROLL', 'ARCHER', 'SCROLL', 'GEM', 'COIN',
    'ARCHER', 'COIN', 'SCROLL', 'RING', 'SCROLL', 'RING', 'RING', 'SCROLL',
    'MAGE', 'SCROLL', 'MAGE', 'CHEST', 'GEM', 'SCROLL', 'RING', 'CHEST',
    'ARCHER',
  ],
  // Reel 3 — 201 stops
  [
    'CROWN', 'KNIGHT', 'RING', 'ARCHER', 'MAGE', 'SCROLL', 'MAGE', 'CHEST',
    'CHEST', 'COIN', 'GEM', 'DRAGON', 'COIN', 'CHEST', 'SCROLL', 'SCROLL',
    'RING', 'MAGE', 'GEM', 'SCROLL', 'CHEST', 'ARCHER', 'COIN', 'GEM',
    'RING', 'SCROLL', 'COIN', 'SCROLL', 'COIN', 'GEM', 'RING', 'KNIGHT',
    'SCROLL', 'KNIGHT', 'COIN', 'CHEST', 'SCROLL', 'ARCHER', 'RING', 'SCROLL',
    'CHEST', 'CROWN', 'SCROLL', 'SCROLL', 'CROWN', 'ARCHER', 'CROWN', 'SCROLL',
    'ARCHER', 'CHEST', 'COIN', 'SCROLL', 'RING', 'SCROLL', 'RING', 'COIN',
    'CROWN', 'ARCHER', 'GEM', 'COIN', 'SCROLL', 'CHEST', 'COIN', 'CHEST',
    'RING', 'DRAGON', 'COIN', 'COIN', 'SCROLL', 'SCROLL', 'COIN', 'SCROLL',
    'CROWN', 'SCROLL', 'SCROLL', 'KNIGHT', 'GEM', 'MAGE', 'COIN', 'CHEST',
    'SCROLL', 'RING', 'SCROLL', 'COIN', 'SCROLL', 'GEM', 'SCROLL', 'SCROLL',
    'COIN', 'ARCHER', 'CROWN', 'ARCHER', 'SCROLL', 'SCROLL', 'RING', 'RING',
    'COIN', 'SCROLL', 'MAGE', 'CHEST', 'RING', 'CROWN', 'RING', 'CROWN',
    'COIN', 'DRAGON', 'SCROLL', 'COIN', 'DRAGON', 'CHEST', 'ARCHER', 'CHEST',
    'GEM', 'ARCHER', 'RING', 'COIN', 'MAGE', 'SCROLL', 'RING', 'RING',
    'SCROLL', 'RING', 'COIN', 'SCROLL', 'SCROLL', 'COIN', 'KNIGHT', 'RING',
    'SCROLL', 'RING', 'SCROLL', 'CROWN', 'CROWN', 'RING', 'KNIGHT', 'COIN',
    'RING', 'CHEST', 'COIN', 'COIN', 'CHEST', 'CHEST', 'SCROLL', 'SCROLL',
    'CHEST', 'SCROLL', 'COIN', 'SCROLL', 'RING', 'KNIGHT', 'RING', 'SCROLL',
    'GEM', 'COIN', 'COIN', 'RING', 'SCROLL', 'COIN', 'SCROLL', 'CROWN',
    'CROWN', 'KNIGHT', 'CHEST', 'COIN', 'RING', 'CHEST', 'RING', 'COIN',
    'CHEST', 'SCROLL', 'CROWN', 'RING', 'CHEST', 'SCROLL', 'ARCHER', 'CHEST',
    'COIN', 'SCROLL', 'CHEST', 'COIN', 'DRAGON', 'RING', 'CROWN', 'RING',
    'SCROLL', 'COIN', 'MAGE', 'CHEST', 'COIN', 'SCROLL', 'RING', 'COIN',
    'RING', 'COIN', 'CROWN', 'RING', 'GEM', 'COIN', 'SCROLL', 'COIN',
    'SCROLL',
  ],
  // Reel 4 — 201 stops
  [
    'RING', 'CHEST', 'CROWN', 'CHEST', 'SCROLL', 'SCROLL', 'ARCHER', 'RING',
    'COIN', 'SCROLL', 'COIN', 'CROWN', 'COIN', 'SCROLL', 'ARCHER', 'SCROLL',
    'SCROLL', 'COIN', 'CROWN', 'RING', 'GEM', 'COIN', 'CROWN', 'DRAGON',
    'GEM', 'COIN', 'CHEST', 'KNIGHT', 'MAGE', 'SCROLL', 'KNIGHT', 'COIN',
    'GEM', 'CROWN', 'CHEST', 'CROWN', 'MAGE', 'SCROLL', 'RING', 'CHEST',
    'ARCHER', 'RING', 'SCROLL', 'RING', 'COIN', 'CHEST', 'GEM', 'RING',
    'CHEST', 'SCROLL', 'SCROLL', 'GEM', 'SCROLL', 'COIN', 'GEM', 'COIN',
    'CHEST', 'GEM', 'COIN', 'SCROLL', 'CHEST', 'KNIGHT', 'RING', 'COIN',
    'COIN', 'COIN', 'ARCHER', 'SCROLL', 'KNIGHT', 'SCROLL', 'SCROLL', 'CHEST',
    'SCROLL', 'RING', 'RING', 'CHEST', 'COIN', 'SCROLL', 'SCROLL', 'RING',
    'COIN', 'SCROLL', 'DRAGON', 'SCROLL', 'SCROLL', 'CHEST', 'RING', 'MAGE',
    'COIN', 'SCROLL', 'CROWN', 'SCROLL', 'SCROLL', 'RING', 'COIN', 'GEM',
    'ARCHER', 'COIN', 'SCROLL', 'SCROLL', 'COIN', 'CHEST', 'SCROLL', 'COIN',
    'RING', 'SCROLL', 'KNIGHT', 'SCROLL', 'SCROLL', 'MAGE', 'CROWN', 'RING',
    'COIN', 'RING', 'CHEST', 'CHEST', 'RING', 'SCROLL', 'COIN', 'SCROLL',
    'RING', 'SCROLL', 'CHEST', 'RING', 'SCROLL', 'RING', 'CHEST', 'SCROLL',
    'RING', 'SCROLL', 'RING', 'RING', 'CHEST', 'RING', 'ARCHER', 'SCROLL',
    'SCROLL', 'SCROLL', 'CROWN', 'CROWN', 'COIN', 'RING', 'CROWN', 'MAGE',
    'RING', 'RING', 'COIN', 'CROWN', 'COIN', 'COIN', 'SCROLL', 'KNIGHT',
    'ARCHER', 'RING', 'COIN', 'CROWN', 'CROWN', 'COIN', 'SCROLL', 'RING',
    'COIN', 'CHEST', 'CHEST', 'SCROLL', 'SCROLL', 'DRAGON', 'SCROLL', 'DRAGON',
    'COIN', 'SCROLL', 'COIN', 'ARCHER', 'COIN', 'SCROLL', 'GEM', 'COIN',
    'CHEST', 'SCROLL', 'KNIGHT', 'SCROLL', 'SCROLL', 'COIN', 'CROWN', 'CROWN',
    'KNIGHT', 'RING', 'SCROLL', 'ARCHER', 'COIN', 'MAGE', 'COIN', 'SCROLL',
    'RING', 'ARCHER', 'GEM', 'CHEST', 'RING', 'COIN', 'CHEST', 'CHEST',
    'COIN',
  ],
  // Reel 5 — 201 stops
  [
    'RING', 'CROWN', 'CROWN', 'RING', 'RING', 'DRAGON', 'SCROLL', 'COIN',
    'CROWN', 'CROWN', 'SCROLL', 'SCROLL', 'COIN', 'MAGE', 'CHEST', 'COIN',
    'GEM', 'COIN', 'KNIGHT', 'DRAGON', 'KNIGHT', 'ARCHER', 'RING', 'RING',
    'ARCHER', 'GEM', 'CHEST', 'SCROLL', 'COIN', 'CHEST', 'CROWN', 'SCROLL',
    'SCROLL', 'SCROLL', 'CHEST', 'COIN', 'SCROLL', 'RING', 'SCROLL', 'SCROLL',
    'CHEST', 'RING', 'GEM', 'COIN', 'MAGE', 'RING', 'SCROLL', 'CHEST',
    'ARCHER', 'RING', 'RING', 'COIN', 'COIN', 'RING', 'SCROLL', 'GEM',
    'COIN', 'COIN', 'RING', 'RING', 'GEM', 'SCROLL', 'KNIGHT', 'SCROLL',
    'CROWN', 'CROWN', 'RING', 'RING', 'SCROLL', 'CHEST', 'CHEST', 'CROWN',
    'DRAGON', 'SCROLL', 'SCROLL', 'RING', 'COIN', 'CROWN', 'CHEST', 'SCROLL',
    'ARCHER', 'KNIGHT', 'GEM', 'SCROLL', 'KNIGHT', 'SCROLL', 'CHEST', 'CHEST',
    'RING', 'MAGE', 'COIN', 'SCROLL', 'MAGE', 'SCROLL', 'CROWN', 'COIN',
    'SCROLL', 'COIN', 'ARCHER', 'SCROLL', 'SCROLL', 'COIN', 'COIN', 'RING',
    'SCROLL', 'COIN', 'COIN', 'SCROLL', 'RING', 'SCROLL', 'COIN', 'SCROLL',
    'SCROLL', 'RING', 'CHEST', 'COIN', 'RING', 'MAGE', 'SCROLL', 'RING',
    'SCROLL', 'CROWN', 'KNIGHT', 'CHEST', 'SCROLL', 'COIN', 'CHEST', 'RING',
    'COIN', 'RING', 'CHEST', 'SCROLL', 'SCROLL', 'CHEST', 'COIN', 'RING',
    'CROWN', 'ARCHER', 'COIN', 'CROWN', 'COIN', 'RING', 'SCROLL', 'RING',
    'COIN', 'COIN', 'ARCHER', 'CHEST', 'COIN', 'COIN', 'SCROLL', 'COIN',
    'COIN', 'RING', 'COIN', 'SCROLL', 'CROWN', 'CHEST', 'SCROLL', 'CHEST',
    'COIN', 'SCROLL', 'RING', 'CROWN', 'CHEST', 'CHEST', 'DRAGON', 'COIN',
    'SCROLL', 'ARCHER', 'SCROLL', 'SCROLL', 'CROWN', 'CROWN', 'SCROLL', 'MAGE',
    'SCROLL', 'SCROLL', 'CHEST', 'SCROLL', 'RING', 'SCROLL', 'COIN', 'COIN',
    'KNIGHT', 'SCROLL', 'RING', 'RING', 'ARCHER', 'SCROLL', 'ARCHER', 'CHEST',
    'GEM', 'COIN', 'KNIGHT', 'COIN', 'CHEST', 'GEM', 'SCROLL', 'SCROLL',
    'CHEST',
  ],
] as const
export function createSpinResult(reelCount = 5, rows = 4, random = Math.random): SpinResult {
  const stops: number[] = []
  const reels = Array.from({ length: reelCount }, (_, reelIndex) => {
    const strip = REEL_STRIPS[reelIndex % REEL_STRIPS.length]
    const stop = Math.floor(random() * strip.length)
    stops.push(stop)
    return reelWindow(reelIndex, stop, rows)
  })
  return { reels, stops }
}
export function reelWindow(reelIndex: number, stop: number, rows = 4): SymbolId[] {
  const strip = REEL_STRIPS[reelIndex % REEL_STRIPS.length]
  const normalizedStop = ((stop % strip.length) + strip.length) % strip.length
  return Array.from({ length: rows }, (_, row) => strip[(normalizedStop + row) % strip.length])
}
