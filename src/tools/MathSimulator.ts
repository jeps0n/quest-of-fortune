import { createSpinResult, REEL_STRIPS, type SpinResult, type SymbolId } from '../game/math/SpinResult'
import { REEL_STRIPS_TO_AUDIT } from './ReelAuditInput'
import { evaluateWins, type JackpotTier } from '../game/math/WinEvaluator'
import { PAYLINES as PAYLINES_FOR_EXACT } from '../game/math/Paylines'
import { PAYTABLE as PAYTABLE_FOR_EXACT } from '../game/math/Paytable'
// Offline verification tool: Monte Carlo and exact calculations measure the
// configured reel math. This module is not imported by the runtime spin path.
const DEFAULT_SPINS = 5_000_000
const QUICK_SPINS = 100_000
const BET_PER_SPIN = 1
const SEED = 0x30001075
const MAJOR_PROGRESSIVE_CONTRIBUTION_PER_SPIN = 0.01
const GRAND_PROGRESSIVE_CONTRIBUTION_PER_SPIN = 0.01
const TOTAL_PROGRESSIVE_CONTRIBUTION_PER_SPIN =
  MAJOR_PROGRESSIVE_CONTRIBUTION_PER_SPIN + GRAND_PROGRESSIVE_CONTRIBUTION_PER_SPIN
