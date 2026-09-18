import { Container, Graphics, Text } from 'pixi.js'
import { gsap } from 'gsap'
import { QUEST_LAYOUT } from '../../config/QuestLayout'
const CORNER_RADIUS = 10
export interface PaylinesButton {
  view: Container
  destroy: () => void
}
interface CreatePaylinesButtonOptions {
  onPaylinesChange: (isShowingPaylines: boolean) => void
}
export function createPaylinesButton({
  onPaylinesChange,
}: CreatePaylinesButtonOptions): PaylinesButton {
  const layout = QUEST_LAYOUT.paylines
  const root = new Container({ label: 'paylines-button' })
  const shadow = new Graphics()
  const face = new Graphics()
  const innerLine = new Graphics()
  const border = new Graphics()
  const label = new Text({
    text: 'PAYLINES',
    resolution: Math.max(2, window.devicePixelRatio || 1),
    style: {
      fill: 0xf6e7bb,
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.05,
    },
  })
  root.position.set(layout.left, QUEST_LAYOUT.stage.height - layout.bottom - layout.height)
  root.eventMode = 'static'
  root.cursor = 'pointer'
  root.hitArea = {
    contains: (x: number, y: number) =>
      x >= 0 && x <= layout.width && y >= 0 && y <= layout.height,
  }
  label.anchor.set(0.5)
  label.position.set(layout.width / 2, layout.height / 2)
  root.addChild(shadow, face, innerLine, border, label)
  let isShowingPaylines = false
  let isHovered = false
  const drawButton = (): void => {
    shadow.clear()
    face.clear()
    innerLine.clear()
    border.clear()
    shadow
      .roundRect(2, 3, layout.width - 4, layout.height - 4, CORNER_RADIUS)
      .fill({ color: 0x09060e, alpha: 0.34 })
    face
      .roundRect(1, 1, layout.width - 2, layout.height - 2, CORNER_RADIUS)
      .fill({
        color: isShowingPaylines ? 0x2d1745 : 0x1d122b,
        alpha: isHovered ? 0.84 : 0.72,
      })
    innerLine
      .moveTo(12, 4)
      .lineTo(layout.width - 12, 4)
      .stroke({
        color: isShowingPaylines ? 0xb981d5 : 0x8f6a9f,
        alpha: isHovered ? 0.32 : 0.18,
        width: 1,
      })
    border
      .roundRect(1.5, 1.5, layout.width - 3, layout.height - 3, CORNER_RADIUS - 0.5)
      .stroke({
        color: isHovered ? 0xf0ce73 : 0xc9a650,
        alpha: isHovered ? 0.94 : 0.76,
        width: isHovered ? 1.25 : 1,
      })
    const tickAlpha = isHovered ? 0.82 : 0.56
    border
      .moveTo(7, layout.height / 2)
      .lineTo(11, layout.height / 2)
      .moveTo(layout.width - 11, layout.height / 2)
      .lineTo(layout.width - 7, layout.height / 2)
      .stroke({ color: 0xd7b75e, alpha: tickAlpha, width: 1 })
    label.style.fill = isShowingPaylines ? 0xf4d77d : 0xf6e7bb
  }
  const toggle = (): void => {
    isShowingPaylines = !isShowingPaylines
    label.text = isShowingPaylines ? 'GAME' : 'PAYLINES'
    drawButton()
    onPaylinesChange(isShowingPaylines)
  }
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && isShowingPaylines) toggle()
  }
  window.addEventListener('keydown', handleKeyDown)
  root.on('pointerover', () => {
    isHovered = true
    drawButton()
    gsap.to(label.scale, { x: 1.035, y: 1.035, duration: 0.16, ease: 'power2.out' })
  })
  root.on('pointerout', () => {
    isHovered = false
    drawButton()
    gsap.to(label.scale, { x: 1, y: 1, duration: 0.16, ease: 'power2.out' })
  })
  root.on('pointertap', toggle)
  drawButton()
  return {
    view: root,
    destroy: () => {
      gsap.killTweensOf(label.scale)
      window.removeEventListener('keydown', handleKeyDown)
    },
  }
}
