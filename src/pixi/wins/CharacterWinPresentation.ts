import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js'
import { gsap } from 'gsap'
import { QUEST_LAYOUT } from '../../config/QuestLayout'
import type { CharacterSymbol } from '../../presentation/ResultClassifier'
const CHARACTER_LOOK: Record<
  CharacterSymbol,
  { color: number; accent: number; border: number }
> = {
  // Borders stay slate-gray first, with only enough character hue to identify the stage.
  ARCHER: { color: 0x43b85f, accent: 0xb8ffc5, border: 0x53685b },
  KNIGHT: { color: 0xd34f4f, accent: 0xffb3a8, border: 0x6a5558 },
  MAGE: { color: 0x4388dc, accent: 0xb8ddff, border: 0x536171 },
  DRAGON: { color: 0x9a5bd4, accent: 0xe0bdff, border: 0x62586c },
}
// Shared alternate-screen art scale.
// Positioning intentionally uses vanilla Pixi top-left local coordinates for this test.
const STAGE_ART_ZOOM = .66
type CharacterMotion = {
  stageOffsetX: number
  stageOffsetY: number
  stageScale: number
  stageDuration: number
  stageEase: string
  titleOffsetX: number
  titleOffsetY: number
  titleStartScaleX: number
  titleStartScaleY: number
  titleStartRotation: number
  titleDuration: number
  titleEase: string
  titleImpactScale: number
  titleImpactRotation: number
  titleImpactDuration: number
  titleResolveDuration: number
  payoutOffsetX: number
  payoutOffsetY: number
  hold: number
}
/**
 * Motion identity only. Final framing, reel geometry, payout timing, and math
 * remain shared so character flavor never leaks into game behavior.
 */
const CHARACTER_MOTION: Record<CharacterSymbol, CharacterMotion> = {
  // Fast, precise lateral arrival: the Archer reads as a clean snap into aim.
  ARCHER: {
    stageOffsetX: -34, stageOffsetY: 0, stageScale: 1.018,
    stageDuration: 0.72, stageEase: 'power3.out',
    titleOffsetX: -86, titleOffsetY: 0,
    titleStartScaleX: 0.90, titleStartScaleY: 1.04, titleStartRotation: -0.025,
    titleDuration: 0.24, titleEase: 'power4.out',
    titleImpactScale: 1.035, titleImpactRotation: 0.012,
    titleImpactDuration: 0.08, titleResolveDuration: 0.14,
    payoutOffsetX: 18, payoutOffsetY: 18, hold: 1.20,
  },
  // Short forward impact: the Knight lands with weight rather than travel.
  KNIGHT: {
    stageOffsetX: 0, stageOffsetY: -5, stageScale: 1.075,
    stageDuration: 0.48, stageEase: 'back.out(1.18)',
    titleOffsetX: 0, titleOffsetY: -78,
    titleStartScaleX: 1.18, titleStartScaleY: 0.78, titleStartRotation: 0,
    titleDuration: 0.22, titleEase: 'power4.in',
    titleImpactScale: 1.10, titleImpactRotation: 0,
    titleImpactDuration: 0.10, titleResolveDuration: 0.18,
    payoutOffsetX: 0, payoutOffsetY: -24, hold: 1.30,
  },
  // Gentle rise and longer ease: the Mage feels suspended and controlled.
  MAGE: {
    stageOffsetX: 0, stageOffsetY: 22, stageScale: 1.028,
    stageDuration: 0.92, stageEase: 'sine.out',
    titleOffsetX: 0, titleOffsetY: 64,
    titleStartScaleX: 0.78, titleStartScaleY: 0.78, titleStartRotation: -0.035,
    titleDuration: 0.76, titleEase: 'sine.out',
    titleImpactScale: 1.025, titleImpactRotation: 0.018,
    titleImpactDuration: 0.24, titleResolveDuration: 0.34,
    payoutOffsetX: 0, payoutOffsetY: 28, hold: 1.42,
  },
  // Slow looming push: the Dragon owns more time and apparent mass.
  DRAGON: {
    stageOffsetX: 14, stageOffsetY: 10, stageScale: 1.095,
    stageDuration: 1.05, stageEase: 'power2.out',
    titleOffsetX: 0, titleOffsetY: 4,
    titleStartScaleX: 1.52, titleStartScaleY: 1.52, titleStartRotation: 0.018,
    titleDuration: 0.86, titleEase: 'power2.out',
    titleImpactScale: 1.08, titleImpactRotation: -0.008,
    titleImpactDuration: 0.22, titleResolveDuration: 0.34,
    payoutOffsetX: -18, payoutOffsetY: 20, hold: 1.55,
  },
}
export type CharacterStageTextures = Record<CharacterSymbol, Texture>
/**
 * Presentation-only HIGH-symbol stage event.
 * Backdrop + theatrical text own the reel viewport briefly, then
 * dissolve so the authoritative winning grid/payline can return unchanged.
 */
