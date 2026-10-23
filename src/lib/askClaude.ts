import { supabase } from './supabase'

/**
 * Ask Claude goes through our own Cloudflare Worker (see /worker).
 * The Anthropic key lives only in the Worker; the app sends the user's
 * Supabase session token so only signed in users can use it.
 */
const ASK_CLAUDE_URL = process.env.EXPO_PUBLIC_ASK_CLAUDE_URL ?? ''

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export type TripContext = {
  petName?: string
  origin?: string
  destination?: string
  travelDate?: string
}

export const askClaudeConfigured = Boolean(ASK_CLAUDE_URL)

export async function askClaude(
  messages: ChatMessage[],
  context: TripContext,
  mode: 'full' | 'widget' = 'full',
): Promise<string> {
  if (!ASK_CLAUDE_URL) throw new Error('Ask Claude is not set up yet.')

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Please sign in to use Ask Claude.')

  const res = await fetch(`${ASK_CLAUDE_URL.replace(/\/$/, '')}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mode, messages, context }),
  })

  const body = (await res.json().catch(() => ({}))) as { reply?: string; error?: string }
  if (!res.ok) throw new Error(body.error ?? `Ask Claude error ${res.status}`)
  return body.reply ?? 'No response received.'
}

type OnboardingLike = {
  petName: string
  origin: string
  destination: string
  destinationCountry?: string
  travelDate: string
} | null | undefined

/** Trip details sent to the Worker, which builds the system prompt from them. */
export function tripContext(onboarding: OnboardingLike): TripContext {
  if (!onboarding) return {}
  return {
    petName: onboarding.petName,
    origin: onboarding.origin,
    destination: onboarding.destinationCountry ?? onboarding.destination,
    travelDate: new Date(onboarding.travelDate).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    }),
  }
}
