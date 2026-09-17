import { gsap } from 'gsap'
import type { AudioManager } from '../../audio/AudioManager'
import type { SymbolId } from '../../game/math/SpinResult'
import type { ReelSymbolPool } from './ReelSymbolPool'
interface MotionBeat { steps: number; duration: number; ease: string }
const MOTION = {
  accelerate: { steps: 2, duration: 0.16, ease: 'power2.in' },
  cruise: { steps: 8, duration: 0.54, ease: 'none' },
  // Six final pitches give all four authoritative result symbols enough
  // runway to enter through the clipped edge instead of being repainted at rest.
  brake: { steps: 6, duration: 0.42, ease: 'power3.out' },
} satisfies Record<string, MotionBeat>
export class ReelAnimator {
  private pool: ReelSymbolPool
  private audio: AudioManager
  constructor(pool: ReelSymbolPool, audio: AudioManager) {
    this.pool = pool
    this.audio = audio
  }
  async spin(result: readonly SymbolId[], delay: number): Promise<void> {
    if (delay > 0) {
      await new Promise<void>((resolve) => { gsap.delayedCall(delay, resolve) })
    }
    this.audio.play('spin-start')
    // One continuous-feeling reel cycle: accelerate, cruise, then visibly
    // decelerate. Every phase travels an exact number of symbol pitches so
    // the pool always returns to the locked -pitch resting alignment.
    await this.scroll(MOTION.accelerate)
    await this.scroll(MOTION.cruise)
    await this.scrollResultIntoView(MOTION.brake, result)
    this.audio.play('reel-stop')
    // The authoritative symbols are already physically in their final rows.
    // There is intentionally no applyVisible() here: repainting at rest is the
    // visual handoff we want to eliminate.
    this.pool.view.y = -this.pool.pitch
    // A restrained mechanical settle. It never changes the final row geometry
    // and the mask continues to clip the reel throughout the motion.
    await new Promise<void>((resolve) => {
      gsap.fromTo(
        this.pool.view,
        { y: -this.pool.pitch - 3 },
        { y: -this.pool.pitch, duration: 0.11, ease: 'power2.out', onComplete: resolve },
      )
    })
    await Promise.all(this.pool.visible(result.length).map((symbol) => symbol.animator.play('land')))
  }
  /**
   * Final deceleration pass. Result symbols are fed into recycled cells while
   * they are still outside the clipped viewport, then physically travel into
   * rows 0..3. At rest, visible indices 1..4 already contain the math result.
   */
  private scrollResultIntoView(beat: MotionBeat, result: readonly SymbolId[]): Promise<void> {
    const proxy = { value: 0 }
    let recycled = 0
    return new Promise((resolve) => {
      gsap.to(proxy, {
        value: beat.steps,
        duration: beat.duration,
        ease: beat.ease,
        onUpdate: () => {
          const whole = Math.floor(proxy.value)
          while (recycled < whole) {
            const step = recycled + 1
            // A symbol inserted at this step finishes at index (steps - step).
            // Visible result rows live at pool indices 1..4.
            const finalIndex = beat.steps - step
            const resultRow = finalIndex - 1
            const stagedId = resultRow >= 0 && resultRow < result.length
              ? result[resultRow]
              : undefined
            this.pool.recycleOne(stagedId)
            recycled += 1
          }
          this.pool.view.y = -this.pool.pitch + (proxy.value - whole) * this.pool.pitch
        },
        onComplete: () => {
          // Guarantee the final recycle even if the tween's last onUpdate lands
          // microscopically below the integer endpoint.
          while (recycled < beat.steps) {
            const step = recycled + 1
            const finalIndex = beat.steps - step
            const resultRow = finalIndex - 1
            const stagedId = resultRow >= 0 && resultRow < result.length
              ? result[resultRow]
              : undefined
            this.pool.recycleOne(stagedId)
            recycled += 1
          }
          this.pool.view.y = -this.pool.pitch
          resolve()
        },
      })
    })
  }
  private scroll(beat: MotionBeat): Promise<void> {
    const proxy = { value: 0 }
    let recycled = 0
    return new Promise((resolve) => {
      gsap.to(proxy, {
        value: beat.steps,
        duration: beat.duration,
        ease: beat.ease,
        onUpdate: () => {
          const whole = Math.floor(proxy.value)
          while (recycled < whole) {
            this.pool.recycleOne()
            recycled += 1
          }
          this.pool.view.y = -this.pool.pitch + (proxy.value - whole) * this.pool.pitch
        },
        onComplete: () => {
          this.pool.view.y = -this.pool.pitch
          resolve()
        },
      })
    })
  }
  destroy(): void {
    gsap.killTweensOf(this.pool.view)
  }
}
