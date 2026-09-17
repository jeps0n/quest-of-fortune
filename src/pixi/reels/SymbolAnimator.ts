import { Container } from 'pixi.js'
import { gsap } from 'gsap'
import type { AudioCue, AudioManager } from '../../audio/AudioManager'

interface SymbolBeat { duration: number; scale?: number; alpha?: number; ease?: string; audio?: AudioCue }
const BEATS: Record<'idle' | 'land' | 'win' | 'bigWin' | 'dim' | 'reset', SymbolBeat> = {
  idle: { duration: 0.15 }, land: { duration: 0.16, scale: 1.04, ease: 'back.out(1.5)' },
  win: { duration: 0.34, scale: 1.10, ease: 'power2.out', audio: 'symbol-win' },
  bigWin: { duration: 0.55, scale: 1.16, ease: 'back.out(1.8)', audio: 'big-win' },
  dim: { duration: 0.2, alpha: 0.28 }, reset: { duration: 0.18, scale: 1, alpha: 1, ease: 'power2.out' },
}

export class SymbolAnimator {
  private view: Container
  private audio: AudioManager
  constructor(view: Container, audio: AudioManager) { this.view = view; this.audio = audio }
  play(name: keyof typeof BEATS): Promise<void> {
    const beat = BEATS[name]
    this.audio.play(beat.audio)
    return new Promise((resolve) => {
      gsap.to(this.view, { alpha: beat.alpha ?? this.view.alpha, duration: beat.duration, ease: beat.ease ?? 'none', onComplete: resolve })
      if (beat.scale !== undefined) gsap.to(this.view.scale, { x: beat.scale, y: beat.scale, duration: beat.duration, ease: beat.ease ?? 'none' })
    })
  }
  destroy(): void { gsap.killTweensOf(this.view); gsap.killTweensOf(this.view.scale) }
}
