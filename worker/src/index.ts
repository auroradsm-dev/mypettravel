/**
 * Mypetravel API (Cloudflare Worker)
 *
 * POST /chat   Ask Claude, for signed in users only.
 *              The Anthropic key never leaves this Worker, the system prompt is
 *              built here, and model, token budget and input sizes are fixed
 *              server side, so the endpoint can't be used as a general LLM proxy.
 * cron         Daily request to Supabase so the free project doesn't pause.
 */

export interface Env {
  ANTHROPIC_API_KEY: string // secret
  SUPABASE_ANON_KEY: string // secret (public by design, kept out of the repo anyway)
  SUPABASE_URL: string
  ALLOWED_ORIGINS: string
}

type Role = 'user' | 'assistant'
type Message = { role: Role; content: string }
type TripContext = { petName?: string; origin?: string; destination?: string; travelDate?: string }
type ChatRequest = { mode?: 'full' | 'widget'; messages?: unknown; context?: TripContext }

const MODEL = 'claude-haiku-4-5'
const MAX_MESSAGES = 20
const MAX_MESSAGE_CHARS = 2_000
const MAX_FIELD_CHARS = 80
const MAX_TOKENS = { full: 1024, widget: 600 } as const

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? ''
    const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    const cors = corsHeaders(allowed.includes(origin) ? origin : null)

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

    const url = new URL(request.url)
    if (url.pathname !== '/chat' || request.method !== 'POST') {
      return json({ error: 'Not found' }, 404, cors)
    }
    if (!allowed.includes(origin)) return json({ error: 'Origin not allowed' }, 403, cors)

    // Only signed in Mypetravel users: check the Supabase session token.
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? ''
    if (!token || !(await isValidSession(token, env))) {
      return json({ error: 'Please sign in to use Ask Claude.' }, 401, cors)
    }

    let body: ChatRequest
    try {
      body = (await request.json()) as ChatRequest
    } catch {
      return json({ error: 'Invalid JSON' }, 400, cors)
    }

    const messages = parseMessages(body.messages)
    if (!messages) return json({ error: 'Invalid conversation' }, 400, cors)
    const mode = body.mode === 'widget' ? 'widget' : 'full'

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS[mode],
        system: systemPrompt(body.context ?? {}, mode),
        messages,
      }),
    })

    if (!upstream.ok) {
      // Log the detail for us, return a plain message to the user.
      console.error('Anthropic error', upstream.status, await upstream.text())
      return json({ error: 'Ask Claude is unavailable right now. Please try again in a minute.' }, 502, cors)
    }
    const data = (await upstream.json()) as { content?: { type: string; text?: string }[] }
    const reply = data.content?.find((c) => c.type === 'text')?.text ?? 'No response received.'
    return json({ reply }, 200, cors)
  },

  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    // Any real database request counts as activity. RLS returns no rows to the anon key, which is fine.
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/user_profiles?select=user_id&limit=1`, {
      headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
    })
    console.log('Supabase keep alive', res.status)
  },
}

async function isValidSession(token: string, env: Env): Promise<boolean> {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  })
  return res.ok
}

function parseMessages(raw: unknown): Message[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null
  const out: Message[] = []
  for (const m of raw) {
    if (!m || typeof m !== 'object') return null
    const { role, content } = m as Record<string, unknown>
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null
    const text = content.trim()
    if (!text || text.length > MAX_MESSAGE_CHARS) return null
    out.push({ role, content: text })
  }
  // The API expects the conversation to end with the user's turn.
  return out[out.length - 1].role === 'user' ? out : null
}

function field(value: string | undefined, fallback: string): string {
  const v = (value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, MAX_FIELD_CHARS)
  return v || fallback
}

function systemPrompt(ctx: TripContext, mode: 'full' | 'widget'): string {
  const petName = field(ctx.petName, 'your pet')
  const origin = field(ctx.origin, 'South Africa')
  const destination = field(ctx.destination, 'the EU')
  const travelDate = field(ctx.travelDate, 'their travel date')

  const base = `You are a warm, knowledgeable pet relocation assistant for My Pet Travel.

The user's pet is named ${petName}. They are relocating from ${origin} to ${destination}, travelling on ${travelDate}.

Help with:
- Finding accredited or state vets
- Pet import regulations at the destination
- Airline AVIH policies and procedures
- Packing lists and travel preparation
- Keeping pets calm during long flights
- Document requirements and timing
- Any other pet relocation questions

Only answer questions about travelling or relocating with a pet. Politely decline anything else.
Be warm, practical and concise. For local vet searches, suggest what to search and which bodies to contact rather than specific listings you can't verify.`

  return mode === 'widget' ? `${base}\nKeep answers brief: this is a small chat widget.` : base
}

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
  if (origin) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}
