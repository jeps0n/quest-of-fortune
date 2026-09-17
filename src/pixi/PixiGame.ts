import { Application } from 'pixi.js'
import { gsap } from 'gsap'
import { QUEST_LAYOUT } from '../config/QuestLayout'
import { AudioManager } from '../audio/AudioManager'
import type { JackpotState } from '../data/JackpotRepository'
import { Game } from '../game/Game'
import { createSpinResult } from '../game/math/SpinResult'
import { createGameLayers, type GameLayers } from './GameLayers'
import { createLookOutButton } from './controls/LookOutButton'
import { createSpinButton } from './controls/SpinButton'
import { ReelSet } from './reels/ReelSet'
import { ContributeAnimation } from './jackpots/ContributeAnimation'
import { JackpotCounter } from './jackpots/JackpotCounter'
export interface PixiGame { app: Application; layers: GameLayers; destroy: () => void }
interface CreatePixiGameOptions { host: HTMLElement; presentation: HTMLElement; jackpots: JackpotState; majorElement: HTMLElement; grandElement: HTMLElement; messageElement: HTMLElement; winElement: HTMLElement }
export async function createPixiGame(options: CreatePixiGameOptions): Promise<PixiGame> {
  const app = new Application(); await app.init({ width: QUEST_LAYOUT.stage.width, height: QUEST_LAYOUT.stage.height, backgroundAlpha: 0, antialias: true, resolution: window.devicePixelRatio || 1, autoDensity: true }); app.canvas.classList.add('pixi-canvas'); options.host.appendChild(app.canvas)
  const layers = createGameLayers(app.stage); const audio = new AudioManager(); const reels = new ReelSet(audio); const contribute = new ContributeAnimation(audio); const majorCounter = new JackpotCounter(options.majorElement); const grandCounter = new JackpotCounter(options.grandElement)
  let game: Game | undefined; const spinButton = createSpinButton(() => { void game?.spin() }); const lookOutButton = createLookOutButton({
    onLookingOutChange: (active) => {
      // LOOK OUT must treat the cabinet and every gameplay presentation layer
      // as one visual object. Keep only the Pixi controls layer visible so the
      // RETURN button remains usable while looking out.
      options.presentation.classList.toggle('is-looking-out', active)
      const alpha = active ? 0 : 1
      for (const layer of [layers.reels, layers.wins, layers.features, layers.cabinetFx]) {
        gsap.killTweensOf(layer)
        gsap.to(layer, { alpha, duration: 0.7, ease: 'power1.inOut' })
      }

      // SPIN belongs visually to the cabinet, so it must fade with the
      // cabinet while LOOK OUT / RETURN stays available on the controls layer.
      gsap.killTweensOf(spinButton.view)
      spinButton.view.eventMode = active ? 'none' : 'static'
      gsap.to(spinButton.view, { alpha, duration: 0.7, ease: 'power1.inOut' })
    },
  })
  reels.applyVisible(createSpinResult())
  layers.reels.addChild(reels.view); layers.cabinetFx.addChild(contribute.view); layers.controls.addChild(spinButton.view, lookOutButton.view)
  game = new Game(reels, spinButton, contribute, majorCounter, grandCounter, options.jackpots, { message: options.messageElement, win: options.winElement }, audio)
  return { app, layers, destroy: () => { game?.destroy(); reels.destroy(); contribute.destroy(); spinButton.destroy(); lookOutButton.destroy(); app.destroy(true, { children: true }) } }
}
