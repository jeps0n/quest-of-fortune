import type { AudioManager } from '../audio/AudioManager'
import { persistJackpots, type JackpotState } from '../data/JackpotRepository'
import { createSpinResult } from './math/SpinResult'
import { evaluateWins, type JackpotTier, type Win, type WinEvaluation } from './math/WinEvaluator'
import { GameState } from './GameState'
import type { ReelSet } from '../pixi/reels/ReelSet'
import type { SpinButton } from '../pixi/controls/SpinButton'
import type { ContributeAnimation } from '../pixi/jackpots/ContributeAnimation'
import type { JackpotCounter } from '../pixi/jackpots/JackpotCounter'
import type { PresentationDirector } from '../presentation/PresentationDirector'
interface GameHud { message: HTMLElement; win: HTMLElement; balance: HTMLElement }
const BET = 1
const MINI_AWARD = 20
const MINOR_AWARD = 50
const MAJOR_SEED = 100
const GRAND_SEED = 500
const PROGRESSIVE_RATE = 0.02
const MAJOR_SHARE = 0.5
const STARTING_BALANCE = 100
const money = (value: number): string => `$${value.toFixed(2)}`
export class Game {
  private state = new GameState()
  private jackpots: JackpotState
  private reels: ReelSet
  private spinButton: SpinButton
  private contributeFx: ContributeAnimation
  private majorCounter: JackpotCounter
  private grandCounter: JackpotCounter
  private presentation: PresentationDirector
  private hud: GameHud
  private audio: AudioManager
  private balance = STARTING_BALANCE
  constructor(reels: ReelSet, spinButton: SpinButton, contributeFx: ContributeAnimation, majorCounter: JackpotCounter, grandCounter: JackpotCounter, presentation: PresentationDirector, jackpots: JackpotState, hud: GameHud, audio: AudioManager) {
    this.reels = reels; this.spinButton = spinButton; this.contributeFx = contributeFx; this.majorCounter = majorCounter; this.grandCounter = grandCounter; this.presentation = presentation; this.jackpots = jackpots; this.hud = hud; this.audio = audio
    this.hud.balance.textContent = money(this.balance)
  }
  async spin(): Promise<void> {
    if (!this.state.canSpin) return
    this.state.set('spinning')
    this.spinButton.setEnabled(false)
    this.presentation.clear()
    this.hud.message.textContent = 'SPINNING…'
    this.hud.win.textContent = '$0.00'
    this.balance = Number((this.balance - BET).toFixed(2))
    this.hud.balance.textContent = money(this.balance)
    const contribution = this.getContributionAmounts()
    await this.previewContribution(contribution.major, contribution.grand)
    await this.reels.resetSymbols()
    const result = createSpinResult()
    await this.reels.spin(result)
    const evaluation = evaluateWins(result, BET)
    const jackpotLabels = await this.resolveJackpotAwards(evaluation)
    if (evaluation.wins.length > 0) {
      this.state.set('win')
      this.balance = Number((this.balance + evaluation.totalPayout).toFixed(2))
      this.hud.balance.textContent = money(this.balance)
      this.hud.win.textContent = money(evaluation.totalPayout)
    }
    await this.presentation.present(evaluation)
    await this.settleContribution(contribution.major, contribution.grand)
    this.hud.message.textContent = this.buildSpinMessage(evaluation, contribution.major, contribution.grand, jackpotLabels)
    this.finish()
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
  private getContributionAmounts(): { major: number; grand: number } {
    const total = Number((BET * PROGRESSIVE_RATE).toFixed(2))
    const major = Number((total * MAJOR_SHARE).toFixed(2))
    const grand = Number((total - major).toFixed(2))
    return { major, grand }
  }
  private async previewContribution(major: number, grand: number): Promise<void> {
    if (major <= 0 && grand <= 0) return
    // Presentation only: show the wager contribution before the reels move.
    // The authoritative jackpot state is settled after result evaluation so
    // jackpot payout/reset ordering remains mathematically unchanged.
    const majorFrom = this.jackpots.majorValue
    const grandFrom = this.jackpots.grandValue
    await Promise.all([
      this.contributeFx.play(major, grand),
      this.majorCounter.animate(majorFrom, Number((majorFrom + major).toFixed(2))),
      this.grandCounter.animate(grandFrom, Number((grandFrom + grand).toFixed(2))),
    ])
  }
  private async settleContribution(major: number, grand: number): Promise<void> {
    if (major <= 0 && grand <= 0) return
    // Keep the original accounting order: resolve any jackpot first, then
    // add this spin's contribution to the resulting meter state.
    this.jackpots = {
      majorValue: Number((this.jackpots.majorValue + major).toFixed(2)),
      grandValue: Number((this.jackpots.grandValue + grand).toFixed(2)),
    }
    await persistJackpots(this.jackpots)
  }
  private buildSpinMessage(evaluation: WinEvaluation, major: number, grand: number, jackpots: JackpotTier[]): string {
    if (jackpots.length > 0) {
      const jackpotWins = evaluation.wins.filter((win) => win.jackpot)
      const details = jackpotWins.map((win) => `${win.jackpot!.toUpperCase()} • ${win.count} ${win.symbol} • ${money(win.payout)}`).join(' + ')
      return `JACKPOT! ${details} • TOTAL +${money(evaluation.totalPayout)}`
    }
    if (evaluation.wins.length === 0) {
      return `NO WIN • BET ${money(BET)} • MAJOR +${money(major)} • GRAND +${money(grand)}`
    }
    if (evaluation.wins.length === 1) return this.describeSingleWin(evaluation.wins[0])
    const visibleDetails = evaluation.wins.slice(0, 4).map((win) =>
      `L${win.lineIndex + 1} ${win.symbol}×${win.count} ${win.payout.toFixed(2)}×`,
    )
    const remainder = evaluation.wins.length > 4 ? ` • +${evaluation.wins.length - 4} MORE` : ''
    return `${evaluation.wins.length} WINS • ${visibleDetails.join(' • ')}${remainder} • TOTAL +${money(evaluation.totalPayout)}`
  }
  private describeSingleWin(win: Win): string {
    return `WIN • LINE ${win.lineIndex + 1} • ${win.symbol} ×${win.count} • ${win.payout.toFixed(2)}× • +${money(win.payout)}`
  }
  private finish(): void { this.state.set('idle'); this.spinButton.setEnabled(true) }
  destroy(): void {
    this.audio.destroy()
  }
}
