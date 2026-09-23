import { Container, Graphics, Text } from 'pixi.js'
import { gsap } from 'gsap'
import { QUEST_LAYOUT } from '../../config/QuestLayout'
import type { JackpotTier, Win } from '../../game/math/WinEvaluator'
interface JackpotProfile {
  duration: number
  dimAlpha: number
  burstRadius: number
  titleSize: number
  amountSize: number
  travelDuration: number
}
const PROFILES: Record<JackpotTier, JackpotProfile> = {
  mini: { duration: 1.65, dimAlpha: 0.26, burstRadius: 82, titleSize: 46, amountSize: 40, travelDuration: 0.42 },
  minor: { duration: 1.95, dimAlpha: 0.22, burstRadius: 98, titleSize: 50, amountSize: 44, travelDuration: 0.48 },
  major: { duration: 2.35, dimAlpha: 0.16, burstRadius: 118, titleSize: 56, amountSize: 50, travelDuration: 0.56 },
  grand: { duration: 2.85, dimAlpha: 0.10, burstRadius: 142, titleSize: 64, amountSize: 58, travelDuration: 0.64 },
}
const TIER_COLORS: Record<JackpotTier, number> = {
  mini: 0x77e3a7,
  minor: 0xff8d83,
  major: 0x8ab5ff,
  grand: 0xe8b2ff,
}
const money = (value: number): string =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
/**
 * Cabinet-level jackpot theatre. Jackpot math is already authoritative before
 * this class runs; this class only visualizes the awarded tier and amount.
 */
