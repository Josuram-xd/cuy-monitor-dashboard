// The person asked the system for less motion: every effect driven from code checks this first
// (the CSS ones are switched off in global.css).
export function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}
