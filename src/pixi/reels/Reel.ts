import { Container, Graphics } from 'pixi.js'
import type { AudioManager } from '../../audio/AudioManager'
import type { SymbolId } from '../../game/math/SpinResult'
import { ReelAnimator } from './ReelAnimator'
import { ReelSymbolPool } from './ReelSymbolPool'
export class Reel {
  readonly view = new Container()
  readonly pool: ReelSymbolPool
  readonly animator: ReelAnimator
  private rows: number
  constructor(width: number, height: number, rows: number, rowGap: number, audio: AudioManager) {
    this.rows = rows
    const cellHeight = (height - rowGap * (rows - 1)) / rows
    const frame = new Graphics().roundRect(0, 0, width, height, 8).fill({ color: 0x080314, alpha: 0.36 }).stroke({ color: 0xd7b141, alpha: 0.34, width: 1 })
    const mask = new Graphics().rect(0, 0, width, height).fill(0xffffff)
    this.pool = new ReelSymbolPool(rows + 2, width, cellHeight, rowGap, audio)
    this.pool.view.y = -this.pool.pitch
    this.view.addChild(frame, this.pool.view, mask); this.pool.view.mask = mask
    this.animator = new ReelAnimator(this.pool, audio)
  }
  spin(result: readonly SymbolId[], delay: number): Promise<void> { return this.animator.spin(result, delay) }
  visibleSymbols(): ReturnType<ReelSymbolPool['visible']> { return this.pool.visible(this.rows) }
  destroy(): void { this.animator.destroy(); this.pool.destroy(); this.view.destroy({ children: true }) }
}
