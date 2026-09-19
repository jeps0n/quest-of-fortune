import { SYMBOL_IDS, type SymbolId } from '../game/math/SpinResult'
import { REEL_GENERATION_INPUT } from './ReelGenerationInput'
/**
 * QUEST OF FORTUNE — REEL SEQUENCE OPTIMIZER
 *
 * Development-only tool for generating candidate production reel strips.
 *
 * WORKFLOW
 * 1. Configure sequencing constraints in this tool.
 * 2. Run: npm run reels:generate
 * 3. Generate five deterministic 200-stop candidate reels.
 * 4. Require structural and reel-set validation to pass.
 * 5. Print a reel-derived Candidate ID and copy/paste-ready REEL_STRIPS.
 * 6. Manually paste an accepted candidate into SpinResult.ts.
 * 7. Run npm run math:quick.
 * 8. If the candidate is promising, run the full npm run math simulation.
 * 9. Adjust sequencing constraints and repeat until the math is accepted.
 * 10. Freeze the accepted strips as production math.
 *
 * COMPOSITION PHILOSOPHY
 * - HIGH symbols form the jackpot-producing skeleton of the reel.
 * - Matching HIGHs may share a 4-stop window, but direct AA adjacency is forbidden.
 * - two-gap-style spacing (gap 3) is preferred over the stronger one-gap spacing (gap 2).
 * - A 4-stop window may never contain 3+ copies of the same HIGH.
 * - LOW / non-jackpot symbols fill the remaining space naturally rather than being
 *   forced into uniform spacing. Common symbols may appear up to 3 times in a
 *   4-stop window; less-common symbols may appear up to 2 times.
 * - Obvious cadence/repetition remains a soft scoring concern rather than a broad
 *   hard ban.
 *
 * IMPORTANT
 * - This tool never writes to SpinResult.ts or any other production file.
 * - This tool never performs Git operations.
 * - REEL_GENERATION_INPUT is the frozen source recipe for the currently accepted production reels.
 * - SpinResult.ts is output-only: promoting a candidate cannot feed production ordering back into generation.
 * - Change generation input/configuration only when intentionally starting a new tuning cycle.
 * - Reel order matters: sequencing is part of the game's math.
 * - Candidate IDs fingerprint the exact generated five-reel set.
 * - The math simulator—not this optimizer—determines whether a candidate satisfies
 *   RTP, hit-rate, volatility, and jackpot-frequency targets.
 */
// -----------------------------------------------------------------------------
// OPTIMIZER CONFIGURATION — PRIMARY TUNING AREA
// -----------------------------------------------------------------------------
const OPTIMIZER_SEED = 0x514f46
const CANDIDATES_PER_REEL = 500
const MAX_ATTEMPTS_PER_REEL = 20_000
const PROGRESS_STEPS = 20
const HIGH_SYMBOLS: readonly SymbolId[] = ['ARCHER', 'KNIGHT', 'MAGE', 'DRAGON']
const PERIODIC_OFFSETS = [10, 20, 25, 40, 50] as const
// HIGH / LOW SYMBOL DISTRIBUTION CONFIGURATION
//
// HIGH symbols use configurable same-symbol clusters per reel.
// one-gap cluster: A-X-A
// two-gap cluster: A-X-X-A
// Remaining copies are isolated occurrences. Different HIGH symbols may interleave.
//
// LOW symbols fill every remaining stop using exact production counts and the
// existing 4-stop window caps below.
interface HighSymbolDistribution {
  oneGapClusters: number
  twoGapClusters: number
}
// Configured per HIGH, left-to-right across Reels 1–5. Start by moving all five
// reels together; use reel weighting only when a full-reel move is too coarse.
// oneGapClusters and twoGapClusters explicitly define the same-symbol cluster
// structure. Remaining copies are derived as isolated occurrences.
const HIGH_SYMBOL_DISTRIBUTION: Readonly<
  Record<'ARCHER' | 'KNIGHT' | 'MAGE' | 'DRAGON', readonly HighSymbolDistribution[]>
