/*
 * Quest of Fortune — 16 fixed paylines.
 *
 * Runtime rows are zero-based (0 = top, 3 = bottom). The guide screen reads
 * these same definitions, so player-facing diagrams cannot drift from math.
 */
export interface PaylineDefinition {
  readonly name: string
  readonly rows: readonly number[]
}
export const PAYLINE_DEFINITIONS: readonly PaylineDefinition[] = [
  // Straights
  { name: 'The Sky',        rows: [0, 0, 0, 0, 0] },
  { name: 'The Horizon',    rows: [1, 1, 1, 1, 1] },
  { name: 'The Trail',      rows: [2, 2, 2, 2, 2] },
  { name: 'The Plains',      rows: [3, 3, 3, 3, 3] },
  // V patterns
  { name: 'The Ravine',     rows: [0, 1, 2, 1, 0] },
  { name: 'The Summit',     rows: [2, 1, 0, 1, 2] },
  { name: 'The Valley',     rows: [1, 2, 3, 2, 1] },
  { name: 'The Peak',      rows: [3, 2, 1, 2, 3] },
  // Zigzags
  { name: 'The Ridge',      rows: [0, 1, 0, 1, 0] },
  { name: 'The River',      rows: [3, 2, 3, 2, 3] },
  { name: 'The Crown',      rows: [1, 0, 1, 0, 1] },
  { name: 'The Catacombs',  rows: [2, 3, 2, 3, 2] },
  // Diagonals
  { name: 'The Descent',    rows: [0, 1, 2, 3, 3] },
  { name: 'The Ascent',     rows: [3, 2, 1, 0, 0] },
  { name: 'The Downfall',       rows: [0, 0, 1, 2, 3] },
  { name: 'The Uprising',       rows: [3, 3, 2, 1, 0] },
] as const
// Existing math/presentation consumers keep the same PAYLINES shape.
export const PAYLINES: readonly (readonly number[])[] = PAYLINE_DEFINITIONS.map(
  ({ rows }) => rows,
)
