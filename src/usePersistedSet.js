import { useState, useEffect } from 'react'

// Persists a Set<string> to localStorage under the given key, syncing on
// every change. Falls back to defaultValue if nothing is stored yet, or if
// the stored value is malformed (e.g. from an older schema).
export function usePersistedSet(key, defaultValue) {
  const [set, setSet] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return new Set(defaultValue)
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return new Set(defaultValue)
      return new Set(parsed)
    } catch {
      return new Set(defaultValue)
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(set)))
    } catch {
      // localStorage unavailable (private browsing, quota, etc.) — fail silently,
      // filters just won't persist this session
    }
  }, [key, set])

  return [set, setSet]
}
