export type GamePhase = 'idle' | 'spinning' | 'win' | 'contributing'

export class GameState {
  private phase: GamePhase = 'idle'
  get current(): GamePhase { return this.phase }
  get canSpin(): boolean { return this.phase === 'idle' }
  set(next: GamePhase): void { this.phase = next }
}
