import { Container, Graphics, Sprite, Text } from 'pixi.js'
import type { AudioManager } from '../../audio/AudioManager'
import type { SymbolId } from '../../game/math/SpinResult'
import { SymbolAnimator } from './SymbolAnimator'
import { getSymbolArtwork } from './SymbolAssets'
/*
 * Presentation lock P1.
 * HIGH symbols own green / red / blue / purple.
 * LOW symbols stay in a warm-neutral treasure family.
 * The frame remains programmatic so artwork can be introduced one symbol at a
 * time without changing reel geometry or the symbol animation contract.
 */
const LOOK: Record<SymbolId, { color: number; label: string; labelColor: number }> = {
  SCROLL: { color: 0xd6b45d, label: 'SCROLL', labelColor: 0xffedbd },
  COIN:   { color: 0xf0c94d, label: 'COIN',   labelColor: 0xffed9b },
  RING:   { color: 0xe58a35, label: 'RING',   labelColor: 0xffc77a },
  CHEST:  { color: 0x9b6238, label: 'CHEST',  labelColor: 0xe8bd82 },
  GEM:    { color: 0xe8dfc7, label: 'GEM',    labelColor: 0xfff7e8 },
  CROWN:  { color: 0xd99b28, label: 'CROWN',  labelColor: 0xffd76c },
  ARCHER: { color: 0x43b85f, label: 'ARCHER', labelColor: 0x9df0ad },
  KNIGHT: { color: 0xd34f4f, label: 'KNIGHT', labelColor: 0xffa2a2 },
  MAGE:   { color: 0x4388dc, label: 'MAGE',   labelColor: 0x9ecaff },
  DRAGON: { color: 0x9a5bd4, label: 'DRAGON', labelColor: 0xd8adff },
}
const OUTER_INSET = 2
const INNER_INSET = 5
const CORNER_SIZE = 5
const LABEL_HEIGHT = 18
const ART_TOP_PADDING = 7
const ART_BOTTOM_PADDING = 6
export class SymbolSprite {
  readonly view = new Container()
  readonly animator: SymbolAnimator
  private id: SymbolId
  private width: number
  private height: number
  private plate = new Graphics()
  private frameOverlay = new Graphics()
  private label = new Text({
    text: '',
    style: {
      fill: 0xf6e7bb,
      fontFamily: 'Georgia, serif',
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
  })
  private artwork = new Sprite()
  constructor(id: SymbolId, width: number, height: number, audio: AudioManager) {
    this.id = id
    this.width = width
    this.height = height
    this.label.anchor.set(0.5)
    this.artwork.anchor.set(0.5)
    this.view.pivot.set(width / 2, height / 2)
    this.view.addChild(this.plate, this.artwork, this.frameOverlay, this.label)
    this.animator = new SymbolAnimator(this.view, audio)
    this.draw()
  }
  get symbolId(): SymbolId { return this.id }
  setSymbol(id: SymbolId): void {
    this.id = id
    this.draw()
  }
  private draw(): void {
    const look = LOOK[this.id]
    const texture = getSymbolArtwork(this.id)
    this.drawFrame(look.color)
    this.label.text = look.label
    this.label.style.fill = look.labelColor
    this.label.position.set(this.width / 2, this.height - 12)
    this.label.visible = true
    if (texture) {
      this.artwork.texture = texture
      this.artwork.visible = true
      this.drawArtwork(texture.width, texture.height)
      return
    }
    this.artwork.visible = false
    this.drawFallbackGlyph(look.color)
  }
  private drawFrame(accent: number): void {
    const x = OUTER_INSET
    const y = OUTER_INSET
    const w = this.width - OUTER_INSET * 2
    const h = this.height - OUTER_INSET * 2
    const labelY = this.height - LABEL_HEIGHT - 4
    this.plate.clear()
    this.frameOverlay.clear()
    // Backing lives behind the artwork. The artwork can therefore fill the tile
    // while the ornamental rails and nameplate remain crisp above it.
    this.plate
      .roundRect(x, y, w, h, 9)
      .fill({ color: 0x0d0815, alpha: 0.97 })
      .stroke({ color: 0x050308, alpha: 0.95, width: 5 })
    // Foreground rails visually contain the full-tile artwork without reducing
    // its composition area.
    this.frameOverlay
      .roundRect(x + 1, y + 1, w - 2, h - 2, 8)
      .stroke({ color: accent, alpha: 0.95, width: 2.5 })
      .roundRect(INNER_INSET, INNER_INSET, this.width - INNER_INSET * 2, this.height - INNER_INSET * 2, 6)
      .stroke({ color: 0xf4d98a, alpha: 0.24, width: 1 })
    // The nameplate intentionally overlays the bottom of the artwork. Artwork
    // is composed as a full tile; roughly the lower 20% is visually occluded.
    this.frameOverlay
      .rect(INNER_INSET + 1, labelY, this.width - (INNER_INSET + 1) * 2, LABEL_HEIGHT)
      .fill({ color: 0x07040c, alpha: 0.90 })
      .moveTo(INNER_INSET + 3, labelY)
      .lineTo(this.width - INNER_INSET - 3, labelY)
      .stroke({ color: accent, alpha: 0.72, width: 1.25 })
    this.drawCorner(INNER_INSET + 2, INNER_INSET + 2, accent)
    this.drawCorner(this.width - INNER_INSET - 2, INNER_INSET + 2, accent)
    this.drawCorner(INNER_INSET + 2, this.height - INNER_INSET - 2, accent)
    this.drawCorner(this.width - INNER_INSET - 2, this.height - INNER_INSET - 2, accent)
  }
  private drawCorner(x: number, y: number, accent: number): void {
    this.frameOverlay
      .poly([
        x, y - CORNER_SIZE,
        x + CORNER_SIZE, y,
        x, y + CORNER_SIZE,
        x - CORNER_SIZE, y,
      ])
      .fill({ color: accent, alpha: 0.9 })
      .stroke({ color: 0xf7dda0, alpha: 0.65, width: 0.8 })
  }
  private drawArtwork(textureWidth: number, textureHeight: number): void {
    const maxWidth = this.width - INNER_INSET * 2
    const maxHeight = this.height - ART_TOP_PADDING - ART_BOTTOM_PADDING
    const verticalScale = Math.min(maxWidth / textureWidth, maxHeight / textureHeight)
    const horizontalScale = maxWidth / textureWidth
    const artCenterY = ART_TOP_PADDING + maxHeight / 2
    // Preserve the existing vertical composition while reclaiming only the
    // unused horizontal space beneath the foreground frame rails.
    this.artwork.scale.set(horizontalScale, verticalScale)
    this.artwork.position.set(this.width / 2, artCenterY)
  }
  private drawFallbackGlyph(color: number): void {
    const availableHeight = this.height - ART_TOP_PADDING - ART_BOTTOM_PADDING
    const centerY = ART_TOP_PADDING + availableHeight / 2
    this.plate
      .circle(this.width / 2, centerY, 15)
      .fill({ color, alpha: 0.86 })
      .circle(this.width / 2, centerY, 20)
      .stroke({ color, alpha: 0.28, width: 3 })
  }
  destroy(): void {
    this.animator.destroy()
    this.view.destroy({ children: true })
  }
}
