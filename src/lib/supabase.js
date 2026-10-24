import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

function looksPlaceholder(value) {
  return !value || /your[-_]|example|placeholder|YOUR_/i.test(value)
}

export const supabaseMode = (() => {
  if (!url && !anonKey) return 'local'
  if (looksPlaceholder(url) || looksPlaceholder(anonKey)) return 'invalid'
  return 'remote'
})()

export const supabase = supabaseMode === 'remote'
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export function supabaseProjectHost() {
  try {
    return new URL(url).host
  } catch {
    return ''
  }
}
