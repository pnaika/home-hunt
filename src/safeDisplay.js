// Shared crash-proof value renderer.
// Anything non-primitive (object, array, nested junk from a botched JSON paste)
// gets stringified into readable text instead of being handed to React as a
// child, which would throw "Objects are not valid as a React child" and blank
// the whole page.
export function safeDisplay(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value

  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'object' && item !== null) ? JSON.stringify(item) : String(item))
      .join('\n')
  }

  if (typeof value === 'object') {
    try {
      const entries = Object.entries(value)
      if (entries.length === 0) return ''
      if (entries.every(([, v]) => typeof v !== 'object' || v === null)) {
        return entries.map(([k, v]) => `${k}: ${v}`).join('\n')
      }
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }

  return String(value)
}
