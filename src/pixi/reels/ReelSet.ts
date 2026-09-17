import { Container } from 'pixi.js'
import { QUEST_LAYOUT } from '../../config/QuestLayout'
import type { AudioManager } from '../../audio/AudioManager'
import type { SpinResult } from '../../game/math/SpinResult'
import type { Win } from '../../game/math/WinEvaluator'
import { Reel } from './Reel'
import { ReelSequencer } from './ReelSequencer'
export class ReelSet {
  readonly view = new Container({ label: 'reel-set' })
  readonly reels: Reel[]
  private sequencer: ReelSequencer
  constructor(audio: AudioManager) {
    const l = QUEST_LAYOUT.reels; const reelWidth = (l.width - l.columnGap * (l.count - 1)) / l.count
    this.view.position.set(l.x, l.y)
    this.reels = Array.from({ length: l.count }, (_, i) => { const reel = new Reel(reelWidth, l.height, l.rows, l.rowGap, audio); reel.view.x = i * (reelWidth + l.columnGap); this.view.addChild(reel.view); return reel })
    this.sequencer = new ReelSequencer(this.reels)
  }
  applyVisible(result: SpinResult): void {
    this.reels.forEach((reel, reelIndex) => reel.pool.applyVisible(result.reels[reelIndex] ?? []))
  }
  spin(result: SpinResult): Promise<void> { return this.sequencer.spin(result) }
  async presentWins(wins: readonly Win[]): Promise<void> {
    const positions = wins.flatMap((win) => win.positions)
    const keys = new Set(positions.map((p) => `${p.reel}:${p.row}`)); const tasks: Promise<void>[] = []
    this.reels.forEach((reel, reelIndex) => reel.visibleSymbols().forEach((symbol, row) => tasks.push(symbol.animator.play(keys.has(`${reelIndex}:${row}`) ? 'win' : 'dim'))))
    await Promise.all(tasks)
  }
  async resetSymbols(): Promise<void> { await Promise.all(this.reels.flatMap((reel) => reel.visibleSymbols().map((symbol) => symbol.animator.play('reset')))) }
  destroy(): void { this.reels.forEach((reel) => reel.destroy()); this.view.destroy() }
}
