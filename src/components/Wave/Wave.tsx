import { useId } from 'react'
import styles from './Wave.module.css'

interface WaveProps {
  // a flat color (any CSS color or var()); by default the page background
  color?: string
  // or the same left-to-right gradient as the green header, so the wave looks like part of it
  gradient?: { from: string; to: string }
  flip?: boolean
}

// A soft wavy edge between two sections (like the waves of the playful landings).
export function Wave({ color = 'var(--color-bg)', gradient, flip = false }: WaveProps) {
  const gradientId = useId()
  return (
    <svg
      className={styles.wave}
      style={{ color, transform: flip ? 'scaleY(-1)' : undefined }}
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {gradient && (
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" style={{ stopColor: gradient.from }} />
            <stop offset="1" style={{ stopColor: gradient.to }} />
          </linearGradient>
        </defs>
      )}
      <path
        fill={gradient ? `url(#${gradientId})` : 'currentColor'}
        d="M0 0 H1200 V26 C 1120 4, 900 64, 750 34 S 450 -4, 300 22 S 100 40, 0 20 Z"
      />
    </svg>
  )
}
