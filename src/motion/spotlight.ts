import { prefersReducedMotion } from './reducedMotion'

const ATTRIBUTE = 'data-spotlight'

// A soft light that follows the pointer over anything marked data-spotlight (cards, panels). One listener
// for the whole page writes the pointer position into the element under it; the light itself is CSS
// (global.css), so React never re-renders for it. Returns the function that removes the listener.
export function startSpotlight(root: Document = document): () => void {
  if (prefersReducedMotion()) {
    return () => {}
  }
  let frame = 0
  let last: PointerEvent | null = null

  function paint() {
    frame = 0
    const target = (last?.target as Element | null)?.closest?.(`[${ATTRIBUTE}]`)
    if (!(target instanceof HTMLElement) || !last) {
      return
    }
    const box = target.getBoundingClientRect()
    target.style.setProperty('--spot-x', `${last.clientX - box.left}px`)
    target.style.setProperty('--spot-y', `${last.clientY - box.top}px`)
  }

  function onMove(event: PointerEvent) {
    // touch has no hover: the light would only flash under the finger
    if (event.pointerType !== 'mouse') {
      return
    }
    last = event
    frame ||= requestAnimationFrame(paint)
  }

  root.addEventListener('pointermove', onMove, { passive: true })
  return () => {
    root.removeEventListener('pointermove', onMove)
    cancelAnimationFrame(frame)
  }
}
