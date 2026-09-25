import { createSpinResult, type SpinResult } from '../../../src/game/math/SpinResult.ts'
import {
  evaluateWins,
  type Win,
  type WinEvaluation,
} from '../../../src/game/math/WinEvaluator.ts'
const TOTAL_BET = 1
const UINT32_RANGE = 0x1_0000_0000
type ProgressiveHit = 'none' | 'major' | 'grand'
interface SettlementRow {
  progressive_payout: number | string
  major_value: number | string
  grand_value: number | string
}
export interface AuthoritativeSpinResponse {
  result: SpinResult
  evaluation: WinEvaluation
  progressiveHit: ProgressiveHit
  progressivePayout: number
  majorValue: number
  grandValue: number
}
function secureRandom(): number {
  const value = new Uint32Array(1)
  crypto.getRandomValues(value)
  return value[0] / UINT32_RANGE
}
function progressiveHitFor(wins: readonly Win[]): ProgressiveHit {
  const progressiveWins = wins.filter(
    (win): win is Win & { jackpot: 'major' | 'grand' } =>
      win.jackpot === 'major' || win.jackpot === 'grand',
  )
  if (progressiveWins.length > 1) {
    throw new Error('Spin produced more than one progressive hit')
  }
  return progressiveWins[0]?.jackpot ?? 'none'
}
function withProgressivePayout(
  evaluation: WinEvaluation,
  progressiveHit: ProgressiveHit,
  progressivePayout: number,
): WinEvaluation {
  if (progressiveHit === 'none') return evaluation
  let replaced = false
  const wins = evaluation.wins.map((win) => {
    if (win.jackpot !== progressiveHit) return win
    replaced = true
    return { ...win, payout: progressivePayout }
  })
  if (!replaced) {
    throw new Error(`Missing ${progressiveHit} win during progressive settlement`)
  }
  return {
    wins,
    totalPayout: wins.reduce((sum, win) => sum + win.payout, 0),
  }
}
function numeric(value: number | string, field: string): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${field} returned by settlement`)
  return parsed
}
export async function runAuthoritativeSpin(
  settleProgressive: (progressiveHit: ProgressiveHit) => Promise<SettlementRow>,
): Promise<AuthoritativeSpinResponse> {
  const result = createSpinResult(5, 4, secureRandom)
  const baseEvaluation = evaluateWins(result, TOTAL_BET)
  const progressiveHit = progressiveHitFor(baseEvaluation.wins)
  const row = await settleProgressive(progressiveHit)
  const progressivePayout = numeric(row.progressive_payout, 'progressive_payout')
  const majorValue = numeric(row.major_value, 'major_value')
  const grandValue = numeric(row.grand_value, 'grand_value')
  const evaluation = withProgressivePayout(
    baseEvaluation,
    progressiveHit,
    progressivePayout,
  )
  return {
    result,
    evaluation,
    progressiveHit,
    progressivePayout,
    majorValue,
    grandValue,
  }
}
