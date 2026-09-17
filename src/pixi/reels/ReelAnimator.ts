import { gsap } from 'gsap'
import type { AudioManager } from '../../audio/AudioManager'
import type { SymbolId } from '../../game/math/SpinResult'
import type { ReelSymbolPool } from './ReelSymbolPool'
interface ReelBeat { duration: number; ease: string; audio?: 'spin-start' | 'reel-stop' }
const BEATS: Record<'spinStart' | 'spinning' | 'stopping' | 'land', ReelBeat> = {
  spinStart: { duration: 0.12, ease: 'power2.in', audio: 'spin-start' }, spinning: { duration: 0.62, ease: 'none' },
  stopping: { duration: 0.24, ease: 'power2.out', audio: 'reel-stop' }, land: { duration: 0.12, ease: 'back.out(1.5)' },
}
export class ReelAnimator {
  private pool: ReelSymbolPool
  private audio: AudioManager
  constructor(pool: ReelSymbolPool, audio: AudioManager) { this.pool = pool; this.audio = audio }
  async spin(result: readonly SymbolId[], delay: number): Promise<void> {
    if (delay > 0) await new Promise<void>((resolve) => { gsap.delayedCall(delay, resolve) })
    this.audio.play(BEATS.spinStart.audio)
    await this.scroll(5, BEATS.spinning.duration)
    this.audio.play(BEATS.stopping.audio)
    await this.scroll(2, BEATS.stopping.duration)

    // Apply the authoritative math result only after all recycling is finished.
    // This guarantees the symbols WinEvaluator sees are the symbols the player sees.
    this.pool.applyVisible(result)
    await Promise.all(this.pool.visible(result.length).map((symbol) => symbol.animator.play('land')))
  }
  private scroll(steps: number, duration: number): Promise<void> {
    const proxy = { value: 0 }; let recycled = 0
    return new Promise((resolve) => {
      gsap.to(proxy, { value: steps, duration, ease: 'none', onUpdate: () => {
        const whole = Math.floor(proxy.value)
        while (recycled < whole) { this.pool.recycleOne(); recycled += 1 }
        this.pool.view.y = (proxy.value - whole) * this.pool.pitch
      }, onComplete: () => { this.pool.view.y = 0; resolve() } })
    })
  }
  destroy(): void { gsap.killTweensOf(this.pool.view) }
}
