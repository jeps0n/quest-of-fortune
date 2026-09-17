import { Container, Graphics } from 'pixi.js'
import { gsap } from 'gsap'
import type { AudioManager } from '../../audio/AudioManager'
import { QUEST_LAYOUT } from '../../config/QuestLayout'
export class ContributeAnimation {
  readonly view = new Container({ label: 'contribute-animation' })
  private audio: AudioManager
  constructor(audio: AudioManager) { this.audio = audio }
  async play(majorAmount: number, grandAmount: number): Promise<void> {
    if (majorAmount <= 0 && grandAmount <= 0) return
    this.audio.play('contribute')
    await Promise.all([
      this.flyTo(QUEST_LAYOUT.jackpotTargets.major.x, QUEST_LAYOUT.jackpotTargets.major.y, majorAmount),
      this.flyTo(QUEST_LAYOUT.jackpotTargets.grand.x, QUEST_LAYOUT.jackpotTargets.grand.y, grandAmount),
    ])
  }
  private flyTo(x: number, y: number, amount: number): Promise<void> {
    if (amount <= 0) return Promise.resolve()
    const orb = new Graphics().circle(0, 0, 8).fill({ color: 0xffd86b, alpha: 0.96 })
    orb.position.set(600, 640); this.view.addChild(orb)
    return new Promise((resolve) => { gsap.to(orb, { x, y, alpha: 0.15, duration: 0.7, ease: 'power2.inOut', onComplete: () => { orb.destroy(); resolve() } }) })
  }
  destroy(): void { this.view.destroy({ children: true }) }
}
