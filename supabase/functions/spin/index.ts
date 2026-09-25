import { runAuthoritativeSpin } from '../_shared/SpinPipeline.ts'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}
type ProgressiveHit = 'none' | 'major' | 'grand'
interface SettlementRow {
  progressive_payout: number | string
  major_value: number | string
  grand_value: number | string
}
interface EdgeEnvironment {
  env: {
    get(name: string): string | undefined
  }
  serve(handler: (request: Request) => Response | Promise<Response>): void
}
function edgeEnvironment(): EdgeEnvironment {
  const deno = (globalThis as typeof globalThis & { Deno?: EdgeEnvironment }).Deno
  if (!deno) throw new Error('Supabase Edge Runtime is unavailable')
  return deno
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders })
}
async function settleProgressive(
  supabaseUrl: string,
  serviceRoleKey: string,
  progressiveHit: ProgressiveHit,
): Promise<SettlementRow> {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/settle_progressive`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ progressive_hit: progressiveHit }),
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Progressive settlement failed (${response.status}): ${detail}`)
  }
  const data: unknown = await response.json()
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') {
    throw new Error('Progressive settlement returned no state')
  }
  return row as SettlementRow
}
const runtime = edgeEnvironment()
runtime.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }
  try {
    const rawBody = await request.text()
    if (rawBody.trim()) {
      const body: unknown = JSON.parse(rawBody)
      if (
        body === null ||
        typeof body !== 'object' ||
        Array.isArray(body) ||
        Object.keys(body as Record<string, unknown>).length > 0
      ) {
        return json({ error: 'Spin does not accept outcome parameters' }, 400)
      }
    }
    const supabaseUrl = runtime.env.get('SUPABASE_URL')
    const serviceRoleKey = runtime.env.get('QOF_SERVER_KEY')
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Server Supabase credentials are not configured')
    }
    const spin = await runAuthoritativeSpin((progressiveHit) =>
      settleProgressive(supabaseUrl, serviceRoleKey, progressiveHit),
    )
    return json(spin)
  } catch (error) {
    console.error('Authoritative spin failed', error)
    return json({ error: 'Spin failed' }, 500)
  }
})
