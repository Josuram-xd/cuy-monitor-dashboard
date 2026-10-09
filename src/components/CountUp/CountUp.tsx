import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  value: number
  // ms the count takes from the old number to the new one
  duration?: number
}

const canAnimate = () =>
  typeof requestAnimationFrame === 'function' &&
  !(
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

// A number that counts up to its value instead of just appearing. The real value is always the
// text a screen reader finds; only the sighted animation goes through the in-between numbers.
export function CountUp({ value, duration = 700 }: CountUpProps) {
  // null = not animating: show the value itself
  const [shown, setShown] = useState<number | null>(null)
  const from = useRef(value)

  useEffect(() => {
    const start = from.current
    from.current = value
    if (start === value || !canAnimate()) {
      return
    }
    let frame = 0
    const begin = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - begin) / duration)
      // ease-out: fast at first, then it settles
      const eased = 1 - Math.pow(1 - progress, 3)
      if (progress < 1) {
        setShown(Math.round(start + (value - start) * eased))
        frame = requestAnimationFrame(tick)
      } else {
        setShown(null)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return <span aria-label={String(value)}>{shown ?? value}</span>
}
