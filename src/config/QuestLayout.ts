/* LOCKED 1200 × 800 logical cabinet geometry. */
export const QUEST_LAYOUT = {
  stage: { width: 1200, height: 800 },
  lookOut: { width: 112, height: 32, right: 24, bottom: 18 },
  reels: {
    x: 95, y: 271, width: 1010, height: 304,
    count: 5, rows: 4, columnGap: 6, rowGap: 6,
  },
  spin: { x: 468, y: 741, width: 264, height: 47 },
  jackpotTargets: {
    grand: { x: 600, y: 132 },
    major: { x: 600, y: 222 },
  },
} as const
