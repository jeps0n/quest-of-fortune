import './style.css'
import { loadJackpots, type JackpotState } from './data/JackpotRepository'
import { createStageScaler } from './ui/StageScaler'
import { createPixiGame } from './pixi/PixiGame'
const FALLBACK_JACKPOTS: JackpotState = { majorValue: 100, grandValue: 500 }
const money = (value: number): string => `$${value.toFixed(2)}`
async function loadGame(): Promise<void> {
  const jackpots = (await loadJackpots()) ?? FALLBACK_JACKPOTS
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div class="stage-viewport"><main class="game-stage"><div class="game-presentation"><div class="cabinet-art" aria-hidden="true"></div><div class="game-ui">
      <header class="title-zone" aria-hidden="true"></header>
      <section class="jackpot-zone"><div class="jackpot-card jackpot-card--grand"><span class="jackpot-label">GRAND</span><strong data-jackpot-grand>${money(jackpots.grandValue)}</strong></div><div class="jackpot-card jackpot-card--mini"><span class="jackpot-label">MINI</span><strong>$20.00</strong></div><div class="jackpot-card jackpot-card--major"><span class="jackpot-label">MAJOR</span><strong data-jackpot-major>${money(jackpots.majorValue)}</strong></div><div class="jackpot-card jackpot-card--minor"><span class="jackpot-label">MINOR</span><strong>$50.00</strong></div></section>
      <section class="reel-zone"><div class="reel-grid" aria-hidden="true">${Array.from({ length: 20 }, () => '<div class="symbol-cell"></div>').join('')}</div></section>
      <section class="message-zone" data-message>READY</section>
      <section class="hud-zone"><div class="hud-item"><span>BALANCE</span><strong>$100.00</strong></div><div class="hud-item"><span>BET</span><strong>$1.00</strong></div><div class="hud-item"><span>WIN</span><strong data-win>$0.00</strong></div></section>
      <section class="control-zone"><button class="spin-button" disabled aria-hidden="true">SPIN</button></section>
    </div></div><div class="pixi-layer" aria-hidden="true"></div></main></div>`
  createStageScaler({ viewport: document.querySelector<HTMLDivElement>('.stage-viewport')!, stage: document.querySelector<HTMLElement>('.game-stage')! })
  await createPixiGame({ host: document.querySelector<HTMLDivElement>('.pixi-layer')!, presentation: document.querySelector<HTMLElement>('.game-presentation')!, jackpots, majorElement: document.querySelector<HTMLElement>('[data-jackpot-major]')!, grandElement: document.querySelector<HTMLElement>('[data-jackpot-grand]')!, messageElement: document.querySelector<HTMLElement>('[data-message]')!, winElement: document.querySelector<HTMLElement>('[data-win]')! })
}
void loadGame()
