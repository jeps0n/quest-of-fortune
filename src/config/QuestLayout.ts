/*
  LOCKED QUEST OF FORTUNE LAYOUT
  --------------------------------
  The cabinet uses one fixed 1200 × 800 logical coordinate system.
  StageScaler scales this surface uniformly; presentation systems consume
  these coordinates and must not redefine the cabinet geometry.
*/
export const QUEST_LAYOUT = {
  stage: {
    width: 1200,
    height: 800,
  },
  lookOut: {
    width: 112,
    height: 32,
    right: 24,
    bottom: 18,
  },
} as const
