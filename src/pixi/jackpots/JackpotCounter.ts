import { gsap } from 'gsap'
export class JackpotCounter {
  private element: HTMLElement
  constructor(element: HTMLElement) { this.element = element }
  animate(from: number, to: number): Promise<void> { const state = { value: from }; return new Promise((resolve) => { gsap.to(state, { value: to, duration: 0.75, ease: 'power2.out', onUpdate: () => { this.element.textContent = `$${state.value.toFixed(2)}` }, onComplete: resolve }) }) }
}
