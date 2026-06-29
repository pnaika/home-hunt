import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase env vars missing — running in offline mode (localStorage fallback)')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ── DB helpers ────────────────────────────────────────────────────────────────

export async function fetchProperties() {
  if (!supabase) return localLoad()
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) { console.error(error); return localLoad() }
  return data.map(r => r.data)
}

export async function upsertProperty(property) {
  if (!supabase) return localUpsert(property)
  const { error } = await supabase
    .from('properties')
    .upsert({ id: property.id, data: property, updated_at: new Date().toISOString() })
  if (error) { console.error(error); localUpsert(property) }
}

export async function deleteProperty(id) {
  if (!supabase) return localDelete(id)
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) { console.error(error); localDelete(id) }
}

// ── localStorage fallback ─────────────────────────────────────────────────────
const LS_KEY = 'home_hunt_properties'

function localLoad() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function localUpsert(p) {
  const all = localLoad()
  const updated = all.find(x => x.id === p.id) ? all.map(x => x.id === p.id ? p : x) : [p, ...all]
  localStorage.setItem(LS_KEY, JSON.stringify(updated))
}
function localDelete(id) {
  localStorage.setItem(LS_KEY, JSON.stringify(localLoad().filter(p => p.id !== id)))
}
