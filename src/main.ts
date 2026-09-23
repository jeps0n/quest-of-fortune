import './style.css'
import { loadJackpots, type JackpotState } from './data/JackpotRepository'
import { createStageScaler } from './ui/StageScaler'
import { createPixiGame } from './pixi/PixiGame'
import { StartupPresentation } from './presentation/StartupPresentation'
const FALLBACK_JACKPOTS: JackpotState = { majorValue: 100, grandValue: 500 }
const money = (value: number): string => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const preloadImage = (src: string): Promise<void> => new Promise((resolve) => {
  const image = new Image()
  image.onload = () => resolve()
  image.onerror = () => resolve()
  image.src = src
})
async function loadGame(): Promise<void> {
  const [loadedJackpots] = await Promise.all([
    loadJackpots(),
    preloadImage(`${import.meta.env.BASE_URL}assets/cabinet/quest-cabinet.png`),
  ])
  const jackpots = loadedJackpots ?? FALLBACK_JACKPOTS
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div class="stage-viewport"><main class="game-stage"><div class="cabinet-motion"><div class="cabinet-composition"><div class="game-presentation"><div class="cabinet-art" aria-hidden="true"></div><div class="game-ui">
      <header class="title-zone" aria-hidden="true"></header>
      <section class="jackpot-zone"><div class="jackpot-card jackpot-card--grand" data-jackpot-card="grand"><span class="jackpot-label">GRAND</span><strong data-jackpot-grand>${money(jackpots.grandValue)}</strong></div><div class="jackpot-card jackpot-card--mini" data-jackpot-card="mini"><span class="jackpot-label">MINI</span><strong>${money(20)}</strong></div><div class="jackpot-card jackpot-card--major" data-jackpot-card="major"><span class="jackpot-label">MAJOR</span><strong data-jackpot-major>${money(jackpots.majorValue)}</strong></div><div class="jackpot-card jackpot-card--minor" data-jackpot-card="minor"><span class="jackpot-label">MINOR</span><strong>${money(50)}</strong></div></section>
      <section class="reel-zone"><div class="reel-grid" aria-hidden="true">${Array.from({ length: 20 }, () => '<div class="symbol-cell"></div>').join('')}</div></section>
      <section class="message-zone" data-message>READY</section>
      <section class="hud-zone"><div class="hud-item"><span>BALANCE</span><strong data-balance>${money(100)}</strong></div><div class="hud-item"><span>BET</span><strong>${money(1)}</strong></div><div class="hud-item"><span>WIN</span><strong data-win>${money(0)}</strong></div></section>
      <section class="control-zone"><button class="spin-button" disabled aria-hidden="true">SPIN</button></section>
    </div></div><div class="pixi-layer" aria-hidden="true"></div><div class="startup-magic-layer" aria-hidden="true"><div class="startup-aura-bloom"></div><div class="startup-magic-wipe"></div></div></div></div></main></div>`
  createStageScaler({ viewport: document.querySelector<HTMLDivElement>('.stage-viewport')!, stage: document.querySelector<HTMLElement>('.game-stage')! })
  const startupPresentation = new StartupPresentation(
    document.querySelector<HTMLElement>('.cabinet-motion')!,
    document.querySelector<HTMLElement>('.startup-aura-bloom')!,
    document.querySelector<HTMLElement>('.startup-magic-wipe')!,
  )
  await createPixiGame({ host: document.querySelector<HTMLDivElement>('.pixi-layer')!, presentation: document.querySelector<HTMLElement>('.game-presentation')!, jackpots, jackpotCards: { mini: document.querySelector<HTMLElement>('[data-jackpot-card="mini"]')!, minor: document.querySelector<HTMLElement>('[data-jackpot-card="minor"]')!, major: document.querySelector<HTMLElement>('[data-jackpot-card="major"]')!, grand: document.querySelector<HTMLElement>('[data-jackpot-card="grand"]')! }, majorElement: document.querySelector<HTMLElement>('[data-jackpot-major]')!, grandElement: document.querySelector<HTMLElement>('[data-jackpot-grand]')!, messageElement: document.querySelector<HTMLElement>('[data-message]')!, winElement: document.querySelector<HTMLElement>('[data-win]')!, balanceElement: document.querySelector<HTMLElement>('[data-balance]')! })
  await startupPresentation.play()
}
void loadGame()
