import { supabase } from '../lib/supabase'

export interface JackpotState {
  majorValue: string | number
  grandValue: string | number
}

interface JackpotStateRow {
  major_value: string | number
  grand_value: string | number
}

export async function loadJackpots(): Promise<JackpotState | null> {
  const { data, error } = await supabase
    .from('jackpot_state')
    .select('major_value, grand_value')
    .eq('id', 1)
    .single<JackpotStateRow>()

  if (error) {
    console.error('Failed to load jackpots:', error)
    return null
  }

  return {
    majorValue: data.major_value,
    grandValue: data.grand_value,
  }
}
