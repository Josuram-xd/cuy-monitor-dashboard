import type { PointerEvent } from 'react'
import { prefersReducedMotion } from './reducedMotion'

const DURATION_MS = 550

// A ring of light that grows from the exact point where a button was pressed. Drawn with the Web
// Animations API on a throwaway span, so it needs no state and cleans itself up.
export function spawnRipple(event: PointerEvent<HTMLElement>): void {
  const host = event.currentTarget
  if (prefersReducedMotion() || (host as HTMLButtonElement).disabled) {
    return
  }
  const box = host.getBoundingClientRect()
  const size = Math.max(box.width, box.height) * 2
  const ripple = document.createElement('span')
  ripple.setAttribute('aria-hidden', 'true')
  ripple.dataset.ripple = ''
  Object.assign(ripple.style, {
    width: `${size}px`,
    height: `${size}px`,
    left: `${event.clientX - box.left - size / 2}px`,
    top: `${event.clientY - box.top - size / 2}px`,
  })
  host.appendChild(ripple)
  const animation = ripple.animate?.(
    [
      { transform: 'scale(0)', opacity: 0.35 },
      { transform: 'scale(1)', opacity: 0 },
    ],
    { duration: DURATION_MS, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  )
  if (animation) {
    animation.onfinish = () => ripple.remove()
  } else {
    ripple.remove()
  }
}
