import { Container, Graphics, Text } from 'pixi.js'
import { gsap } from 'gsap'
import { QUEST_LAYOUT } from '../../config/QuestLayout'
export interface SpinButton { view: Container; setEnabled: (enabled: boolean) => void; destroy: () => void }
export function createSpinButton(onSpin: () => void): SpinButton {
  const l = QUEST_LAYOUT.spin
  const view = new Container({ label: 'spin-button' })
  const shadow = new Graphics()
  const rim = new Graphics()
  const face = new Graphics()
  const shine = new Graphics()
  const label = new Text({
    text: 'SPIN',
    style: {
      fill: 0xfff0b5,
      fontFamily: 'Georgia, serif',
      fontSize: 24,
      fontWeight: '700',
      letterSpacing: 3,
      stroke: { color: 0x4a2408, width: 2 },
      dropShadow: { color: 0x000000, alpha: 0.8, blur: 2, distance: 2 },
    },
  })
  let enabled = true
  let hovered = false
  view.position.set(l.x, l.y)
  label.anchor.set(0.5)
  label.position.set(l.width / 2, l.height / 2 - 1)
  view.addChild(shadow, rim, face, shine, label)
  const draw = (): void => {
    const active = enabled
    shadow.clear().roundRect(3, 5, l.width - 6, l.height - 5, 15).fill({ color: 0x050208, alpha: 0.72 })
    rim.clear().roundRect(0, 0, l.width, l.height, 15)
      .fill({ color: active ? (hovered ? 0xf1c75b : 0xb98a2d) : 0x554b3d, alpha: 0.98 })
      .stroke({ color: active ? 0xffe49a : 0x756c5d, alpha: active ? 0.9 : 0.35, width: 1 })
    face.clear().roundRect(3, 3, l.width - 6, l.height - 7, 12)
      .fill({ color: active ? (hovered ? 0x51236b : 0x321745) : 0x17131c, alpha: 0.98 })
      .stroke({ color: active ? 0x6f3c83 : 0x39313f, alpha: 0.9, width: 1 })
    shine.clear().roundRect(8, 6, l.width - 16, Math.max(5, (l.height - 14) * 0.38), 8)
      .fill({ color: 0xffffff, alpha: active ? (hovered ? 0.12 : 0.075) : 0.02 })
    label.alpha = active ? 1 : 0.4
  }
  const setEnabled = (next: boolean): void => {
    enabled = next
    view.eventMode = next ? 'static' : 'none'
    view.cursor = next ? 'pointer' : 'default'
    draw()
  }
  view.hitArea = { contains: (x: number, y: number) => x >= 0 && x <= l.width && y >= 0 && y <= l.height }
  view.on('pointerover', () => {
    hovered = true
    draw()
    gsap.to(view.scale, { x: 1.018, y: 1.018, duration: 0.14, ease: 'power2.out', transformOrigin: '50% 50%' })
    gsap.to(label.scale, { x: 1.035, y: 1.035, duration: 0.14, ease: 'power2.out' })
  })
  view.on('pointerout', () => {
    hovered = false
    draw()
    gsap.to(view.scale, { x: 1, y: 1, duration: 0.16, ease: 'power2.out' })
    gsap.to(label.scale, { x: 1, y: 1, duration: 0.16, ease: 'power2.out' })
  })
  view.on('pointertap', () => {
    if (!enabled) return
    gsap.fromTo(face.scale, { x: 0.985, y: 0.9 }, { x: 1, y: 1, duration: 0.18, ease: 'back.out(2)' })
    onSpin()
  })
  setEnabled(true)
  return {
    view,
    setEnabled,
    destroy: () => {
      gsap.killTweensOf(view.scale)
      gsap.killTweensOf(label.scale)
      gsap.killTweensOf(face.scale)
      view.destroy({ children: true })
    },
  }
}
