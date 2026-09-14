const STAGE_WIDTH = 1200
const STAGE_HEIGHT = 800
const VIEWPORT_PADDING = 16
const MIN_SUPPORTED_SCALE = 0.5

interface StageScalerElements {
  viewport: HTMLElement
  stage: HTMLElement
}

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
      availableWidth / STAGE_WIDTH,
      availableHeight / STAGE_HEIGHT,
      1,
    )

    stage.style.transform = `scale(${scale})`

    viewport.style.width = `${STAGE_WIDTH * scale}px`
    viewport.style.height = `${STAGE_HEIGHT * scale}px`

    document.body.classList.toggle(
      'viewport-too-small',
      scale < MIN_SUPPORTED_SCALE,
    )
  }

  updateScale()
  window.addEventListener('resize', updateScale)

  return () => {
    window.removeEventListener('resize', updateScale)
  }
}
