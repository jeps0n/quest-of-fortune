interface LookOutControllerElements {
  presentation: HTMLElement
  button: HTMLButtonElement
}
const RETURN_REMINDER_DELAY_MS = 15000
export function createLookOutController({
  presentation,
  button,
}: LookOutControllerElements): () => void {
  let isLookingOut = false
  let reminderTimer: number | undefined
  const clearReminder = (): void => {
    if (reminderTimer !== undefined) {
      window.clearTimeout(reminderTimer)
      reminderTimer = undefined
    }
    button.classList.remove('is-reminding')
  }
  const scheduleReminder = (): void => {
    clearReminder()
    reminderTimer = window.setTimeout(() => {
      reminderTimer = undefined
      if (isLookingOut) {
        button.classList.add('is-reminding')
      }
    }, RETURN_REMINDER_DELAY_MS)
  }
  const setLookingOut = (nextValue: boolean): void => {
    isLookingOut = nextValue
    presentation.classList.toggle('is-looking-out', isLookingOut)
    button.setAttribute('aria-pressed', String(isLookingOut))
    button.textContent = isLookingOut ? 'RETURN' : 'LOOK OUT'
    button.setAttribute(
      'aria-label',
      isLookingOut ? 'Return to the game' : 'Look out over the valley',
    )
    if (isLookingOut) {
      scheduleReminder()
    } else {
      clearReminder()
    }
  }
  const toggleLookOut = (): void => {
    setLookingOut(!isLookingOut)
  }
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && isLookingOut) {
      setLookingOut(false)
      button.focus()
    }
  }
  button.addEventListener('click', toggleLookOut)
  window.addEventListener('keydown', handleKeyDown)
  return () => {
    clearReminder()
    button.removeEventListener('click', toggleLookOut)
    window.removeEventListener('keydown', handleKeyDown)
  }
}
