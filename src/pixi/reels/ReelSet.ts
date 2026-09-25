import { Container } from 'pixi.js'
import { gsap } from 'gsap'
import { QUEST_LAYOUT } from '../../config/QuestLayout'
import type { SpinResult } from '../../game/math/SpinResult'
import type { Win } from '../../game/math/WinEvaluator'
import type { CharacterSymbol } from '../../presentation/ResultClassifier'
import { Reel } from './Reel'
import { ReelSequencer } from './ReelSequencer'
export class ReelSet {
  readonly view = new Container({ label: 'reel-set' })
  readonly reels: Reel[]
  private sequencer: ReelSequencer
  constructor() {
    const l = QUEST_LAYOUT.reels; const reelWidth = (l.width - l.columnGap * (l.count - 1)) / l.count
    this.view.position.set(l.x, l.y)
    this.reels = Array.from({ length: l.count }, (_, i) => { const reel = new Reel(reelWidth, l.height, l.rows, l.rowGap); reel.view.x = i * (reelWidth + l.columnGap); this.view.addChild(reel.view); return reel })
    this.sequencer = new ReelSequencer(this.reels)
  }
  applyVisible(result: SpinResult): void {
    this.reels.forEach((reel, reelIndex) => reel.pool.applyVisible(result.reels[reelIndex] ?? []))
  }
  spin(result: SpinResult): Promise<void> { return this.sequencer.spin(result) }
  async presentWins(wins: readonly Win[]): Promise<void> {
    const positions = wins.flatMap((win) => win.positions)
    const keys = new Set(positions.map((p) => `${p.reel}:${p.row}`))
    const tasks: Promise<void>[] = []
    this.reels.forEach((reel, reelIndex) =>
      reel.visibleSymbols().forEach((symbol, row) => {
        const key = `${reelIndex}:${row}`
        // A subtle left-to-right ripple makes the player read the winning
        // route instead of seeing every cell fire as one flat event.
        const delay = keys.has(key) ? reelIndex * 0.045 : 0
        tasks.push(symbol.animator.play(keys.has(key) ? 'win' : 'dim', delay))
      }),
    )
    await Promise.all(tasks)
  }
  async presentHighWins(wins: readonly Win[], character: CharacterSymbol): Promise<void> {
    const positions = wins.flatMap((win) => win.positions)
    const keys = new Set(positions.map((p) => `${p.reel}:${p.row}`))
    const characterKeys = new Set(wins.filter((win) => win.symbol === character).flatMap((win) => win.positions).map((p) => `${p.reel}:${p.row}`))
    const tasks: Promise<void>[] = []
    this.reels.forEach((reel, reelIndex) => reel.visibleSymbols().forEach((symbol, row) => {
      const key = `${reelIndex}:${row}`
      const isCharacter = characterKeys.has(key)
      const isWinner = keys.has(key)
      const delay = isWinner ? reelIndex * 0.05 : 0
      tasks.push(symbol.animator.play(isCharacter ? 'bigWin' : isWinner ? 'win' : 'dim', delay))
    }))
    await Promise.all(tasks)
  }
  fadeForStage(alpha: number, duration = 0.22): Promise<void> {
    gsap.killTweensOf(this.view)
    return new Promise((resolve) => {
      gsap.to(this.view, { alpha, duration, ease: 'power2.inOut', onComplete: resolve })
    })
  }
  restoreFromStage(duration = 0.26): Promise<void> {
    return this.fadeForStage(1, duration)
  }
  async resetSymbols(): Promise<void> { await Promise.all(this.reels.flatMap((reel) => reel.visibleSymbols().map((symbol) => symbol.animator.play('reset')))) }
  destroy(): void { gsap.killTweensOf(this.view); this.reels.forEach((reel) => reel.destroy()); this.view.destroy() }
}
