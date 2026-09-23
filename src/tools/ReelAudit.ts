import type { SymbolId } from '../game/math/SpinResult'
import { REEL_STRIPS_TO_AUDIT } from './ReelAuditInput'
import { HISTORICAL_REEL_STRIPS } from './ReelAuditReference'
import { CHALLENGER_GENERATION_INPUT, CHALLENGER_HIGH_DISTRIBUTION, CHALLENGER_REEL_LENGTH, isLeftWeightedHighCounts } from './ReelTargetProfile'
const HIGH_SYMBOLS = ['ARCHER', 'KNIGHT', 'MAGE', 'DRAGON'] as const
const ALL_SYMBOLS = ['SCROLL', 'COIN', 'RING', 'CHEST', 'CROWN', 'GEM', ...HIGH_SYMBOLS] as const
const REFERENCE_EXPECTED_COUNTS: Readonly<Record<SymbolId, number>> = {
  SCROLL: 47, COIN: 39, RING: 33, CHEST: 22, CROWN: 14,
  GEM: 13, ARCHER: 11, KNIGHT: 9, MAGE: 7, DRAGON: 5,
}
type HighSymbol = (typeof HIGH_SYMBOLS)[number]
interface HighDistributionStats {
  copies: number
  isolatedOccurrences: number
  oneGapClusters: number
  twoGapClusters: number
  adjacency: number
  gaps: number[]
  minIsolatedGap: number | null
  maxIsolatedGap: number | null
  averageIsolatedGap: number | null
}
function circularGap(from: number, to: number, length: number): number {
  return (to - from + length) % length
}
function auditHigh(strip: readonly SymbolId[], symbol: HighSymbol): HighDistributionStats {
  const positions: number[] = []
  for (let index = 0; index < strip.length; index += 1) {
    if (strip[index] === symbol) positions.push(index)
  }
  const involved = new Set<number>()
  const gaps: number[] = []
  let oneGapClusters = 0
  let twoGapClusters = 0
  let adjacency = 0
  for (let index = 0; index < positions.length; index += 1) {
    const next = (index + 1) % positions.length
    const gap = circularGap(positions[index], positions[next], strip.length)
    gaps.push(gap)
    if (gap === 1) {
      adjacency += 1
      involved.add(index); involved.add(next)
    } else if (gap === 2) {
      oneGapClusters += 1
      involved.add(index); involved.add(next)
    } else if (gap === 3) {
      twoGapClusters += 1
      involved.add(index); involved.add(next)
    }
  }
  const isolatedGaps = gaps.filter((gap) => gap >= 4)
  return {
    copies: positions.length,
    isolatedOccurrences: positions.length - involved.size,
    oneGapClusters,
    twoGapClusters,
    adjacency,
    gaps,
    minIsolatedGap: isolatedGaps.length ? Math.min(...isolatedGaps) : null,
    maxIsolatedGap: isolatedGaps.length ? Math.max(...isolatedGaps) : null,
    averageIsolatedGap: isolatedGaps.length ? isolatedGaps.reduce((sum, gap) => sum + gap, 0) / isolatedGaps.length : null,
  }
}
function pad(value: string, width: number): string { return value.padEnd(width, ' ') }
function formatDistribution(stats: HighDistributionStats): string {
  const adjacency = stats.adjacency > 0 ? `  ADJ:${stats.adjacency}` : ''
  return `I:${stats.isolatedOccurrences}  1G:${stats.oneGapClusters}  2G:${stats.twoGapClusters}${adjacency}`
}
function formatGapBalance(stats: HighDistributionStats): string {
  if (stats.minIsolatedGap === null || stats.maxIsolatedGap === null || stats.averageIsolatedGap === null) return 'n/a'
  return `${stats.minIsolatedGap}-${stats.maxIsolatedGap} avg ${stats.averageIsolatedGap.toFixed(1)}`
}
function hasChainedCloseGaps(gaps: readonly number[]): boolean {
  if (gaps.length < 2) return false
  const isClose = (gap: number) => gap === 2 || gap === 3
  return gaps.some((gap, index) => isClose(gap) && isClose(gaps[(index + 1) % gaps.length]))
}
function closeClusterSpacing(strip: readonly SymbolId[], symbol: HighSymbol): number[] {
  const positions: number[] = []
  for (let index = 0; index < strip.length; index += 1) {
    if (strip[index] === symbol) positions.push(index)
  }
  const centers: number[] = []
  for (let index = 0; index < positions.length; index += 1) {
    const current = positions[index]
    const next = positions[(index + 1) % positions.length]
    const gap = circularGap(current, next, strip.length)
    if (gap === 2 || gap === 3) centers.push((current + gap / 2) % strip.length)
  }
  if (centers.length <= 1) return []
  centers.sort((a, b) => a - b)
  return centers.map((center, index) => {
    const next = index === centers.length - 1 ? centers[0] + strip.length : centers[index + 1]
    return next - center
  })
}
function formatClusterSpacing(spacing: readonly number[]): string {
  return spacing.length ? spacing.map((value) => Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)).join(' / ') : 'n/a'
}
function validateSet(
  label: string,
  reels: readonly (readonly SymbolId[])[],
  expectedCounts: Readonly<Record<SymbolId, number>> | readonly Readonly<Record<SymbolId, number>>[],
  expectedLength: number,
): string[] {
  const problems: string[] = []
  if (reels.length !== 5) problems.push(`${label}: expected 5 reels, found ${reels.length}`)
  reels.forEach((strip, reelIndex) => {
    if (strip.length !== expectedLength) problems.push(`${label} R${reelIndex + 1}: expected ${expectedLength} stops, found ${strip.length}`)
    for (const symbol of ALL_SYMBOLS) {
      const actual = strip.filter((item) => item === symbol).length
      const expectedByReel = Array.isArray(expectedCounts) ? expectedCounts[reelIndex] : expectedCounts
      const expected = expectedByReel[symbol]
      if (actual !== expected) problems.push(`${label} R${reelIndex + 1} ${symbol}: expected ${expected}, found ${actual}`)
    }
  })
  return problems
}
function validateCandidateTopology(reels: readonly (readonly SymbolId[])[]): string[] {
  const problems: string[] = []
  reels.forEach((strip, reelIndex) => {
    for (const symbol of HIGH_SYMBOLS) {
      const stats = auditHigh(strip, symbol)
      const expected = CHALLENGER_HIGH_DISTRIBUTION[symbol][reelIndex]
      if (stats.adjacency > 0) problems.push(`CANDIDATE R${reelIndex + 1} ${symbol}: adjacency ${stats.adjacency} is not allowed`)
      if (hasChainedCloseGaps(stats.gaps)) problems.push(`CANDIDATE R${reelIndex + 1} ${symbol}: chained close gaps are not allowed`)
      if (stats.oneGapClusters !== expected.oneGapClusters || stats.twoGapClusters !== expected.twoGapClusters) {
        problems.push(
          `CANDIDATE R${reelIndex + 1} ${symbol}: expected 1G/2G ${expected.oneGapClusters}/${expected.twoGapClusters}, found ${stats.oneGapClusters}/${stats.twoGapClusters}`,
        )
      }
    }
  })
  return problems
}
function countSymbol(strip: readonly SymbolId[], symbol: SymbolId): number {
  return strip.reduce((count, item) => count + (item === symbol ? 1 : 0), 0)
}
function validateCandidateHighDirection(reels: readonly (readonly SymbolId[])[]): string[] {
  const problems: string[] = []
  for (const symbol of HIGH_SYMBOLS) {
    const counts = reels.map((strip) => countSymbol(strip, symbol))
    if (!isLeftWeightedHighCounts(counts)) {
      problems.push(`CANDIDATE ${symbol}: HIGH counts must be left-weighted R1 >= R2 >= R3 >= R4 >= R5; found ${counts.join(' > ')}`)
    }
  }
  return problems
}
function formatObservedCountTable(
  label: string,
  reels: readonly (readonly SymbolId[])[],
): string[] {
  const symbolWidth = 10
  const reelWidth = 5
  const totalWidth = 7
  const lines: string[] = []
  lines.push(label)
  lines.push(
    'SYMBOL'.padEnd(symbolWidth)
      + ['R1', 'R2', 'R3', 'R4', 'R5'].map((value) => value.padStart(reelWidth)).join('')
      + 'TOTAL'.padStart(totalWidth),
  )
  lines.push('-'.repeat(symbolWidth + reelWidth * 5 + totalWidth))
  for (const symbol of ALL_SYMBOLS) {
    const counts = reels.map((strip) => countSymbol(strip, symbol))
    const total = counts.reduce((sum, count) => sum + count, 0)
    lines.push(
      symbol.padEnd(symbolWidth)
        + counts.map((count) => count.toString().padStart(reelWidth)).join('')
        + total.toString().padStart(totalWidth),
    )
  }
  lines.push('-'.repeat(symbolWidth + reelWidth * 5 + totalWidth))
  const reelTotals = reels.map((strip) => strip.length)
  lines.push(
    'TOTAL'.padEnd(symbolWidth)
      + reelTotals.map((count) => count.toString().padStart(reelWidth)).join('')
      + reelTotals.reduce((sum, count) => sum + count, 0).toString().padStart(totalWidth),
  )
  return lines
}
function printObservedCountComparison(): void {
  const reference = formatObservedCountTable('REFERENCE', HISTORICAL_REEL_STRIPS)
  const candidate = formatObservedCountTable('CANDIDATE', REEL_STRIPS_TO_AUDIT)
  const gutter = '      '
  const leftWidth = Math.max(...reference.map((line) => line.length))
  const rowCount = Math.max(reference.length, candidate.length)
  console.log('SYMBOL COUNTS — REFERENCE vs CANDIDATE')
  console.log('='.repeat(leftWidth * 2 + gutter.length))
  for (let index = 0; index < rowCount; index += 1) {
    const left = reference[index] ?? ''
    const right = candidate[index] ?? ''
    console.log(left.padEnd(leftWidth) + gutter + right)
  }
}
function totals(reels: readonly (readonly SymbolId[])[], symbol: HighSymbol) {
  const stats = reels.map((strip) => auditHigh(strip, symbol))
  return {
    oneGap: stats.reduce((sum, item) => sum + item.oneGapClusters, 0),
    twoGap: stats.reduce((sum, item) => sum + item.twoGapClusters, 0),
    adjacency: stats.reduce((sum, item) => sum + item.adjacency, 0),
  }
}
const referenceProblems = validateSet('REFERENCE', HISTORICAL_REEL_STRIPS, REFERENCE_EXPECTED_COUNTS, 200)
const candidateProblems = [
  ...validateSet('CANDIDATE', REEL_STRIPS_TO_AUDIT, CHALLENGER_GENERATION_INPUT, CHALLENGER_REEL_LENGTH),
  ...validateCandidateTopology(REEL_STRIPS_TO_AUDIT),
  ...validateCandidateHighDirection(REEL_STRIPS_TO_AUDIT),
]
console.log('QUEST OF FORTUNE — REEL DISTRIBUTION COMPARISON')
console.log('===============================================')
console.log('REFERENCE = approved reel benchmark (ReelAuditReference.ts)')
console.log('CANDIDATE = reel set under evaluation (ReelAuditInput.ts)')
console.log('I = isolated | 1G = one-gap cluster | 2G = two-gap cluster | A = adjacency')
console.log('')
console.log('INPUT VALIDATION')
console.log('----------------')
console.log(`REFERENCE: ${referenceProblems.length === 0 ? 'VALID' : 'INVALID'}`)
console.log(`CANDIDATE: ${candidateProblems.length === 0 ? 'VALID' : 'INVALID'}`)
for (const problem of [...referenceProblems, ...candidateProblems]) console.log(`  ! ${problem}`)
if (referenceProblems.length || candidateProblems.length) {
  console.log('\nComparison stopped because an input is invalid.')
} else {
  console.log('')
  printObservedCountComparison()
  console.log('\nHIGH SYMBOL DISTRIBUTION — TOTALS')
  console.log('---------------------------------')
  console.log(`${pad('SYMBOL', 10)}${pad('REFERENCE 1G/2G', 20)}${pad('CANDIDATE 1G/2G', 20)}ADJ REF/CAND`)
  console.log('-'.repeat(68))
  for (const symbol of HIGH_SYMBOLS) {
    const ref = totals(HISTORICAL_REEL_STRIPS, symbol)
    const cand = totals(REEL_STRIPS_TO_AUDIT, symbol)
    console.log(`${pad(symbol, 10)}${pad(`${ref.oneGap} / ${ref.twoGap}`, 20)}${pad(`${cand.oneGap} / ${cand.twoGap}`, 20)}${ref.adjacency} / ${cand.adjacency}`)
  }
  console.log('\nHIGH SYMBOL DISTRIBUTION — REEL BY REEL')
  console.log('----------------------------------------')
  for (const symbol of HIGH_SYMBOLS) {
    console.log(symbol)
    console.log(`${pad('REEL', 7)}${pad('REFERENCE', 20)}CANDIDATE`)
    for (let reelIndex = 0; reelIndex < 5; reelIndex += 1) {
      const ref = auditHigh(HISTORICAL_REEL_STRIPS[reelIndex], symbol)
      const cand = auditHigh(REEL_STRIPS_TO_AUDIT[reelIndex], symbol)
      console.log(`${pad(`R${reelIndex + 1}`, 7)}${pad(formatDistribution(ref), 20)}${formatDistribution(cand)}`)
    }
    console.log('')
  }
  console.log('CHAINED CLOSE GAPS — CIRCULAR')
  console.log('-----------------------------')
  console.log('PASS = no consecutive close gaps (2/3), including last → first.')
  for (const symbol of HIGH_SYMBOLS) {
    const ref = HISTORICAL_REEL_STRIPS.map((strip) => hasChainedCloseGaps(auditHigh(strip, symbol).gaps) ? 'FAIL' : 'PASS')
    const cand = REEL_STRIPS_TO_AUDIT.map((strip) => hasChainedCloseGaps(auditHigh(strip, symbol).gaps) ? 'FAIL' : 'PASS')
    console.log(`${pad(symbol, 10)}REF ${ref.join(' ')} | CAND ${cand.join(' ')}`)
  }
  console.log('')
  console.log('CLOSE-CLUSTER CIRCULAR SPACING')
  console.log('------------------------------')
  console.log(`Distances are between 1G/2G cluster centers; reference = 200 stops, candidate = ${CHALLENGER_REEL_LENGTH} stops; n/a = 0 or 1 cluster.`)
  for (const symbol of HIGH_SYMBOLS) {
    console.log(symbol)
    console.log(`${pad('REEL', 7)}${pad('REFERENCE', 24)}CANDIDATE`)
    for (let reelIndex = 0; reelIndex < 5; reelIndex += 1) {
      const ref = formatClusterSpacing(closeClusterSpacing(HISTORICAL_REEL_STRIPS[reelIndex], symbol))
      const cand = formatClusterSpacing(closeClusterSpacing(REEL_STRIPS_TO_AUDIT[reelIndex], symbol))
      console.log(`${pad(`R${reelIndex + 1}`, 7)}${pad(ref, 24)}${cand}`)
    }
    console.log('')
  }
  console.log('ISOLATED GAP BALANCE — MIN/MAX/AVERAGE')
  console.log('--------------------------------------')
  console.log('Only gaps >= 4 are summarized here; 1G/2G clustering is reported above.')
  for (const symbol of HIGH_SYMBOLS) {
    console.log(symbol)
    console.log(`${pad('REEL', 7)}${pad('REFERENCE', 22)}CANDIDATE`)
    for (let reelIndex = 0; reelIndex < 5; reelIndex += 1) {
      const ref = auditHigh(HISTORICAL_REEL_STRIPS[reelIndex], symbol)
      const cand = auditHigh(REEL_STRIPS_TO_AUDIT[reelIndex], symbol)
      console.log(`${pad(`R${reelIndex + 1}`, 7)}${pad(formatGapBalance(ref), 22)}${formatGapBalance(cand)}`)
    }
    console.log('')
  }
  console.log('CIRCULAR SAME-HIGH GAPS — FULL DETAIL')
  console.log('-------------------------------------')
  for (let reelIndex = 0; reelIndex < 5; reelIndex += 1) {
    console.log(`Reel ${reelIndex + 1}`)
    for (const symbol of HIGH_SYMBOLS) {
      const ref = auditHigh(HISTORICAL_REEL_STRIPS[reelIndex], symbol)
      const cand = auditHigh(REEL_STRIPS_TO_AUDIT[reelIndex], symbol)
      const columnWidth = Math.max(5, Math.max(...ref.gaps, ...cand.gaps).toString().length + 3)
      const gapHeaders = ref.gaps.map((_, index) => `G${index + 1}`.padStart(columnWidth, ' ')).join('')
      const refGaps = ref.gaps.map((gap) => gap.toString().padStart(columnWidth, ' ')).join('')
      const candGaps = cand.gaps.map((gap) => gap.toString().padStart(columnWidth, ' ')).join('')
      console.log(`  ${symbol}`)
      console.log(`        ${gapHeaders}`)
      console.log(`  REF   ${refGaps}`)
      console.log(`  CAND  ${candGaps}`)
    }
    console.log('')
  }
  console.log('\nComparison complete. No production files were modified.')
}
