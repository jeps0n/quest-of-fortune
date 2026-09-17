import { Container, Graphics, Text } from 'pixi.js'
import type { AudioManager } from '../../audio/AudioManager'
import type { SymbolId } from '../../game/math/SpinResult'
import { SymbolAnimator } from './SymbolAnimator'

const LOOK: Record<SymbolId, { color: number; label: string }> = {
  RING:   { color: 0xb65353, label: 'RING' },
  SCROLL: { color: 0x4f9c5f, label: 'SCROLL' },
  COIN:   { color: 0xc9a650, label: 'COIN' },
  CHEST:  { color: 0x9a573d, label: 'CHEST' },
  CROWN:  { color: 0x8d62cf, label: 'CROWN' },
  GEM:    { color: 0x4b7dcc, label: 'GEM' },
  ARCHER: { color: 0x5ca66b, label: 'ARCHER' },
  KNIGHT: { color: 0xb8bcc7, label: 'KNIGHT' },
  MAGE:   { color: 0x8b63d9, label: 'MAGE' },
  DRAGON: { color: 0xc84f45, label: 'DRAGON' },
}

export class QuestSymbol {
  readonly view = new Container()
  readonly animator: SymbolAnimator
  private id: SymbolId
  private width: number
  private height: number
  private plate = new Graphics()
  private label = new Text({ text: '', style: { fill: 0xf6e7bb, fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: '700' } })

  constructor(id: SymbolId, width: number, height: number, audio: AudioManager) {
    this.id = id; this.width = width; this.height = height
    this.label.anchor.set(0.5); this.view.pivot.set(width / 2, height / 2)
    this.view.addChild(this.plate, this.label); this.animator = new SymbolAnimator(this.view, audio); this.draw()
  }

  get symbolId(): SymbolId { return this.id }
  setSymbol(id: SymbolId): void { this.id = id; this.draw() }

  private draw(): void {
    const look = LOOK[this.id]
    this.plate.clear().roundRect(2, 2, this.width - 4, this.height - 4, 9).fill({ color: 0x140d20, alpha: 0.94 }).stroke({ color: look.color, alpha: 0.92, width: 2 })
    this.plate.circle(this.width / 2, this.height / 2 - 7, 12).fill({ color: look.color, alpha: 0.72 })
    this.label.text = look.label; this.label.position.set(this.width / 2, this.height / 2 + 16)
  }

  destroy(): void { this.animator.destroy(); this.view.destroy({ children: true }) }
}
