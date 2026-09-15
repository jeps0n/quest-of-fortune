interface LookOutControllerElements {
  presentation: HTMLElement
  button: HTMLButtonElement
}

const RETURN_REMINDER_DELAY_MS = 15000
const BUTTON_LOCK_MS = 2000

export function createLookOutController({
  presentation,
  button,
}: LookOutControllerElements): () => void {
  let isLookingOut = false
  let reminderTimer: number | undefined
  let buttonLockTimer: number | undefined

  const clearReminder = (): void => {
    if (reminderTimer !== undefined) {
      window.clearTimeout(reminderTimer)
      reminderTimer = undefined
    }

    button.classList.remove('is-reminding')
  }

  const clearButtonLock = (): void => {
    if (buttonLockTimer !== undefined) {
      window.clearTimeout(buttonLockTimer)
      buttonLockTimer = undefined
    }
  }

  const lockButton = (): void => {
    clearButtonLock()
    button.disabled = true

    buttonLockTimer = window.setTimeout(() => {
      buttonLockTimer = undefined
      button.disabled = false
    }, BUTTON_LOCK_MS)
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
    if (nextValue === isLookingOut) {
      return
    }

    isLookingOut = nextValue
    presentation.classList.toggle('is-looking-out', isLookingOut)
    button.setAttribute('aria-pressed', String(isLookingOut))
    button.textContent = isLookingOut ? 'RETURN' : 'LOOK OUT'
    button.setAttribute(
      'aria-label',
      isLookingOut ? 'Return to the game' : 'Look out over the valley',
    )

    lockButton()

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
    if (event.key === 'Escape' && isLookingOut && !button.disabled) {
      setLookingOut(false)
      button.focus()
    }
  }

  // LOOK OUT is enabled immediately on initialization.
  button.disabled = false
  button.addEventListener('click', toggleLookOut)
  window.addEventListener('keydown', handleKeyDown)

  return () => {
    clearReminder()
    clearButtonLock()
    button.disabled = false
    button.removeEventListener('click', toggleLookOut)
    window.removeEventListener('keydown', handleKeyDown)
  }
}
