import { createPortal } from 'react-dom'
import { useEffect, useState, useRef } from 'react'

// Renders children into document.body, positioned under a given anchor element.
// Exists because an absolutely-positioned dropdown nested inside any ancestor
// with overflow:auto/hidden (e.g. a horizontally-scrolling filter pill row)
// gets clipped at that ancestor's boundary — no z-index value can escape a
// clipping/scroll context. Rendering via a portal sidesteps the whole problem.
export function DropdownPortal({ anchorRef, open, onClose, children, align = 'left' }) {
  const [coords, setCoords] = useState(null)
  const portalRef = useRef(null)

  useEffect(() => {
    if (!open || !anchorRef.current) { setCoords(null); return }

    function updatePosition() {
      const rect = anchorRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + 6,
        left: align === 'right' ? undefined : rect.left,
        right: align === 'right' ? window.innerWidth - rect.right : undefined,
      })
    }

    updatePosition()
    // Reposition on scroll/resize so it tracks the button if the page moves
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, anchorRef, align])

  useEffect(() => {
    if (!open) return

    function onClickOutside(e) {
      // Ignore clicks on the anchor button (it has its own toggle logic)
      if (anchorRef.current && anchorRef.current.contains(e.target)) return
      // CRITICAL: also ignore clicks inside the portal content itself.
      // The portal renders into document.body, a DOM SIBLING of the anchor —
      // not a descendant — so anchorRef.contains() alone can never catch
      // clicks on dropdown items. Without this check, mousedown on any
      // item closes the dropdown immediately (before the click event even
      // fires), and the subsequent click re-targets to whatever element
      // is now underneath — typically a property card — triggering navigation.
      if (portalRef.current && portalRef.current.contains(e.target)) return
      onClose()
    }

    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('touchstart', onClickOutside)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('touchstart', onClickOutside)
    }
  }, [open, anchorRef, onClose])

  if (!open || !coords) return null

  return createPortal(
    <div
      ref={portalRef}
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        right: coords.right,
        zIndex: 1000,
      }}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  )
}
