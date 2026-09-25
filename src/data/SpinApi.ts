import { supabase } from '../lib/supabase'
import type { SpinResult } from '../game/math/SpinResult'
import type { WinEvaluation } from '../game/math/WinEvaluator'
export type ProgressiveHit = 'none' | 'major' | 'grand'
export interface AuthoritativeSpinResponse {
  result: SpinResult
  evaluation: WinEvaluation
  progressiveHit: ProgressiveHit
  progressivePayout: number
  majorValue: number
  grandValue: number
}
// Production spins cross a single authority boundary here. The client receives
// both the landed symbols and their evaluated awards; it does not re-roll or
// reinterpret a successful server response before presentation.
export async function requestAuthoritativeSpin(): Promise<AuthoritativeSpinResponse> {
  const { data, error } = await supabase.functions.invoke<AuthoritativeSpinResponse>('spin', {
    body: {},
  })
  if (error) {
    throw new Error(`Authoritative spin request failed: ${error.message}`)
  }
  if (!data) {
    throw new Error('Authoritative spin returned no data')
  }
  return data
}
