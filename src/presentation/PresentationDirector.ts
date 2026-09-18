import type { AudioEvent, AudioManager } from '../audio/AudioManager'
import type { WinEvaluation } from '../game/math/WinEvaluator'
import type { ReelSet } from '../pixi/reels/ReelSet'
import type { CharacterWinPresentation } from '../pixi/wins/CharacterWinPresentation'
import type { WinPresentation } from '../pixi/wins/WinPresentation'
import {
  classifyResult,
  type CharacterSymbol,
  type ResultPresentation,
} from './ResultClassifier'
const HIGH_AUDIO_EVENTS: Record<CharacterSymbol, AudioEvent> = {
  ARCHER: 'win:high:archer',
  KNIGHT: 'win:high:knight',
  MAGE: 'win:high:mage',
  DRAGON: 'win:high:dragon',
}
/** Owns post-result presentation routing. Math is complete before this class runs. */
export class PresentationDirector {
  private reels: ReelSet
  private wins: WinPresentation
  private characterWins: CharacterWinPresentation
  private audio: AudioManager
  constructor(
    reels: ReelSet,
    wins: WinPresentation,
    characterWins: CharacterWinPresentation,
    audio: AudioManager,
  ) {
    this.reels = reels
    this.wins = wins
    this.characterWins = characterWins
    this.audio = audio
  }
  async present(
    evaluation: WinEvaluation,
  ): Promise<ResultPresentation> {
    const presentation = classifyResult(evaluation)
    this.emitAudioEvent(presentation)
    if (evaluation.wins.length > 0) {
      this.wins.show(evaluation.wins)
      if (
        presentation.kind === 'high' &&
        presentation.character
      ) {
        // HIGH: prove the real win, then turn the reel viewport into a short
        // character stage. The same celebration becomes 2B's jackpot bridge.
        await this.reels.presentHighWins(
          evaluation.wins,
          presentation.character,
        )
        // HIGH wins get a deliberate rhythm of their own.
        // First let the player read the actual winning line, then clear
        // the viewport before any theatrical information arrives.
        await this.wait(0.68)
        await Promise.all([
          this.reels.fadeForStage(0.025, 0.48),
          this.wins.fadeTo(0, 0.36),
        ])
        await this.wait(0.18)
        const primary = evaluation.wins
          .filter(
            (win) =>
              win.symbol === presentation.character &&
              !win.jackpot,
          )
          .reduce(
            (best, win) =>
              !best || win.payout > best.payout
                ? win
                : best,
            undefined as
              | typeof evaluation.wins[number]
              | undefined,
          )
        await this.characterWins.celebrate(
          presentation.character,
          primary?.count ?? 3,
          primary?.payout ?? 0,
        )
        // Resolve in the opposite order:
        // celebration leaves first, then the authoritative reels/payline
        // return as the persistent result record.
        await this.characterWins.fadeOut(0.42)
        await Promise.all([
          this.reels.restoreFromStage(0.48),
          this.wins.fadeTo(1, 0.44),
        ])
      } else if (presentation.kind === 'normal') {
        // NORMAL wins also get a brief stage beat, but never the character
        // takeover. This establishes spectacle without spending jackpot scale.
        await this.reels.presentWins(
          evaluation.wins,
        )
        await this.wait(0.24)
        await this.reels.fadeForStage(
          0.20,
          0.20,
        )
        await this.wins.stagePulse()
        await this.reels.restoreFromStage(
          0.26,
        )
      } else {
        await this.reels.presentWins(
          evaluation.wins,
        )
      }
    }
    return presentation
  }
  clear(): void {
    void this.reels.restoreFromStage(0)
    this.wins.clear()
    this.characterWins.clear()
  }
  private wait(
    seconds: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(
        resolve,
        seconds * 1000,
      )
    })
  }
  private emitAudioEvent(
    presentation: ResultPresentation,
  ): void {
    switch (presentation.kind) {
      case 'normal':
        this.audio.emit('win:normal')
        break
      case 'high':
        if (presentation.character) {
          this.audio.emit(
            HIGH_AUDIO_EVENTS[presentation.character],
          )
        }
        break
      case 'jackpot':
        if (presentation.jackpot) {
          this.audio.emit(
            `jackpot:${presentation.jackpot}`,
          )
        }
        break
      case 'none':
        this.audio.emit('result:no-win')
        break
    }
  }
}