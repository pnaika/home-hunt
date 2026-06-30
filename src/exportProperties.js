// Bulk export of all properties currently in the tracker. Exists because
// there was previously no durable way to get "everything" out of the app —
// each deep-dive's JSON only ever existed as a one-off chat message, with
// no consolidated source of truth a person could pull from later.

// Strips internal-only fields that don't make sense in an export meant to
// be re-shareable or re-importable (favourite/deleted are local UI state,
// not research data).
function cleanForExport(property) {
  const { favourite, deleted, deletedAt, ...rest } = property
  return rest
}

export function buildExportPayload(properties, { includeDeleted = false } = {}) {
  const filtered = includeDeleted ? properties : properties.filter(p => !p.deleted)
  return {
    exportedAt: new Date().toISOString(),
    count: filtered.length,
    properties: filtered.map(cleanForExport),
  }
}

export function downloadPropertiesJson(properties, options = {}) {
  const payload = buildExportPayload(properties, options)
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const dateStr = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `home-hunt-export-${dateStr}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getExportJsonString(properties, options = {}) {
  return JSON.stringify(buildExportPayload(properties, options), null, 2)
}
