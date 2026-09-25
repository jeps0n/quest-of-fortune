export type AudioCue = 'win-recognized'
/** Presentation-only audio service keyed by semantic gameplay cues. */
export class AudioManager {
  private clips = new Map<AudioCue, HTMLAudioElement>()
  private volume = 0.50
  load(cue: AudioCue, src: string): void {
    const audio = new Audio(src)
    audio.preload = 'auto'
    audio.volume = this.volume
    this.clips.set(cue, audio)
  }
  play(cue: AudioCue): void {
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
