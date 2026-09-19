import { gsap } from 'gsap'
const money = (value: number): string => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export class HudValuePresentation {
  private readonly balanceElement: HTMLElement
  private readonly winElement: HTMLElement
  constructor(
    balanceElement: HTMLElement,
    winElement: HTMLElement,
  ) {
    this.balanceElement = balanceElement
    this.winElement = winElement
  }
  setBalance(
    value: number,
    emphasis: 'wager' | 'payout' | 'none' = 'none',
  ): void {
    this.balanceElement.textContent = money(value)
    if (emphasis === 'none') return
    gsap.killTweensOf(this.balanceElement)
    gsap.fromTo(
      this.balanceElement,
      {
        scale: emphasis === 'wager' ? 0.975 : 1.045,
        filter: 'brightness(1.22)',
      },
      {
        scale: 1,
        filter: 'brightness(1)',
        duration: emphasis === 'wager' ? 0.24 : 0.34,
        ease: 'power2.out',
        overwrite: true,
      },
    )
  }
  resetWin(): void {
    gsap.killTweensOf(this.winElement)
    gsap.set(this.winElement, {
      scale: 1,
      filter: 'brightness(1)',
    })
    this.winElement.textContent = '$0.00'
  }
  showWin(value: number): void {
    gsap.killTweensOf(this.winElement)
    const counter = { value: 0 }
    this.winElement.textContent = '$0.00'
    gsap.fromTo(
      this.winElement,
      {
        scale: 1.07,
        filter: 'brightness(1.38)',
      },
      {
        scale: 1,
        filter: 'brightness(1)',
        duration: 0.42,
        ease: 'power2.out',
        overwrite: true,
      },
    )
    gsap.to(counter, {
      value,
      duration: 0.42,
      ease: 'power2.out',
      onUpdate: () => {
        this.winElement.textContent = money(counter.value)
      },
      onComplete: () => {
        this.winElement.textContent = money(value)
      },
    })
  }
  destroy(): void {
    gsap.killTweensOf(this.balanceElement)
    gsap.killTweensOf(this.winElement)
  }
}