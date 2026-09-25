import type { SymbolId } from '../game/math/SpinResult'
import { PAYTABLE } from '../game/math/Paytable'
import { PAYLINES } from '../game/math/Paylines'
import { REEL_GENERATION_INPUT, type ReelComposition } from './ReelGenerationInput'
// Offline search model for deriving candidate reel compositions near the locked
// RTP and jackpot-frequency targets. Its output feeds generation/audit tooling;
// runtime spins consume finished reel strips rather than executing this search.
export interface HighSymbolDistribution { oneGapClusters: number; twoGapClusters: number }
export type HighSymbol = 'ARCHER' | 'KNIGHT' | 'MAGE' | 'DRAGON'
const HIGH_SYMBOLS: readonly HighSymbol[] = ['ARCHER', 'KNIGHT', 'MAGE', 'DRAGON']
const LOW_SYMBOLS: readonly SymbolId[] = ['SCROLL', 'COIN', 'RING', 'CHEST', 'CROWN', 'GEM']
const BASE_REEL_LENGTH = 200
const MIN_SHARED_REEL_LENGTH = 195
const MAX_SHARED_REEL_LENGTH = 205
const MAX_HIGH_DELTA_PER_REEL = 2
const MAX_LOW_DELTA_PER_REEL = 4
const HIGH_PROFILE_FINALISTS = 32
const TARGET_BASE_RTP = 93.6
const TARGET_FREQUENCY: Readonly<Record<HighSymbol, number>> = {
  ARCHER: 399,
  KNIGHT: 999,
  MAGE: 1999,
  DRAGON: 9999,
}
// Hard jackpot band: every HIGH jackpot denominator must stay within
// 0.1 below through 0.9 above its official 9-ending anchor. Profiles outside
// these bands are ineligible; the search never widens or falls back.
const MIN_FREQUENCY_UNDER_TARGET = 0.1
const MAX_FREQUENCY_OVER_TARGET = 0.9
const HIGH_GLOBAL_COUNT_RANGE: Readonly<Record<HighSymbol, readonly [number, number]>> = {
  ARCHER: [52, 58],
  KNIGHT: [42, 48],
  MAGE: [32, 38],
  DRAGON: [23, 27],
}
const JACKPOT_PAYOUT: Readonly<Record<HighSymbol, number>> = {
  ARCHER: 20,
  KNIGHT: 50,
  MAGE: 100,
  DRAGON: 500,
}
const BASE_DISTRIBUTION: Readonly<Record<HighSymbol, readonly HighSymbolDistribution[]>> = {
  ARCHER: [
    { oneGapClusters: 2, twoGapClusters: 0 }, { oneGapClusters: 1, twoGapClusters: 1 },
    { oneGapClusters: 1, twoGapClusters: 1 }, { oneGapClusters: 0, twoGapClusters: 1 },
    { oneGapClusters: 0, twoGapClusters: 1 },
  ],
  KNIGHT: [
    { oneGapClusters: 1, twoGapClusters: 0 }, { oneGapClusters: 1, twoGapClusters: 0 },
    { oneGapClusters: 1, twoGapClusters: 0 }, { oneGapClusters: 0, twoGapClusters: 1 },
    { oneGapClusters: 0, twoGapClusters: 1 },
  ],
  MAGE: [
    { oneGapClusters: 1, twoGapClusters: 0 }, { oneGapClusters: 1, twoGapClusters: 0 },
    { oneGapClusters: 1, twoGapClusters: 0 }, { oneGapClusters: 0, twoGapClusters: 1 },
    { oneGapClusters: 0, twoGapClusters: 1 },
  ],
  DRAGON: [
    { oneGapClusters: 1, twoGapClusters: 0 }, { oneGapClusters: 0, twoGapClusters: 1 },
    { oneGapClusters: 0, twoGapClusters: 1 }, { oneGapClusters: 0, twoGapClusters: 0 },
    { oneGapClusters: 0, twoGapClusters: 0 },
  ],
}
interface Variant {
  counts: readonly number[]
  distribution: readonly HighSymbolDistribution[]
  frequency: number
  structuralCost: number
}
// HIGH-symbol inventory may stay flat or decrease left-to-right, but never rise
// on a later reel. This preserves the intended directional qualification profile.
export function isLeftWeightedHighCounts(counts: readonly number[]): boolean {
  return counts.length === 5 && counts.every((count, reel) => reel === 0 || counts[reel - 1] >= count)
}
function countVectors(symbol: HighSymbol, base: number): number[][] {
  const result: number[][] = []
  const [minimumTotal, maximumTotal] = HIGH_GLOBAL_COUNT_RANGE[symbol]
  const visit = (counts: number[]): void => {
    if (counts.length === 5) {
      const total = counts.reduce((sum, count) => sum + count, 0)
      if (total < minimumTotal || total > maximumTotal) return
      if (!isLeftWeightedHighCounts(counts)) return
      result.push(counts)
      return
    }
    const previous = counts[counts.length - 1]
    for (let delta = -MAX_HIGH_DELTA_PER_REEL; delta <= MAX_HIGH_DELTA_PER_REEL; delta++) {
      const count = base + delta
      if (count < 1) continue
      if (previous !== undefined && previous < count) continue
      visit([...counts, count])
    }
  }
  visit([])
  return result
}
function configsForExposure(count: number, exposure: number, baseline: HighSymbolDistribution): HighSymbolDistribution[] {
  const configs: HighSymbolDistribution[] = []
  for (let one = 0; one <= 3; one++) for (let two = 0; two <= 3; two++) {
    if (2 * one + two !== exposure) continue
    if (one + two > Math.floor(count / 2)) continue
    configs.push({ oneGapClusters: one, twoGapClusters: two })
  }
  return configs.sort((left, right) => {
    const lc = Math.abs(left.oneGapClusters - baseline.oneGapClusters) + Math.abs(left.twoGapClusters - baseline.twoGapClusters)
    const rc = Math.abs(right.oneGapClusters - baseline.oneGapClusters) + Math.abs(right.twoGapClusters - baseline.twoGapClusters)
    return lc - rc
  })
}
// Convert cluster topology into probabilities of seeing 0, 1, or 2 copies of a
// HIGH symbol in the four-row visible window for a single circular reel.
function reelWindowDistribution(count: number, config: HighSymbolDistribution, reelLength: number): readonly [number, number, number] {
  const doubleWindows = 2 * config.oneGapClusters + config.twoGapClusters
  const singleWindows = 4 * count - 2 * doubleWindows
  const zeroWindows = reelLength - singleWindows - doubleWindows
  if (zeroWindows < 0 || singleWindows < 0) throw new Error('Invalid theoretical HIGH window distribution')
  return [zeroWindows / reelLength, singleWindows / reelLength, doubleWindows / reelLength]
}
// Convolve the per-reel visible-count distributions and measure the probability
// that five or more matching HIGH symbols are visible across the full window.
function jackpotFrequency(counts: readonly number[], distribution: readonly HighSymbolDistribution[], reelLength: number): number {
  let total = [1]
  for (let reel = 0; reel < 5; reel++) {
    const reelDistribution = reelWindowDistribution(counts[reel], distribution[reel], reelLength)
    const next = Array(total.length + 2).fill(0) as number[]
    total.forEach((left, leftCount) => reelDistribution.forEach((right, rightCount) => {
      next[leftCount + rightCount] += left * right
    }))
    total = next
  }
  const probability = total.slice(5).reduce((sum, value) => sum + value, 0)
  return 1 / probability
}
function jackpotFrequencyBand(symbol: HighSymbol): readonly [number, number] {
  const target = TARGET_FREQUENCY[symbol]
  return [target - MIN_FREQUENCY_UNDER_TARGET, target + MAX_FREQUENCY_OVER_TARGET]
}
function isJackpotFrequencyEligible(symbol: HighSymbol, frequency: number): boolean {
  const [minimum, maximum] = jackpotFrequencyBand(symbol)
  return frequency >= minimum - 1e-9 && frequency <= maximum + 1e-9
}
function jackpotFrequencyScore(symbol: HighSymbol, frequency: number): number {
  const target = TARGET_FREQUENCY[symbol]
  return Math.abs(frequency - target) / target * 100
}
// Search only structurally valid variants inside the hard frequency band, then
// retain the closest candidates so later cross-symbol search remains tractable.
function variantsFor(symbol: HighSymbol, reelLength: number): Variant[] {
  const baseCount = REEL_GENERATION_INPUT[0][symbol]
  const baseline = BASE_DISTRIBUTION[symbol]
  const variants: Variant[] = []
  for (const counts of countVectors(symbol, baseCount)) {
    const options = counts.map((count, reel) => {
      const baseExposure = 2 * baseline[reel].oneGapClusters + baseline[reel].twoGapClusters
      const configs: HighSymbolDistribution[] = []
      for (let exposure = Math.max(0, baseExposure - 2); exposure <= baseExposure + 2; exposure++) {
        configs.push(...configsForExposure(count, exposure, baseline[reel]))
      }
      return configs
    })
    for (const r0 of options[0]) for (const r1 of options[1]) for (const r2 of options[2])
      for (const r3 of options[3]) for (const r4 of options[4]) {
        const distribution = [r0, r1, r2, r3, r4]
        const frequency = jackpotFrequency(counts, distribution, reelLength)
        if (!isJackpotFrequencyEligible(symbol, frequency)) continue
        const countCost = counts.reduce((sum, count) => sum + Math.abs(count - baseCount), 0)
        const topologyCost = distribution.reduce((sum, config, reel) => sum
          + Math.abs(config.oneGapClusters - baseline[reel].oneGapClusters)
          + Math.abs(config.twoGapClusters - baseline[reel].twoGapClusters), 0)
        variants.push({ counts, distribution, frequency, structuralCost: countCost + topologyCost * 0.75 })
      }
  }
  variants.sort((a, b) => {
    const as = jackpotFrequencyScore(symbol, a.frequency) + a.structuralCost * 0.015
    const bs = jackpotFrequencyScore(symbol, b.frequency) + b.structuralCost * 0.015
    return as - bs
  })
  return variants.slice(0, 16)
}
function compositionLength(composition: ReelComposition): number {
  return Object.values(composition).reduce((total, count) => total + count, 0)
}
function paylineRtp(compositions: readonly ReelComposition[]): number {
  let expectedReturn = 0
  for (let line = 0; line < PAYLINES.length; line++) {
    for (const symbol of Object.keys(PAYTABLE) as SymbolId[]) {
      const probabilities = compositions.map((composition) => composition[symbol] / compositionLength(composition))
      for (const [countText, payout] of Object.entries(PAYTABLE[symbol])) {
        const count = Number(countText)
        let probability = 1
        for (let reel = 0; reel < count; reel++) probability *= probabilities[reel]
        if (count < 5) probability *= 1 - probabilities[count]
        expectedReturn += probability * payout
      }
    }
  }
  return expectedReturn * 100
}
function compositionsFor(selection: Readonly<Record<HighSymbol, Variant>>, reelLength: number): ReelComposition[] | undefined {
  const result: ReelComposition[] = []
  for (let reel = 0; reel < 5; reel++) {
    const base = REEL_GENERATION_INPUT[reel]
    let highDelta = 0
    const highCounts = {} as Record<HighSymbol, number>
    for (const symbol of HIGH_SYMBOLS) {
      const count = selection[symbol].counts[reel]
      highCounts[symbol] = count
      highDelta += count - base[symbol]
    }
    const scroll = base.SCROLL + (reelLength - BASE_REEL_LENGTH) - highDelta
    if (scroll < 1) return undefined
    result.push({ ...base, SCROLL: scroll, ...highCounts })
  }
  return result
}
function scoreSelection(selection: Readonly<Record<HighSymbol, Variant>>, compositions: readonly ReelComposition[]): number {
  const payline = paylineRtp(compositions)
  let jackpotRtp = 0
  let frequencyScore = 0
  let structuralCost = 0
  for (const symbol of HIGH_SYMBOLS) {
    const variant = selection[symbol]
    frequencyScore += jackpotFrequencyScore(symbol, variant.frequency)
    jackpotRtp += (1 / variant.frequency) * JACKPOT_PAYOUT[symbol] * 100
    structuralCost += variant.structuralCost
  }
  const baseRtp = payline + jackpotRtp
  return Math.abs(baseRtp - TARGET_BASE_RTP) * 80 + frequencyScore * 4 + structuralCost * 0.01
}
interface ProfileCandidate {
  selection: Record<HighSymbol, Variant>
  compositions: ReelComposition[]
  score: number
}
function jackpotRtp(selection: Readonly<Record<HighSymbol, Variant>>): number {
  return HIGH_SYMBOLS.reduce(
    (sum, symbol) => sum + (1 / selection[symbol].frequency) * JACKPOT_PAYOUT[symbol] * 100,
    0,
  )
}
function lowDeviationCost(compositions: readonly ReelComposition[], baseline: readonly ReelComposition[]): number {
  let cost = 0
  for (let reel = 0; reel < 5; reel++) {
    for (const symbol of LOW_SYMBOLS) cost += Math.abs(compositions[reel][symbol] - baseline[reel][symbol])
  }
  return cost
}
// Once HIGH-symbol behavior is fixed, tune only LOW-symbol inventory toward the
// payline RTP target while minimizing deviation from the baseline composition.
function lowTune(
  source: readonly ReelComposition[],
  targetPaylineRtp: number,
): { compositions: ReelComposition[]; paylineRtp: number } {
  let current = source.map((composition) => ({ ...composition })) as ReelComposition[]
  let currentRtp = paylineRtp(current)
  const objective = (rtp: number, compositions: readonly ReelComposition[]) =>
    Math.abs(rtp - targetPaylineRtp) * 1000 + lowDeviationCost(compositions, source) * 0.002
  // A move changes one LOW identity into another on the same reel. Reel length
  // stays fixed, while global LOW inventories are free to move within a tight
  // per-reel envelope. HIGH counts/topology and jackpot frequencies are untouched.
  for (let pass = 0; pass < 50; pass++) {
    let bestMove: { compositions: ReelComposition[]; rtp: number; objective: number } | undefined
    const currentObjective = objective(currentRtp, current)
    for (let reel = 0; reel < 5; reel++) {
      for (const fromSymbol of LOW_SYMBOLS) for (const toSymbol of LOW_SYMBOLS) {
        if (fromSymbol === toSymbol) continue
        if (current[reel][fromSymbol] <= 1) continue
        const next = current.map((composition) => ({ ...composition })) as Record<SymbolId, number>[]
        next[reel][fromSymbol] -= 1
        next[reel][toSymbol] += 1
        const withinBounds = LOW_SYMBOLS.every((symbol) =>
          Math.abs(next[reel][symbol] - source[reel][symbol]) <= MAX_LOW_DELTA_PER_REEL
        )
        if (!withinBounds) continue
        const typed = next as ReelComposition[]
        const rtp = paylineRtp(typed)
        const nextObjective = objective(rtp, typed)
        if (nextObjective + 1e-9 >= currentObjective) continue
        if (!bestMove || nextObjective < bestMove.objective) bestMove = { compositions: typed, rtp, objective: nextObjective }
      }
    }
    if (!bestMove) break
    current = bestMove.compositions
    currentRtp = bestMove.rtp
  }
  return { compositions: current, paylineRtp: currentRtp }
}
function bestProfileForLength(reelLength: number): ProfileCandidate | undefined {
  const pools = Object.fromEntries(HIGH_SYMBOLS.map((symbol) => [symbol, variantsFor(symbol, reelLength)])) as Record<HighSymbol, Variant[]>
  if (HIGH_SYMBOLS.some((symbol) => pools[symbol].length === 0)) return undefined
  const finalists: ProfileCandidate[] = []
  for (const archer of pools.ARCHER) for (const knight of pools.KNIGHT)
    for (const mage of pools.MAGE) for (const dragon of pools.DRAGON) {
      const selection = { ARCHER: archer, KNIGHT: knight, MAGE: mage, DRAGON: dragon }
      const compositions = compositionsFor(selection, reelLength)
      if (!compositions) continue
      const score = scoreSelection(selection, compositions)
      finalists.push({ selection, compositions, score })
    }
  finalists.sort((left, right) => left.score - right.score)
  let bestForLength: ProfileCandidate | undefined
  for (const finalist of finalists.slice(0, HIGH_PROFILE_FINALISTS)) {
    const fixedJackpotRtp = jackpotRtp(finalist.selection)
    const tuned = lowTune(finalist.compositions, TARGET_BASE_RTP - fixedJackpotRtp)
    const score = scoreSelection(finalist.selection, tuned.compositions)
    if (!bestForLength || score < bestForLength.score) {
      bestForLength = { selection: finalist.selection, compositions: tuned.compositions, score }
    }
  }
  return bestForLength
}
const profileSearchStartedAt = performance.now()
const sharedLengthCount = MAX_SHARED_REEL_LENGTH - MIN_SHARED_REEL_LENGTH + 1
console.log('LEGAL ENVELOPE SEARCH')
console.log('---------------------')
console.log(`Shared reel lengths: ${MIN_SHARED_REEL_LENGTH}-${MAX_SHARED_REEL_LENGTH} (${sharedLengthCount} lengths)`)
console.log('Hard jackpot bands: MINI 398.9-399.9 | MINOR 998.9-999.9 | MAJOR 1998.9-1999.9 | GRAND 9998.9-9999.9')
console.log('Searching mathematical profiles...')
let best: ProfileCandidate | undefined
let bestReelLength: number | undefined
for (let reelLength = MIN_SHARED_REEL_LENGTH; reelLength <= MAX_SHARED_REEL_LENGTH; reelLength++) {
  const lengthStartedAt = performance.now()
  const lengthIndex = reelLength - MIN_SHARED_REEL_LENGTH + 1
  console.log(`  [${lengthIndex}/${sharedLengthCount}] ${reelLength} stops — searching...`)
  const candidate = bestProfileForLength(reelLength)
  const elapsedSeconds = (performance.now() - lengthStartedAt) / 1000
  if (!candidate) {
    console.log(`  [${lengthIndex}/${sharedLengthCount}] ${reelLength} stops — no eligible profile (${elapsedSeconds.toFixed(2)}s)`)
    continue
  }
  const candidateBaseRtp = paylineRtp(candidate.compositions) + jackpotRtp(candidate.selection)
  console.log(`  [${lengthIndex}/${sharedLengthCount}] ${reelLength} stops — eligible | Base RTP ${candidateBaseRtp.toFixed(4)}% (${elapsedSeconds.toFixed(2)}s)`)
  if (!best || candidate.score < best.score) {
    best = candidate
    bestReelLength = reelLength
  }
}
const profileSearchSeconds = (performance.now() - profileSearchStartedAt) / 1000
if (!best || bestReelLength === undefined) {
  console.log(`Legal-envelope search complete: NO ELIGIBLE PROFILE (${profileSearchSeconds.toFixed(2)}s)`)
  throw new Error(
    `NO ELIGIBLE PROFILE across shared reel lengths ${MIN_SHARED_REEL_LENGTH}-${MAX_SHARED_REEL_LENGTH} with all four hard jackpot bands.`,
  )
}
console.log(`Legal-envelope search complete: selected ${bestReelLength} stops (${profileSearchSeconds.toFixed(2)}s)`)
console.log('')
for (const symbol of HIGH_SYMBOLS) {
  if (!isLeftWeightedHighCounts(best.selection[symbol].counts)) {
    throw new Error(`${symbol} challenger HIGH counts are not left-weighted (R1 >= R2 >= R3 >= R4 >= R5).`)
  }
  if (!isJackpotFrequencyEligible(symbol, best.selection[symbol].frequency)) {
    const [minimum, maximum] = jackpotFrequencyBand(symbol)
    throw new Error(`${symbol} challenger jackpot frequency is outside the hard jackpot band ${minimum.toFixed(1)}-${maximum.toFixed(1)}.`)
  }
}
export const CHALLENGER_PROFILE_SEARCH_SECONDS = profileSearchSeconds
export const CHALLENGER_REEL_LENGTH = bestReelLength
export const CHALLENGER_GENERATION_INPUT: readonly ReelComposition[] = best.compositions
export const CHALLENGER_HIGH_DISTRIBUTION: Readonly<Record<HighSymbol, readonly HighSymbolDistribution[]>> = {
  ARCHER: best.selection.ARCHER.distribution,
  KNIGHT: best.selection.KNIGHT.distribution,
  MAGE: best.selection.MAGE.distribution,
  DRAGON: best.selection.DRAGON.distribution,
}
export const CHALLENGER_TARGET_SUMMARY = HIGH_SYMBOLS.map((symbol) => ({
  symbol,
  frequency: best.selection[symbol].frequency,
  target: TARGET_FREQUENCY[symbol],
}))
const challengerPaylineRtp = paylineRtp(best.compositions)
const challengerJackpotRtp = HIGH_SYMBOLS.reduce(
  (sum, symbol) => sum + (1 / best.selection[symbol].frequency) * JACKPOT_PAYOUT[symbol] * 100,
  0,
)
export const CHALLENGER_RTP_SUMMARY = {
  paylineRtp: challengerPaylineRtp,
  jackpotRtp: challengerJackpotRtp,
  baseRtp: challengerPaylineRtp + challengerJackpotRtp,
  targetBaseRtp: TARGET_BASE_RTP,
} as const
