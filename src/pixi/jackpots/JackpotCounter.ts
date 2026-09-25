import { gsap } from 'gsap'
const money = (value: number): string => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
// DOM-backed meter presenter. `animate` interpolates display text only; callers
// remain responsible for deciding the actual jackpot value and reset semantics.
export class JackpotCounter {
  private element: HTMLElement
  constructor(element: HTMLElement) { this.element = element }
  set(value: number): void {
    gsap.killTweensOf(this.element)
    gsap.set(this.element, { scale: 1 })
    this.element.textContent = money(value)
  }
  animate(from: number, to: number): Promise<void> {
    const state = { value: from }
    gsap.killTweensOf(this.element)
    gsap.killTweensOf(state)
    return new Promise((resolve) => {
      gsap.to(this.element, { scale: 1.045, duration: 0.16, ease: 'power2.out' })
      gsap.to(state, {
        value: to,
        duration: 0.75,
        ease: 'power2.out',
        onUpdate: () => { this.element.textContent = money(state.value) },
        onComplete: () => {
          this.element.textContent = money(to)
          gsap.to(this.element, { scale: 1, duration: 0.22, ease: 'back.out(2)' })
          resolve()
        },
      })
    })
  }
}
