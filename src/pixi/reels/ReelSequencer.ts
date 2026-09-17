import type { SpinResult } from '../../game/math/SpinResult'
import type { Reel } from './Reel'
export class ReelSequencer {
  private reels: Reel[]
  constructor(reels: Reel[]) { this.reels = reels }
  spin(result: SpinResult): Promise<void> { return Promise.all(this.reels.map((reel, i) => reel.spin(result.reels[i] ?? [], i * 0.10))).then(() => undefined) }
}
