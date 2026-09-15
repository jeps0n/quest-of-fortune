import './style.css'
import { supabase } from './lib/supabase'
import { createStageScaler } from './ui/StageScaler'
import { createLookOutController } from './ui/LookOutController'
async function loadGame(): Promise<void> {
  const { data, error } = await supabase
    .from('jackpot_state')
    .select('major_value, grand_value')
    .eq('id', 1)
    .single()
  if (error) {
    console.error('Failed to load jackpots:', error)
  }
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div class="stage-viewport">
      <main class="game-stage">
        <div class="game-presentation">
          <div class="cabinet-art" aria-hidden="true"></div>
          <div class="game-ui">
        <header class="title-zone" aria-hidden="true"></header>
        <section class="jackpot-zone">
          <div class="jackpot-card jackpot-card--grand">
            <span class="jackpot-label">GRAND</span>
            <strong>${data ? data.grand_value : '--'}</strong>
          </div>
          <div class="jackpot-card jackpot-card--mini">
            <span class="jackpot-label">MINI</span>
            <strong>$20.00</strong>
          </div>
          <div class="jackpot-card jackpot-card--major">
            <span class="jackpot-label">MAJOR</span>
            <strong>${data ? data.major_value : '--'}</strong>
          </div>
          <div class="jackpot-card jackpot-card--minor">
            <span class="jackpot-label">MINOR</span>
            <strong>$50.00</strong>
          </div>
        </section>
        <section class="reel-zone">
          <div class="reel-grid">
            ${Array.from({ length: 20 }, () => '<div class="symbol-cell"></div>').join('')}
          </div>
        </section>
        <section class="message-zone">
          WIN / FEATURE MESSAGE
        </section>
        <section class="hud-zone">
          <div class="hud-item">
            <span>BALANCE</span>
            <strong>$100.00</strong>
          </div>
          <div class="hud-item">
            <span>BET</span>
            <strong>$1.00</strong>
          </div>
          <div class="hud-item">
            <span>WIN</span>
            <strong>$0.00</strong>
          </div>
        </section>
        <section class="control-zone">
          <button class="spin-button" disabled>SPIN</button>
        </section>
          </div>
        </div>
        <button
          class="lookout-button"
          type="button"
          aria-pressed="false"
          aria-label="Look out over the valley"
        >
          LOOK OUT
        </button>
      </main>
    </div>
  `
  createStageScaler({
    viewport: document.querySelector<HTMLDivElement>('.stage-viewport')!,
    stage: document.querySelector<HTMLElement>('.game-stage')!,
  })
  createLookOutController({
    presentation: document.querySelector<HTMLElement>('.game-presentation')!,
    button: document.querySelector<HTMLButtonElement>('.lookout-button')!,
  })
}
void loadGame()
