import { createSpinResult, type SpinResult, type SymbolId } from '../game/math/SpinResult'
import { REEL_STRIPS_TO_AUDIT } from './ReelAuditInput'
import { evaluateWins, type JackpotTier } from '../game/math/WinEvaluator'
const DEFAULT_SPINS = 5_000_000
const QUICK_SPINS = 100_000
const BET_PER_SPIN = 1
const SEED = 0x514f46
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
  console.log('JACKPOT FREQUENCY')
  console.log('----------------------------------------------------------------------------')
  for (const tier of ['mini', 'minor', 'major', 'grand'] as const) {
    const targetFrequency = TARGET_JACKPOT_FREQUENCY[tier]
    const hits = stats.jackpotHits[tier]
    const actualFrequency =
      hits === 0 ? 'no hits' : `1 / ${(stats.spins / hits).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const target = `1 / ${targetFrequency.toLocaleString()}`
    console.log(
      `${jackpotLabels[tier].padEnd(27)}${actualFrequency.padStart(14)}${target.padStart(20)}${jackpotFrequencyDelta(hits, stats.spins, targetFrequency).padStart(20)}`,
    )
  }
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
