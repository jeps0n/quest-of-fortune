import type { JackpotState } from '../data/JackpotRepository'
import { requestAuthoritativeSpin, type AuthoritativeSpinResponse } from '../data/SpinApi'
import { createSpinResult } from './math/SpinResult'
import { evaluateWins, type JackpotTier, type Win, type WinEvaluation } from './math/WinEvaluator'
import { GameState } from './GameState'
import type { ReelSet } from '../pixi/reels/ReelSet'
import type { SpinButton } from '../pixi/controls/SpinButton'
import type { ContributeAnimation } from '../pixi/jackpots/ContributeAnimation'
import type { JackpotCounter } from '../pixi/jackpots/JackpotCounter'
import type { PresentationDirector } from '../presentation/PresentationDirector'
import { HudValuePresentation } from '../presentation/HudValuePresentation'
import type { SpinOverride } from '../dev/SpinOverride'
interface GameHud { message: HTMLElement; win: HTMLElement; balance: HTMLElement }
const BET = 1
const MINI_AWARD = 20
const MINOR_AWARD = 50
const MAJOR_SEED = 100
const GRAND_SEED = 500
const PROGRESSIVE_RATE = 0.02
const MAJOR_SHARE = 0.5
const STARTING_BALANCE = 100
const money = (value: number): string => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
  private hudValues: HudValuePresentation
  private spinOverride: SpinOverride | null
  private balance = STARTING_BALANCE
  constructor(reels: ReelSet, spinButton: SpinButton, contributeFx: ContributeAnimation, majorCounter: JackpotCounter, grandCounter: JackpotCounter, presentation: PresentationDirector, jackpots: JackpotState, hud: GameHud, spinOverride: SpinOverride | null = null) {
    this.reels = reels; this.spinButton = spinButton; this.contributeFx = contributeFx; this.majorCounter = majorCounter; this.grandCounter = grandCounter; this.presentation = presentation; this.jackpots = jackpots; this.hud = hud; this.spinOverride = spinOverride
    this.hudValues = new HudValuePresentation(hud.balance, hud.win)
    this.hudValues.setBalance(this.balance)
  }
  // Owns the runtime transaction boundary for a spin: obtain/construct the result,
  // present the wager and progressive contribution, resolve awards, then reconcile
  // the UI to the authoritative jackpot snapshot before returning to idle.
  async spin(): Promise<void> {
    if (!this.state.canSpin) return
    this.state.set('spinning')
    this.spinButton.setEnabled(false)
    this.presentation.clear()
    this.hud.message.textContent = 'SPINNING…'
    this.hudValues.resetWin()
    const demoArmed = this.spinOverride?.selection !== null
    let authoritative: AuthoritativeSpinResponse | null = null
    let result
    let evaluation: WinEvaluation
    if (demoArmed) {
      const baseResult = createSpinResult()
      result = this.spinOverride!.consume(baseResult)
      evaluation = evaluateWins(result, BET)
    } else {
      try {
        authoritative = await requestAuthoritativeSpin()
      } catch (error) {
        console.error('Authoritative spin failed:', error)
        this.hud.message.textContent = 'SPIN FAILED • TRY AGAIN'
        this.finish()
        return
      }
      result = authoritative.result
      evaluation = authoritative.evaluation
    }
    this.balance = Number((this.balance - BET).toFixed(2))
    this.hudValues.setBalance(this.balance, 'wager')
    const contribution = this.getContributionAmounts()
    // Progressive meters visually receive this wager's contribution before the
    // result resolves, so a progressive award includes the current spin's share.
    await this.previewContribution(contribution.major, contribution.grand)
    await this.reels.resetSymbols()
    await this.reels.spin(result)
    const jackpotLabels = demoArmed
      ? await this.resolveJackpotAwards(evaluation, contribution.major, contribution.grand)
      : this.jackpotLabels(evaluation)
    if (evaluation.wins.length > 0) {
      this.state.set('win')
      this.balance = Number((this.balance + evaluation.totalPayout).toFixed(2))
      this.hudValues.setBalance(this.balance, 'payout')
      this.hudValues.showWin(evaluation.totalPayout)
    }
    if (evaluation.wins.length > 0) {
      this.hud.message.textContent = 'WIN!'
    }
    await this.presentation.present(evaluation)
    await this.resetAwardedProgressiveCounters(jackpotLabels, evaluation)
    if (authoritative) {
      this.applyAuthoritativeJackpotState(authoritative)
    } else {
      await this.settleDemoContribution(contribution.major, contribution.grand, jackpotLabels)
    }
    this.hud.message.textContent = this.buildSpinMessage(evaluation, contribution.major, contribution.grand, jackpotLabels)
    this.finish()
  }
  // Demo selections bypass the server, so they reproduce the same contribution-
  // before-payout/reset semantics locally without changing the production path.
  private async resolveJackpotAwards(
    evaluation: WinEvaluation,
    majorContribution: number,
    grandContribution: number,
  ): Promise<JackpotTier[]> {
    const awarded = new Set<JackpotTier>()
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
          const postContributionValue = Number((this.jackpots.majorValue + majorContribution).toFixed(2))
          win.payout = postContributionValue
          this.jackpots = { ...this.jackpots, majorValue: MAJOR_SEED }
          break
        }
        case 'grand': {
          const postContributionValue = Number((this.jackpots.grandValue + grandContribution).toFixed(2))
          win.payout = postContributionValue
          this.jackpots = { ...this.jackpots, grandValue: GRAND_SEED }
          break
        }
      }
    }
    evaluation.totalPayout = evaluation.wins.reduce((sum, win) => sum + win.payout, 0)
    return [...awarded]
  }
  private async resetAwardedProgressiveCounters(jackpots: readonly JackpotTier[], evaluation: WinEvaluation): Promise<void> {
    const tasks: Promise<void>[] = []
    if (jackpots.includes('major')) {
      const award = evaluation.wins.find((win) => win.jackpot === 'major')?.payout ?? MAJOR_SEED
      tasks.push(this.majorCounter.animate(award, MAJOR_SEED))
    }
    if (jackpots.includes('grand')) {
      const award = evaluation.wins.find((win) => win.jackpot === 'grand')?.payout ?? GRAND_SEED
      tasks.push(this.grandCounter.animate(award, GRAND_SEED))
    }
    if (tasks.length > 0) await Promise.all(tasks)
  }
  private jackpotLabels(evaluation: WinEvaluation): JackpotTier[] {
    return [...new Set(
      evaluation.wins
        .map((win) => win.jackpot)
        .filter((jackpot): jackpot is JackpotTier => jackpot !== undefined),
    )]
  }
  private applyAuthoritativeJackpotState(authoritative: AuthoritativeSpinResponse): void {
    // The contribution animation has already completed. Reconcile silently to
    // the server snapshot so shared-progressive activity cannot leave this
    // browser's meters stale or make another player's contribution look local.
    this.jackpots = {
      majorValue: authoritative.majorValue,
      grandValue: authoritative.grandValue,
    }
    this.majorCounter.set(authoritative.majorValue)
    this.grandCounter.set(authoritative.grandValue)
  }
  private getContributionAmounts(): { major: number; grand: number } {
    const total = Number((BET * PROGRESSIVE_RATE).toFixed(2))
    const major = Number((total * MAJOR_SHARE).toFixed(2))
    const grand = Number((total - major).toFixed(2))
    return { major, grand }
  }
  private async previewContribution(major: number, grand: number): Promise<void> {
    if (major <= 0 && grand <= 0) return
    const majorFrom = this.jackpots.majorValue
    const grandFrom = this.jackpots.grandValue
    await Promise.all([
      this.contributeFx.play(major, grand),
      this.majorCounter.animate(majorFrom, Number((majorFrom + major).toFixed(2))),
      this.grandCounter.animate(grandFrom, Number((grandFrom + grand).toFixed(2))),
    ])
  }
  // Commit the locally previewed contribution only for a demo selection. A hit
  // progressive has already paid its post-contribution value and returns to seed.
  private async settleDemoContribution(major: number, grand: number, jackpots: readonly JackpotTier[]): Promise<void> {
    if (major <= 0 && grand <= 0) return
    const before = this.jackpots
    const updated = {
      majorValue: jackpots.includes('major')
        ? MAJOR_SEED
        : Number((before.majorValue + major).toFixed(2)),
      grandValue: jackpots.includes('grand')
        ? GRAND_SEED
        : Number((before.grandValue + grand).toFixed(2)),
    }
    this.jackpots = updated
  }
  private buildSpinMessage(evaluation: WinEvaluation, major: number, grand: number, jackpots: JackpotTier[]): string {
    if (jackpots.length > 0) {
      const lineWins = evaluation.wins.filter((win) => !win.jackpot)
      const jackpotWins = evaluation.wins.filter((win) => win.jackpot)
      const lineDetails = lineWins.map((win) =>
        `L${win.lineIndex + 1} ${win.symbol}×${win.count} ${win.payout.toFixed(2)}×`,
      )
      const jackpotDetails = jackpotWins.map((win) =>
        `${win.jackpot!.toUpperCase()} JACKPOT • ${win.count} ${win.symbol} • +${money(win.payout)}`,
      )
      return `${[...jackpotDetails, ...lineDetails].join(' • ')} • TOTAL +${money(evaluation.totalPayout)}`
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
    this.hudValues.destroy()
  }
}
