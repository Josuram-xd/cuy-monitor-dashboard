import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import styles from './Reveal.module.css'

interface RevealProps {
  children: ReactNode
  // ms to wait once it is on screen, so a row of cards comes in one after another
  delay?: number
  className?: string
}

// Fades and lifts its content the first time it scrolls into view. Without IntersectionObserver
// (old browsers, tests) the content is simply there.
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const node = ref.current
    if (seen || !node) {
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [seen])

  return (
    <div
      ref={ref}
      className={cx(styles.reveal, seen && styles.seen, className)}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}
