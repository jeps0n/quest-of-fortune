import { Container, Graphics, Text } from 'pixi.js'
import { gsap } from 'gsap'
import { QUEST_LAYOUT } from '../../config/QuestLayout'
import { PAYLINES } from '../../game/math/Paylines'
import type { Win } from '../../game/math/WinEvaluator'
const LINE_PALETTE = [0xffd76a, 0xffecad, 0xf6b84a, 0xfff3cf] as const
const JACKPOT_COLOR = 0xfff0ad
export class WinPresentation {
  readonly view = new Container({ label: 'win-presentation' })
  private graphics = new Graphics()
  private badge = new Text({
    text: '',
    style: {
      fill: 0x1b1025,
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: 1,
    },
  })
  constructor() {
    this.badge.anchor.set(0.5)
    this.view.addChild(this.graphics, this.badge)
  }
  show(wins: readonly Win[]): void {
    this.clear()
    if (wins.length === 0) return
    const ordinary = wins.filter((win) => !win.jackpot)
    const jackpots = wins.filter((win) => win.jackpot)
    ordinary.forEach((win, index) => this.drawPayline(win, index))
    jackpots.forEach((win) => this.drawJackpot(win))
    this.view.alpha = 0
    gsap.to(this.view, { alpha: 1, duration: 0.16, ease: 'power2.out' })
  }
  stagePulse(): Promise<void> {
    gsap.killTweensOf(this.view)
    return new Promise((resolve) => {
      const timeline = gsap.timeline({ onComplete: resolve })
      timeline
        .fromTo(this.view, { alpha: 0.72 }, { alpha: 1, duration: 0.16, ease: 'power2.out' })
        .to(this.view, { alpha: 0.82, duration: 0.22, ease: 'power1.inOut' })
        .to(this.view, { alpha: 1, duration: 0.22, ease: 'power2.out' })
        .to({}, { duration: 0.12 })
    })
  }
  fadeTo(alpha: number, duration = 0.18): Promise<void> {
    gsap.killTweensOf(this.view)
    return new Promise((resolve) => {
      gsap.to(this.view, { alpha, duration, ease: 'power1.inOut', onComplete: resolve })
    })
  }
  clear(): void {
    gsap.killTweensOf(this.view)
    gsap.killTweensOf(this.view.scale)
    this.view.scale.set(1)
    this.graphics.clear()
    this.badge.text = ''
    this.view.alpha = 1
  }
  private drawPayline(win: Win, winIndex: number): void {
    if (win.lineIndex < 0 || win.positions.length === 0) return
    const path = PAYLINES[win.lineIndex]
    if (!path) return
    const color = LINE_PALETTE[winIndex % LINE_PALETTE.length]
    const centers = path.map((row, reel) => this.center(reel, row))
    const l = QUEST_LAYOUT.reels
    // Let the guide enter and leave the reel window like a real cabinet
    // payline instead of looking trapped between the first/last symbol centers.
    const fullPoints = [
      { x: l.x - 10, y: centers[0].y },
      ...centers,
      { x: l.x + l.width + 10, y: centers[centers.length - 1].y },
    ]
    const winningPoints = win.positions.map((position) => this.center(position.reel, position.row))
    // Soft outer light + crisp core. No large circles and no cell-sized shapes:
    // the symbols remain the hero while the line reads as cabinet lighting.
    this.strokePath(fullPoints, color, 0.16, 2)
    this.strokePath(winningPoints, 0x12081b, 0.38, 9)
    this.strokePath(winningPoints, color, 0.34, 7)
    this.strokePath(winningPoints, color, 1, 2.5)
    this.strokePath(winningPoints, 0xfff7da, 0.78, 1)
    // Small end caps give ordinary wins a deliberate start/finish without
    // enclosing symbols or competing with HIGH character treatments.
    if (winningPoints.length > 1) {
      const first = winningPoints[0]
      const last = winningPoints[winningPoints.length - 1]
      this.graphics.circle(first.x, first.y, 7).stroke({ color, alpha: 0.34, width: 1.5 })
      this.graphics.circle(last.x, last.y, 7).stroke({ color, alpha: 0.34, width: 1.5 })
    }
    winningPoints.forEach((point) => {
      this.graphics.circle(point.x, point.y, 4.5).fill({ color: 0x160d20, alpha: 0.86 })
      this.graphics.circle(point.x, point.y, 4.5).stroke({ color, alpha: 1, width: 2 })
      this.graphics.circle(point.x, point.y, 1.5).fill({ color: 0xfff7da, alpha: 1 })
    })
  }
  private strokePath(points: readonly { x: number; y: number }[], color: number, alpha: number, width: number): void {
    if (points.length === 0) return
    this.graphics.moveTo(points[0].x, points[0].y)
    points.slice(1).forEach((point) => this.graphics.lineTo(point.x, point.y))
    this.graphics.stroke({ color, alpha, width })
  }
  private drawJackpot(win: Win): void {
    const l = QUEST_LAYOUT.reels
    // Jackpot treatment intentionally escapes the ordinary payline language.
    // The frame breathes just outside the reel opening and the symbol halos are
    // lighter than the old medallions so they do not look clipped into cells.
    this.graphics
      .roundRect(l.x - 9, l.y - 9, l.width + 18, l.height + 18, 15)
      .stroke({ color: JACKPOT_COLOR, alpha: 0.18, width: 10 })
      .roundRect(l.x - 7, l.y - 7, l.width + 14, l.height + 14, 14)
      .stroke({ color: JACKPOT_COLOR, alpha: 0.92, width: 2.5 })
    win.positions.forEach((position) => {
      const point = this.center(position.reel, position.row)
      this.graphics.circle(point.x, point.y, 25).stroke({ color: JACKPOT_COLOR, alpha: 0.16, width: 8 })
      this.graphics.circle(point.x, point.y, 21).stroke({ color: JACKPOT_COLOR, alpha: 0.95, width: 2.5 })
    })
    this.badge.text = `${win.jackpot!.toUpperCase()} JACKPOT`
    this.badge.position.set(l.x + l.width / 2, l.y - 24)
    const bounds = this.badge.getBounds()
    this.graphics
      .roundRect(bounds.x - 16, bounds.y - 7, bounds.width + 32, bounds.height + 14, 9)
      .fill({ color: JACKPOT_COLOR, alpha: 0.98 })
      .stroke({ color: 0x2a1535, alpha: 0.9, width: 2 })
  }
  private center(reel: number, row: number): { x: number; y: number } {
    const l = QUEST_LAYOUT.reels
    const reelWidth = (l.width - l.columnGap * (l.count - 1)) / l.count
    const cellHeight = (l.height - l.rowGap * (l.rows - 1)) / l.rows
    return {
      x: l.x + reel * (reelWidth + l.columnGap) + reelWidth / 2,
      y: l.y + row * (cellHeight + l.rowGap) + cellHeight / 2,
    }
  }
  destroy(): void {
    gsap.killTweensOf(this.view)
    gsap.killTweensOf(this.view.scale)
    this.view.destroy({ children: true })
  }
}
