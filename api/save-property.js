import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify secret token
  const auth = req.headers['x-api-secret']
  if (!auth || auth !== process.env.SAVE_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Validate body
  const property = req.body
  if (!property || !property.address) {
    return res.status(400).json({ error: 'Missing property.address' })
  }

  // Write to Supabase
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )

  // Upsert by address (normalize to lowercase for matching)
  const { data: existing } = await supabase
    .from('properties')
    .select('id, data')
    .eq('data->>address', property.address)
    .maybeSingle()

  const record = {
    id: existing?.id || property.id || `prop_${Date.now()}`,
    data: {
      ...property,
      id: existing?.id || property.id || `prop_${Date.now()}`,
      dateAdded: existing?.data?.dateAdded ||
        new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      updatedAt: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('properties')
    .upsert(record)

  if (error) {
    console.error('Supabase error:', error)
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({
    success: true,
    action: existing ? 'updated' : 'created',
    id: record.id,
    address: property.address,
  })
}
