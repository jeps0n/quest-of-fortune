import { supabase } from '../lib/supabase'
export interface JackpotState { majorValue: number; grandValue: number }
interface JackpotStateRow { major_value: string | number; grand_value: string | number }
const asNumber = (value: string | number): number => Number(value) || 0
// Jackpot meters are shared state, so startup reads their current server values
// instead of assuming the local seed values are current. Returning null keeps
// the repository policy-free; main.ts owns the visual startup fallback.
export async function loadJackpots(): Promise<JackpotState | null> {
  const { data, error } = await supabase.from('jackpot_state').select('major_value, grand_value').eq('id', 1).single<JackpotStateRow>()
  if (error) { console.error('Failed to load jackpots:', error); return null }
  return { majorValue: asNumber(data.major_value), grandValue: asNumber(data.grand_value) }
}
