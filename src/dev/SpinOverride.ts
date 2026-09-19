import { PAYLINE_DEFINITIONS } from '../game/math/Paylines'
import {
  REEL_STRIPS,
  createSpinResult,
  reelWindow,
  type SpinResult,
  type SymbolId,
} from '../game/math/SpinResult'
export type MatchCount = 3 | 4 | 5
export type SpinOverrideMode = 'payline' | 'anywhere'
export interface SpinOverrideSelection {
  readonly mode: SpinOverrideMode
  readonly symbol: SymbolId
  readonly count: MatchCount
  readonly paylineIndex?: number
}
/**
 * DEV-only controlled-spin selector.
 *
 * The override never paints or replaces symbols in the viewport. It selects
 * legal stop positions on the real production reel strips. Production RNG first
 * chooses the natural stops; the override then advances each circular reel forward
 * from those stops to a legal landing that fulfills the armed request exactly.
 * The final 5x4 viewport is therefore always a board normal reel-strip RNG could produce.
 */
export class SpinOverride {
  private armedSelection: SpinOverrideSelection | null = null
  private readonly armedListeners = new Set<(armed: boolean) => void>()
  arm(selection: SpinOverrideSelection): void {
    if (selection.mode === 'payline' && !PAYLINE_DEFINITIONS[selection.paylineIndex ?? -1]) {
      throw new Error(`Unknown payline index: ${selection.paylineIndex}`)
    }
    this.armedSelection = { ...selection }
    this.emitArmedChange()
  }
  disarm(): void {
    if (!this.armedSelection) return
    this.armedSelection = null
    this.emitArmedChange()
  }
  onArmedChange(listener: (armed: boolean) => void): () => void {
    this.armedListeners.add(listener)
    listener(this.armedSelection !== null)
    return () => { this.armedListeners.delete(listener) }
  }
  get selection(): SpinOverrideSelection | null {
    return this.armedSelection ? { ...this.armedSelection } : null
  }
  consume(baseResult: SpinResult): SpinResult {
    const selection = this.armedSelection
    if (!selection) return baseResult
    this.armedSelection = null
    this.emitArmedChange()
    const baseStops = this.requireBaseStops(baseResult)
    const stops = selection.mode === 'anywhere'
      ? this.findAnywhereStopsWithRetries(selection.symbol, selection.count, baseStops)
      : this.findPaylineStops(
          selection.symbol,
          selection.count,
          selection.paylineIndex ?? 0,
          baseStops,
        )
    return {
      stops,
      reels: stops.map((stop, reelIndex) => reelWindow(reelIndex, stop)),
    }
  }
  private emitArmedChange(): void {
    const armed = this.armedSelection !== null
    for (const listener of this.armedListeners) listener(armed)
  }
  /**
   * PAYLINE means exactly N copies of the selected symbol in the entire 5x4
   * viewport. Each of those copies must occupy the requested payline on reels
   * 1..N. Every other visible cell must be free of the selected symbol.
   */
  private findPaylineStops(
    symbol: SymbolId,
    count: MatchCount,
    paylineIndex: number,
    baseStops: readonly number[],
  ): number[] {
    const line = PAYLINE_DEFINITIONS[paylineIndex]
    if (!line) throw new Error(`Unknown payline index: ${paylineIndex}`)
    return REEL_STRIPS.map((_, reelIndex) => {
      const requiredRow = reelIndex < count ? line.rows[reelIndex] : null
      const stop = this.firstForwardLegalStop(reelIndex, baseStops[reelIndex], (candidateStop) => {
        const window = reelWindow(reelIndex, candidateStop)
        const visibleCount = this.countVisible(window, symbol)
        if (requiredRow === null) return visibleCount === 0
        return visibleCount === 1 && window[requiredRow] === symbol
      })
      if (stop === null) {
        throw new Error(
          `No legitimate reel stop can produce exactly ${count} ${symbol} symbols on ${line.name}`,
        )
      }
      return stop
    })
  }
  /**
   * ANYWHERE gets at most three invisible generation attempts: the genuine
   * production result supplied to consume(), followed by up to two fresh
   * production RNG origins. All attempts finish before reel animation begins.
   */
  private findAnywhereStopsWithRetries(
    symbol: SymbolId,
    count: MatchCount,
    baseStops: readonly number[],
  ): number[] {
    const maxAttempts = 3
    let attemptStops = baseStops
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const match = this.findAnywhereStops(symbol, count, attemptStops)
      if (match) return match
      if (attempt < maxAttempts - 1) {
        attemptStops = this.requireBaseStops(createSpinResult())
      }
    }
    throw new Error(
      `No legitimate reel-stop combination produces exactly ${count} ${symbol} symbols after ${maxAttempts} attempts`,
    )
  }
  /**
   * ANYWHERE means exactly N visible copies across the full 5x4 viewport.
   *
   * The genuine production RNG stops remain the origin of the Demo Spin. Those
   * five stops deterministically choose a starting reel, then the search walks
   * the reels cyclically from that point. Every candidate landing is reached by
   * advancing that reel forward on its real circular production strip.
   *
   * Candidate choice is also derived from the original RNG stops so a selected
   * symbol is not repeatedly biased toward the first visible row/alignment.
   * No additional RNG is consumed by the override.
   */
  private findAnywhereStops(
    symbol: SymbolId,
    count: MatchCount,
    baseStops: readonly number[],
  ): number[] | null {
    const reelCount = REEL_STRIPS.length
    const startReel = baseStops.reduce((total, stop) => total + stop, 0) % reelCount
    const reelOrder = Array.from(
      { length: reelCount },
      (_, offset) => (startReel + offset) % reelCount,
    )
    const candidateSets = new Map<
      number,
      Array<{ stop: number; count: number; offset: number }>
    >()
    for (const reelIndex of reelOrder) {
      candidateSets.set(
        reelIndex,
        this.anywhereCandidates(reelIndex, symbol, baseStops),
      )
    }
    const search = (orderIndex: number, remaining: number, stops: number[]): number[] | null => {
      if (orderIndex === reelOrder.length) return remaining === 0 ? stops : null
      const reelIndex = reelOrder[orderIndex]
      const candidates = candidateSets.get(reelIndex) ?? []
      const ordered = [...candidates].sort((left, right) => {
        // While targets are still needed, walk toward a genuine positive-count
        // landing before considering a zero-target window. Between positive
        // landings, whichever RNG-derived legal alignment is physically closer
        // in the forward direction wins. This allows 1- or 2-symbol windows to
        // arise from the strip instead of imposing a fixed distribution.
        if (remaining > 0 && left.count === 0 && right.count > 0) return 1
        if (remaining > 0 && right.count === 0 && left.count > 0) return -1
        return left.offset - right.offset
      })
      for (const candidate of ordered) {
        if (candidate.count > remaining) continue
        const nextStops = [...stops]
        nextStops[reelIndex] = candidate.stop
        const match = search(orderIndex + 1, remaining - candidate.count, nextStops)
        if (match) return match
      }
      return null
    }
    return search(0, count, [...baseStops])
  }
  private anywhereCandidates(
    reelIndex: number,
    symbol: SymbolId,
    baseStops: readonly number[],
  ): Array<{ stop: number; count: number; offset: number }> {
    const strip = REEL_STRIPS[reelIndex]
    const byCount = new Map<number, Array<{ stop: number; count: number; offset: number }>>()
    // Enumerate the physical dial in the production direction from this reel's
    // genuine RNG origin. Every entry is therefore a real contiguous 4-stop
    // production window; symbols are never painted, replaced, or moved by row.
    for (let offset = 0; offset < strip.length; offset += 1) {
      const stop = (baseStops[reelIndex] + offset) % strip.length
      const visibleCount = this.countVisible(reelWindow(reelIndex, stop), symbol)
      const candidates = byCount.get(visibleCount) ?? []
      candidates.push({ stop, count: visibleCount, offset })
      byCount.set(visibleCount, candidates)
    }
    // Do not always take the first window in which a target becomes visible.
    // A stable value derived from the genuine five-stop RNG result selects one
    // legal forward alignment for each possible visible count. This lets rows
    // 1/2/3/4 and real multi-target clusters vary without another RNG call.
    return [...byCount.entries()]
      .sort(([leftCount], [rightCount]) => leftCount - rightCount)
      .map(([visibleCount, candidates]) => {
        if (visibleCount === 0) return candidates[0]
        const choice = this.derivedCandidateIndex(baseStops, reelIndex, visibleCount, candidates.length)
        return candidates[choice]
      })
  }
  private derivedCandidateIndex(
    baseStops: readonly number[],
    reelIndex: number,
    visibleCount: number,
    candidateCount: number,
  ): number {
    let value = 0x514f46
    for (let index = 0; index < baseStops.length; index += 1) {
      value = Math.imul(value ^ (baseStops[index] + 1 + index * 257), 16777619) >>> 0
    }
    value = Math.imul(value ^ ((reelIndex + 1) * 65537), 16777619) >>> 0
    value = Math.imul(value ^ (visibleCount * 4099), 16777619) >>> 0
    return value % candidateCount
  }
  private firstForwardLegalStop(
    reelIndex: number,
    baseStop: number,
    accepts: (stop: number) => boolean,
  ): number | null {
    const strip = REEL_STRIPS[reelIndex]
    for (let offset = 0; offset < strip.length; offset += 1) {
      const stop = (baseStop + offset) % strip.length
      if (accepts(stop)) return stop
    }
    return null
  }
  private requireBaseStops(baseResult: SpinResult): readonly number[] {
    const stops = baseResult.stops
    if (!stops || stops.length < REEL_STRIPS.length) {
      throw new Error('Demo Spin requires genuine production RNG reel stops')
    }
    return stops.map((stop, reelIndex) => {
      const length = REEL_STRIPS[reelIndex].length
      return ((stop % length) + length) % length
    })
  }
  private countVisible(window: readonly SymbolId[], symbol: SymbolId): number {
    return window.reduce((total, visible) => total + (visible === symbol ? 1 : 0), 0)
  }
}
