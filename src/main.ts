import './style.css'
import { loadJackpots } from './data/JackpotRepository'
import { createStageScaler } from './ui/StageScaler'
import { createPixiGame } from './pixi/PixiGame'
async function loadGame(): Promise<void> {
  const jackpots = await loadJackpots()
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
                <strong>${jackpots ? jackpots.grandValue : '--'}</strong>
              </div>
              <div class="jackpot-card jackpot-card--mini">
                <span class="jackpot-label">MINI</span>
                <strong>$20.00</strong>
              </div>
              <div class="jackpot-card jackpot-card--major">
                <span class="jackpot-label">MAJOR</span>
                <strong>${jackpots ? jackpots.majorValue : '--'}</strong>
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
        <div class="pixi-layer" aria-hidden="true"></div>
      </main>
    </div>
  `
  createStageScaler({
    viewport: document.querySelector<HTMLDivElement>('.stage-viewport')!,
    stage: document.querySelector<HTMLElement>('.game-stage')!,
  })
  await createPixiGame({
    host: document.querySelector<HTMLDivElement>('.pixi-layer')!,
    presentation: document.querySelector<HTMLElement>('.game-presentation')!,
  })
}
void loadGame()
