import { Container } from 'pixi.js'
import { gsap } from 'gsap'
import type { AudioManager } from '../../audio/AudioManager'
type SymbolBeat = 'idle' | 'win' | 'bigWin' | 'dim' | 'reset'
/**
 * Presentation-only symbol motion. Reel geometry never moves: every beat acts
 * on the centered QuestSymbol container and always resolves back to scale 1.
 */
export class SymbolAnimator {
  private view: Container
  private audio: AudioManager
  constructor(view: Container, audio: AudioManager) {
    this.view = view
    this.audio = audio
  }
  play(name: SymbolBeat | 'land', delay = 0): Promise<void> {
    if (name === 'land') return this.land()
    this.killMotion()
    switch (name) {
      case 'win':
        return this.winBeat(delay)
      case 'bigWin':
        return this.bigWinBeat(delay)
      case 'dim':
        return this.dim(delay)
      case 'reset':
        return this.reset(delay)
      case 'idle':
      default:
        return this.idle(delay)
    }
  }
  private winBeat(delay: number): Promise<void> {
    this.audio.play('symbol-win')
    return new Promise((resolve) => {
      const tl = gsap.timeline({ delay, onComplete: resolve })
      // Fast readable hit, tiny recoil, then a confident settle. The second
      // pulse keeps ordinary wins alive without turning them into a character
      // celebration.
      tl.to(this.view.scale, {
        x: 1.115,
        y: 1.115,
        duration: 0.105,
        ease: 'power3.out',
      })
        .to(this.view.scale, {
          x: 0.985,
          y: 0.985,
          duration: 0.09,
          ease: 'power2.inOut',
        })
        .to(this.view.scale, {
          x: 1.055,
          y: 1.055,
          duration: 0.11,
          ease: 'power2.out',
        })
        .to(this.view.scale, {
          x: 1,
          y: 1,
          duration: 0.24,
          ease: 'back.out(2.2)',
        })
    })
  }
  private bigWinBeat(delay: number): Promise<void> {
    this.audio.play('big-win')
    return new Promise((resolve) => {
      const tl = gsap.timeline({ delay, onComplete: resolve })
      // HIGH symbols get a heavier anticipation/impact beat before the
      // dedicated character stage takes over.
      tl.to(this.view.scale, {
        x: 0.955,
        y: 0.955,
        duration: 0.08,
        ease: 'power2.in',
      })
        .to(this.view.scale, {
          x: 1.16,
          y: 1.16,
          duration: 0.14,
          ease: 'back.out(1.7)',
        })
        .to(this.view, {
          alpha: 0.82,
          duration: 0.07,
          ease: 'power1.inOut',
        }, '<0.04')
        .to(this.view, {
          alpha: 1,
          duration: 0.11,
          ease: 'power1.out',
        })
        .to(this.view.scale, {
          x: 1,
          y: 1,
          duration: 0.28,
          ease: 'back.out(2.4)',
        }, '<0.02')
    })
  }
  private dim(delay: number): Promise<void> {
    return new Promise((resolve) => {
      gsap.to(this.view, {
        alpha: 0.34,
        duration: 0.24,
        delay,
        ease: 'power2.out',
        onComplete: resolve,
      })
    })
  }
  private reset(delay: number): Promise<void> {
    return new Promise((resolve) => {
      const tl = gsap.timeline({ delay, onComplete: resolve })
      tl.to(this.view, {
        alpha: 1,
        duration: 0.14,
        ease: 'power2.out',
      })
        .to(this.view.scale, {
          x: 1,
          y: 1,
          duration: 0.16,
          ease: 'power2.out',
        }, '<')
    })
  }
  private idle(delay: number): Promise<void> {
    return new Promise((resolve) => {
      gsap.to(this.view, {
        alpha: 1,
        duration: 0.15,
        delay,
        ease: 'power1.out',
        onComplete: resolve,
      })
    })
  }
  private land(): Promise<void> {
    // ReelAnimator owns the mechanical stop/settle. Keep the symbol itself
    // almost perfectly still so the rectangular cell never appears to inflate.
    this.killMotion()
    this.view.alpha = 1
    this.view.scale.set(1)
    return new Promise((resolve) => {
      gsap.fromTo(
        this.view,
        { alpha: 0.94 },
        {
          alpha: 1,
          duration: 0.09,
          ease: 'power1.out',
          onComplete: resolve,
        },
      )
    })
  }
  private killMotion(): void {
    gsap.killTweensOf(this.view)
    gsap.killTweensOf(this.view.scale)
  }
  destroy(): void {
    this.killMotion()
  }
}
