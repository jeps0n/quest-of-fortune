import { gsap } from 'gsap'
export class StartupPresentation {
  private motion: HTMLElement
  private aura: HTMLElement
  private wipe: HTMLElement
  private timeline: gsap.core.Timeline | null = null
  private stage: HTMLElement | null
  private previousStageOverflow = ''
  constructor(motion: HTMLElement, aura: HTMLElement, wipe: HTMLElement) {
    this.motion = motion
    this.aura = aura
    this.wipe = wipe
    this.stage = motion.closest<HTMLElement>('.game-stage')
  }
  async play(): Promise<void> {
    // The fixed 1200x800 stage normally clips everything to the gameplay surface.
    // During startup only, let the physical cabinet overshoot that boundary so the
    // crown can expand upward with the sides and base. The inner magic layer keeps
    // its own clipping, and the stage's normal overflow is restored on completion.
    if (this.stage) {
      this.previousStageOverflow = this.stage.style.overflow
      this.stage.style.overflow = 'visible'
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.motion.style.visibility = 'visible'
      this.motion.style.opacity = '1'
      this.motion.style.pointerEvents = ''
      this.restoreStageOverflow()
      return
    }
    this.motion.style.pointerEvents = 'none'
    gsap.set(this.motion, {
      autoAlpha: 0,
      y: 20,
      scale: 0.962,
      filter: 'brightness(0.64) saturate(0.76)',
      transformOrigin: '50% 52%',
    })
    gsap.set(this.aura, {
      autoAlpha: 0,
      scaleX: 0.82,
      scaleY: 0.76,
      x: -18,
      y: 10,
      rotate: -1.5,
    })
    gsap.set(this.wipe, { autoAlpha: 0, xPercent: -430, rotate: -8 })
    // Keep the curtain down until the fully assembled DOM + Pixi scene has
    // reached the renderer. The reveal is presentation only; gameplay is ready.
    await this.nextPaint()
    await this.nextPaint()
    await new Promise<void>((resolve) => {
      this.timeline = gsap.timeline({
        onComplete: () => {
          gsap.set(this.motion, { clearProps: 'transform,filter' })
          gsap.set(this.aura, { clearProps: 'transform,opacity,visibility' })
          gsap.set(this.wipe, { clearProps: 'transform,opacity,visibility' })
          this.motion.style.visibility = 'visible'
          this.motion.style.opacity = '1'
          this.motion.style.pointerEvents = ''
          this.restoreStageOverflow()
          this.timeline = null
          resolve()
        },
      })
      this.timeline
        .set(this.motion, { visibility: 'visible' })
        // Beat 1: the completed cabinet arrives as one physical object.
        .to(this.motion, {
          autoAlpha: 1,
          y: -4,
          scale: 1.008,
          filter: 'brightness(0.90) saturate(0.92)',
          duration: 0.46,
          ease: 'power3.out',
        })
        // Beat 2: a soft gold-and-purple rounded-rectangle bloom wakes inside
        // the cabinet, filling its footprint while remaining fully clipped.
        .to(this.aura, {
          autoAlpha: 0.72,
          scaleX: 1.01,
          scaleY: 1.00,
          x: 0,
          y: 0,
          rotate: 0,
          duration: 0.34,
          ease: 'power3.out',
        }, 0.16)
        .to(this.aura, {
          autoAlpha: 0.84,
          scaleX: 1.055,
          scaleY: 1.045,
          duration: 0.20,
          ease: 'sine.out',
        }, 0.43)
        // Beat 3: a slightly broader gold-and-purple wipe crosses the entire cabinet.
        // Its parent clips it, so the light reaches the edge without overshooting.
        .to(this.wipe, {
          autoAlpha: 0.54,
          duration: 0.09,
          ease: 'power1.out',
        }, 0.61)
        .to(this.wipe, {
          xPercent: 430,
          duration: 0.52,
          ease: 'power2.inOut',
        }, 0.61)
        .to(this.wipe, {
          autoAlpha: 0,
          duration: 0.13,
          ease: 'power2.in',
        }, 1.02)
        .to(this.motion, {
          filter: 'brightness(1.045) saturate(1.07)',
          duration: 0.13,
          ease: 'power2.out',
        }, 0.84)
        // Beat 4: the bloom breathes out instead of exploding past the frame.
        .to(this.aura, {
          autoAlpha: 0,
          scaleX: 1.09,
          scaleY: 1.075,
          duration: 0.43,
          ease: 'power2.inOut',
        }, 0.91)
        // Beat 5: physical settle. Magic disappears; cabinet geometry returns
        // exactly to its locked resting state.
        .to(this.motion, {
          y: 0,
          scale: 1,
          filter: 'brightness(1) saturate(1)',
          duration: 0.36,
          ease: 'back.out(2.0)',
        }, 1.00)
    })
  }
  destroy(): void {
    this.timeline?.kill()
    this.timeline = null
    gsap.killTweensOf(this.motion)
    gsap.killTweensOf(this.aura)
    gsap.killTweensOf(this.wipe)
    this.restoreStageOverflow()
  }
  private restoreStageOverflow(): void {
    if (!this.stage) return
    this.stage.style.overflow = this.previousStageOverflow
  }
  private nextPaint(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()))
  }
}
