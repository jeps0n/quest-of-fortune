import type { SymbolId } from './SpinResult'
/*
 * Direct-dollar awards for a fixed $1 total spin.
 * These are NOT line-bet multipliers: a listed $1.25 award pays $1.25.
 * Character 5-kind is omitted because 5+ matching character symbols anywhere
 * on the 5x4 result awards that character's jackpot tier instead.
 */
export const PAYTABLE: Record<SymbolId, Record<number, number>> = {
  SCROLL: { 3: 1.25, 4: 1.50, 5: 3.25 },
  COIN:   { 3: 1.50, 4: 2.00, 5: 4.00 },
  RING:   { 3: 1.75, 4: 2.75, 5: 4.75 },
  CHEST:  { 3: 2.00, 4: 3.25, 5: 5.75 },
  GEM:    { 3: 2.25, 4: 4.25, 5: 7.00 },
  CROWN:  { 3: 3.00, 4: 5.25, 5: 8.50 },
  ARCHER: { 3: 4.50, 4: 7.00 },
  KNIGHT: { 3: 6.00, 4: 9.00 },
  MAGE:   { 3: 8.00, 4: 11.50 },
  DRAGON: { 3: 11.00, 4: 15.50 },
}
