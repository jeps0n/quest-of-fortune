import { Container } from 'pixi.js'
import { gsap } from 'gsap'
import type { AudioCue, AudioManager } from '../../audio/AudioManager'
interface SymbolBeat { duration: number; scale?: number; alpha?: number; ease?: string; audio?: AudioCue }
const BEATS: Record<'idle' | 'win' | 'bigWin' | 'dim' | 'reset', SymbolBeat> = {
  idle: { duration: 0.15 },
  win: { duration: 0.22, scale: 1.015, ease: 'power2.out', audio: 'symbol-win' },
  bigWin: { duration: 0.34, scale: 1.025, ease: 'power2.out', audio: 'big-win' },
  dim: { duration: 0.22, alpha: 0.58, ease: 'power2.out' },
  reset: { duration: 0.16, scale: 1, alpha: 1, ease: 'power2.out' },
}
export class SymbolAnimator {
  private view: Container
  private audio: AudioManager
  constructor(view: Container, audio: AudioManager) {
    this.view = view
    this.audio = audio
  }
  play(name: keyof typeof BEATS | 'land'): Promise<void> {
    if (name === 'land') return this.land()
    const beat = BEATS[name]
    this.audio.play(beat.audio)
    return new Promise((resolve) => {
      gsap.to(this.view, {
        alpha: beat.alpha ?? this.view.alpha,
        duration: beat.duration,
        ease: beat.ease ?? 'none',
        onComplete: resolve,
      })
      if (beat.scale !== undefined) {
        gsap.to(this.view.scale, {
          x: beat.scale,
          y: beat.scale,
          duration: beat.duration,
          ease: beat.ease ?? 'none',
        })
      }
    })
  }
  private land(): Promise<void> {
    // ReelAnimator supplies the mechanical stop/settle. Keep the symbol itself
    // almost perfectly still so its rectangular cell never appears to inflate.
    gsap.killTweensOf(this.view.scale)
    this.view.scale.set(1)
    return new Promise((resolve) => {
      gsap.fromTo(this.view, { alpha: 0.94 }, { alpha: 1, duration: 0.09, ease: 'power1.out', onComplete: resolve })
    })
  }
  destroy(): void {
    gsap.killTweensOf(this.view)
    gsap.killTweensOf(this.view.scale)
  }
}