export class JackpotPresentation {
  readonly view = new Container({ label: 'jackpot-presentation' })
  private dimmer = new Graphics()
  private energy = new Graphics()
  private burst = new Graphics()
  private title = new Text({ text: '', style: { fill: 0xfff3c4, fontFamily: 'Georgia, Times New Roman, serif', fontWeight: '900', letterSpacing: 5 } })
  private amount = new Text({ text: '', style: { fill: 0xffffff, fontFamily: 'Georgia, Times New Roman, serif', fontWeight: '900', letterSpacing: 2 } })
  private activeTimeline: gsap.core.Timeline | null = null
  private plaqueElements: Record<JackpotTier, HTMLElement>
  constructor(plaqueElements: Record<JackpotTier, HTMLElement>) {
    this.plaqueElements = plaqueElements
    this.title.anchor.set(0.5)
    this.amount.anchor.set(0.5)
    this.view.addChild(this.dimmer, this.energy, this.burst, this.title, this.amount)
    this.clear()
  }
  async celebrate(win: Win): Promise<void> {
    if (!win.jackpot) return
    this.clear()
    const tier = win.jackpot
    const profile = PROFILES[tier]
    const color = TIER_COLORS[tier]
    const target = QUEST_LAYOUT.jackpotTargets[tier]
    const source = this.averagePosition(win)
    const plaque = this.plaqueElements[tier]
    this.view.visible = true
    this.view.alpha = 1
    const presentationBounds = QUEST_LAYOUT.presentationBounds
    this.dimmer
      .rect(presentationBounds.x, presentationBounds.y, presentationBounds.width, presentationBounds.height)
      .fill({ color: 0x090311, alpha: 0.72 })
    this.dimmer.alpha = 0
    this.energy.circle(0, 0, 8).fill({ color: 0xfff1b0, alpha: 1 })
    this.energy.circle(0, 0, 18).stroke({ color, alpha: 0.42, width: 6 })
    this.energy.position.set(source.x, source.y)
    this.energy.alpha = 0
    this.burst.circle(target.x, target.y, profile.burstRadius).stroke({ color, alpha: 0.34, width: 12 })
    this.burst.circle(target.x, target.y, profile.burstRadius * 0.72).stroke({ color: 0xffe6a2, alpha: 0.75, width: 3 })
    this.burst.alpha = 0
    this.burst.scale.set(0.35)
    this.burst.pivot.set(target.x, target.y)
    this.burst.position.set(target.x, target.y)
    this.title.text = `${tier.toUpperCase()} JACKPOT`
    this.title.style.fontSize = profile.titleSize
    this.title.position.set(QUEST_LAYOUT.stage.width / 2, QUEST_LAYOUT.reels.y + QUEST_LAYOUT.reels.height * 0.43)
    this.title.alpha = 0
    this.title.scale.set(0.72)
    this.amount.text = money(0)
    this.amount.style.fontSize = profile.amountSize
    this.amount.position.set(QUEST_LAYOUT.stage.width / 2, QUEST_LAYOUT.reels.y + QUEST_LAYOUT.reels.height * 0.63)
    this.amount.alpha = 0
    this.amount.scale.set(0.86)
    const count = { value: 0 }
    const timeline = gsap.timeline()
    this.activeTimeline = timeline
    await new Promise<void>((resolve) => {
      timeline.eventCallback('onComplete', resolve)
      timeline
        .to({}, { duration: 0.28 })
        .to(this.dimmer, { alpha: 1 - profile.dimAlpha, duration: 0.32, ease: 'power2.out' })
        .to(this.energy, { alpha: 1, duration: 0.10 }, '<0.04')
        .to(this.energy.position, { x: target.x, y: target.y, duration: profile.travelDuration, ease: 'power2.in' })
        .to(this.energy.scale, { x: 1.8, y: 1.8, duration: 0.12, ease: 'power2.out' }, '<0.04')
        .to(this.energy, { alpha: 0, duration: 0.12 }, '<')
        .call(() => this.pulsePlaque(plaque, tier))
        .to(this.burst, { alpha: 1, duration: 0.10 }, '<')
        .to(this.burst.scale, { x: 1, y: 1, duration: 0.42, ease: 'back.out(1.8)' }, '<')
        .to(this.burst, { alpha: 0.12, duration: 0.52, ease: 'power1.out' }, '<0.12')
        .to(this.title, { alpha: 1, duration: 0.20 }, '<0.02')
        .to(this.title.scale, { x: 1, y: 1, duration: 0.36, ease: 'back.out(1.9)' }, '<')
        .to(this.amount, { alpha: 1, duration: 0.18 }, '<0.10')
        .to(this.amount.scale, { x: 1, y: 1, duration: 0.28, ease: 'back.out(1.7)' }, '<')
        .to(count, {
          value: win.payout,
          duration: profile.duration * 0.48,
          ease: 'power2.out',
          onUpdate: () => { this.amount.text = money(count.value) },
          onComplete: () => { this.amount.text = money(win.payout) },
        }, '<0.02')
        .to({}, { duration: profile.duration * 0.20 })
        .to([this.title, this.amount], { alpha: 0, duration: 0.28, ease: 'power1.in' })
        .to(this.dimmer, { alpha: 0, duration: 0.36, ease: 'power2.inOut' }, '<0.04')
    })
    this.activeTimeline = null
    this.clear()
  }
  clear(): void {
    this.activeTimeline?.kill()
    this.activeTimeline = null
    gsap.killTweensOf([this.view, this.dimmer, this.energy, this.energy.position, this.energy.scale, this.burst, this.burst.scale, this.title, this.title.scale, this.amount, this.amount.scale])
    Object.values(this.plaqueElements).forEach((element) => gsap.killTweensOf(element))
    this.dimmer.clear()
    this.energy.clear()
    this.burst.clear()
    this.title.text = ''
    this.amount.text = ''
    this.title.alpha = 0
    this.amount.alpha = 0
    this.energy.alpha = 0
    this.burst.alpha = 0
    this.energy.scale.set(1)
    this.burst.scale.set(1)
    this.view.alpha = 1
    this.view.visible = false
  }
  destroy(): void {
    this.clear()
    this.view.destroy({ children: true })
  }
  private pulsePlaque(element: HTMLElement, tier: JackpotTier): void {
    gsap.killTweensOf(element)
    const strength = tier === 'grand' ? 1.09 : tier === 'major' ? 1.075 : 1.055
    gsap.timeline()
      .to(element, { scale: strength, filter: 'brightness(1.65)', duration: 0.14, ease: 'power2.out' })
      .to(element, { scale: 1, filter: 'brightness(1)', duration: 0.38, ease: 'back.out(2.2)' })
  }
  private averagePosition(win: Win): { x: number; y: number } {
    if (win.positions.length === 0) return { x: QUEST_LAYOUT.stage.width / 2, y: QUEST_LAYOUT.reels.y + QUEST_LAYOUT.reels.height / 2 }
    const l = QUEST_LAYOUT.reels
    const reelWidth = (l.width - l.columnGap * (l.count - 1)) / l.count
    const cellHeight = (l.height - l.rowGap * (l.rows - 1)) / l.rows
    const points = win.positions.map(({ reel, row }) => ({
      x: l.x + reel * (reelWidth + l.columnGap) + reelWidth / 2,
      y: l.y + row * (cellHeight + l.rowGap) + cellHeight / 2,
    }))
    return {
      x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
      y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    }
  }
}
