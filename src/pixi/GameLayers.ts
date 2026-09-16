import { Container } from 'pixi.js'
export interface GameLayers {
  reels: Container
  wins: Container
  features: Container
  cabinetFx: Container
  controls: Container
}
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
