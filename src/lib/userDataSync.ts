import { supabase } from './supabase'
import type { SyncData } from '../store/useAppStore'

export type { SyncData }

export async function loadUserData(userId: string): Promise<SyncData | null> {
  if (!userId) return null   // never query with empty id
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, data')
      .eq('user_id', userId)   // client-side filter (RLS enforces this server-side too)
      .single()

    if (error || !data) return null

    // Sanity-check: the returned row must belong to the requesting user.
    // Supabase RLS already guarantees this, but we verify client-side too.
    if (data.user_id !== userId) return null

    return data.data as SyncData
  } catch {
    return null
  }
}

export async function saveUserData(userId: string, syncData: SyncData, email?: string | null): Promise<void> {
  // Save core data first — never let email column issues block this
  try {
    await supabase
      .from('user_profiles')
      .upsert(
        { user_id: userId, data: syncData, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
  } catch {
    // Fail silently — localStorage still has the data
    return
  }

  // Best-effort: also store email (requires email column to exist)
  if (email) {
    try {
      await supabase
        .from('user_profiles')
        .update({ email })
        .eq('user_id', userId)
    } catch {
      // Column may not exist yet — harmless
    }
  }
}