> = {
  ARCHER: [
    { oneGapClusters: 2, twoGapClusters: 0 }, // R1
    { oneGapClusters: 1, twoGapClusters: 1 }, // R2
    { oneGapClusters: 1, twoGapClusters: 1 }, // R3
    { oneGapClusters: 0, twoGapClusters: 1 }, // R4
    { oneGapClusters: 0, twoGapClusters: 1 }, // R5
  ],
  KNIGHT: [
    { oneGapClusters: 1, twoGapClusters: 0 }, // R1
    { oneGapClusters: 1, twoGapClusters: 0 }, // R2
    { oneGapClusters: 1, twoGapClusters: 0 }, // R3
    { oneGapClusters: 0, twoGapClusters: 1 }, // R4
    { oneGapClusters: 0, twoGapClusters: 1 }, // R5
  ],
  MAGE: [
    { oneGapClusters: 1, twoGapClusters: 0 }, // R1
    { oneGapClusters: 1, twoGapClusters: 0 }, // R2
    { oneGapClusters: 1, twoGapClusters: 0 }, // R3
    { oneGapClusters: 0, twoGapClusters: 1 }, // R4
    { oneGapClusters: 0, twoGapClusters: 1 }, // R5
  ],
  DRAGON: [
    { oneGapClusters: 1, twoGapClusters: 0 }, // R1
    { oneGapClusters: 0, twoGapClusters: 1 }, // R2
    { oneGapClusters: 0, twoGapClusters: 1 }, // R3
    { oneGapClusters: 0, twoGapClusters: 0 }, // R4
    { oneGapClusters: 0, twoGapClusters: 0 }, // R5
  ],
} as const
function highSymbolDistribution(symbol: SymbolId, reelIndex: number): HighSymbolDistribution {
  if (!HIGH_SYMBOLS.includes(symbol)) throw new Error(`${symbol} is not a HIGH symbol`)
  return HIGH_SYMBOL_DISTRIBUTION[symbol as keyof typeof HIGH_SYMBOL_DISTRIBUTION][reelIndex]
}
// Maximum copies of each non-jackpot symbol allowed in any circular 4-stop
// viewport. These caps prevent extreme local bundling without evenly spacing
// the filler symbols across the full reel.
const WINDOW_LIMITS: Readonly<Partial<Record<SymbolId, number>>> = {
  SCROLL: 3,
  COIN: 3,
  RING: 3,
  CHEST: 2,
  GEM: 2,
  CROWN: 2,
}
interface Candidate {
  strip: SymbolId[]
  score: number
  highSpacingPenalty: number
}
interface ValidationResult {
  valid: boolean
  errors: string[]
}
interface HighClusterStats {
  oneGapClusters: number
  twoGapClusters: number
  sharedWindowExposure: number
  isolatedCopies: number
  oneGapHighInteriors: number
  oneGapLowInteriors: number
  twoGapInteriorHighCounts: readonly [number, number, number]
}
interface HighDensityStats {
  windowsByHighCount: readonly [number, number, number, number, number]
}
// -----------------------------------------------------------------------------
// DETERMINISTIC RANDOMNESS
// -----------------------------------------------------------------------------
function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
function shuffled<T>(source: readonly T[], random: () => number): T[] {
  const result = [...source]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const value = result[index]
    result[index] = result[swapIndex]
    result[swapIndex] = value
  }
  return result
}
// Build in two deliberate passes: HIGH-symbol structure first, LOW-symbol fill second.
// Each HIGH is placed independently against its configured cluster profile. This avoids
// asking a blind full-reel shuffle to discover the requested structure by accident.
function highDistributionMatches(positions: readonly number[], length: number, config: HighSymbolDistribution): boolean {
  const sorted = [...positions].sort((a, b) => a - b)
  let oneGapClusters = 0
  let twoGapClusters = 0
  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index]
    const next = sorted[(index + 1) % sorted.length]
    const gap = (next - current + length) % length
    if (gap === 1) return false
    if (gap === 2) oneGapClusters += 1
    if (gap === 3) twoGapClusters += 1
    if (gap < 4 && gap !== 2 && gap !== 3) return false
  }
  return oneGapClusters === config.oneGapClusters && twoGapClusters === config.twoGapClusters
}
function placeHighSymbol(
  count: number,
  length: number,
  occupied: Set<number>,
  random: () => number,
  config: HighSymbolDistribution,
): number[] | undefined {
  const available = Array.from({ length }, (_, index) => index).filter((index) => !occupied.has(index))
  const attempts = 400
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const positions = shuffled(available, random).slice(0, count)
    if (!highDistributionMatches(positions, length, config)) continue
    return positions
  }
  return undefined
}
function generateHighLowDistribution(reference: readonly SymbolId[], reelIndex: number, random: () => number): SymbolId[] | undefined {
  const counts = symbolCounts(reference)
  const strip = Array<SymbolId | undefined>(reference.length).fill(undefined)
  const occupied = new Set<number>()
  // Randomize which HIGH gets first choice of positions so mixed-HIGH
  // interleaving remains natural rather than inheriting a fixed placement bias.
  for (const symbol of shuffled(HIGH_SYMBOLS, random)) {
    const positions = placeHighSymbol(counts.get(symbol) ?? 0, reference.length, occupied, random, highSymbolDistribution(symbol, reelIndex))
    if (!positions) return undefined
    for (const position of positions) {
      strip[position] = symbol
      occupied.add(position)
    }
  }
  const lows = shuffled(reference.filter((symbol) => !HIGH_SYMBOLS.includes(symbol)), random)
  let lowIndex = 0
  for (let index = 0; index < strip.length; index += 1) {
    if (strip[index] === undefined) {
      strip[index] = lows[lowIndex]
      lowIndex += 1
    }
  }
  return strip as SymbolId[]
}
// -----------------------------------------------------------------------------
// REEL COMPOSITION + CIRCULAR WINDOW HELPERS
// -----------------------------------------------------------------------------
function symbolCounts(strip: readonly SymbolId[]): Map<SymbolId, number> {
  const counts = new Map<SymbolId, number>()
  for (const symbol of SYMBOL_IDS) counts.set(symbol, 0)
  for (const symbol of strip) counts.set(symbol, (counts.get(symbol) ?? 0) + 1)
  return counts
}
function circularAt(strip: readonly SymbolId[], index: number): SymbolId {
  return strip[((index % strip.length) + strip.length) % strip.length]
}
function countSymbolInWindow(strip: readonly SymbolId[], start: number, symbol: SymbolId): number {
  let count = 0
  for (let offset = 0; offset < 4; offset += 1) {
    if (circularAt(strip, start + offset) === symbol) count += 1
  }
  return count
}
function circularGaps(strip: readonly SymbolId[], symbol: SymbolId): number[] {
  const positions: number[] = []
  for (let index = 0; index < strip.length; index += 1) {
    if (strip[index] === symbol) positions.push(index)
  }
  if (positions.length < 2) return [strip.length]
  return positions.map((position, index) => {
    const next = positions[(index + 1) % positions.length]
    return (next - position + strip.length) % strip.length
  })
}
function isHigh(symbol: SymbolId): boolean {
  return HIGH_SYMBOLS.includes(symbol)
}
function highClusterStats(strip: readonly SymbolId[], symbol: SymbolId): HighClusterStats {
  const gaps = circularGaps(strip, symbol)
  let sharedWindowExposure = 0
  let oneGapHighInteriors = 0
  let oneGapLowInteriors = 0
  const twoGapInteriorHighCounts: [number, number, number] = [0, 0, 0]
  for (let start = 0; start < strip.length; start += 1) {
    if (countSymbolInWindow(strip, start, symbol) === 2) sharedWindowExposure += 1
  }
  for (let index = 0; index < strip.length; index += 1) {
    if (strip[index] !== symbol) continue
    if (circularAt(strip, index + 2) === symbol) {
      if (isHigh(circularAt(strip, index + 1))) oneGapHighInteriors += 1
      else oneGapLowInteriors += 1
    }
    if (circularAt(strip, index + 3) === symbol) {
      const internalHighs = Number(isHigh(circularAt(strip, index + 1))) + Number(isHigh(circularAt(strip, index + 2)))
      twoGapInteriorHighCounts[internalHighs] += 1
    }
  }
  // A copy is isolated when no matching copy is within three stops in either
  // circular direction. Different HIGH symbols do not affect isolated-occurrence status.
  let isolatedCopies = 0
  for (let index = 0; index < strip.length; index += 1) {
    if (strip[index] !== symbol) continue
    let isolated = true
    for (let distance = 1; distance <= 3; distance += 1) {
      if (circularAt(strip, index - distance) === symbol || circularAt(strip, index + distance) === symbol) {
        isolated = false
        break
      }
    }
    if (isolated) isolatedCopies += 1
  }
  return {
    oneGapClusters: gaps.filter((gap) => gap === 2).length,
    twoGapClusters: gaps.filter((gap) => gap === 3).length,
    sharedWindowExposure,
    isolatedCopies,
    oneGapHighInteriors,
    oneGapLowInteriors,
    twoGapInteriorHighCounts,
  }
}
function highDensityStats(strip: readonly SymbolId[]): HighDensityStats {
  const windowsByHighCount: [number, number, number, number, number] = [0, 0, 0, 0, 0]
  for (let start = 0; start < strip.length; start += 1) {
    let highs = 0
    for (let offset = 0; offset < 4; offset += 1) {
      if (isHigh(circularAt(strip, start + offset))) highs += 1
    }
    windowsByHighCount[highs] += 1
  }
  return { windowsByHighCount }
}
function hasExactHighDistribution(strip: readonly SymbolId[], reelIndex: number): boolean {
  for (const symbol of HIGH_SYMBOLS) {
    const stats = highClusterStats(strip, symbol)
    const dial = highSymbolDistribution(symbol, reelIndex)
    if (stats.oneGapClusters !== dial.oneGapClusters) return false
    if (stats.twoGapClusters !== dial.twoGapClusters) return false
  }
  return true
}
function hasValidWindowComposition(strip: readonly SymbolId[]): boolean {
  // Matching HIGHs can cluster, but never directly (AA) and never 3+ in the
  // same visible 4-stop viewport.
  for (const symbol of HIGH_SYMBOLS) {
    if (circularGaps(strip, symbol).some((gap) => gap === 1)) return false
    for (let start = 0; start < strip.length; start += 1) {
      if (countSymbolInWindow(strip, start, symbol) > 2) return false
    }
  }
  // Filler symbols use frequency-aware viewport caps.
  for (const [symbol, limit] of Object.entries(WINDOW_LIMITS) as [SymbolId, number][]) {
    for (let start = 0; start < strip.length; start += 1) {
      if (countSymbolInWindow(strip, start, symbol) > limit) return false
    }
  }
  return true
}
// -----------------------------------------------------------------------------
// SEQUENCE SCORING
// Lower scores are preferred. Hard validity is handled separately.
//
// Configured one-gap (2) and two-gap (3) HIGH clusters are protected structural
// features. The remaining circular gap edges share the remaining reel
// circumference. Their mathematically expected spacing is therefore derived from
// the reel itself rather than from symbol-specific magic thresholds.
//
// Remaining HIGH gaps are scored by normalized squared deviation from that
// expected spacing. Mild irregularity is cheap; severe compression and large dead
// zones become progressively expensive.
// -----------------------------------------------------------------------------
function highSpacingPenalty(strip: readonly SymbolId[]): number {
  let penalty = 0
  for (const symbol of HIGH_SYMBOLS) {
    const gaps = circularGaps(strip, symbol)
    const clusterGaps = gaps.filter((gap) => gap === 2 || gap === 3)
    const remainingGaps = gaps.filter((gap) => gap >= 4)
    if (remainingGaps.length === 0) continue
    const clusterCircumference = clusterGaps.reduce((sum, gap) => sum + gap, 0)
    const remainingCircumference = strip.length - clusterCircumference
    const expectedGap = remainingCircumference / remainingGaps.length
    for (const gap of remainingGaps) {
      const normalizedDeviation = (gap - expectedGap) / expectedGap
      penalty += normalizedDeviation * normalizedDeviation
    }
  }
  return penalty
}
function sequenceScore(strip: readonly SymbolId[]): number {
  let score = highSpacingPenalty(strip)
  // LOW / filler texture: doubles are natural. Triples are allowed by the hard
  // window rules, so only exact three-in-a-row runs receive a mild penalty.
  for (let index = 0; index < strip.length; index += 1) {
    const current = strip[index]
    const next = circularAt(strip, index + 1)
    const nextTwo = circularAt(strip, index + 2)
    if (!HIGH_SYMBOLS.includes(current) && current === next && current === nextTwo) score += 2
  }
  // Discourage obvious repeating sub-strip/cadence patterns.
  for (const offset of PERIODIC_OFFSETS) {
    let matches = 0
    for (let index = 0; index < strip.length; index += 1) {
      if (strip[index] === circularAt(strip, index + offset)) matches += 1
    }
    score += matches * 0.15
  }
  // HIGH symbol distribution is a hard constraint, not a score.
  // Scoring therefore stays focused on natural LOW-symbol texture and cadence.
  return score
}
// -----------------------------------------------------------------------------
// STRUCTURAL VALIDATION
// Candidate strips must preserve exact reference composition and satisfy every
// circular 4-stop composition rule above.
// -----------------------------------------------------------------------------
export function validateReelStrip(
  strip: readonly SymbolId[],
  reference: readonly SymbolId[],
  reelIndex?: number,
): ValidationResult {
  const errors: string[] = []
  if (strip.length !== reference.length) errors.push(`length ${strip.length}; expected ${reference.length}`)
  const expectedCounts = symbolCounts(reference)
  const actualCounts = symbolCounts(strip)
  for (const symbol of SYMBOL_IDS) {
    const expected = expectedCounts.get(symbol) ?? 0
    const actual = actualCounts.get(symbol) ?? 0
    if (actual !== expected) errors.push(`${symbol} count ${actual}; expected ${expected}`)
  }
  for (const symbol of HIGH_SYMBOLS) {
    const gaps = circularGaps(strip, symbol)
    if (gaps.some((gap) => gap === 1)) errors.push(`${symbol} contains prohibited AA adjacency`)
    for (let start = 0; start < strip.length; start += 1) {
      const count = countSymbolInWindow(strip, start, symbol)
      if (count > 2) {
        errors.push(`${symbol} appears ${count} times in 4-stop window starting at ${start}`)
        break
      }
    }
  }
  for (const [symbol, limit] of Object.entries(WINDOW_LIMITS) as [SymbolId, number][]) {
    for (let start = 0; start < strip.length; start += 1) {
      const count = countSymbolInWindow(strip, start, symbol)
      if (count > limit) {
        errors.push(`${symbol} appears ${count} times in 4-stop window starting at ${start}; maximum ${limit}`)
        break
      }
    }
  }
  // Generated candidates must match the configured HIGH symbol distribution exactly.
  if (reelIndex !== undefined && !hasExactHighDistribution(strip, reelIndex)) {
    for (const symbol of HIGH_SYMBOLS) {
      const stats = highClusterStats(strip, symbol)
      const dial = highSymbolDistribution(symbol, reelIndex)
      const twoGapClusters = dial.twoGapClusters
      if (stats.oneGapClusters !== dial.oneGapClusters || stats.twoGapClusters !== twoGapClusters) {
        errors.push(`${symbol} distribution one-gap ${stats.oneGapClusters}/${dial.oneGapClusters}; two-gap ${stats.twoGapClusters}/${twoGapClusters}`)
      }
    }
  }
  return { valid: errors.length === 0, errors }
}
// -----------------------------------------------------------------------------
// CANDIDATE GENERATION
// Each reel receives its own deterministic random stream. We generate valid
// complete compositions and keep the candidate that best matches the explicit
// per-HIGH clustering budget while preserving natural LOW texture. This keeps
// the model intentionally small: isolated occurrences + one-gap + two-gap clusters, then constrained LOW-symbol placement.
// -----------------------------------------------------------------------------
function highDistributionDistance(strip: readonly SymbolId[], reelIndex: number): number {
  let distance = 0
  for (const symbol of HIGH_SYMBOLS) {
    const stats = highClusterStats(strip, symbol)
    const dial = highSymbolDistribution(symbol, reelIndex)
    distance += Math.abs(stats.oneGapClusters - dial.oneGapClusters)
    distance += Math.abs(stats.twoGapClusters - dial.twoGapClusters)
  }
  return distance
}
function highDistributionSummary(strip: readonly SymbolId[], reelIndex: number): string {
  return HIGH_SYMBOLS.map((symbol) => {
    const stats = highClusterStats(strip, symbol)
    const dial = highSymbolDistribution(symbol, reelIndex)
    const twoGapClusters = dial.twoGapClusters
    const ok = stats.oneGapClusters === dial.oneGapClusters && stats.twoGapClusters === twoGapClusters
    return `${symbol} one-gap ${stats.oneGapClusters}/${dial.oneGapClusters} | two-gap ${stats.twoGapClusters}/${twoGapClusters}${ok ? ' ✓' : ' ✗'}`
  }).join(' || ')
}
function writeProgress(reelIndex: number, attempts: number, exactCandidates: number): void {
  const percent = Math.min(100, Math.floor((attempts / MAX_ATTEMPTS_PER_REEL) * 100))
  console.log(
    `Optimizing Reel ${reelIndex + 1}/5 [${String(percent).padStart(3)}%] ${attempts.toLocaleString()} / ${MAX_ATTEMPTS_PER_REEL.toLocaleString()} attempts | exact ${exactCandidates.toLocaleString()} / ${CANDIDATES_PER_REEL.toLocaleString()}`,
  )
}
function optimizeReel(reference: readonly SymbolId[], reelIndex: number): Candidate {
  const random = seededRandom((OPTIMIZER_SEED + Math.imul(reelIndex + 1, 0x9e3779b1)) >>> 0)
  let best: Candidate | undefined
  let bestNear: Candidate | undefined
  let bestNearDistance = Number.POSITIVE_INFINITY
  let exactCandidates = 0
  let attempts = 0
  let nextProgressStep = 1
  while (attempts < MAX_ATTEMPTS_PER_REEL && exactCandidates < CANDIDATES_PER_REEL) {
    attempts += 1
    const strip = generateHighLowDistribution(reference, reelIndex, random)
    if (strip && hasValidWindowComposition(strip)) {
      const distance = highDistributionDistance(strip, reelIndex)
      const score = sequenceScore(strip)
      if (distance < bestNearDistance || (distance === bestNearDistance && (!bestNear || score < bestNear.score))) {
        bestNearDistance = distance
        bestNear = { strip, score, highSpacingPenalty: highSpacingPenalty(strip) }
      }
      if (distance === 0) {
        exactCandidates += 1
        if (!best || score < best.score) best = { strip, score, highSpacingPenalty: highSpacingPenalty(strip) }
      }
    }
    const progressStep = Math.floor((attempts / MAX_ATTEMPTS_PER_REEL) * PROGRESS_STEPS)
    if (progressStep >= nextProgressStep || attempts === MAX_ATTEMPTS_PER_REEL) {
      writeProgress(reelIndex, attempts, exactCandidates)
      nextProgressStep = progressStep + 1
    }
  }
  writeProgress(reelIndex, attempts, exactCandidates)
  if (!best) {
    const nearest = bestNear ? highDistributionSummary(bestNear.strip, reelIndex) : 'No structurally valid candidate found.'
    throw new Error(
      `Reel ${reelIndex + 1} failed after ${attempts.toLocaleString()} attempts. ` +
      `Exact HIGH matches: 0. Best distribution: ${nearest}`,
    )
  }
  if (exactCandidates < CANDIDATES_PER_REEL) {
    console.log(
      `Reel ${reelIndex + 1}: attempt budget reached with ${exactCandidates.toLocaleString()} exact candidate(s); using the best exact HIGH match found.`,
    )
  }
  return best
}
export function generateOptimizedReelStrips(): SymbolId[][] {
  return REEL_GENERATION_INPUT.map((reference, reelIndex) => optimizeReel(reference, reelIndex).strip)
}
// -----------------------------------------------------------------------------
// REEL-SET UNIQUENESS VALIDATION
// Treat circular rotations and reversed circular rotations as equivalent so the
// five generated reels cannot secretly be the same sequence with a new origin.
// -----------------------------------------------------------------------------
function canonicalRotation(strip: readonly SymbolId[]): string {
  const doubled = [...strip, ...strip]
  let best = doubled.slice(0, strip.length).join('|')
  for (let start = 1; start < strip.length; start += 1) {
    const candidate = doubled.slice(start, start + strip.length).join('|')
    if (candidate < best) best = candidate
  }
  return best
}
function canonicalCircularSequence(strip: readonly SymbolId[]): string {
  const forward = canonicalRotation(strip)
  const reversed = canonicalRotation([...strip].reverse())
  return forward < reversed ? forward : reversed
}
function validateReelSet(strips: readonly (readonly SymbolId[])[]): ValidationResult {
  const errors: string[] = []
  const seen = new Map<string, number>()
  strips.forEach((strip, reelIndex) => {
    const key = canonicalCircularSequence(strip)
    const previous = seen.get(key)
    if (previous !== undefined) {
      errors.push(`Reel ${reelIndex + 1} duplicates Reel ${previous + 1} by equality, rotation, or reversal`)
    } else {
      seen.set(key, reelIndex)
    }
  })
  return { valid: errors.length === 0, errors }
}
// -----------------------------------------------------------------------------
// CANDIDATE FINGERPRINT
// Stable development identifier, not a cryptographic integrity check.
// -----------------------------------------------------------------------------
function reelCandidateId(strips: readonly (readonly SymbolId[])[]): string {
  let hash = 0x811c9dc5
  const input = strips.map((strip) => strip.join('|')).join('||')
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return `QOF-${hash.toString(16).toUpperCase().padStart(8, '0')}`
}
// -----------------------------------------------------------------------------
// COPY/PASTE OUTPUT — NEVER WRITES TO SpinResult.ts
// -----------------------------------------------------------------------------
function formatStrip(strip: readonly SymbolId[]): string {
  const lines: string[] = ['  [']
  for (let index = 0; index < strip.length; index += 8) {
    const chunk = strip.slice(index, index + 8).map((symbol) => `'${symbol}'`).join(', ')
    lines.push(`    ${chunk},`)
  }
  lines.push('  ],')
  return lines.join('\n')
}
function run(): void {
  const candidates = REEL_GENERATION_INPUT.map((reference, reelIndex) => optimizeReel(reference, reelIndex))
  const strips = candidates.map((candidate) => candidate.strip)
  const candidateId = reelCandidateId(strips)
  console.log('QUEST OF FORTUNE — REEL SEQUENCE OPTIMIZER')
  console.log('==========================================')
  console.log(`Candidate ID: ${candidateId}`)
  console.log(`Seed: 0x${OPTIMIZER_SEED.toString(16).toUpperCase()}`)
  console.log('HIGH Symbol Distribution: one-gap and two-gap clusters configured per HIGH / per reel; remaining copies are isolated')
  console.log(`Exact Candidates / Reel: up to ${CANDIDATES_PER_REEL.toLocaleString()}`)
  console.log(`Attempt Budget / Reel: ${MAX_ATTEMPTS_PER_REEL.toLocaleString()}`)
  console.log('')
  strips.forEach((strip, reelIndex) => {
    const validation = validateReelStrip(strip, REEL_GENERATION_INPUT[reelIndex], reelIndex)
    console.log(`Reel ${reelIndex + 1}: ${validation.valid ? 'VALID' : 'INVALID'} | HIGH spacing penalty ${candidates[reelIndex].highSpacingPenalty.toFixed(4)}`)
    for (const symbol of HIGH_SYMBOLS) {
      const stats = highClusterStats(strip, symbol)
      const [twoGap0, twoGap1, twoGap2] = stats.twoGapInteriorHighCounts
      const dial = highSymbolDistribution(symbol, reelIndex)
      const twoGapClusters = dial.twoGapClusters
      console.log(`  ${symbol}`)
      console.log(
        `    Clusters ${dial.oneGapClusters + dial.twoGapClusters} | Isolated ${String(stats.isolatedCopies).padStart(2)} | One-gap ${String(stats.oneGapClusters).padStart(2)} / ${dial.oneGapClusters} | Two-gap ${String(stats.twoGapClusters).padStart(2)} / ${twoGapClusters} | Shared-window exposure ${stats.sharedWindowExposure}`,
      )
      console.log(
        `    Interiors: one-gap low ${stats.oneGapLowInteriors} / high ${stats.oneGapHighInteriors} | two-gap 0H ${twoGap0} / 1H ${twoGap1} / 2H ${twoGap2}`,
      )
    }
    const density = highDensityStats(strip).windowsByHighCount
    console.log(`  HIGH density (4-stop windows): 0H ${density[0]} | 1H ${density[1]} | 2H ${density[2]} | 3H ${density[3]} | 4H ${density[4]}`)
    if (!validation.valid) console.log(`  ${validation.errors.join('; ')}`)
  })
  if (strips.some((strip, reelIndex) => !validateReelStrip(strip, REEL_GENERATION_INPUT[reelIndex], reelIndex).valid)) {
    throw new Error('Generated strips failed structural validation.')
  }
  const setValidation = validateReelSet(strips)
  console.log(`Reel Set: ${setValidation.valid ? 'UNIQUE' : 'INVALID'}`)
  if (!setValidation.valid) {
    console.log(`  ${setValidation.errors.join('; ')}`)
    throw new Error('Generated reel set failed uniqueness validation.')
  }
  console.log('\nCOPY / PASTE INTO SpinResult.ts')
  console.log('--------------------------------')
  console.log(`// REEL CANDIDATE: ${candidateId}`)
  console.log('export const REEL_STRIPS: readonly (readonly SymbolId[])[] = [')
  strips.forEach((strip, reelIndex) => {
    console.log(`  // Reel ${reelIndex + 1} — 200 stops`)
    console.log(formatStrip(strip))
  })
  console.log('] as const')
}
run()
