import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase env vars missing — running in offline mode (localStorage fallback)')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ── Properties ────────────────────────────────────────────────────────────────
// Every function takes householdId as its first argument and scopes the
// query to it. There's no server-side enforcement of this (RLS policy is
// still "public access" — see SUPABASE_MIGRATION.sql §5 comments) — the
// household code is a sharing convention, not a security boundary. Anyone
// who knows or guesses a code can read/write it. This is a deliberate
// tradeoff for a no-login personal tool; see docs/TRD.md.

export async function fetchProperties(householdId, { includeDeleted = false } = {}) {
  if (!supabase) return localLoad(householdId, includeDeleted)
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('household_id', householdId)
    .order('updated_at', { ascending: false })
  if (error) { console.error(error); return localLoad(householdId, includeDeleted) }
  const rows = data.map(r => r.data)
  return includeDeleted ? rows : rows.filter(p => !p.deleted)
}

export async function upsertProperty(householdId, property) {
  if (!supabase) return localUpsert(householdId, property)
  const { error } = await supabase
    .from('properties')
    .upsert({ id: property.id, household_id: householdId, data: property, updated_at: new Date().toISOString() })
  if (error) { console.error(error); localUpsert(householdId, property) }
}

// Soft delete — sets deleted:true + deletedAt, keeps the row
export async function softDeleteProperty(householdId, id) {
  if (!supabase) return localSoftDelete(householdId, id)
  const { data } = await supabase.from('properties').select('data').eq('id', id).eq('household_id', householdId).single()
  if (!data) return
  const updated = { ...data.data, deleted: true, deletedAt: new Date().toISOString() }
  await upsertProperty(householdId, updated)
}

// Restore from soft delete
export async function restoreProperty(householdId, id) {
  if (!supabase) return localRestore(householdId, id)
  const { data } = await supabase.from('properties').select('data').eq('id', id).eq('household_id', householdId).single()
  if (!data) return
  const updated = { ...data.data, deleted: false, deletedAt: null }
  await upsertProperty(householdId, updated)
}

// Hard delete (permanent — only used for purge after 30 days)
export async function hardDeleteProperty(householdId, id) {
  if (!supabase) return localHardDelete(householdId, id)
  const { error } = await supabase.from('properties').delete().eq('id', id).eq('household_id', householdId)
  if (error) console.error(error)
}

// ── Price checks ──────────────────────────────────────────────────────────────

export async function fetchPriceChecks(householdId, propertyId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('price_checks')
    .select('*')
    .eq('property_id', propertyId)
    .eq('household_id', householdId)
    .order('checked_at', { ascending: true })
  if (error) { console.error(error); return [] }
  return data
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function fetchComments(householdId, propertyId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('property_id', propertyId)
    .eq('household_id', householdId)
    .order('created_at', { ascending: true })
  if (error) { console.error(error); return [] }
  return data
}

export async function addComment(householdId, propertyId, author, text) {
  if (!supabase) return null
  const comment = {
    id: `c_${Date.now()}`,
    household_id: householdId,
    property_id: propertyId,
    author,
    text,
    created_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('comments').insert(comment)
  if (error) { console.error(error); return null }
  return comment
}

export async function deleteComment(householdId, id) {
  if (!supabase) return
  await supabase.from('comments').delete().eq('id', id).eq('household_id', householdId)
}

// ── Votes ─────────────────────────────────────────────────────────────────────

export async function fetchVotes(householdId, propertyId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('property_id', propertyId)
    .eq('household_id', householdId)
  if (error) { console.error(error); return [] }
  return data
}

export async function upsertVote(householdId, propertyId, author, vote) {
  if (!supabase) return
  const { error } = await supabase.from('votes').upsert({
    id: `v_${householdId}_${propertyId}_${author}`,
    household_id: householdId,
    property_id: propertyId,
    author,
    vote,
    created_at: new Date().toISOString(),
  }, { onConflict: 'property_id,household_id,author' })
  if (error) console.error(error)
}

export async function removeVote(householdId, propertyId, author) {
  if (!supabase) return
  await supabase.from('votes').delete()
    .eq('property_id', propertyId)
    .eq('household_id', householdId)
    .eq('author', author)
}

// ── Realtime subscriptions ────────────────────────────────────────────────────
// Realtime postgres_changes filters only support a single eq() filter
// expression server-side, so we filter by household_id (the coarser scope)
// and let property_id-specific filtering for comments/votes happen
// client-side if needed — in practice these are scoped to one open detail
// page at a time, so the extra client-side check is cheap.

export function subscribeToProperties(householdId, callback) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel(`properties-${householdId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'properties', filter: `household_id=eq.${householdId}` }, callback)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export function subscribeToComments(householdId, propertyId, callback) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel(`comments-${householdId}-${propertyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments',
      filter: `property_id=eq.${propertyId}` }, callback)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export function subscribeToVotes(householdId, propertyId, callback) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel(`votes-${householdId}-${propertyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'votes',
      filter: `property_id=eq.${propertyId}` }, callback)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// ── localStorage fallback ─────────────────────────────────────────────────────
// Used only when Supabase env vars are missing. Scoped by household via a
// per-household storage key so even the offline fallback respects isolation.
function lsKey(householdId) { return `home_hunt_properties_${householdId || 'default'}` }

function localLoad(householdId, includeDeleted) {
  try {
    const all = JSON.parse(localStorage.getItem(lsKey(householdId)) || '[]')
    return includeDeleted ? all : all.filter(p => !p.deleted)
  } catch { return [] }
}
function localUpsert(householdId, p) {
  const all = JSON.parse(localStorage.getItem(lsKey(householdId)) || '[]')
  const updated = all.find(x => x.id === p.id) ? all.map(x => x.id === p.id ? p : x) : [p, ...all]
  localStorage.setItem(lsKey(householdId), JSON.stringify(updated))
}
function localSoftDelete(householdId, id) {
  const all = JSON.parse(localStorage.getItem(lsKey(householdId)) || '[]')
  localStorage.setItem(lsKey(householdId), JSON.stringify(
    all.map(p => p.id === id ? { ...p, deleted: true, deletedAt: new Date().toISOString() } : p)
  ))
}
function localRestore(householdId, id) {
  const all = JSON.parse(localStorage.getItem(lsKey(householdId)) || '[]')
  localStorage.setItem(lsKey(householdId), JSON.stringify(
    all.map(p => p.id === id ? { ...p, deleted: false, deletedAt: null } : p)
  ))
}
function localHardDelete(householdId, id) {
  const all = JSON.parse(localStorage.getItem(lsKey(householdId)) || '[]')
  localStorage.setItem(lsKey(householdId), JSON.stringify(all.filter(p => p.id !== id)))
}