const TARGET_BASE_RTP = 93.6
const TARGET_PROGRESSIVE_RTP = 2
const TARGET_FUNDED_RTP = 95.6
const TARGET_HIT_RATE_MIN = 27
const TARGET_HIT_RATE_MAX = 30
const TARGET_JACKPOT_FREQUENCY: Record<JackpotTier, number> = {
  mini: 400,
  minor: 1_000,
  major: 2_000,
  grand: 10_000,
}
type ReelSource = 'production' | 'input'
interface SimulationStats {
  spins: number
  totalWagered: number
  totalReturned: number
  paylineReturned: number
  jackpotReturned: number
  winningSpins: number
  jackpotHits: Record<JackpotTier, number>
  progressiveContribution: number
}
// A deterministic PRNG makes simulation runs reproducible while tuning or
// comparing reel-strip revisions.
function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
function commandLineArgs(): string[] {
  return (globalThis as { process?: { argv: string[] } }).process?.argv.slice(2) ?? []
}
function requestedSpinCount(args: readonly string[]): number {
  if (args.includes('--quick')) return QUICK_SPINS
  const spinsArg = args.find((arg) => arg.startsWith('--spins='))
  if (!spinsArg) return DEFAULT_SPINS
  const spins = Number(spinsArg.slice('--spins='.length))
  if (!Number.isSafeInteger(spins) || spins <= 0) throw new Error(`Invalid --spins value: ${spinsArg}`)
  return spins
}
function requestedReelSource(args: readonly string[]): ReelSource {
  return args.includes('--input') ? 'input' : 'production'
}
function createSpinResultFromStrips(
  strips: readonly (readonly SymbolId[])[],
  reelCount: number,
  rows: number,
  random: () => number,
): SpinResult {
  if (strips.length === 0) throw new Error('Input reel set is empty.')
  const stops: number[] = []
  const reels = Array.from({ length: reelCount }, (_, reelIndex) => {
    const strip = strips[reelIndex % strips.length]
    if (strip.length === 0) throw new Error(`Input reel ${reelIndex + 1} is empty.`)
    const stop = Math.floor(random() * strip.length)
    stops.push(stop)
    return Array.from({ length: rows }, (_, row) => strip[(stop + row) % strip.length])
  })
  return { reels, stops }
}
interface ExactMathStats {
  paylineRtp: number
  jackpotRtp: number
  baseRtp: number
  jackpotFrequency: Record<JackpotTier, number>
}
const JACKPOT_SYMBOLS: Readonly<Record<JackpotTier, SymbolId>> = {
  mini: 'ARCHER', minor: 'KNIGHT', major: 'MAGE', grand: 'DRAGON',
}
const JACKPOT_PAYOUTS: Readonly<Record<JackpotTier, number>> = {
  mini: 20, minor: 50, major: 100, grand: 500,
}
// Enumerate every stop on a circular strip to derive the exact distribution of
// visible copies for a symbol, avoiding sampling noise in jackpot calculations.
function exactWindowCountDistribution(strip: readonly SymbolId[], symbol: SymbolId): number[] {
  const counts = [0, 0, 0, 0, 0]
  for (let stop = 0; stop < strip.length; stop += 1) {
    let copies = 0
    for (let row = 0; row < 4; row += 1) if (strip[(stop + row) % strip.length] === symbol) copies += 1
    counts[copies] += 1
  }
  return counts.map((count) => count / strip.length)
}
function exactJackpotProbability(strips: readonly (readonly SymbolId[])[], symbol: SymbolId): number {
  let totalDistribution = [1]
  for (const strip of strips) {
    const reelDistribution = exactWindowCountDistribution(strip, symbol)
    const next = Array(totalDistribution.length + 4).fill(0) as number[]
    totalDistribution.forEach((leftProbability, leftCount) => {
      reelDistribution.forEach((rightProbability, rightCount) => {
        next[leftCount + rightCount] += leftProbability * rightProbability
      })
    })
    totalDistribution = next
  }
  return totalDistribution.slice(5).reduce((sum, probability) => sum + probability, 0)
}
// Payline RTP is computed analytically from reel symbol frequencies; the Monte
// Carlo pass below is retained as an independent behavioral cross-check.
function exactPaylineRtp(strips: readonly (readonly SymbolId[])[]): number {
  let expectedReturn = 0
for (let lineIndex = 0; lineIndex < awaitPaylines().length; lineIndex += 1) {
    for (const symbol of Object.keys(awaitPaytable()) as SymbolId[]) {
      const probabilities = strips.map((strip) => strip.reduce((count, item) => count + (item === symbol ? 1 : 0), 0) / strip.length)
      for (const [countText, payout] of Object.entries(awaitPaytable()[symbol])) {
        const count = Number(countText)
        let probability = 1
        for (let reel = 0; reel < count; reel += 1) probability *= probabilities[reel]
        if (count < strips.length) probability *= 1 - probabilities[count]
        expectedReturn += probability * payout
      }
    }
  }
  return expectedReturn * 100
}
// Local wrappers keep the exact-math implementation tied to the same runtime
// definitions used by evaluateWins without creating a second math contract.
function awaitPaylines() { return PAYLINES_FOR_EXACT }
function awaitPaytable() { return PAYTABLE_FOR_EXACT }
function exactMath(strips: readonly (readonly SymbolId[])[]): ExactMathStats {
  const paylineRtp = exactPaylineRtp(strips)
  const jackpotFrequency = {} as Record<JackpotTier, number>
  let jackpotRtp = 0
  for (const tier of ['mini', 'minor', 'major', 'grand'] as const) {
    const probability = exactJackpotProbability(strips, JACKPOT_SYMBOLS[tier])
    jackpotFrequency[tier] = 1 / probability
    jackpotRtp += probability * JACKPOT_PAYOUTS[tier] * 100
  }
  return { paylineRtp, jackpotRtp, baseRtp: paylineRtp + jackpotRtp, jackpotFrequency }
}
// Run the same result/evaluation math used by the game over a deterministic
// sample and separate payline return from jackpot return for easier diagnosis.
function simulate(spins: number, reelSource: ReelSource): SimulationStats {
  const random = seededRandom(SEED)
  const stats: SimulationStats = {
    spins,
    totalWagered: spins * BET_PER_SPIN,
    totalReturned: 0,
    paylineReturned: 0,
    jackpotReturned: 0,
    winningSpins: 0,
    jackpotHits: { mini: 0, minor: 0, major: 0, grand: 0 },
    progressiveContribution: spins * TOTAL_PROGRESSIVE_CONTRIBUTION_PER_SPIN,
  }
  console.log(`Reel source: ${reelSource === 'input' ? 'INPUT — ReelAuditInput.ts' : 'PRODUCTION — SpinResult.ts'}`)
  console.log('Simulation running...')
  const progressInterval = Math.max(1, Math.floor(spins / 10))
  for (let spin = 0; spin < spins; spin += 1) {
    const result =
      reelSource === 'input'
        ? createSpinResultFromStrips(REEL_STRIPS_TO_AUDIT, 5, 4, random)
        : createSpinResult(5, 4, random)
    const evaluation = evaluateWins(result, BET_PER_SPIN)
    if (evaluation.totalPayout > 0) stats.winningSpins += 1
    stats.totalReturned += evaluation.totalPayout
    for (const win of evaluation.wins) {
      if (win.jackpot) {
        stats.jackpotReturned += win.payout
        stats.jackpotHits[win.jackpot] += 1
      } else {
        stats.paylineReturned += win.payout
      }
    }
    const completed = spin + 1
    if (completed % progressInterval === 0 || completed === spins) {
      const progress = Math.min(100, Math.round((completed / spins) * 100))
      console.log(`[${String(progress).padStart(3, ' ')}%] ${completed.toLocaleString()} / ${spins.toLocaleString()}`)
    }
  }
  console.log('Simulation complete.')
  return stats
}
function percent(numerator: number, denominator: number): string {
  return `${((numerator / denominator) * 100).toFixed(4)}%`
}
function money(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function percentageValue(numerator: number, denominator: number): number {
  return (numerator / denominator) * 100
}
function percentagePointDelta(actual: number, target: number): string {
  const delta = actual - target
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(4)} pp`
}
function jackpotFrequencyDelta(hits: number, spins: number, targetFrequency: number): string {
  if (hits === 0) return 'n/a'
  const actualFrequency = spins / hits
  const delta = ((targetFrequency / actualFrequency) - 1) * 100
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}%`
}
function printReport(stats: SimulationStats, runtimeSeconds: number, reelSource: ReelSource): void {
  const baseRtp = percentageValue(stats.totalReturned, stats.totalWagered)
  const progressiveRtp = percentageValue(stats.progressiveContribution, stats.totalWagered)
  const fundedRtp = percentageValue(
    stats.totalReturned + stats.progressiveContribution,
    stats.totalWagered,
  )
  const hitRate = percentageValue(stats.winningSpins, stats.spins)
  const hitRateStatus =
    hitRate >= TARGET_HIT_RATE_MIN && hitRate <= TARGET_HIT_RATE_MAX ? 'IN RANGE' : 'OUT OF RANGE'
  const jackpotLabels: Record<JackpotTier, string> = {
    mini: 'MINI ($20)',
    minor: 'MINOR ($50)',
    major: 'MAJOR ($100+)',
    grand: 'GRAND ($500+)',
  }
  const exact = exactMath(reelSource === 'input' ? REEL_STRIPS_TO_AUDIT : REEL_STRIPS)
  console.log('\nEXACT LONG-RUN MATH — REEL DERIVED')
  console.log('==================================')
  console.log(`Payline RTP: ${exact.paylineRtp.toFixed(4)}%`)
  console.log(`Jackpot RTP: ${exact.jackpotRtp.toFixed(4)}%`)
  console.log(`Base RTP:    ${exact.baseRtp.toFixed(4)}%  (${percentagePointDelta(exact.baseRtp, TARGET_BASE_RTP)})`)
  for (const tier of ['mini', 'minor', 'major', 'grand'] as const) {
    console.log(`${tier.toUpperCase().padEnd(6)} 1 / ${exact.jackpotFrequency[tier].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
  }
  console.log('\nQUEST OF FORTUNE — MATH VALIDATION')
  console.log('==================================')
  console.log(`Seed: 0x${SEED.toString(16).toUpperCase()}`)
  console.log(`Reel Source: ${reelSource === 'input' ? 'INPUT — ReelAuditInput.ts' : 'PRODUCTION — SpinResult.ts'}`)
  console.log('')
  console.log('BASE / RESET RTP')
  console.log('============================================================================')
  console.log('METRIC / JACKPOT          SIM              TARGET          DELTA / STATUS')
  console.log('----------------------------------------------------------------------------')
  console.log('')
  console.log(`${'  Payline RTP'.padEnd(27)}${percent(stats.paylineReturned, stats.totalWagered).padStart(10)}`)
  console.log(`${'+ Jackpot RTP'.padEnd(27)}${percent(stats.jackpotReturned, stats.totalWagered).padStart(10)}`)
  console.log(`${''.padEnd(27)}${'--------'.padStart(10)}`)
  console.log(
    `${'= Reset/Base RTP'.padEnd(27)}${`${baseRtp.toFixed(4)}%`.padStart(10)}${`${TARGET_BASE_RTP.toFixed(4)}%`.padStart(20)}${percentagePointDelta(baseRtp, TARGET_BASE_RTP).padStart(20)}`,
  )
  console.log('')
  console.log(
    `${'+ Progressive'.padEnd(27)}${`${progressiveRtp.toFixed(4)}%`.padStart(10)}${`${TARGET_PROGRESSIVE_RTP.toFixed(4)}%`.padStart(20)}${percentagePointDelta(progressiveRtp, TARGET_PROGRESSIVE_RTP).padStart(20)}`,
  )
  console.log(`${''.padEnd(27)}${'--------'.padStart(10)}`)
  console.log(
    `${'= Funded RTP'.padEnd(27)}${`${fundedRtp.toFixed(4)}%`.padStart(10)}${`${TARGET_FUNDED_RTP.toFixed(4)}%`.padStart(20)}${percentagePointDelta(fundedRtp, TARGET_FUNDED_RTP).padStart(20)}`,
  )
  console.log('')
  console.log(
    `${'Hit Rate'.padEnd(27)}${`${hitRate.toFixed(4)}%`.padStart(10)}${`${TARGET_HIT_RATE_MIN.toFixed(0)}–${TARGET_HIT_RATE_MAX.toFixed(0)}%`.padStart(20)}${hitRateStatus.padStart(20)}`,
  )
  console.log('')
  console.log('')
  console.log('JACKPOT FREQUENCY / HITS')
  console.log('--------------------------------------------------------------------------------------')
  console.log(`${'JACKPOT'.padEnd(27)}${'SIM FREQUENCY'.padStart(14)}${'HITS'.padStart(10)}${'TARGET'.padStart(20)}${'DELTA'.padStart(20)}`)
  console.log('-'.repeat(91))
  for (const tier of ['mini', 'minor', 'major', 'grand'] as const) {
    const targetFrequency = TARGET_JACKPOT_FREQUENCY[tier]
    const hits = stats.jackpotHits[tier]
    const actualFrequency =
      hits === 0 ? 'no hits' : `1 / ${(stats.spins / hits).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const target = `1 / ${targetFrequency.toLocaleString()}`
    console.log(
      `${jackpotLabels[tier].padEnd(27)}${actualFrequency.padStart(14)}${hits.toLocaleString().padStart(10)}${target.padStart(20)}${jackpotFrequencyDelta(hits, stats.spins, targetFrequency).padStart(20)}`,
    )
  }
  const totalJackpotHits = Object.values(stats.jackpotHits).reduce((sum, hits) => sum + hits, 0)
  console.log('-'.repeat(91))
  console.log(`${'TOTAL JACKPOT HITS'.padEnd(41)}${totalJackpotHits.toLocaleString().padStart(10)}`)
  console.log('')
  console.log('')
  console.log('RUN DETAILS')
  console.log('============================================================================')
  console.log(`${'Spins'.padEnd(27)}${stats.spins.toLocaleString()}`)
  console.log(`${'Bet / Spin'.padEnd(27)}${money(BET_PER_SPIN)}`)
  console.log(`${'Total Wagered'.padEnd(27)}${money(stats.totalWagered)}`)
  console.log(`${'Total Returned'.padEnd(27)}${money(stats.totalReturned)}`)
  console.log(
    `${'Avg Winning Spin'.padEnd(27)}${stats.winningSpins === 0 ? money(0) : money(stats.totalReturned / stats.winningSpins)}`,
  )
  console.log(`${'Runtime'.padEnd(27)}${runtimeSeconds.toFixed(2)}s`)
}
const args = commandLineArgs()
const spins = requestedSpinCount(args)
const reelSource = requestedReelSource(args)
const startedAt = performance.now()
const stats = simulate(spins, reelSource)
const runtimeSeconds = (performance.now() - startedAt) / 1000
printReport(stats, runtimeSeconds, reelSource)
