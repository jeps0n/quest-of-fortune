/*
 * Quest of Fortune — 16 fixed paylines.
 *
 * Runtime rows are zero-based (0 = top, 3 = bottom). These map directly to
 * the player-facing 1-based paths used by the payline reference artwork.
 */
export const PAYLINES: readonly (readonly number[])[] = [
  // Straights
  [0, 0, 0, 0, 0], //  1 — The Sky        [1,1,1,1,1]
  [1, 1, 1, 1, 1], //  2 — The Horizon       [2,2,2,2,2]
  [2, 2, 2, 2, 2], //  3 — The Trail      [3,3,3,3,3]
  [3, 3, 3, 3, 3], //  4 — The Foundation [4,4,4,4,4]
  // V patterns
  [0, 1, 2, 1, 0], //  5 — The Quest      [1,2,3,2,1]
  [2, 1, 0, 1, 2], //  6 — The Summit     [3,2,1,2,3]
  [1, 2, 3, 2, 1], //  7 — The Valley     [2,3,4,3,2]
  [3, 2, 1, 2, 3], //  8 — The Peak       [4,3,2,3,4]
  // Zigzags
  [0, 1, 0, 1, 0], //  9 — The Ridge      [1,2,1,2,1]
  [3, 2, 3, 2, 3], // 10 — The River      [4,3,4,3,4]
  [1, 0, 1, 0, 1], // 11 — The Crown      [2,1,2,1,2]
  [2, 3, 2, 3, 2], // 12 — The Catacombs  [3,4,3,4,3]
  // Diagonals
  [0, 1, 2, 3, 3], // 13 — The Descent    [1,2,3,4,4]
  [3, 2, 1, 0, 0], // 14 — The Ascent     [4,3,2,1,1]
  [0, 0, 1, 2, 3], // 15 — The Fall       [1,1,2,3,4]
  [3, 3, 2, 1, 0], // 16 — The Rise       [4,4,3,2,1]
] as const
