import { Container, Graphics, Text } from 'pixi.js'
import { gsap } from 'gsap'
import { QUEST_LAYOUT } from '../../config/QuestLayout'
const RETURN_REMINDER_DELAY_MS = 15000
const BUTTON_LOCK_MS = 2000
const CORNER_RADIUS = 10
export interface LookOutButton {
  view: Container
  destroy: () => void
}
interface CreateLookOutButtonOptions {
  onLookingOutChange: (isLookingOut: boolean) => void
}
export function createLookOutButton({
  onLookingOutChange,
}: CreateLookOutButtonOptions): LookOutButton {
  const layout = QUEST_LAYOUT.lookOut
  const root = new Container({ label: 'look-out-button' })
  const shadow = new Graphics()
  const face = new Graphics()
  const innerLine = new Graphics()
  const border = new Graphics()
  const lockVeil = new Graphics()
  const reminder = new Graphics()
  const label = new Text({
    text: 'LOOK OUT',
    resolution: Math.max(2, window.devicePixelRatio || 1),
    style: {
      fill: 0xf6e7bb,
      fontFamily: 'Georgia, Times New Roman, serif',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.05,
    },
  })
  root.position.set(
    QUEST_LAYOUT.stage.width - layout.right - layout.width,
    QUEST_LAYOUT.stage.height - layout.bottom - layout.height,
  )
  root.eventMode = 'static'
  root.cursor = 'pointer'
  root.hitArea = {
    contains: (x: number, y: number) =>
      x >= 0 && x <= layout.width && y >= 0 && y <= layout.height,
  }
  label.anchor.set(0.5)
  label.position.set(layout.width / 2, layout.height / 2)
  root.addChild(shadow, face, innerLine, border, lockVeil, reminder, label)
  let isLookingOut = false
  let isLocked = false
  let isHovered = false
  let lockTimer: number | undefined
  let reminderTimer: number | undefined
  const reminderProgress = { value: 0 }
  const lockProgress = { value: 0 }
  const drawButton = (): void => {
    shadow.clear()
    face.clear()
    innerLine.clear()
    border.clear()
    const disabled = isLocked
    const hovered = isHovered && !disabled
    const active = isLookingOut
    // A deliberately Pixi-native treatment: separate depth, face, inner bevel
    // and perimeter rather than one heavy all-purpose plate.
    shadow
      .roundRect(2, 3, layout.width - 4, layout.height - 4, CORNER_RADIUS)
      .fill({ color: 0x09060e, alpha: disabled ? 0.20 : 0.34 })
    face
      .roundRect(1, 1, layout.width - 2, layout.height - 2, CORNER_RADIUS)
      .fill({
        color: active ? 0x462039 : 0x2d1727,
        alpha: disabled ? 0.48 : hovered ? 0.92 : 0.80,
      })
    // Restrained upper bevel gives the plate depth without a CSS-like glow.
    innerLine
      .moveTo(12, 4)
      .lineTo(layout.width - 12, 4)
      .stroke({
        color: active ? 0xf0b3dc : 0xd69ab9,
        alpha: disabled ? 0.10 : hovered ? 0.48 : 0.30,
        width: 1,
      })
    border
      .roundRect(1.5, 1.5, layout.width - 3, layout.height - 3, CORNER_RADIUS - 0.5)
      .stroke({
        color: disabled ? 0x8f846c : hovered ? 0xffdda0 : 0xd8b96d,
        alpha: disabled ? 0.38 : hovered ? 1 : 0.88,
        width: hovered ? 1.35 : 1.1,
      })
    // Tiny ornamental ticks make it read as a game control without changing
    // the locked hit box or surrounding layout.
    const tickColor = disabled ? 0x8f846c : 0xe2c476
    const tickAlpha = disabled ? 0.24 : hovered ? 0.92 : 0.68
    border
      .moveTo(7, layout.height / 2)
      .lineTo(11, layout.height / 2)
      .moveTo(layout.width - 11, layout.height / 2)
      .lineTo(layout.width - 7, layout.height / 2)
      .stroke({ color: tickColor, alpha: tickAlpha, width: 1 })
    label.alpha = disabled ? 0.40 : 1
    label.style.fill = disabled ? 0xb8aa89 : active ? 0xffe4f5 : hovered ? 0xfff3d8 : 0xf8e9c5
  }
  const drawLockVeil = (progress: number): void => {
    lockVeil.clear()
    if (!isLocked) return
    const inset = 4
    const usableWidth = layout.width - inset * 2
    const usableHeight = layout.height - inset * 2
    const sweepWidth = Math.min(12, Math.max(7, usableWidth * 0.15))
    // Keep the complete sweep geometry inside the inner plate instead of
    // relying on a mask. This avoids Pixi mask-coordinate surprises while
    // guaranteeing that the effect never bleeds beyond the button.
    const travel = Math.max(0, usableWidth - sweepWidth)
    const x = inset + travel * progress
    lockVeil
      .roundRect(inset, inset, usableWidth, usableHeight, CORNER_RADIUS - 3)
      .fill({ color: 0x0a0710, alpha: 0.16 })
      .roundRect(x, inset - 1, sweepWidth, usableHeight, 3)
      .fill({ color: 0xd8b65e, alpha: 0.16 })
  }
  const drawReminderSpark = (x: number, y: number): void => {
    reminder.clear()
    reminder
      .circle(x, y, 4.2)
      .fill({ color: 0xe2bd63, alpha: 0.10 })
      .circle(x, y, 2.1)
      .fill({ color: 0xffdc78, alpha: 0.24 })
      .moveTo(x, y - 2.7)
      .lineTo(x + 1.15, y)
      .lineTo(x, y + 2.7)
      .lineTo(x - 1.15, y)
      .closePath()
      .fill({ color: 0xfff0b0, alpha: 0.98 })
  }
  const placeReminder = (progress: number): void => {
    const inset = 2
    const width = layout.width - inset * 2
    const height = layout.height - inset * 2
    const radius = CORNER_RADIUS
    const horizontal = width - radius * 2
    const vertical = height - radius * 2
    const arc = Math.PI * radius / 2
    const perimeter = horizontal * 2 + vertical * 2 + arc * 4
    let d = (progress % 1) * perimeter
    if (d < horizontal) return drawReminderSpark(inset + radius + d, inset)
    d -= horizontal
    if (d < arc) {
      const a = -Math.PI / 2 + d / radius
      return drawReminderSpark(inset + width - radius + Math.cos(a) * radius, inset + radius + Math.sin(a) * radius)
    }
    d -= arc
    if (d < vertical) return drawReminderSpark(inset + width, inset + radius + d)
    d -= vertical
    if (d < arc) {
      const a = d / radius
      return drawReminderSpark(inset + width - radius + Math.cos(a) * radius, inset + height - radius + Math.sin(a) * radius)
    }
    d -= arc
    if (d < horizontal) return drawReminderSpark(inset + width - radius - d, inset + height)
    d -= horizontal
    if (d < arc) {
      const a = Math.PI / 2 + d / radius
      return drawReminderSpark(inset + radius + Math.cos(a) * radius, inset + height - radius + Math.sin(a) * radius)
    }
    d -= arc
    if (d < vertical) return drawReminderSpark(inset, inset + height - radius - d)
    d -= vertical
    const a = Math.PI + d / radius
    drawReminderSpark(inset + radius + Math.cos(a) * radius, inset + radius + Math.sin(a) * radius)
  }
  const clearReminder = (): void => {
    if (reminderTimer !== undefined) {
      window.clearTimeout(reminderTimer)
      reminderTimer = undefined
    }
    gsap.killTweensOf(reminderProgress)
    reminder.clear()
    reminder.visible = false
  }
  const scheduleReminder = (): void => {
    clearReminder()
    reminderTimer = window.setTimeout(() => {
      reminderTimer = undefined
      if (!isLookingOut) return
      reminder.visible = true
      reminderProgress.value = 0
      placeReminder(0)
      gsap.to(reminderProgress, {
        value: 1,
        duration: 2.8,
        ease: 'none',
        repeat: -1,
        onUpdate: () => placeReminder(reminderProgress.value),
      })
    }, RETURN_REMINDER_DELAY_MS)
  }
  const lockButton = (): void => {
    if (lockTimer !== undefined) window.clearTimeout(lockTimer)
    gsap.killTweensOf(lockProgress)
    gsap.killTweensOf(lockVeil)
    isLocked = true
    root.eventMode = 'none'
    root.cursor = 'default'
    lockProgress.value = 0
    lockVeil.alpha = 1
    drawButton()
    drawLockVeil(0)
    gsap.to(lockProgress, {
      value: 1,
      duration: BUTTON_LOCK_MS / 1000,
      ease: 'none',
      onUpdate: () => drawLockVeil(lockProgress.value),
    })
    lockTimer = window.setTimeout(() => {
      lockTimer = undefined
      gsap.killTweensOf(lockProgress)
      isLocked = false
      lockVeil.clear()
      root.eventMode = 'static'
      root.cursor = 'pointer'
      drawButton()
      // Small readiness response when the two-second lock expires.
      gsap.fromTo(
        border,
        { alpha: 0.58 },
        { alpha: 1, duration: 0.24, ease: 'power2.out' },
      )
    }, BUTTON_LOCK_MS)
  }
  const toggle = (): void => {
    if (isLocked) return
    isLookingOut = !isLookingOut
    label.text = isLookingOut ? 'RETURN' : 'LOOK OUT'
    lockButton()
    if (isLookingOut) scheduleReminder()
    else clearReminder()
    onLookingOutChange(isLookingOut)
  }
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && isLookingOut && !isLocked) {
      toggle()
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  root.on('pointerover', () => {
    isHovered = true
    drawButton()
    if (!isLocked) gsap.to(label.scale, { x: 1.035, y: 1.035, duration: 0.16, ease: 'power2.out' })
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
      if (lockTimer !== undefined) window.clearTimeout(lockTimer)
      clearReminder()
      gsap.killTweensOf(lockProgress)
      gsap.killTweensOf(lockVeil)
      gsap.killTweensOf(border)
      gsap.killTweensOf(label.scale)
      window.removeEventListener('keydown', handleKeyDown)
    },
  }
}
