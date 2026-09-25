import { PAYLINES } from './Paylines.ts'
import { PAYTABLE } from './Paytable.ts'
import type { SpinResult, SymbolId } from './SpinResult.ts'
export type JackpotTier = 'mini' | 'minor' | 'major' | 'grand'
export interface WinPosition { reel: number; row: number }
export interface Win {
  lineIndex: number
  symbol: SymbolId
  count: number
  payout: number
  positions: WinPosition[]
  jackpot?: JackpotTier
}
export interface WinEvaluation { wins: Win[]; totalPayout: number }
export const ANYWHERE_JACKPOTS: Partial<Record<SymbolId, JackpotTier>> = {
  ARCHER: 'mini', KNIGHT: 'minor', MAGE: 'major', DRAGON: 'grand',
}
const JACKPOT_PAYOUTS: Record<JackpotTier, number> = {
  mini: 20,
  minor: 50,
  major: 100,
  grand: 500,
}
// Evaluation is deterministic and side-effect free: identical landed symbols
// always produce identical base awards. Progressive meter values are resolved by
// the runtime/server layer after this structural win classification.
export function evaluateWins(result: SpinResult, _totalBet = 1): WinEvaluation {
  const wins: Win[] = []
  // Payline wins qualify left-to-right from reel 1. HIGH 5+ results are withheld
  // here because the anywhere pass below must award each character jackpot once.
  PAYLINES.forEach((line, lineIndex) => {
    const symbol = result.reels[0]?.[line[0]]
    if (!symbol) return
    let count = 1
    for (let reel = 1; reel < result.reels.length; reel += 1) {
      if (result.reels[reel]?.[line[reel]] !== symbol) break
      count += 1
    }
    // Character 5+ is handled once by the anywhere-jackpot pass below.
    if (count >= 5 && ANYWHERE_JACKPOTS[symbol]) return
    const payout = PAYTABLE[symbol][count]
    if (!payout) return
    const positions = Array.from({ length: count }, (_, reel) => ({ reel, row: line[reel] }))
    wins.push({ lineIndex, symbol, count, payout, positions })
  })
  // HIGH jackpots are scatter-style: five or more matching character symbols
  // anywhere in the full 5x4 window qualify, independent of payline geometry.
  for (const [symbol, jackpot] of Object.entries(ANYWHERE_JACKPOTS) as [SymbolId, JackpotTier][]) {
    const positions: WinPosition[] = []
    result.reels.forEach((reel, reelIndex) => reel.forEach((landed, row) => {
      if (landed === symbol) positions.push({ reel: reelIndex, row })
    }))
    if (positions.length >= 5) {
      wins.push({ lineIndex: -1, symbol, count: positions.length, payout: JACKPOT_PAYOUTS[jackpot], positions, jackpot })
    }
  }
  return { wins, totalPayout: wins.reduce((sum, win) => sum + win.payout, 0) }
}
