import { flushSync } from 'react-dom'
import { prefersReducedMotion } from './reducedMotion'

export interface Point {
  x: number
  y: number
}

// Changes the theme with a circle that opens from the point that was clicked (View Transitions API).
// Browsers without it, or a person who asked for less motion, get the change at once.
export function changeThemeWithReveal(apply: () => void, origin?: Point): void {
  const start = (
    document as Document & {
      startViewTransition?: (update: () => void) => { ready: Promise<void> }
    }
  ).startViewTransition
  if (!start || prefersReducedMotion()) {
    apply()
    return
  }
  const { x, y } = origin ?? { x: innerWidth / 2, y: innerHeight / 2 }
  // the farthest corner from the click: the circle ends covering the whole screen
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const transition = start.call(document, () => flushSync(apply))
  void transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
      },
      {
        duration: 520,
        easing: 'cubic-bezier(0.2, 0, 0, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  })
}
