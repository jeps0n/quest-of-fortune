import { Container } from 'pixi.js'
import type { AudioManager } from '../../audio/AudioManager'
import { SYMBOL_IDS, type SymbolId } from '../../game/math/SpinResult'
import { QuestSymbol } from './Symbol'
export class ReelSymbolPool {
  readonly view = new Container()
  readonly symbols: QuestSymbol[]
  private cellHeight: number
  private gap: number
  constructor(size: number, cellWidth: number, cellHeight: number, gap: number, audio: AudioManager) {
    this.cellHeight = cellHeight; this.gap = gap
    this.symbols = Array.from({ length: size }, (_, i) => new QuestSymbol(SYMBOL_IDS[i % SYMBOL_IDS.length], cellWidth, cellHeight, audio))
    this.symbols.forEach((symbol) => this.view.addChild(symbol.view)); this.layout()
  }
  get pitch(): number { return this.cellHeight + this.gap }
  layout(): void { this.symbols.forEach((symbol, i) => symbol.view.position.set(symbol.view.pivot.x, i * this.pitch + symbol.view.pivot.y)) }
  recycleOne(): void {
    const last = this.symbols.pop(); if (!last) return
    last.setSymbol(SYMBOL_IDS[Math.floor(Math.random() * SYMBOL_IDS.length)])
    this.symbols.unshift(last); this.view.setChildIndex(last.view, 0); this.layout()
  }
  applyVisible(ids: readonly SymbolId[], offset = 1): void { ids.forEach((id, row) => this.symbols[row + offset]?.setSymbol(id)) }
  visible(rows: number, offset = 1): QuestSymbol[] { return this.symbols.slice(offset, offset + rows) }
  destroy(): void { this.symbols.forEach((symbol) => symbol.destroy()); this.view.destroy() }
}
