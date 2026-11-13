// One place for the motion the app uses, so every animated list and panel moves the same way.
// The durations stay inside the range the CSS transitions in tokens.css already use: this is the
// same house style, driven from code where CSS can't reach (a list that reorders, a panel that
// appears when a WebSocket message arrives).
import type { Transition, Variants } from 'motion/react'

// a short, soft ease-out: things settle instead of snapping
export const EASE_OUT: Transition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] }

/** A list whose items come in one after another, barely. */
export const listVariants: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.045 } },
}

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  shown: { opacity: 1, y: 0, transition: EASE_OUT },
}

/** A panel that appears later than the thing it belongs to, and may go away again. */
export const panelVariants: Variants = {
  hidden: { opacity: 0, height: 0, y: -4 },
  shown: { opacity: 1, height: 'auto', y: 0, transition: EASE_OUT },
  gone: { opacity: 0, height: 0, transition: { duration: 0.18 } },
}

/**
 * A page leaving and the next one arriving. The numbers are the ones global.css already used for
 * `page-enter` (280ms, rising 10px): the feel does not change, but a page can now also leave, which
 * a CSS animation on an unmounting element cannot do.
 */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.2, 0, 0, 1] } },
  gone: { opacity: 0, y: -6, transition: { duration: 0.16, ease: 'easeIn' } },
}
