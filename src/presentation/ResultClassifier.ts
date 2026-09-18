import type { SymbolId } from '../game/math/SpinResult'
import type { JackpotTier, WinEvaluation } from '../game/math/WinEvaluator'
export type CharacterSymbol = 'ARCHER' | 'KNIGHT' | 'MAGE' | 'DRAGON'
export type PresentationKind = 'none' | 'normal' | 'high' | 'jackpot'
export interface ResultPresentation {
  kind: PresentationKind
  character?: CharacterSymbol
  jackpot?: JackpotTier
}
const HIGH_SYMBOLS = new Set<CharacterSymbol>(['ARCHER', 'KNIGHT', 'MAGE', 'DRAGON'])
function isCharacterSymbol(symbol: SymbolId): symbol is CharacterSymbol {
  return HIGH_SYMBOLS.has(symbol as CharacterSymbol)
}
/**
 * Converts an already-evaluated result into a presentation category.
 * This layer never decides wins or payouts; WinEvaluator remains authoritative.
 */
export function classifyResult(evaluation: WinEvaluation): ResultPresentation {
  const jackpotWin = evaluation.wins.find((win) => win.jackpot)
  if (jackpotWin?.jackpot) {
    return {
      kind: 'jackpot',
      jackpot: jackpotWin.jackpot,
      ...(isCharacterSymbol(jackpotWin.symbol)
        ? { character: jackpotWin.symbol }
        : {}),
    }
  }
  const highWins = evaluation.wins.filter((win) => isCharacterSymbol(win.symbol))
  if (highWins.length > 0) {
    const primary = highWins.reduce((best, win) => win.payout > best.payout ? win : best)
    return { kind: 'high', character: primary.symbol as CharacterSymbol }
  }
  if (evaluation.wins.length > 0) return { kind: 'normal' }
  return { kind: 'none' }
}
