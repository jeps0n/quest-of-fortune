import type { SpinResult } from '../../game/math/SpinResult'
import type { Reel } from './Reel'
const REEL_START_STAGGER = 0.075
export class ReelSequencer {
  private reels: Reel[]
  constructor(reels: Reel[]) {
    this.reels = reels
  }
  spin(result: SpinResult): Promise<void> {
    // Classic left-to-right cadence: each reel starts and therefore lands a
    // beat after the reel before it, while every reel uses identical physics.
    return Promise.all(
      this.reels.map((reel, i) => reel.spin(result.reels[i] ?? [], i * REEL_START_STAGGER)),
    ).then(() => undefined)
  }
}
