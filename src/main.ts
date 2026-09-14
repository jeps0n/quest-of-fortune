import './style.css'
import { supabase } from './lib/supabase'

async function loadJackpots(): Promise<void> {
  const { data, error } = await supabase
    .from('jackpot_state')
    .select('major_value, grand_value')
    .eq('id', 1)
    .single()

  if (error) {
    console.error('Failed to load jackpots:', error)
    return
  }

  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <main id="game">
      <h1>Quest of Fortune</h1>

      <p id="major">MAJOR: ${data.major_value}</p>
      <p id="grand">GRAND: ${data.grand_value}</p>

      <button id="contribute" disabled>CONTRIBUTE</button>
    </main>
  `
}

void loadJackpots()