import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = req.headers['x-api-secret']
  if (!auth || auth !== process.env.SAVE_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const property = req.body
  if (!property || !property.address) {
    return res.status(400).json({ error: 'Missing property.address' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )

  const { data: existing } = await supabase
    .from('properties')
    .select('id, data')
    .eq('data->>address', property.address)
    .maybeSingle()

  const nowIso = new Date().toISOString()
  const oldPrice = existing?.data?.price ? Number(existing.data.price) : null
  const newPrice = property.price ? Number(property.price) : null

  // Detect price change and build a human-readable flag
  let priceChangeFlag = property.priceChangeFlag || ''
  if (oldPrice && newPrice && oldPrice !== newPrice) {
    const diff = newPrice - oldPrice
    const pct = ((diff / oldPrice) * 100).toFixed(1)
    if (diff < 0) {
      priceChangeFlag = `⬇️ Dropped $${Math.abs(diff).toLocaleString()} (${pct}%)`
    } else {
      priceChangeFlag = `⬆️ Increased $${diff.toLocaleString()} (+${pct}%)`
    }
  }

  const record = {
    id: existing?.id || property.id || `prop_${Date.now()}`,
    data: {
      ...property,
      id: existing?.id || property.id || `prop_${Date.now()}`,
      dateAdded: existing?.data?.dateAdded ||
        new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      // Preserve favourite/deleted state unless explicitly overridden
      favourite: property.favourite !== undefined ? property.favourite : (existing?.data?.favourite || false),
      deleted: property.deleted !== undefined ? property.deleted : (existing?.data?.deleted || false),
      lastCheckedAt: nowIso,
      priceChangeFlag,
      updatedAt: nowIso,
    },
    updated_at: nowIso,
  }

  const { error } = await supabase.from('properties').upsert(record)

  if (error) {
    console.error('Supabase error:', error)
    return res.status(500).json({ error: error.message })
  }

  // Log this price observation to history (best-effort, don't fail the request if this errors)
  if (newPrice) {
    try {
      await supabase.from('price_checks').insert({
        id: `pc_${record.id}_${Date.now()}`,
        property_id: record.id,
        price: newPrice,
        dom: property.dom || null,
        source: 'claude_recheck',
      })
    } catch (e) {
      console.error('price_checks insert failed (non-fatal):', e)
    }
  }

  return res.status(200).json({
    success: true,
    action: existing ? 'updated' : 'created',
    id: record.id,
    address: property.address,
    priceChanged: !!priceChangeFlag,
    priceChangeFlag,
  })
}
