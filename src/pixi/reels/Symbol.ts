import { Container, Graphics, Text } from 'pixi.js'
import type { AudioManager } from '../../audio/AudioManager'
import type { SymbolId } from '../../game/math/SpinResult'
import { SymbolAnimator } from './SymbolAnimator'
/*
 * Presentation lock P1.
 * HIGH symbols own green / red / blue / purple.
 * LOW symbols stay in a warm-neutral treasure family so the two tiers read
 * differently before final artwork is introduced.
 */
const LOOK: Record<SymbolId, { color: number; label: string; labelColor: number }> = {
  SCROLL: { color: 0xd6b45d, label: 'SCROLL', labelColor: 0xffedbd },
  COIN:   { color: 0xf0c94d, label: 'COIN',   labelColor: 0xffed9b },
  RING:   { color: 0xe58a35, label: 'RING',   labelColor: 0xffc77a },
  CHEST:  { color: 0x9b6238, label: 'CHEST',  labelColor: 0xe8bd82 },
  GEM:    { color: 0xe8dfc7, label: 'GEM',    labelColor: 0xfff7e8 },
  CROWN:  { color: 0xd99b28, label: 'CROWN',  labelColor: 0xffd76c },
  ARCHER: { color: 0x43b85f, label: 'ARCHER', labelColor: 0x9df0ad },
  KNIGHT: { color: 0xd34f4f, label: 'KNIGHT', labelColor: 0xffa2a2 },
  MAGE:   { color: 0x4388dc, label: 'MAGE',   labelColor: 0x9ecaff },
  DRAGON: { color: 0x9a5bd4, label: 'DRAGON', labelColor: 0xd8adff },
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
    this.plate
      .clear()
      .roundRect(2, 2, this.width - 4, this.height - 4, 9)
      .fill({ color: 0x100a19, alpha: 0.96 })
      .stroke({ color: look.color, alpha: 0.98, width: 3 })
    this.plate.circle(this.width / 2, this.height / 2 - 8, 15).fill({ color: look.color, alpha: 0.86 })
    this.plate.circle(this.width / 2, this.height / 2 - 8, 20).stroke({ color: look.color, alpha: 0.28, width: 3 })
    this.label.text = look.label
    this.label.style.fill = look.labelColor
    this.label.position.set(this.width / 2, this.height / 2 + 18)
  }
  destroy(): void { this.animator.destroy(); this.view.destroy({ children: true }) }
}
