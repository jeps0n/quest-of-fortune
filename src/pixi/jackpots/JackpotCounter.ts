import { gsap } from 'gsap'
export class JackpotCounter {
  private element: HTMLElement
  constructor(element: HTMLElement) { this.element = element }
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
        onUpdate: () => { this.element.textContent = `$${state.value.toFixed(2)}` },
        onComplete: () => {
          gsap.to(this.element, { scale: 1, duration: 0.22, ease: 'back.out(2)' })
          resolve()
        },
      })
    })
  }
}
