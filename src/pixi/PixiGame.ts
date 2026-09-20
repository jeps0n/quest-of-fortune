import { Application, Assets, Sprite } from 'pixi.js'
import { gsap } from 'gsap'
import { QUEST_LAYOUT } from '../config/QuestLayout'
import { AudioManager } from '../audio/AudioManager'
import type { JackpotState } from '../data/JackpotRepository'
import { Game } from '../game/Game'
import { createSpinResult } from '../game/math/SpinResult'
import { createGameLayers, type GameLayers } from './GameLayers'
import { createLookOutButton } from './controls/LookOutButton'
import { createPaylinesButton } from './controls/PaylinesButton'
import { createPaylinesGuide } from './paylines/PaylinesGuide'
import { createSpinButton } from './controls/SpinButton'
import { ReelSet } from './reels/ReelSet'
import { loadSymbolArtwork } from './reels/SymbolAssets'
import { ContributeAnimation } from './jackpots/ContributeAnimation'
import { JackpotCounter } from './jackpots/JackpotCounter'
import { WinPresentation } from './wins/WinPresentation'
import { CharacterWinPresentation, type CharacterStageTextures } from './wins/CharacterWinPresentation'
import { PresentationDirector } from '../presentation/PresentationDirector'
import { SpinOverride } from '../dev/SpinOverride'
import { DemoControls } from '../dev/DemoControls'
export interface PixiGame { app: Application; layers: GameLayers; destroy: () => void }
interface CreatePixiGameOptions { host: HTMLElement; presentation: HTMLElement; jackpots: JackpotState; majorElement: HTMLElement; grandElement: HTMLElement; messageElement: HTMLElement; winElement: HTMLElement; balanceElement: HTMLElement }
export async function createPixiGame(options: CreatePixiGameOptions): Promise<PixiGame> {
  const app = new Application()
  await app.init({ width: QUEST_LAYOUT.stage.width, height: QUEST_LAYOUT.stage.height, backgroundAlpha: 0, antialias: true, resolution: window.devicePixelRatio || 1, autoDensity: true })
  app.canvas.classList.add('pixi-canvas')
  options.host.appendChild(app.canvas)
  const stageTextures: CharacterStageTextures = {
    ARCHER: await Assets.load('assets/stage/archer-stage.png'),
    KNIGHT: await Assets.load('assets/stage/knight-stage.png'),
    MAGE: await Assets.load('assets/stage/mage-stage.png'),
    DRAGON: await Assets.load('assets/stage/dragon-stage.png'),
  }
  const paylinesTexture = await Assets.load('assets/cabinet/quest-paylines.png')
  await loadSymbolArtwork()
  const layers = createGameLayers(app.stage)
  const audio = new AudioManager()
  const spinOverride = new SpinOverride()
  const demoControls = new DemoControls(spinOverride)
  const reels = new ReelSet(audio)
  const contribute = new ContributeAnimation(audio)
  const majorCounter = new JackpotCounter(options.majorElement)
  const grandCounter = new JackpotCounter(options.grandElement)
  const winPresentation = new WinPresentation()
  const characterWinPresentation = new CharacterWinPresentation(stageTextures)
  const presentationDirector = new PresentationDirector(reels, winPresentation, characterWinPresentation, audio)
  const paylinesScreen = new Sprite(paylinesTexture)
  const paylinesGuide = createPaylinesGuide()
  paylinesScreen.label = 'paylines-screen'
  paylinesScreen.position.set(0, 0)
  paylinesScreen.width = QUEST_LAYOUT.stage.width
  paylinesScreen.height = QUEST_LAYOUT.stage.height
  paylinesScreen.visible = false
  let game: Game | undefined
  let isShowingPaylines = false
  const spinButton = createSpinButton(() => { void game?.spin() })
  const unsubscribeSpinArmed = spinOverride.onArmedChange((armed) => spinButton.setArmed(armed))
  const setGameplayLayersVisible = (visible: boolean): void => {
    const alpha = visible ? 1 : 0
    for (const layer of [layers.reels, layers.wins, layers.cabinetFx]) {
      gsap.killTweensOf(layer)
      layer.alpha = alpha
    }
    gsap.killTweensOf(spinButton.view)
    spinButton.view.alpha = alpha
    spinButton.view.eventMode = visible ? 'static' : 'none'
  }
  let paylinesButton: ReturnType<typeof createPaylinesButton> | undefined
  const lookOutButton = createLookOutButton({
    onLookingOutChange: (active) => {
      options.presentation.classList.toggle('is-looking-out', active)
      const alpha = active ? 0 : 1
      for (const layer of [layers.reels, layers.wins, layers.features, layers.cabinetFx]) {
        gsap.killTweensOf(layer)
        gsap.to(layer, { alpha, duration: 0.7, ease: 'power1.inOut' })
      }
      gsap.killTweensOf(spinButton.view)
      const shouldShowSpin = !active && !isShowingPaylines
      spinButton.view.eventMode = shouldShowSpin ? 'static' : 'none'
      gsap.to(spinButton.view, {
        alpha: shouldShowSpin ? 1 : 0,
        duration: 0.7,
        ease: 'power1.inOut',
      })
      if (paylinesButton) {
        // Keep PAYLINES/GAME visually synchronized with the cabinet transition.
        // It remains mounted so LOOK OUT fades it instead of popping it on/off.
        gsap.killTweensOf(paylinesButton.view)
        paylinesButton.view.eventMode = active ? 'none' : 'static'
        gsap.to(paylinesButton.view, { alpha, duration: 0.7, ease: 'power1.inOut' })
      }
    },
  })
  paylinesButton = createPaylinesButton({
    onPaylinesChange: (active) => {
      isShowingPaylines = active
      paylinesScreen.visible = active
      paylinesGuide.visible = active
      options.presentation.style.visibility = active ? 'hidden' : ''
      setGameplayLayersVisible(!active)
      // PAYLINES selects the active cabinet view; LOOK OUT remains available
      // and temporarily hides whichever view is active. Returning from LOOK OUT
      // therefore restores PAYLINES here instead of forcing the main game view.
    },
  })
  reels.applyVisible(createSpinResult())
  layers.reels.addChild(reels.view)
  layers.wins.addChild(winPresentation.view, characterWinPresentation.view)
  layers.features.addChild(paylinesScreen, paylinesGuide)
  paylinesGuide.visible = false
  layers.cabinetFx.addChild(contribute.view)
  layers.controls.addChild(spinButton.view, paylinesButton.view, lookOutButton.view)
  game = new Game(reels, spinButton, contribute, majorCounter, grandCounter, presentationDirector, options.jackpots, { message: options.messageElement, win: options.winElement, balance: options.balanceElement }, audio, spinOverride)
  return {
    app,
    layers,
    destroy: () => {
      if (isShowingPaylines) options.presentation.style.visibility = ''
      unsubscribeSpinArmed?.()
      demoControls.destroy()
      game?.destroy()
      reels.destroy()
      winPresentation.destroy()
      characterWinPresentation.destroy()
      contribute.destroy()
      spinButton.destroy()
      paylinesButton?.destroy()
      lookOutButton.destroy()
      app.destroy(true, { children: true })
    },
  }
}
