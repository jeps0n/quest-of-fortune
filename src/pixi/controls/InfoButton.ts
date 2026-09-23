import { Container, Graphics, Text } from 'pixi.js'
import { gsap } from 'gsap'
import { QUEST_LAYOUT } from '../../config/QuestLayout'
const CORNER_RADIUS = 10
export interface InfoButton {
  view: Container
  setInfoOpen: (open: boolean) => void
  destroy: () => void
}
export function createInfoButton(onToggleInfo: () => void): InfoButton {
  const layout = QUEST_LAYOUT.info
  const root = new Container({ label: 'info-button' })
  const shadow = new Graphics()
  const face = new Graphics()
  const innerLine = new Graphics()
  const border = new Graphics()
  const label = new Text({
    text: 'INFO',
    resolution: Math.max(2, window.devicePixelRatio || 1),
    style: {
      fill: 0xf5f0ff,
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.05,
    },
  })
  root.position.set(layout.left, QUEST_LAYOUT.stage.height - layout.bottom - layout.height)
  root.eventMode = 'static'
  root.cursor = 'pointer'
  root.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= layout.width && y >= 0 && y <= layout.height }
  label.anchor.set(0.5)
  label.position.set(layout.width / 2, layout.height / 2)
  root.addChild(shadow, face, innerLine, border, label)
  let infoOpen = false
  let hovered = false
  const draw = (): void => {
    // INFO is icy/arcane lavender; GAME is warm/heroic. Geometry stays identical so
    // the control reads as the same family while color communicates purpose.
    const faceColor = infoOpen ? 0x4a2b12 : 0x30284d
    const bevelColor = infoOpen ? 0xffd778 : 0xf4efff
    const borderColor = infoOpen ? 0xe5b84f : 0xe0d4ff
    const hoverBorder = infoOpen ? 0xffe49a : 0xf7f3ff
    const tickColor = infoOpen ? 0xf2c861 : 0xc9b8ff
    shadow.clear().roundRect(2, 3, layout.width - 4, layout.height - 4, CORNER_RADIUS).fill({ color: 0x09060e, alpha: 0.34 })
    face.clear().roundRect(1, 1, layout.width - 2, layout.height - 2, CORNER_RADIUS).fill({ color: faceColor, alpha: hovered ? 0.92 : 0.80 })
    innerLine.clear().moveTo(12, 4).lineTo(layout.width - 12, 4).stroke({ color: bevelColor, alpha: hovered ? 0.56 : 0.36, width: 1 })
    border.clear().roundRect(1.5, 1.5, layout.width - 3, layout.height - 3, CORNER_RADIUS - 0.5).stroke({ color: hovered ? hoverBorder : borderColor, alpha: hovered ? 1 : 0.92, width: hovered ? 1.35 : 1.1 })
    border.moveTo(7, layout.height / 2).lineTo(11, layout.height / 2).moveTo(layout.width - 11, layout.height / 2).lineTo(layout.width - 7, layout.height / 2).stroke({ color: tickColor, alpha: hovered ? 0.96 : 0.72, width: 1 })
    label.style.fill = infoOpen ? (hovered ? 0xffefb5 : 0xffdfa0) : (hovered ? 0xffffff : 0xf8f4ff)
  }
  const setInfoOpen = (open: boolean): void => {
    infoOpen = open
    label.text = infoOpen ? 'GAME' : 'INFO'
    draw()
  }
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && infoOpen) onToggleInfo()
  }
  window.addEventListener('keydown', handleKeyDown)
  root.on('pointerover', () => { hovered = true; draw(); gsap.to(label.scale, { x: 1.035, y: 1.035, duration: 0.16, ease: 'power2.out' }) })
  root.on('pointerout', () => { hovered = false; draw(); gsap.to(label.scale, { x: 1, y: 1, duration: 0.16, ease: 'power2.out' }) })
  root.on('pointertap', onToggleInfo)
  draw()
  return {
    view: root,
    setInfoOpen,
    destroy: () => {
      gsap.killTweensOf(label.scale)
      window.removeEventListener('keydown', handleKeyDown)
    },
  }
}
