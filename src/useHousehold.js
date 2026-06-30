import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  setStoredHouseholdCode, isValidHouseholdCode, normalizeHouseholdCode,
} from './household.js'

// Resolves the active household code from the URL param. By the time this
// runs, App.jsx's <RootRedirect> has already guaranteed there IS a code in
// the URL (it redirects bare "/" to /h/<stored-or-fresh-code> before this
// component ever mounts) — so this hook's job is just to read it, validate
// it, and keep localStorage in sync so future bare "/" visits return here.
//
// If someone hand-edits the URL to a malformed code, we don't silently
// rewrite it out from under them — better to let downstream code (e.g. a
// "this household code looks invalid" message) handle that explicitly than
// surprise-redirect mid-session.
export function useHousehold() {
  const { code: urlCode } = useParams()
  const navigate = useNavigate()
  const [householdId, setHouseholdId] = useState(null)
  const [ready, setReady] = useState(false)
  const [invalidCode, setInvalidCode] = useState(false)

  useEffect(() => {
    if (!urlCode) { setReady(false); return }

    const normalized = normalizeHouseholdCode(urlCode)
    if (!isValidHouseholdCode(normalized)) {
      setInvalidCode(true)
      setReady(true)
      return
    }

    setInvalidCode(false)
    setStoredHouseholdCode(normalized)
    setHouseholdId(normalized)
    setReady(true)
  }, [urlCode])

  // Switching households is a deliberate user action (paste a code, or pick
  // a saved one) — navigates to the new /h/:code, which re-triggers the
  // effect above via the changed urlCode param.
  function switchHousehold(newCode) {
    const normalized = normalizeHouseholdCode(newCode)
    if (!isValidHouseholdCode(normalized)) return false
    navigate(`/h/${normalized}`)
    return true
  }

  return { householdId, ready, invalidCode, switchHousehold }
}
