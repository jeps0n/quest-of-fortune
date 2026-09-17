import { PAYLINES } from './Paylines'
import { PAYTABLE } from './Paytable'
import type { SpinResult, SymbolId } from './SpinResult'

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

const ANYWHERE_JACKPOTS: Partial<Record<SymbolId, JackpotTier>> = {
  ARCHER: 'mini', KNIGHT: 'minor', MAGE: 'major', DRAGON: 'grand',
}

const JACKPOT_PAYOUTS: Record<JackpotTier, number> = {
  mini: 20,
  minor: 50,
  major: 100,
  grand: 500,
}

export function evaluateWins(result: SpinResult, _totalBet = 1): WinEvaluation {
  const wins: Win[] = []

  // Ordinary paylines pay direct dollar awards.
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

  // 5+ matching HIGH symbols anywhere in the full 5x4 result awards one jackpot.
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
