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

export async function fetchProperties({ includeDeleted = false } = {}) {
  if (!supabase) return localLoad(includeDeleted)
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) { console.error(error); return localLoad(includeDeleted) }
  const rows = data.map(r => r.data)
  return includeDeleted ? rows : rows.filter(p => !p.deleted)
}

export async function upsertProperty(property) {
  if (!supabase) return localUpsert(property)
  const { error } = await supabase
    .from('properties')
    .upsert({ id: property.id, data: property, updated_at: new Date().toISOString() })
  if (error) { console.error(error); localUpsert(property) }
}

// Soft delete — sets deleted:true + deletedAt, keeps the row
export async function softDeleteProperty(id) {
  if (!supabase) return localSoftDelete(id)
  const { data } = await supabase.from('properties').select('data').eq('id', id).single()
  if (!data) return
  const updated = { ...data.data, deleted: true, deletedAt: new Date().toISOString() }
  await upsertProperty(updated)
}

// Restore from soft delete
export async function restoreProperty(id) {
  if (!supabase) return localRestore(id)
  const { data } = await supabase.from('properties').select('data').eq('id', id).single()
  if (!data) return
  const updated = { ...data.data, deleted: false, deletedAt: null }
  await upsertProperty(updated)
}

// Hard delete (permanent — only used for purge after 30 days)
export async function hardDeleteProperty(id) {
  if (!supabase) return localHardDelete(id)
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) console.error(error)
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function fetchComments(propertyId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: true })
  if (error) { console.error(error); return [] }
  return data
}

export async function addComment(propertyId, author, text) {
  if (!supabase) return null
  const comment = {
    id: `c_${Date.now()}`,
    property_id: propertyId,
    author,
    text,
    created_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('comments').insert(comment)
  if (error) { console.error(error); return null }
  return comment
}

export async function deleteComment(id) {
  if (!supabase) return
  await supabase.from('comments').delete().eq('id', id)
}

// ── Votes ─────────────────────────────────────────────────────────────────────

export async function fetchVotes(propertyId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('property_id', propertyId)
  if (error) { console.error(error); return [] }
  return data
}

export async function upsertVote(propertyId, author, vote) {
  if (!supabase) return
  const { error } = await supabase.from('votes').upsert({
    id: `v_${propertyId}_${author}`,
    property_id: propertyId,
    author,
    vote,
    created_at: new Date().toISOString(),
  }, { onConflict: 'property_id,author' })
  if (error) console.error(error)
}

export async function removeVote(propertyId, author) {
  if (!supabase) return
  await supabase.from('votes').delete()
    .eq('property_id', propertyId)
    .eq('author', author)
}

// ── Realtime subscriptions ────────────────────────────────────────────────────

export function subscribeToProperties(callback) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel('properties-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, callback)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export function subscribeToComments(propertyId, callback) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel(`comments-${propertyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments',
      filter: `property_id=eq.${propertyId}` }, callback)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

export function subscribeToVotes(propertyId, callback) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel(`votes-${propertyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'votes',
      filter: `property_id=eq.${propertyId}` }, callback)
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// ── localStorage fallback ─────────────────────────────────────────────────────
const LS_KEY = 'home_hunt_properties'
function localLoad(includeDeleted) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
    return includeDeleted ? all : all.filter(p => !p.deleted)
  } catch { return [] }
}
function localUpsert(p) {
  const all = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  const updated = all.find(x => x.id === p.id) ? all.map(x => x.id === p.id ? p : x) : [p, ...all]
  localStorage.setItem(LS_KEY, JSON.stringify(updated))
}
function localSoftDelete(id) {
  const all = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  localStorage.setItem(LS_KEY, JSON.stringify(
    all.map(p => p.id === id ? { ...p, deleted: true, deletedAt: new Date().toISOString() } : p)
  ))
}
function localRestore(id) {
  const all = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  localStorage.setItem(LS_KEY, JSON.stringify(
    all.map(p => p.id === id ? { ...p, deleted: false, deletedAt: null } : p)
  ))
}
function localHardDelete(id) {
  const all = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  localStorage.setItem(LS_KEY, JSON.stringify(all.filter(p => p.id !== id)))
}
