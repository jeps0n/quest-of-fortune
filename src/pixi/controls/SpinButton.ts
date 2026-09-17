import { Container, Graphics, Text } from 'pixi.js'
import { gsap } from 'gsap'
import { QUEST_LAYOUT } from '../../config/QuestLayout'
export interface SpinButton { view: Container; setEnabled: (enabled: boolean) => void; destroy: () => void }
export function createSpinButton(onSpin: () => void): SpinButton {
  const l = QUEST_LAYOUT.spin; const view = new Container({ label: 'spin-button' }); const face = new Graphics(); const label = new Text({ text: 'SPIN', style: { fill: 0xffedb0, fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: '700', letterSpacing: 2 } })
  let enabled = true; let hovered = false
  view.position.set(l.x, l.y); label.anchor.set(0.5); label.position.set(l.width / 2, l.height / 2); view.addChild(face, label)
  const draw = (): void => { face.clear().roundRect(1, 1, l.width - 2, l.height - 2, 13).fill({ color: enabled ? (hovered ? 0x39204f : 0x241633) : 0x17131c, alpha: 0.94 }).stroke({ color: enabled ? (hovered ? 0xf0ce73 : 0xc9a650) : 0x706650, alpha: enabled ? 0.95 : 0.45, width: hovered ? 2 : 1.25 }); label.alpha = enabled ? 1 : 0.45 }
  const setEnabled = (next: boolean): void => { enabled = next; view.eventMode = next ? 'static' : 'none'; view.cursor = next ? 'pointer' : 'default'; draw() }
  view.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= l.width && y >= 0 && y <= l.height }; view.on('pointerover', () => { hovered = true; draw(); gsap.to(label.scale, { x: 1.04, y: 1.04, duration: 0.12 }) }); view.on('pointerout', () => { hovered = false; draw(); gsap.to(label.scale, { x: 1, y: 1, duration: 0.12 }) }); view.on('pointertap', () => { if (enabled) onSpin() })
  setEnabled(true); return { view, setEnabled, destroy: () => { gsap.killTweensOf(label.scale); view.destroy({ children: true }) } }
}
