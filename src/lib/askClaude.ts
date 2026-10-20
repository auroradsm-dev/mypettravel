import { supabase } from './supabase'

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

/** URL of the Cloudflare Worker that holds the Anthropic key (see worker/). */
export const ASK_URL = process.env.EXPO_PUBLIC_ASK_URL ?? ''

/** Sends the chat to our Worker, which calls Claude. The API key never touches the browser. */
export async function askClaude(messages: ChatMessage[], system: string): Promise<string> {
  if (!ASK_URL) throw new Error('Ask Claude is not configured.')

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Please sign in to use Ask Claude.')

  const res = await fetch(`${ASK_URL.replace(/\/$/, '')}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ system, messages: messages.map((m) => ({ role: m.role, content: m.content })) }),
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((body as any)?.error?.message ?? `Error ${res.status}`)
  return (body as any).text ?? 'No response received.'
}
