import { QUEST_LAYOUT } from '../config/QuestLayout'
const VIEWPORT_PADDING = 16
interface StageScalerElements {
  viewport: HTMLElement
  stage: HTMLElement
}
// Scale the authored logical stage as one unit rather than independently
// reflowing cabinet geometry. The <= 1 clamp preserves source-pixel sharpness on
// large displays and keeps math-to-display coordinates stable at every size.
export function createStageScaler({
  viewport,
  stage,
}: StageScalerElements): () => void {
  const updateScale = (): void => {
    const availableWidth = Math.max(
      0,
      window.innerWidth - VIEWPORT_PADDING * 2,
    )
    const availableHeight = Math.max(
      0,
      window.innerHeight - VIEWPORT_PADDING * 2,
    )
    const scale = Math.min(
      availableWidth / QUEST_LAYOUT.stage.width,
      availableHeight / QUEST_LAYOUT.stage.height,
      1,
    )
    stage.style.transform = `scale(${scale})`
    viewport.style.width = `${QUEST_LAYOUT.stage.width * scale}px`
    viewport.style.height = `${QUEST_LAYOUT.stage.height * scale}px`
  }
  updateScale()
  window.addEventListener('resize', updateScale)
  return () => {
    window.removeEventListener('resize', updateScale)
  }
}
