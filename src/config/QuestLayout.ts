/* LOCKED 1200 × 800 logical cabinet geometry. */
const STAGE_WIDTH = 1200
const STAGE_HEIGHT = 800
// Keep cabinet-level presentation effects tucked beneath the ornate side rails.
// This mirrors the established 5% startup-magic viewport, but lives in logical
// stage coordinates so the boundary scales uniformly on every browser size.
const PRESENTATION_HORIZONTAL_INSET = STAGE_WIDTH * 0.06
const PRESENTATION_INSET_TOP = STAGE_HEIGHT * 0.015
const PRESENTATION_INSET_BOTTOM = STAGE_HEIGHT * 0.025
export const QUEST_LAYOUT = {
  stage: { width: STAGE_WIDTH, height: STAGE_HEIGHT },
  presentationBounds: {
    x: PRESENTATION_HORIZONTAL_INSET,
    y: PRESENTATION_INSET_TOP,
    width: STAGE_WIDTH - PRESENTATION_HORIZONTAL_INSET * 2,
    height:
      STAGE_HEIGHT -
      PRESENTATION_INSET_TOP -
      PRESENTATION_INSET_BOTTOM,
  },
  lookOut: { width: 112, height: 32, right: 192, bottom: 29 },
  info: { width: 112, height: 32, left: 192, bottom: 29 },
  // INFO tabs are centered as one group on the SPIN control's center axis (x = 600).
  // Y geometry remains locked via the existing bottom/height values.
  paytable: { width: 112, height: 32, left: 482, bottom: 29 },
  paylines: { width: 112, height: 32, left: 606, bottom: 29 },
  reels: {
    x: 95, y: 271, width: 1010, height: 304,
    count: 5, rows: 4, columnGap: 6, rowGap: 6,
  },
  spin: { x: 468, y: 723, width: 264, height: 47 },
  jackpotTargets: {
    grand: { x: 600, y: 128 },
    mini: { x: 286, y: 211 },
    major: { x: 600, y: 211 },
    minor: { x: 914, y: 211 },
  },
} as const
