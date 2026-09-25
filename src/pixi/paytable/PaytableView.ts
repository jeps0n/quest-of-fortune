import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js'
import { PAYTABLE } from '../../game/math/Paytable'
import { REEL_STRIPS, type SymbolId } from '../../game/math/SpinResult'
import { ANYWHERE_JACKPOTS, type JackpotTier } from '../../game/math/WinEvaluator'
import { getSymbolArtwork } from '../reels/SymbolAssets'
import { SYMBOL_LOOK } from '../reels/SymbolSprite'
const SYMBOLS: readonly SymbolId[] = [
  'SCROLL', 'COIN', 'RING', 'CHEST', 'CROWN',
  'GEM', 'ARCHER', 'KNIGHT', 'MAGE', 'DRAGON',
]
const JACKPOT_NAMES: Record<JackpotTier, string> = {
  mini: 'MINI JACKPOT', minor: 'MINOR JACKPOT', major: 'MAJOR JACKPOT', grand: 'GRAND JACKPOT',
}
const START_X = 116
const START_Y = 200
const CARD_WIDTH = 186
const CARD_HEIGHT = 224
const GAP_X = 12
const GAP_Y = 14
const ART_MAX_WIDTH = 169
const ART_MAX_HEIGHT = 101
const ART_BORDER_COLOR = 0xd8c9a8
const ART_BORDER_PADDING = 2
// Optional development overlay for reel identity and frequency diagnostics.
const SHOW_PAYTABLE_DIAGNOSTICS = false
// Read left-to-right as NORMAL -> MEDIUM -> RICH. Color progression carries
// emphasis without adding separators or badges.
const COUNT_COLORS = [0x9584ad, 0xc9aef0, 0xf7efff] as const
const PAYOUT_COLORS = [0xb99b55, 0xf0c85d, 0xfff0ad] as const
const COUNT_SIZES = [11, 12, 13] as const
const PAYOUT_SIZES = [13, 14, 15] as const
function addCenteredText(root: Container, text: string, x: number, y: number, fontSize: number, fill = 0xf6e7bb): Text {
  const label = new Text({
    text,
    resolution: Math.max(2, window.devicePixelRatio || 1),
    style: {
      fill,
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize,
      fontWeight: '700',
      letterSpacing: 0.8,
      align: 'center',
    },
  })
  label.anchor.set(0.5)
  label.position.set(x, y)
  root.addChild(label)
  return label
}
function addArtwork(root: Container, symbol: SymbolId): void {
  const texture = getSymbolArtwork(symbol)
  if (!texture) return
  const scale = Math.min(ART_MAX_WIDTH / texture.width, ART_MAX_HEIGHT / texture.height)
  const displayedWidth = texture.width * scale
  const displayedHeight = texture.height * scale
  // One uniform, close-fitting artwork edge across every card. It follows the
  // displayed asset's own aspect ratio instead of creating another inset panel.
  const artBorder = new Graphics()
  artBorder
    .roundRect(
      -displayedWidth / 2 - ART_BORDER_PADDING,
      -displayedHeight / 2 - ART_BORDER_PADDING,
      displayedWidth + ART_BORDER_PADDING * 2,
      displayedHeight + ART_BORDER_PADDING * 2,
      4,
    )
    .stroke({ color: ART_BORDER_COLOR, alpha: 0.72, width: 1.25 })
  root.addChild(artBorder)
  const art = new Sprite(texture)
  art.anchor.set(0.5)
  art.scale.set(scale)
  root.addChild(art)
}
function getProductionReelFrequencyLabel(symbol: SymbolId): string {
  const counts = REEL_STRIPS.map((reel) => reel.reduce(
    (count, reelSymbol) => count + (reelSymbol === symbol ? 1 : 0),
    0,
  ))
  return counts.join(' / ')
}
function addDiagnosticIdentity(root: Container, symbol: SymbolId): void {
  // Compass/debug data intentionally bypasses SYMBOL_LOOK so presentation
  // aliases cannot hide a crossed internal identity. Frequency is derived
  // directly from the current production REEL_STRIPS, never reference data.
  addCenteredText(root, `ID: ${symbol}`, 0, 9, 8, 0x00ffff)
  addCenteredText(root, `R1–R5: ${getProductionReelFrequencyLabel(symbol)}`, 0, 20, 8, 0x00ffff)
}
function addPayoutColumn(
  root: Container,
  x: number,
  count: number,
  amount: number,
  valueColor: number,
  countColor: number,
  countY: number,
  valueY: number,
  emphasis: 0 | 1 | 2,
): void {
  addCenteredText(root, `${count}×`, x, countY, COUNT_SIZES[emphasis], countColor)
  addCenteredText(root, `$${amount.toFixed(2)}`, x, valueY, PAYOUT_SIZES[emphasis], valueColor)
}
function createSymbolCard(symbol: SymbolId): Container {
  const cardRoot = new Container({ label: `paytable-card-${symbol.toLowerCase()}` })
  const look = SYMBOL_LOOK[symbol]
  const halfW = CARD_WIDTH / 2
  const halfH = CARD_HEIGHT / 2
  // Keep symbol identity on the card surface rather than adding a second framed panel.
  const surface = new Graphics()
  surface
    .roundRect(-halfW, -halfH, CARD_WIDTH, CARD_HEIGHT, 12)
    .fill({ color: 0x0d0912, alpha: 0.76 })
    .stroke({ color: 0x050308, alpha: 0.88, width: 3 })
    .roundRect(-halfW + 2, -halfH + 2, CARD_WIDTH - 4, CARD_HEIGHT - 4, 10)
    .stroke({ color: look.color, alpha: 0.62, width: 1.5 })
    .roundRect(-halfW + 5, -halfH + 5, CARD_WIDTH - 10, CARD_HEIGHT - 10, 8)
    .stroke({ color: 0xf4d98a, alpha: 0.10, width: 1 })
  cardRoot.addChild(surface)
  const artworkRoot = new Container()
  artworkRoot.position.set(0, -70)
  cardRoot.addChild(artworkRoot)
  addArtwork(artworkRoot, symbol)
  // The separator is intentionally a rail, not a box: art and information are
  // two zones of one card, with the symbol color carrying identity between them.
  const separator = new Graphics()
  separator
    .moveTo(-69, -28)
    .lineTo(69, -28)
    .stroke({ color: look.color, alpha: 0.42, width: 1.25 })
    .moveTo(-38, -26)
    .lineTo(38, -26)
    .stroke({ color: look.labelColor, alpha: 0.12, width: 1 })
  cardRoot.addChild(separator)
  addCenteredText(cardRoot, look.label, 0, -8, 18, look.labelColor)
  if (SHOW_PAYTABLE_DIAGNOSTICS) addDiagnosticIdentity(cardRoot, symbol)
  const payouts = PAYTABLE[symbol]
  const jackpot = ANYWHERE_JACKPOTS[symbol]
  if (jackpot) {
    addPayoutColumn(cardRoot, -43, 3, payouts[3], PAYOUT_COLORS[0], COUNT_COLORS[0], 27, 46, 0)
    addPayoutColumn(cardRoot, 43, 4, payouts[4], PAYOUT_COLORS[1], COUNT_COLORS[1], 27, 46, 1)
    const jackpotDivider = new Graphics()
    jackpotDivider
      .moveTo(-47, 63)
      .lineTo(47, 63)
      .stroke({ color: look.color, alpha: 0.30, width: 1 })
    cardRoot.addChild(jackpotDivider)
    addCenteredText(cardRoot, '5+ ANYWHERE', 0, 78, COUNT_SIZES[2], COUNT_COLORS[2])
    addCenteredText(cardRoot, JACKPOT_NAMES[jackpot], 0, 95, 11, look.labelColor)
  } else {
    addPayoutColumn(cardRoot, -55, 3, payouts[3], PAYOUT_COLORS[0], COUNT_COLORS[0], 32, 55, 0)
    addPayoutColumn(cardRoot, 0, 4, payouts[4], PAYOUT_COLORS[1], COUNT_COLORS[1], 32, 55, 1)
    addPayoutColumn(cardRoot, 55, 5, payouts[5], PAYOUT_COLORS[2], COUNT_COLORS[2], 32, 55, 2)
  }
  return cardRoot
}
export function createPaytableView(frameTexture: Texture): Container {
  const root = new Container({ label: 'paytable-view' })
  root.sortableChildren = true
  const frame = new Sprite(frameTexture)
  frame.width = 1200
  frame.height = 800
  frame.zIndex = 0
  root.addChild(frame)
  SYMBOLS.forEach((symbol, index) => {
    const column = index % 5
    const row = Math.floor(index / 5)
    const x = START_X + column * (CARD_WIDTH + GAP_X)
    const y = START_Y + row * (CARD_HEIGHT + GAP_Y)
    const card = createSymbolCard(symbol)
    card.position.set(x + CARD_WIDTH / 2, y + CARD_HEIGHT / 2)
    card.zIndex = 10
    root.addChild(card)
  })
  const rules = new Container({ label: 'paytable-rules' })
  rules.zIndex = 30
  root.addChild(rules)
  addCenteredText(
    rules,
    '5+ MATCHING CHARACTER SYMBOLS ANYWHERE AWARD THE CHARACTER JACKPOT',
    600,
    687,
    11,
    0xf0c85d,
  )
  addCenteredText(
    rules,
    'OTHER LINE WINS PAY NORMALLY  •  AWARDS SHOWN FOR A $1.00 TOTAL BET',
    600,
    704,
    10,
    0xd8c9a8,
  )
  return root
}
