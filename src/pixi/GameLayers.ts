import { Container } from 'pixi.js'
export interface GameLayers {
  reels: Container
  wins: Container
  features: Container
  cabinetFx: Container
  controls: Container
}
// Child order is the rendering contract: later layers draw above earlier ones.
// Keeping that contract centralized prevents individual features from relying on
// ad-hoc zIndex values or re-parenting each other during presentation.
export function createGameLayers(stage: Container): GameLayers {
  const layers: GameLayers = {
    reels: new Container({ label: 'reels' }),
    wins: new Container({ label: 'wins' }),
    features: new Container({ label: 'features' }),
    cabinetFx: new Container({ label: 'cabinet-fx' }),
    controls: new Container({ label: 'controls' }),
  }
  stage.addChild(
    layers.reels,
    layers.wins,
    layers.features,
    layers.cabinetFx,
    layers.controls,
  )
  return layers
}