export class CharacterWinPresentation {
  readonly view = new Container({
    label: 'character-win-presentation',
  })
  private screen = new Container({
    label: 'high-alternate-screen',
  })
  private screenMask = new Graphics()
  private matte = new Graphics()
  private backdrop: Sprite
  private border = new Graphics()
  private shade = new Graphics()
  private title = new Text({
    text: '',
    style: {
      fill: 0xffffff,
      fontFamily: 'Georgia, serif',
      fontSize: 34,
      fontWeight: '700',
      letterSpacing: 4,
      dropShadow: {
        color: 0x000000,
        alpha: 0.9,
        blur: 7,
        distance: 3,
      },
    },
  })
  private payout = new Text({
    text: '',
    style: {
      fill: 0xffe7a6,
      fontFamily: 'Georgia, serif',
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: 2,
      dropShadow: {
        color: 0x000000,
        alpha: 0.9,
        blur: 5,
        distance: 2,
      },
    },
  })
  // Explicit field instead of a TypeScript constructor parameter property.
  // This keeps the file compatible with erasableSyntaxOnly.
  private textures: CharacterStageTextures
  constructor(textures: CharacterStageTextures) {
    this.textures = textures
    const l = QUEST_LAYOUT.reels
    this.backdrop = new Sprite(this.textures.ARCHER)
    // The alternate screen owns the cabinet-space offset. Everything inside it
    // Use screen-local coordinates with (0, 0) at the top-left.
    this.screen.position.set(l.x, l.y)
    this.backdrop.anchor.set(0)
    this.backdrop.position.set(0, 0)
    this.fitBackdropToScreen()
    this.title.anchor.set(0.5)
    this.payout.anchor.set(0.5)
    // HIGH celebrations are an alternate display mode inside the cabinet,
    // not a page-level overlay.
    //
    // Everything theatrical lives inside this screen and is hard-clipped
    // to the exact reel opening. The cabinet remains the physical frame.
    this.screenMask
      .rect(0, 0, l.width, l.height)
      .fill(0xffffff)
    this.screen.addChild(
      this.matte,
      this.backdrop,
      this.shade,
      this.border,
      this.title,
      this.payout,
    )
    // Mask moves with the alternate screen and remains exactly the reel opening.
    this.screen.addChild(this.screenMask)
    this.screen.mask = this.screenMask
    this.view.addChild(this.screen)
    this.view.alpha = 0
  }
  show(
    character: CharacterSymbol,
    count: number,
    payout: number,
  ): void {
    this.clear()
    const look = CHARACTER_LOOK[character]
    const l = QUEST_LAYOUT.reels
    const cx = l.width / 2
    const cy = l.height / 2
    this.backdrop.texture = this.textures[character]
    // Vanilla Pixi positioning baseline: artwork begins at the alternate
    // screen's local top-left. The hard screen mask still clips all overflow.
    this.backdrop.position.set(0, 0)
    this.fitBackdropToScreen()
    this.backdrop.alpha = 0.88
    // Opaque graphite underlay makes the alternate screen visually replace
    // the reels instead of blending with the ornate cabinet beneath it.
    this.matte
      .rect(
        0,
        0,
        l.width,
        l.height,
      )
      .fill({
        color: 0x171a20,
        alpha: 0.96,
      })
    // Only a light glass tint remains over the stronger artwork.
    // The backdrop itself does the visual lifting.
    this.shade
      .rect(
        0,
        0,
        l.width,
        l.height,
      )
      .fill({
        color: 0x11131a,
        alpha: 0.08,
      })
    // Alternate-screen bezel:
    //
    // 1. graphite/slate physical edge
    // 2. restrained character-tinted edge
    // 3. subtle thematic highlight
    //
    // This reads as the cabinet's internal display bezel rather than
    // introducing another ornate gold frame.
    this.border
      .rect(
        3,
        3,
        l.width - 6,
        l.height - 6,
      )
      .stroke({
        color: 0x303640,
        alpha: 0.98,
        width: 7,
      })
      .rect(
        7,
        7,
        l.width - 14,
        l.height - 14,
      )
      .stroke({
        color: look.border,
        alpha: 0.98,
        width: 3,
      })
      .rect(
        10,
        10,
        l.width - 20,
        l.height - 20,
      )
      .stroke({
        color: look.accent,
        alpha: 0.28,
        width: 1,
      })
    this.title.text = `${character} ×${count}`
    this.title.style.fill = look.accent
    this.title.position.set(
      cx,
      cy - 20,
    )
    this.payout.text =
      `${payout.toFixed(2)}×  •  $${payout.toFixed(2)}`
    this.payout.position.set(
      cx,
      cy + 20,
    )
    // Initial theatrical state.
    // celebrate() reveals these elements one beat at a time.
    const motion = CHARACTER_MOTION[character]
    const baseScale = this.getBackdropBaseScale()
    const baseX = this.backdrop.x
    const baseY = this.backdrop.y
    this.view.alpha = 0
    this.backdrop.alpha = 0
    this.backdrop.position.set(
      baseX + motion.stageOffsetX,
      baseY + motion.stageOffsetY,
    )
    this.backdrop.scale.set(baseScale * motion.stageScale)
    this.shade.alpha = 0
    this.border.alpha = 0
    this.title.alpha = 0
    this.title.scale.set(
      motion.titleStartScaleX,
      motion.titleStartScaleY,
    )
    this.title.rotation = motion.titleStartRotation
    this.payout.alpha = 0
    this.payout.scale.set(0.96)
  }
  /**
   * Shared HIGH celebration.
   * Jackpot presentation can later extend this beat instead of returning.
   */
  celebrate(
    character: CharacterSymbol,
    count: number,
    payout: number,
  ): Promise<void> {
    this.show(
      character,
      count,
      payout,
    )
    const l = QUEST_LAYOUT.reels
    const cx = l.width / 2
    const cy = l.height / 2
    const motion = CHARACTER_MOTION[character]
    const baseScale = this.getBackdropBaseScale()
    // show() has already applied the character's intro offset. Derive the
    // shared final framing from it so every path resolves to the same camera.
    const baseX = this.backdrop.x - motion.stageOffsetX
    const baseY = this.backdrop.y - motion.stageOffsetY
    return new Promise((resolve) => {
      const tl = gsap.timeline({
        onComplete: resolve,
      })
      // ------------------------------------------------------------
      // BEAT 1 — THE STAGE
      // ------------------------------------------------------------
      //
      // The artwork receives the viewport by itself first.
      // No character title or payout is competing with the reveal.
      //
      // The slow push is intentionally restrained:
      // keep the generated backdrop as the primary spectacle rather than procedural
      // character geometry.
      tl.set(
        this.view,
        {
          alpha: 1,
        },
      )
        .to(
          this.backdrop,
          {
            alpha: 0.88,
            duration: 0.62,
            ease: 'power2.out',
          },
        )
        .to(
          this.backdrop,
          {
            x: baseX,
            y: baseY,
            duration: motion.stageDuration,
            ease: motion.stageEase,
          },
          '<',
        )
        .to(
          this.backdrop.scale,
          {
            x: baseScale,
            y: baseScale,
            duration: motion.stageDuration,
            ease: motion.stageEase,
          },
          '<',
        )
        .to(
          this.shade,
          {
            alpha: 1,
            duration: 0.46,
            ease: 'power1.out',
          },
          '<0.08',
        )
        .to(
          this.border,
          {
            alpha: 1,
            duration: 0.42,
            ease: 'power2.out',
          },
          '<0.10',
        )
        // Let the alternate screen exist by itself.
        .to(
          {},
          {
            duration: 0.56,
          },
        )
      // ------------------------------------------------------------
      // BEAT 2 — WHO WON
      // ------------------------------------------------------------
      //
      // Character/count arrives alone and gets time to register
      // before the money appears.
      tl.fromTo(
        this.title,
        {
          alpha: 0,
          x: cx + motion.titleOffsetX,
          y: cy - 20 + motion.titleOffsetY,
          rotation: motion.titleStartRotation,
        },
        {
          alpha: 1,
          x: cx,
          y: cy - 20,
          rotation: 0,
          duration: motion.titleDuration,
          ease: motion.titleEase,
        },
      )
        .to(
          this.title.scale,
          {
            x: motion.titleImpactScale,
            y: motion.titleImpactScale,
            duration: motion.titleDuration,
            ease: motion.titleEase,
          },
          '<',
        )
        // Each HIGH owns a visibly different arrival axis, then gets one
        // character-specific impact/recoil before resolving to shared framing.
        .to(
          this.title,
          {
            rotation: motion.titleImpactRotation,
            duration: motion.titleImpactDuration,
            ease: character === 'KNIGHT' ? 'power4.out' : 'power2.out',
          },
        )
        .to(
          this.title.scale,
          {
            x: character === 'KNIGHT' ? 0.96 : 1,
            y: character === 'KNIGHT' ? 1.05 : 1,
            duration: motion.titleImpactDuration,
            ease: character === 'KNIGHT' ? 'power4.out' : 'power2.out',
          },
          '<',
        )
        .to(
          this.title,
          {
            rotation: 0,
            duration: motion.titleResolveDuration,
            ease: character === 'MAGE' ? 'sine.inOut' : 'power2.out',
          },
        )
        .to(
          this.title.scale,
          {
            x: 1,
            y: 1,
            duration: motion.titleResolveDuration,
            ease: character === 'MAGE' ? 'sine.inOut' : 'back.out(1.7)',
          },
          '<',
        )
        // Character identity gets its own hold.
        .to(
          {},
          {
            duration: character === 'ARCHER' ? 0.42 : 0.62,
          },
        )
      // ------------------------------------------------------------
      // BEAT 3 — THE PAYOFF
      // ------------------------------------------------------------
      //
      // Reveal the multiplier/value only after the character entrance
      // reveal. It does not arrive simultaneously with the title.
      tl.fromTo(
        this.payout,
        {
          alpha: 0,
          x: cx + motion.payoutOffsetX,
          y: cy + 20 + motion.payoutOffsetY,
        },
        {
          alpha: 1,
          x: cx,
          y: cy + 20,
          duration: 0.42,
          ease: 'power2.out',
        },
      )
        .to(
          this.payout.scale,
          {
            x: 1,
            y: 1,
            duration: 0.36,
            ease: 'power2.out',
          },
          '<',
        )
      // ------------------------------------------------------------
      // BEAT 4 — CELEBRATE
      // ------------------------------------------------------------
      //
      // Stop asking the player's eyes to chase motion.
      // Hold the completed composition so the HIGH result feels
      // materially different from an ordinary win.
      tl.to(
        {},
        {
          duration: motion.hold,
        },
      )
    })
  }
  /**
   * Returns the shared native-art scale.
   *
   * 1.0 = the texture's original dimensions. The fixed reel viewport
   * simply crops whatever falls outside its mask.
   */
  private getBackdropBaseScale(): number {
    return STAGE_ART_ZOOM
  }
  /**
   * Positions native-scale artwork behind the fixed alternate screen.
   *
   * The viewport does not resize the texture. Anything outside the
   * viewport is cropped by screenMask.
   *
   * STAGE_ART_ZOOM is shared by all four character plates.
   */
  private fitBackdropToScreen(): void {
    const l = QUEST_LAYOUT.reels
    const textureWidth =
      this.backdrop.texture.width || l.width
    const textureHeight =
      this.backdrop.texture.height || l.height
    // Keep the artwork at its native texture scale. The viewport is a
    // fixed camera window and screenMask handles all cropping.
    const finalScale = STAGE_ART_ZOOM
    const renderedWidth = textureWidth * finalScale
    const renderedHeight = textureHeight * finalScale
    const centeredX = -(renderedWidth - l.width) / 2
    const centeredY = -(renderedHeight - l.height) / 2
    const stageCenterX = QUEST_LAYOUT.stage.width / 2
    const stageCenterY = QUEST_LAYOUT.stage.height / 2
    const screenCenterX = l.x + l.width / 2
    const screenCenterY = l.y + l.height / 2
    const stageCenterCompensationX = screenCenterX - stageCenterX
    const stageCenterCompensationY = screenCenterY - stageCenterY
    this.backdrop.scale.set(finalScale)
    this.backdrop.position.set(
      centeredX + stageCenterCompensationX,
      centeredY + stageCenterCompensationY,
    )
  }
  fadeOut(
    duration = 0.24,
  ): Promise<void> {
    gsap.killTweensOf(this.view)
    return new Promise((resolve) => {
      gsap.to(
        this.view,
        {
          alpha: 0,
          duration,
          ease: 'power2.in',
          onComplete: resolve,
        },
      )
    })
  }
  clear(): void {
    gsap.killTweensOf(this.view)
    gsap.killTweensOf(this.backdrop)
    gsap.killTweensOf(this.backdrop.scale)
    gsap.killTweensOf(this.shade)
    gsap.killTweensOf(this.border)
    gsap.killTweensOf(this.title)
    gsap.killTweensOf(this.title.scale)
    gsap.killTweensOf(this.payout)
    gsap.killTweensOf(this.payout.scale)
    this.matte.clear()
    this.shade.clear()
    this.border.clear()
    this.title.text = ''
    this.payout.text = ''
    this.matte.alpha = 1
    this.shade.alpha = 1
    this.border.alpha = 1
    this.title.scale.set(1)
    this.title.rotation = 0
    this.payout.scale.set(1)
    this.backdrop.scale.set(1)
    this.view.alpha = 0
    this.view.scale.set(1)
  }
  destroy(): void {
    this.clear()
    this.view.destroy({
      children: true,
    })
  }
}