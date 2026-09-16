import { Application } from 'pixi.js'
import { QUEST_LAYOUT } from '../config/QuestLayout'
import { createGameLayers, type GameLayers } from './GameLayers'
import { createLookOutButton } from './controls/LookOutButton'
export interface PixiGame {
  app: Application
  layers: GameLayers
  destroy: () => void
}
interface CreatePixiGameOptions {
  host: HTMLElement
  presentation: HTMLElement
}
export async function createPixiGame({
  host,
  presentation,
}: CreatePixiGameOptions): Promise<PixiGame> {
  const app = new Application()
  await app.init({
    width: QUEST_LAYOUT.stage.width,
    height: QUEST_LAYOUT.stage.height,
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  })
  app.canvas.classList.add('pixi-canvas')
  host.appendChild(app.canvas)
  const layers = createGameLayers(app.stage)
  const lookOutButton = createLookOutButton({
    onLookingOutChange: (isLookingOut) => {
      presentation.classList.toggle('is-looking-out', isLookingOut)
    },
  })
  layers.controls.addChild(lookOutButton.view)
  return {
    app,
    layers,
    destroy: () => {
      lookOutButton.destroy()
      app.destroy(true, { children: true })
    },
  }
}
