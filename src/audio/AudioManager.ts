export type AudioCue =
  | 'spin-start'
  | 'spin-loop'
  | 'reel-stop'
  | 'symbol-win'
  | 'big-win'
  | 'contribute'
  | 'win-normal'
  | 'payout-tick'
  | 'archer-win'
  | 'knight-win'
  | 'mage-win'
  | 'dragon-win'
  | 'jackpot-impact'
  | 'archer-jackpot'
  | 'knight-jackpot'
  | 'mage-jackpot'
  | 'dragon-jackpot'
export type AudioEvent =
  | 'spin:start'
  | 'spin:loop:start'
  | 'spin:loop:stop'
  | 'reel:stop'
  | 'contribution'
  | 'result:no-win'
  | 'win:normal'
  | 'win:high:archer'
  | 'win:high:knight'
  | 'win:high:mage'
  | 'win:high:dragon'
  | 'jackpot:mini'
  | 'jackpot:minor'
  | 'jackpot:major'
  | 'jackpot:grand'
  | 'payout:tick'
const EVENT_CUES: Partial<Record<AudioEvent, readonly AudioCue[]>> = {
  'spin:start': ['spin-start'],
  'spin:loop:start': ['spin-loop'],
  'reel:stop': ['reel-stop'],
  contribution: ['contribute'],
  'win:normal': ['win-normal'],
  'win:high:archer': ['archer-win'],
  'win:high:knight': ['knight-win'],
  'win:high:mage': ['mage-win'],
  'win:high:dragon': ['dragon-win'],
  'jackpot:mini': ['jackpot-impact', 'archer-jackpot'],
  'jackpot:minor': ['jackpot-impact', 'knight-jackpot'],
  'jackpot:major': ['jackpot-impact', 'mage-jackpot'],
  'jackpot:grand': ['jackpot-impact', 'dragon-jackpot'],
  'payout:tick': ['payout-tick'],
}
/**
 * Audio is presentation-only. Missing clips are intentionally silent and can
 * never block game state, reel timing, win evaluation, or jackpot accounting.
 */
export class AudioManager {
  private clips = new Map<AudioCue, HTMLAudioElement>()
  private volume = 0.55
  load(cue: AudioCue, src: string): void {
    const audio = new Audio(src)
    audio.preload = 'auto'
    audio.volume = this.volume
    this.clips.set(cue, audio)
  }
  emit(event: AudioEvent): void {
    if (event === 'spin:loop:stop') {
      this.stop('spin-loop')
      return
    }
    EVENT_CUES[event]?.forEach((cue) => this.play(cue))
  }
  play(cue?: AudioCue): void {
    if (!cue) return
    const audio = this.clips.get(cue)
    if (!audio) return
    audio.currentTime = 0
    void audio.play().catch(() => undefined)
  }
  stop(cue: AudioCue): void {
    const audio = this.clips.get(cue)
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
  }
  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value))
    this.clips.forEach((audio) => { audio.volume = this.volume })
  }
  destroy(): void {
    this.clips.forEach((audio) => {
      audio.pause()
      audio.src = ''
    })
    this.clips.clear()
  }
}
