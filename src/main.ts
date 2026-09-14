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

      <button id="contribute">CONTRIBUTE</button>
    </main>
  `

  document
    .querySelector<HTMLButtonElement>('#contribute')!
    .addEventListener('click', contributeToJackpots)
}

async function contributeToJackpots(): Promise<void> {
const { data, error } = await supabase.rpc('contribute_to_jackpot')

  if (error) {
    console.error('Failed to contribute:', error)
    return
  }

  const updated = data?.[0]

  if (!updated) {
    console.error('No updated jackpot values returned')
    return
  }

  document.querySelector<HTMLParagraphElement>('#major')!.textContent =
    `MAJOR: ${updated.major_value}`

  document.querySelector<HTMLParagraphElement>('#grand')!.textContent =
    `GRAND: ${updated.grand_value}`
}

void loadJackpots()