import { Container, Graphics, Text } from 'pixi.js'
import { gsap } from 'gsap'
import { QUEST_LAYOUT } from '../../config/QuestLayout'
const CORNER_RADIUS = 10
export interface PaytableButton { view: Container; setActive: (active: boolean) => void; destroy: () => void }
export function createPaytableButton(onSelect: () => void): PaytableButton {
  const layout = QUEST_LAYOUT.paytable
  const root = new Container({ label: 'paytable-button' })
  const shadow = new Graphics(), face = new Graphics(), innerLine = new Graphics(), border = new Graphics()
  const label = new Text({ text: 'PAYTABLE', resolution: Math.max(2, window.devicePixelRatio || 1), style: { fill: 0xf6e7bb, fontFamily: 'Georgia, Times New Roman, serif', fontSize: 10, fontWeight: '700', letterSpacing: 1.05 } })
  root.position.set(layout.left, QUEST_LAYOUT.stage.height - layout.bottom - layout.height)
  root.eventMode = 'static'; root.cursor = 'pointer'
  root.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= layout.width && y >= 0 && y <= layout.height }
  label.anchor.set(0.5); label.position.set(layout.width / 2, layout.height / 2)
  root.addChild(shadow, face, innerLine, border, label)
  let active = false, hovered = false
  const draw = (): void => {
    shadow.clear().roundRect(2, 3, layout.width - 4, layout.height - 4, CORNER_RADIUS).fill({ color: 0x09060e, alpha: 0.34 })
    face.clear().roundRect(1, 1, layout.width - 2, layout.height - 2, CORNER_RADIUS).fill({ color: active ? 0x3b1f58 : 0x21152f, alpha: hovered ? 0.92 : active ? 0.88 : 0.76 })
    innerLine.clear().moveTo(12, 4).lineTo(layout.width - 12, 4).stroke({ color: active ? 0xe0a9ff : 0xa47ab5, alpha: active ? 0.56 : hovered ? 0.40 : 0.24, width: 1 })
    border.clear().roundRect(1.5, 1.5, layout.width - 3, layout.height - 3, CORNER_RADIUS - 0.5).stroke({ color: active ? 0xffdf82 : hovered ? 0xe8c96f : 0xb99b55, alpha: active ? 1 : hovered ? 0.96 : 0.78, width: active ? 1.55 : hovered ? 1.3 : 1.05 })
    border.moveTo(7, layout.height / 2).lineTo(11, layout.height / 2).moveTo(layout.width - 11, layout.height / 2).lineTo(layout.width - 7, layout.height / 2).stroke({ color: active ? 0xffdc7a : 0xc9a650, alpha: active ? 0.96 : hovered ? 0.84 : 0.58, width: 1 })
    label.style.fill = active ? 0xffedb0 : hovered ? 0xfaf0d0 : 0xe9dcbd
  }
  root.on('pointerover', () => { hovered = true; draw(); gsap.to(label.scale, { x: 1.035, y: 1.035, duration: 0.16, ease: 'power2.out' }) })
  root.on('pointerout', () => { hovered = false; draw(); gsap.to(label.scale, { x: 1, y: 1, duration: 0.16, ease: 'power2.out' }) })
  root.on('pointertap', onSelect)
  draw()
  return { view: root, setActive: (next) => { active = next; draw() }, destroy: () => gsap.killTweensOf(label.scale) }
}
