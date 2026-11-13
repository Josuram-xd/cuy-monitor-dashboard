import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { prefersReducedMotion } from './reducedMotion'

// How far the card leans, in degrees, at the very edge. Small on purpose: enough to read as depth,
// not enough to make the text swim or the edges go soft.
const MAX_TILT = 7

export interface Tilt {
  /** Spread onto the element that leans. */
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerLeave: (event: ReactPointerEvent<HTMLElement>) => void
}

/**
 * Makes an element lean towards the pointer, with real perspective rather than a flat scale.
 *
 * It writes two custom properties, --tilt-x and --tilt-y, which the element's own `:hover` rule puts
 * inside the transform it already has. Done this way the lean costs no React render and no animated
 * value per card, and the ease back to flat is the transition the card already declares: when the
 * pointer leaves, `:hover` stops applying and the transform returns on its own.
 *
 * It does nothing for anyone who asked the system for less motion, and nothing for a pointer that is
 * not a mouse: on a touch screen there is no hover, so the card would only ever lean after a tap,
 * which looks like a glitch rather than an effect.
 */
export function useTilt(enabled = true): Tilt {
  // one write per frame: pointermove fires far more often than the screen redraws
  const frame = useRef(0)

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || event.pointerType !== 'mouse' || prefersReducedMotion()) {
        return
      }
      const element = event.currentTarget
      const box = element.getBoundingClientRect()
      // -1 to 1, where the pointer is inside the element
      const x = ((event.clientX - box.left) / box.width - 0.5) * 2
      const y = ((event.clientY - box.top) / box.height - 0.5) * 2
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        // a pointer below the middle lifts the bottom edge, so this one is inverted
        element.style.setProperty('--tilt-x', `${(-y * MAX_TILT).toFixed(2)}deg`)
        element.style.setProperty('--tilt-y', `${(x * MAX_TILT).toFixed(2)}deg`)
      })
    },
    [enabled],
  )

  const onPointerLeave = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    cancelAnimationFrame(frame.current)
    // back to flat, so the card does not keep the last lean for the next time it is hovered
    event.currentTarget.style.removeProperty('--tilt-x')
    event.currentTarget.style.removeProperty('--tilt-y')
  }, [])

  return { onPointerMove, onPointerLeave }
}
