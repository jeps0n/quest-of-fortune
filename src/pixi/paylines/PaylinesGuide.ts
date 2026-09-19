import { Container, Graphics, Text } from 'pixi.js'
import { PAYLINE_DEFINITIONS } from '../../game/math/Paylines'
const COLUMNS = 4
const PANEL_START_X = 82
const PANEL_START_Y = 205
const PANEL_STEP_X = 262
const PANEL_STEP_Y = 139
const PANEL_WIDTH = 245
const NAME_OFFSET_Y = -20
// Optical tuning dials for each horizontal bank of four cards.
// Adjust names independently from the miniature reel grids/paylines.
const NAME_ROW_Y_OFFSETS = [3, 1, 5, 11] as const
const GRID_ROW_Y_OFFSETS = [-2, 0, 4, 11] as const
// Each black panel represents a miniature version of the real 5 x 4 reel window.
// Payline points are always placed at the centers of these cells.
const GRID_LEFT = 42
const GRID_TOP = 7
const GRID_WIDTH = 176
const GRID_HEIGHT = 80
const REELS = 5
const ROWS = 4
const GRID_COLOR = 0xd8b96a
const LINE_COLOR = 0xffd76a
const CORE_COLOR = 0xfff1b0
const cellWidth = GRID_WIDTH / REELS
const cellHeight = GRID_HEIGHT / ROWS
const pointX = (reel: number): number => GRID_LEFT + cellWidth * (reel + 0.5)
const pointY = (row: number): number => GRID_TOP + cellHeight * (row + 0.5)
const drawMiniReelGrid = (graphics: Graphics, panelX: number, panelY: number): void => {
  // Outer boundary and cell dividers stay deliberately quiet so the payline is
  // always the dominant information in the panel.
  graphics
    .rect(panelX + GRID_LEFT, panelY + GRID_TOP, GRID_WIDTH, GRID_HEIGHT)
    .stroke({ color: GRID_COLOR, alpha: 0.33, width: 1 })
  for (let reel = 1; reel < REELS; reel += 1) {
    const x = panelX + GRID_LEFT + cellWidth * reel
    graphics
      .moveTo(x, panelY + GRID_TOP)
      .lineTo(x, panelY + GRID_TOP + GRID_HEIGHT)
      .stroke({ color: GRID_COLOR, alpha: 0.24, width: 1 })
  }
  for (let row = 1; row < ROWS; row += 1) {
    const y = panelY + GRID_TOP + cellHeight * row
    graphics
      .moveTo(panelX + GRID_LEFT, y)
      .lineTo(panelX + GRID_LEFT + GRID_WIDTH, y)
      .stroke({ color: GRID_COLOR, alpha: 0.11, width: 1 })
  }
}
export function createPaylinesGuide(): Container {
  const root = new Container({ label: 'paylines-guide' })
  PAYLINE_DEFINITIONS.forEach(({ name: paylineName, rows }, index) => {
    const column = index % COLUMNS
    const panelRow = Math.floor(index / COLUMNS)
    const panelX = PANEL_START_X + column * PANEL_STEP_X
    const panelY = PANEL_START_Y + panelRow * PANEL_STEP_Y
    const nameY = panelY + (NAME_ROW_Y_OFFSETS[panelRow] ?? 0)
    const gridY = panelY + (GRID_ROW_Y_OFFSETS[panelRow] ?? 0)
    const diagram = new Graphics()
    diagram.label = `payline-${index + 1}-diagram`
    drawMiniReelGrid(diagram, panelX, gridY)
    // A restrained wide stroke provides glow without filters or animation.
    diagram.moveTo(panelX + pointX(0), gridY + pointY(rows[0]))
    for (let reel = 1; reel < rows.length; reel += 1) {
      diagram.lineTo(panelX + pointX(reel), gridY + pointY(rows[reel]))
    }
    diagram.stroke({ color: LINE_COLOR, alpha: 0.18, width: 7 })
    diagram.moveTo(panelX + pointX(0), gridY + pointY(rows[0]))
    for (let reel = 1; reel < rows.length; reel += 1) {
      diagram.lineTo(panelX + pointX(reel), gridY + pointY(rows[reel]))
    }
    diagram.stroke({ color: CORE_COLOR, alpha: 0.96, width: 2 })
    rows.forEach((row, reel) => {
      const x = panelX + pointX(reel)
      const y = gridY + pointY(row)
      diagram.circle(x, y, 6).fill({ color: LINE_COLOR, alpha: 0.2 })
      diagram.circle(x, y, 3.25).fill({ color: CORE_COLOR, alpha: 1 })
      diagram.circle(x, y, 1.25).fill({ color: 0xffffff, alpha: 0.95 })
    })
    const name = new Text({
      text: paylineName.toUpperCase(),
      resolution: Math.max(2, window.devicePixelRatio || 1),
      style: {
        fill: 0xf6e7bb,
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.15,
      },
    })
    name.anchor.set(0.5)
    name.position.set(panelX + PANEL_WIDTH / 2 + 5, nameY + NAME_OFFSET_Y)
    root.addChild(diagram, name)
  })
  return root
}
