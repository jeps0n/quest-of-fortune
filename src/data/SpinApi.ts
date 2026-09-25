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
