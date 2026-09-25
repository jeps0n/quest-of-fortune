import { Application, Assets, Sprite } from 'pixi.js'
import { gsap } from 'gsap'
import { QUEST_LAYOUT } from '../config/QuestLayout'
import { AudioManager } from '../audio/AudioManager'
import type { JackpotState } from '../data/JackpotRepository'
import { Game } from '../game/Game'
import { createSpinResult } from '../game/math/SpinResult'
import { createGameLayers, type GameLayers } from './GameLayers'
import { createLookOutButton } from './controls/LookOutButton'
import { createInfoButton } from './controls/InfoButton'
import { createPaylinesButton } from './controls/PaylinesButton'
import { createPaytableButton } from './controls/PaytableButton'
import { createPaylinesGuide } from './paylines/PaylinesGuide'
import { createPaytableView } from './paytable/PaytableView'
import { createSpinButton } from './controls/SpinButton'
import { ReelSet } from './reels/ReelSet'
import { loadSymbolArtwork } from './reels/SymbolAssets'
import { ContributeAnimation } from './jackpots/ContributeAnimation'
import { JackpotCounter } from './jackpots/JackpotCounter'
import { JackpotPresentation } from './jackpots/JackpotPresentation'
import { WinPresentation } from './wins/WinPresentation'
import { CharacterWinPresentation, type CharacterStageTextures } from './wins/CharacterWinPresentation'
import { PresentationDirector } from '../presentation/PresentationDirector'
import { SpinOverride } from '../dev/SpinOverride'
import { DemoControls } from '../dev/DemoControls'
export interface PixiGame { app: Application; layers: GameLayers; destroy: () => void }
interface CreatePixiGameOptions { host: HTMLElement; presentation: HTMLElement; jackpots: JackpotState; jackpotCards: Record<'mini' | 'minor' | 'major' | 'grand', HTMLElement>; majorElement: HTMLElement; grandElement: HTMLElement; messageElement: HTMLElement; winElement: HTMLElement; balanceElement: HTMLElement }
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
  const paytableTexture = await Assets.load('assets/cabinet/quest-paytable.png')
  await loadSymbolArtwork()
  const layers = createGameLayers(app.stage)
  const audio = new AudioManager()
  audio.load('win-recognized', 'assets/audio/qof-win-chime.mp3')
  const spinOverride = new SpinOverride()
  const demoControls = new DemoControls(spinOverride)
  const reels = new ReelSet()
  const contribute = new ContributeAnimation()
  const majorCounter = new JackpotCounter(options.majorElement)
  const grandCounter = new JackpotCounter(options.grandElement)
  const winPresentation = new WinPresentation()
  const characterWinPresentation = new CharacterWinPresentation(stageTextures)
  const jackpotPresentation = new JackpotPresentation(options.jackpotCards)
  const presentationDirector = new PresentationDirector(reels, winPresentation, characterWinPresentation, jackpotPresentation, audio)
  const paylinesScreen = new Sprite(paylinesTexture)
  const paylinesGuide = createPaylinesGuide()
  const paytableView = createPaytableView(paytableTexture)
  paylinesScreen.label = 'paylines-screen'
  paylinesScreen.position.set(0, 0)
  paylinesScreen.width = QUEST_LAYOUT.stage.width
  paylinesScreen.height = QUEST_LAYOUT.stage.height
  paylinesScreen.visible = false
  let game: Game | undefined
  type InfoPage = 'paytable' | 'paylines'
  let isInfoOpen = false
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
  let infoButton: ReturnType<typeof createInfoButton>
  let paylinesButton: ReturnType<typeof createPaylinesButton>
  let paytableButton: ReturnType<typeof createPaytableButton>
  const showInfoPage = (page: InfoPage): void => {
    const showPaytable = page === 'paytable'
    paytableView.visible = isInfoOpen && showPaytable
    paylinesScreen.visible = isInfoOpen && !showPaytable
    paylinesGuide.visible = isInfoOpen && !showPaytable
    paytableButton.setActive(showPaytable)
    paylinesButton.setActive(!showPaytable)
  }
  const setInfoOpen = (open: boolean): void => {
    isInfoOpen = open
    infoButton.setInfoOpen(open)
    options.presentation.style.visibility = open ? 'hidden' : ''
    setGameplayLayersVisible(!open)
    paytableButton.view.visible = open
    paylinesButton.view.visible = open
    if (open) showInfoPage('paytable')
    else {
      paytableView.visible = false
      paylinesScreen.visible = false
      paylinesGuide.visible = false
      paytableButton.setActive(false)
      paylinesButton.setActive(false)
    }
  }
  infoButton = createInfoButton(() => setInfoOpen(!isInfoOpen))
  paytableButton = createPaytableButton(() => showInfoPage('paytable'))
  paylinesButton = createPaylinesButton(() => showInfoPage('paylines'))
  paytableButton.view.visible = false
  paylinesButton.view.visible = false
  const lookOutButton = createLookOutButton({
    onLookingOutChange: (active) => {
      options.presentation.classList.toggle('is-looking-out', active)
      const alpha = active ? 0 : 1
      for (const layer of [layers.reels, layers.wins, layers.features, layers.cabinetFx]) {
        gsap.killTweensOf(layer)
        gsap.to(layer, { alpha, duration: 0.7, ease: 'power1.inOut' })
      }
      gsap.killTweensOf(spinButton.view)
      const shouldShowSpin = !active && !isInfoOpen
      spinButton.view.eventMode = shouldShowSpin ? 'static' : 'none'
      gsap.to(spinButton.view, { alpha: shouldShowSpin ? 1 : 0, duration: 0.7, ease: 'power1.inOut' })
      for (const button of [infoButton.view, paytableButton.view, paylinesButton.view]) {
        gsap.killTweensOf(button)
        button.eventMode = active ? 'none' : 'static'
        gsap.to(button, { alpha, duration: 0.7, ease: 'power1.inOut' })
      }
    },
  })
  reels.applyVisible(createSpinResult())
  layers.reels.addChild(reels.view)
  layers.wins.addChild(winPresentation.view, characterWinPresentation.view)
  layers.cabinetFx.addChild(jackpotPresentation.view)
  layers.features.addChild(paylinesScreen, paylinesGuide, paytableView)
  paylinesGuide.visible = false
  paytableView.visible = false
  layers.cabinetFx.addChild(contribute.view)
  layers.controls.addChild(spinButton.view, infoButton.view, paytableButton.view, paylinesButton.view, lookOutButton.view)
  game = new Game(reels, spinButton, contribute, majorCounter, grandCounter, presentationDirector, options.jackpots, { message: options.messageElement, win: options.winElement, balance: options.balanceElement }, spinOverride)
  return {
    app,
    layers,
    destroy: () => {
      if (isInfoOpen) options.presentation.style.visibility = ''
      unsubscribeSpinArmed?.()
      demoControls.destroy()
      game?.destroy()
      audio.destroy()
      reels.destroy()
      winPresentation.destroy()
      characterWinPresentation.destroy()
      jackpotPresentation.destroy()
      contribute.destroy()
      spinButton.destroy()
      infoButton.destroy()
      paylinesButton.destroy()
      paytableButton.destroy()
      lookOutButton.destroy()
      app.destroy(true, { children: true })
    },
  }
}
