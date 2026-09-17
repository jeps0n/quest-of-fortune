import type { AudioManager } from '../audio/AudioManager'
import { persistJackpots, type JackpotState } from '../data/JackpotRepository'
import { createSpinResult } from './math/SpinResult'
import { evaluateWins, type JackpotTier, type WinEvaluation } from './math/WinEvaluator'
import { GameState } from './GameState'
import type { ReelSet } from '../pixi/reels/ReelSet'
import type { SpinButton } from '../pixi/controls/SpinButton'
import type { ContributeAnimation } from '../pixi/jackpots/ContributeAnimation'
import type { JackpotCounter } from '../pixi/jackpots/JackpotCounter'
interface GameHud { message: HTMLElement; win: HTMLElement }

const BET = 1
const MINI_AWARD = 20
const MINOR_AWARD = 50
const MAJOR_SEED = 100
const GRAND_SEED = 500
const PROGRESSIVE_RATE = 0.02
const MAJOR_SHARE = 0.5
const money = (value: number): string => `$${value.toFixed(2)}`

export class Game {
  private state = new GameState()
  private jackpots: JackpotState
  private reels: ReelSet
  private spinButton: SpinButton
  private contributeFx: ContributeAnimation
  private majorCounter: JackpotCounter
  private grandCounter: JackpotCounter
  private hud: GameHud
  private audio: AudioManager

  constructor(reels: ReelSet, spinButton: SpinButton, contributeFx: ContributeAnimation, majorCounter: JackpotCounter, grandCounter: JackpotCounter, jackpots: JackpotState, hud: GameHud, audio: AudioManager) {
    this.reels = reels; this.spinButton = spinButton; this.contributeFx = contributeFx; this.majorCounter = majorCounter; this.grandCounter = grandCounter; this.jackpots = jackpots; this.hud = hud; this.audio = audio
  }

  async spin(): Promise<void> {
    if (!this.state.canSpin) return
    this.state.set('spinning'); this.spinButton.setEnabled(false); this.hud.message.textContent = 'SPINNING…'; this.hud.win.textContent = '$0.00'
    await this.reels.resetSymbols()

    const result = createSpinResult()
    await this.reels.spin(result)
    const evaluation = evaluateWins(result, BET)
    const jackpotLabels = await this.resolveJackpotAwards(evaluation)

    if (evaluation.wins.length > 0) {
      this.state.set('win')
      this.hud.win.textContent = money(evaluation.totalPayout)
      await this.reels.presentWins(evaluation.wins.flatMap((win) => win.positions))
    }

    const contribution = await this.contribute()
    this.hud.message.textContent = this.buildSpinMessage(evaluation.totalPayout, contribution.major, contribution.grand, jackpotLabels)

    window.setTimeout(() => { void this.reels.resetSymbols(); this.finish() }, 700)
  }

  private async resolveJackpotAwards(evaluation: WinEvaluation): Promise<JackpotTier[]> {
    const awarded = new Set<JackpotTier>()
    const resetAnimations: Promise<void>[] = []

    for (const win of evaluation.wins) {
      if (!win.jackpot || awarded.has(win.jackpot)) continue
      awarded.add(win.jackpot)

      switch (win.jackpot) {
        case 'mini':
          win.payout = MINI_AWARD
          break
        case 'minor':
          win.payout = MINOR_AWARD
          break
        case 'major': {
          const from = this.jackpots.majorValue
          win.payout = from
          this.jackpots = { ...this.jackpots, majorValue: MAJOR_SEED }
          resetAnimations.push(this.majorCounter.animate(from, MAJOR_SEED))
          break
        }
        case 'grand': {
          const from = this.jackpots.grandValue
          win.payout = from
          this.jackpots = { ...this.jackpots, grandValue: GRAND_SEED }
          resetAnimations.push(this.grandCounter.animate(from, GRAND_SEED))
          break
        }
      }
    }

    evaluation.totalPayout = evaluation.wins.reduce((sum, win) => sum + win.payout, 0)
    if (resetAnimations.length > 0) await Promise.all(resetAnimations)
    return [...awarded]
  }

  private async contribute(): Promise<{ major: number; grand: number }> {
    const total = Number((BET * PROGRESSIVE_RATE).toFixed(2))
    const major = Number((total * MAJOR_SHARE).toFixed(2))
    const grand = Number((total - major).toFixed(2))
    if (total <= 0) return { major: 0, grand: 0 }

    this.state.set('contributing')
    const majorFrom = this.jackpots.majorValue
    const grandFrom = this.jackpots.grandValue
    this.jackpots = {
      majorValue: Number((majorFrom + major).toFixed(2)),
      grandValue: Number((grandFrom + grand).toFixed(2)),
    }

    const persistence = persistJackpots(this.jackpots)
    await Promise.all([
      persistence,
      this.contributeFx.play(major, grand),
      this.majorCounter.animate(majorFrom, this.jackpots.majorValue),
      this.grandCounter.animate(grandFrom, this.jackpots.grandValue),
    ])
    return { major, grand }
  }

  private buildSpinMessage(win: number, major: number, grand: number, jackpots: JackpotTier[]): string {
    const outcome = win > 0 ? `WIN ${money(win)}` : 'NO WIN'
    const jackpot = jackpots.length > 0 ? ` • ${jackpots.map((tier) => `${tier.toUpperCase()} JACKPOT`).join(' + ')}` : ''
    return `BET ${money(BET)} • ${outcome}${jackpot} • MAJOR +${money(major)} • GRAND +${money(grand)}`
  }

  private finish(): void { this.state.set('idle'); this.spinButton.setEnabled(true) }
  destroy(): void { void this.audio }
}
