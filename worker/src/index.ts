/**
 * MyPetTravel backend helper, runs on Cloudflare Workers.
 *
 * Two jobs:
 * 1. POST /ask  Proxies "Ask Claude" chats so the Anthropic key never
 *    reaches the browser. Only signed in users (valid Supabase session) can use it.
 * 2. Cron      Pings Supabase every 2 days so the free project never pauses.
 */

export interface Env {
  ANTHROPIC_API_KEY: string // secret: wrangler secret put ANTHROPIC_API_KEY
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string // secret: wrangler secret put SUPABASE_ANON_KEY
  ALLOWED_ORIGINS: string // comma separated
}

type Message = { role: 'user' | 'assistant'; content: string }

const MODEL = 'claude-haiku-4-5'
const MAX_TOKENS = 1024
const MAX_MESSAGES = 30
const MAX_CHARS = 4000

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  const ok = origin && allowed.includes(origin)
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}

/** Asks Supabase whether this access token belongs to a real, signed in user. */
async function isSignedIn(token: string, env: Env): Promise<boolean> {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  })
  return res.ok
}

function validMessages(m: unknown): m is Message[] {
  return (
    Array.isArray(m) &&
    m.length > 0 &&
    m.length <= MAX_MESSAGES &&
    m.every(
      (x) =>
        x &&
        (x.role === 'user' || x.role === 'assistant') &&
        typeof x.content === 'string' &&
        x.content.length <= MAX_CHARS,
    )
  )
}

async function handleAsk(req: Request, env: Env, cors: Record<string, string>) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token || !(await isSignedIn(token, env))) {
    return json({ error: { message: 'Please sign in to use Ask Claude.' } }, 401, cors)
  }

  const body = (await req.json().catch(() => null)) as { messages?: unknown; system?: unknown } | null
  if (!body || !validMessages(body.messages)) {
    return json({ error: { message: 'Invalid request.' } }, 400, cors)
  }
  const system = typeof body.system === 'string' ? body.system.slice(0, MAX_CHARS) : undefined

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, system, messages: body.messages }),
  })

  const data = (await res.json().catch(() => ({}))) as any
  if (!res.ok) {
    console.log('Anthropic error', res.status, JSON.stringify(data))
    return json({ error: { message: 'The assistant is unavailable right now. Try again later.' } }, 502, cors)
  }
  return json({ text: data.content?.[0]?.text ?? 'No response received.' }, 200, cors)
}

/** A real database read, so Supabase counts the project as active. */
async function keepSupabaseAwake(env: Env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/user_profiles?select=user_id&limit=1`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
  })
  console.log('Supabase keep alive:', res.status)
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(req.headers.get('Origin'), env)
    const url = new URL(req.url)

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (url.pathname === '/ask' && req.method === 'POST') return handleAsk(req, env, cors)
    if (url.pathname === '/health') return json({ ok: true }, 200, cors)
    return json({ error: { message: 'Not found' } }, 404, cors)
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(keepSupabaseAwake(env))
  },
}
