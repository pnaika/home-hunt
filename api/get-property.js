import { createClient } from '@supabase/supabase-js'

// Public read-only endpoint — no secret required, since this powers
// shareable links meant to be sent to an agent or partner without
// requiring them to have the app installed or know the API secret.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  if (!id) {
    return res.status(400).json({ error: 'Missing id parameter' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )

  const { data, error } = await supabase
    .from('properties')
    .select('data')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Supabase error:', error)
    return res.status(500).json({ error: error.message })
  }

  if (!data) {
    return res.status(404).json({ error: 'Property not found' })
  }

  // Strip internal-only fields before returning (favourite state, deleted flag)
  const { favourite, deleted, deletedAt, ...publicData } = data.data

  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300')
  return res.status(200).json({ property: publicData })
}
