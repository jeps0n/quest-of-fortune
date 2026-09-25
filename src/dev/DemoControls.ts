import { PAYLINE_DEFINITIONS } from '../game/math/Paylines'
import { PAYTABLE } from '../game/math/Paytable'
import { SYMBOL_IDS, type SymbolId } from '../game/math/SpinResult'
import { SpinOverride, type MatchCount, type SpinOverrideMode } from './SpinOverride'
const COUNTS: readonly MatchCount[] = [3, 4, 5]
const MODES: readonly SpinOverrideMode[] = ['payline', 'anywhere']
const RANKED_SYMBOL_IDS = Object.keys(PAYTABLE) as SymbolId[]
const PAYLINE_NAME_WIDTH = Math.max(...PAYLINE_DEFINITIONS.map((line) => line.name.length))
const SYMBOL_TEXT_COLORS: Partial<Record<SymbolId, string>> = {
  ARCHER: '#7ee394',
  KNIGHT: '#ff8178',
  MAGE: '#78b9ff',
  DRAGON: '#c88cff',
}
const DEFAULT_SYMBOL_TEXT_COLOR = '#f5f1e8'
// Developer-only UI for selecting the presentation of the next spin. It arms
// SpinOverride; it does not introduce a separate runtime spin type or alter the
// normal game pipeline after the one-shot selection is consumed.
export class DemoControls {
  private readonly spinOverride: SpinOverride
  private readonly root: HTMLDivElement
  private readonly modeSelect: HTMLSelectElement
  private readonly symbolSelect: HTMLSelectElement
  private readonly countSelect: HTMLSelectElement
  private readonly paylineSelect: HTMLSelectElement
  private readonly paylineField: HTMLLabelElement
  private readonly status: HTMLDivElement
  private readonly keyHandler: (event: KeyboardEvent) => void
  private readonly armButton: HTMLButtonElement
  private readonly unsubscribeArmed: () => void
  constructor(spinOverride: SpinOverride) {
    this.spinOverride = spinOverride
    this.root = document.createElement('div')
    this.modeSelect = this.createSelect('Mode', [
      ['payline', 'PAYLINE'],
      ['anywhere', 'ANYWHERE'],
    ])
    this.symbolSelect = this.createSelect('Symbol', RANKED_SYMBOL_IDS.map((symbol) => [symbol, symbol]))
    this.countSelect = this.createSelect('Count', COUNTS.map((count) => [String(count), String(count)]))
    this.paylineSelect = this.createSelect(
      'Payline',
      PAYLINE_DEFINITIONS.map((_, index) =>
        [String(index), this.formatPaylineOption(index)],
      ),
      true,
    )
    this.paylineField = this.wrapField('PAYLINE', this.paylineSelect)
    this.status = document.createElement('div')
    this.armButton = this.createButton('ARM NEXT SPIN')
    this.keyHandler = (event) => {
      if (
        event.ctrlKey &&
        event.altKey &&
        event.shiftKey &&
        event.code === 'ArrowDown'
      ) {
        event.preventDefault()
        this.setOpen(Boolean(this.root.hidden))
      }
    }
    this.build()
    this.unsubscribeArmed = this.spinOverride.onArmedChange((armed) => this.renderArmedState(armed))
    document.body.appendChild(this.root)
    window.addEventListener('keydown', this.keyHandler)
  }
  destroy(): void {
    window.removeEventListener('keydown', this.keyHandler)
    this.unsubscribeArmed()
    this.root.remove()
  }
  // The panel is built imperatively so development controls remain isolated from
  // the production cabinet DOM/CSS and can be removed without affecting game UI.
  private build(): void {
    this.root.hidden = true
    Object.assign(this.root.style, {
      position: 'fixed',
      top: '16px',
      right: '16px',
      zIndex: '9999',
      width: '360px',
      padding: '12px',
      border: '2.5px solid rgba(255,255,255,0.30)',
      borderRadius: '10px',
      background: 'rgba(12, 14, 20, 0.96)',
      color: '#f5f1e8',
      font: '13px/1.35 system-ui, sans-serif',
      boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
    })
    const title = document.createElement('div')
    title.textContent = 'Demo Spin Controls'
    Object.assign(title.style, { fontWeight: '700', fontSize: '15px', marginBottom: '10px' })
    const hint = document.createElement('div')
    Object.assign(hint.style, {
      display: 'flex',
      alignItems: 'baseline',
      gap: '3px',
      fontSize: '11px',
      marginBottom: '12px',
      whiteSpace: 'nowrap',
    })
    const appendHintPart = (text: string, styles: Partial<CSSStyleDeclaration>) => {
      const part = document.createElement('span')
      part.textContent = text
      Object.assign(part.style, styles)
      hint.appendChild(part)
    }
    const keyStyle: Partial<CSSStyleDeclaration> = {
      color: '#f5f1e8',
      fontWeight: '700',
    }
    const separatorStyle: Partial<CSSStyleDeclaration> = {
      color: '#8ca4ad',
      fontWeight: '600',
    }
    appendHintPart('Ctrl', keyStyle)
    appendHintPart('+', separatorStyle)
    appendHintPart('Alt', keyStyle)
    appendHintPart('+', separatorStyle)
    appendHintPart('Shift', keyStyle)
    appendHintPart('+', separatorStyle)
    appendHintPart('↓', {
      ...keyStyle,
      fontFamily: 'Arial Black, Arial, system-ui, sans-serif',
      fontSize: '15px',
      fontWeight: '900',
      lineHeight: '0.8',
    })
    appendHintPart('to toggle', {
      color: '#9da3ad',
      fontWeight: '400',
    })
    const fields = document.createElement('div')
    Object.assign(fields.style, { display: 'grid', gap: '8px' })
    fields.append(
      this.wrapField('SYMBOL', this.symbolSelect),
      this.wrapField('COUNT', this.countSelect),
      this.wrapField('MODE', this.modeSelect),
      this.paylineField,
    )
    this.symbolSelect.addEventListener('change', () => {
      this.syncSymbolColor()
      this.syncArmedSelection()
    })
    this.countSelect.addEventListener('change', () => this.syncArmedSelection())
    this.modeSelect.addEventListener('change', () => {
      this.syncMode()
      this.syncArmedSelection()
    })
    this.paylineSelect.addEventListener('change', () => this.syncArmedSelection())
    const actions = document.createElement('div')
    Object.assign(actions.style, { display: 'flex', gap: '8px', marginTop: '12px' })
    const clearButton = this.createButton('CLEAR')
    this.armButton.addEventListener('click', () => this.arm())
    clearButton.addEventListener('click', () => {
      this.spinOverride.disarm()
      this.renderStatus()
    })
    actions.append(this.armButton, clearButton)
    Object.assign(this.status.style, { marginTop: '10px', minHeight: '18px', fontWeight: '700' })
    this.root.append(title, hint, fields, actions, this.status)
    this.syncMode()
    this.syncSymbolColor()
    this.renderStatus()
  }
  // Validate the current controls before translating them into a one-shot
  // SpinOverride selection consumed by Game on the next spin.
  private arm(): void {
    const mode = this.modeSelect.value as SpinOverrideMode
    const symbol = this.symbolSelect.value as SymbolId
    const count = Number(this.countSelect.value) as MatchCount
    const paylineIndex = Number(this.paylineSelect.value)
    if (!MODES.includes(mode) || !SYMBOL_IDS.includes(symbol) || !COUNTS.includes(count)) return
    if (mode === 'payline' && !PAYLINE_DEFINITIONS[paylineIndex]) return
    this.spinOverride.arm({
      mode,
      symbol,
      count,
      paylineIndex: mode === 'payline' ? paylineIndex : undefined,
    })
    this.renderStatus()
  }
  // Editing controls while already armed updates that pending selection in place.
  private syncArmedSelection(): void {
    if (!this.spinOverride.selection) return
    this.arm()
  }
  private renderStatus(): void {
    const selection = this.spinOverride.selection
    if (!selection) {
      this.status.textContent = 'NEXT SPIN: NORMAL RNG'
      this.status.style.color = '#b7bcc7'
      return
    }
    if (selection.mode === 'anywhere') {
      this.status.textContent = `ARMED: ${selection.symbol} ×${selection.count} • ANYWHERE`
    } else {
      const line = PAYLINE_DEFINITIONS[selection.paylineIndex ?? -1]
      this.status.textContent = `ARMED: ${selection.symbol} ×${selection.count} • ${line?.name ?? 'PAYLINE'}`
    }
    this.status.style.color = '#8cefff'
  }
  private renderArmedState(armed: boolean): void {
    this.root.style.borderWidth = '2.5px'
    this.root.style.borderColor = armed ? 'rgba(92, 222, 238, 0.82)' : 'rgba(255,255,255,0.30)'
    this.armButton.style.borderColor = armed ? 'rgba(92, 222, 238, 0.78)' : 'rgba(255,255,255,0.18)'
    this.armButton.style.background = armed ? '#153b47' : '#292e3a'
    this.armButton.style.color = armed ? '#d9fcff' : '#fff'
    this.renderStatus()
  }
  private syncSymbolColor(): void {
    const symbol = this.symbolSelect.value as SymbolId
    this.symbolSelect.style.color = SYMBOL_TEXT_COLORS[symbol] ?? DEFAULT_SYMBOL_TEXT_COLOR
  }
  private syncMode(): void {
    const anywhere = this.modeSelect.value === 'anywhere'
    this.paylineSelect.disabled = anywhere
    this.paylineField.style.display = anywhere ? 'none' : 'block'
  }
  private setOpen(open: boolean): void {
    this.root.hidden = !open
    if (open) this.renderStatus()
  }
  private formatPaylineOption(index: number): string {
    const line = PAYLINE_DEFINITIONS[index]
    const number = String(index + 1).padStart(2, ' ')
    const name = line.name.toUpperCase().padEnd(PAYLINE_NAME_WIDTH, ' ')
    const rows = `[${line.rows.join(', ')}]`
    return `${number} - ${name} - ${rows}`.replaceAll(' ', '\u00a0')
  }
  private createSelect(
    label: string,
    options: readonly (readonly [string, string])[],
    monospace = false,
  ): HTMLSelectElement {
    const select = document.createElement('select')
    select.setAttribute('aria-label', label)
    for (const [value, text] of options) {
      const option = document.createElement('option')
      option.value = value
      option.textContent = text
      if (label === 'Symbol') {
        option.style.color = SYMBOL_TEXT_COLORS[value as SymbolId] ?? DEFAULT_SYMBOL_TEXT_COLOR
      }
      select.appendChild(option)
    }
    Object.assign(select.style, {
      width: '100%',
      padding: '7px 8px',
      borderRadius: '6px',
      border: '1px solid rgba(255,255,255,0.18)',
      background: '#1d2029',
      color: '#fff',
      fontFamily: monospace ? 'ui-monospace, SFMono-Regular, Consolas, monospace' : 'inherit',
    })
    return select
  }
  private wrapField(labelText: string, control: HTMLElement): HTMLLabelElement {
    const label = document.createElement('label')
    const text = document.createElement('span')
    text.textContent = labelText
    Object.assign(text.style, { display: 'block', opacity: '0.7', fontSize: '10px', marginBottom: '3px' })
    label.append(text, control)
    return label
  }
  private createButton(text: string): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = text
    Object.assign(button.style, {
      flex: '1',
      padding: '7px 8px',
      borderRadius: '6px',
      border: '1px solid rgba(255,255,255,0.18)',
      background: '#292e3a',
      color: '#fff',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '11px',
    })
    return button
  }
}
