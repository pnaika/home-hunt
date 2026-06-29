import { useState, useEffect } from 'react'

const KEY = 'home_hunt_user'

export function useUser() {
  const [user, setUser] = useState(() => localStorage.getItem(KEY) || '')
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setShowPicker(true)
  }, [])

  function saveName(name) {
    const trimmed = name.trim()
    if (!trimmed) return
    localStorage.setItem(KEY, trimmed)
    setUser(trimmed)
    setShowPicker(false)
  }

  function clearUser() {
    localStorage.removeItem(KEY)
    setUser('')
    setShowPicker(true)
  }

  return { user, showPicker, setShowPicker, saveName, clearUser }
}
