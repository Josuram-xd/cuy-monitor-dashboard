import { useEffect, useRef, type CSSProperties } from 'react'
import styles from './AppBackdrop.module.css'

type Sprite = 'leaf' | 'paw' | 'carrot' | 'hay'

// left/top in %, size in px, depth: how far it moves with the scroll and the mouse (far things move less)
const SPRITES: {
  kind: Sprite
  left: number
  top: number
  size: number
  depth: number
  delay: number
}[] = [
  { kind: 'leaf', left: 6, top: 14, size: 38, depth: 0.5, delay: 0 },
  { kind: 'paw', left: 86, top: 10, size: 30, depth: 0.8, delay: -5 },
  { kind: 'carrot', left: 92, top: 46, size: 40, depth: 1.1, delay: -9 },
  { kind: 'hay', left: 3, top: 56, size: 44, depth: 0.7, delay: -3 },
  { kind: 'leaf', left: 78, top: 72, size: 34, depth: 1.3, delay: -12 },
  { kind: 'paw', left: 14, top: 86, size: 28, depth: 0.9, delay: -7 },
  { kind: 'carrot', left: 48, top: 92, size: 32, depth: 0.6, delay: -14 },
  { kind: 'leaf', left: 60, top: 6, size: 28, depth: 0.4, delay: -2 },
]

const CLOUDS = [
  { top: 18, depth: 0.25, scale: 1.2, duration: 80, delay: -10 },
  { top: 52, depth: 0.45, scale: 0.9, duration: 64, delay: -34 },
  { top: 78, depth: 0.35, scale: 1.4, duration: 96, delay: -50 },
]

function SpriteArt({ kind }: { kind: Sprite }) {
  switch (kind) {
    case 'leaf':
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M5 27C5 12 14 4 28 4c0 14-8 23-23 23z" fill="currentColor" />
          <path
            d="M6 26L21 11"
            stroke="var(--color-bg)"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )
    case 'paw':
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
          <ellipse cx="16" cy="21" rx="7.5" ry="6" />
          <ellipse cx="7" cy="13" rx="3" ry="4" />
          <ellipse cx="13" cy="8" rx="3" ry="4.2" />
          <ellipse cx="19.5" cy="8" rx="3" ry="4.2" />
          <ellipse cx="25.5" cy="13" rx="3" ry="4" />
        </svg>
      )
    case 'carrot':
      return (
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M20 9c3 3 3 8-3 17-2 3-4 3-5 1-1-1-1-3 1-5 5-6 6-11 7-13z" fill="currentColor" />
          <path
            d="M20 9c0-4 2-6 5-6M21 10c2-2 5-2 7-1M19 8c-1-3-3-4-5-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )
    case 'hay':
      return (
        <svg
          viewBox="0 0 32 32"
          aria-hidden="true"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M6 28L14 6M12 28L16 6M18 28L18 6M24 28L20 6M29 27L22 8" />
          <path d="M5 20h24" strokeWidth="3" />
        </svg>
      )
  }
}

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// A soft picture behind the whole app that moves with it: clouds, leaves, paws, carrots and blobs of
// color at different depths. Scrolling and moving the mouse shift the layers by different amounts
// (parallax), and each piece also drifts on its own. It is decoration only, never covers a click and
// stays still for people who asked for no motion.
export function AppBackdrop() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = root.current
    if (!node || prefersReducedMotion()) {
      return
    }
    let frame = 0
    let scroll = 0
    let mx = 0
    let my = 0
    const paint = () => {
      frame = 0
      node.style.setProperty('--scroll', String(scroll))
      node.style.setProperty('--mx', mx.toFixed(3))
      node.style.setProperty('--my', my.toFixed(3))
    }
    const schedule = () => {
      if (frame === 0) {
        frame = requestAnimationFrame(paint)
      }
    }
    const onScroll = () => {
      scroll = window.scrollY
      schedule()
    }
    const onPointer = (event: PointerEvent) => {
      // -1 to 1 from the center of the window
      mx = (event.clientX / window.innerWidth - 0.5) * 2
      my = (event.clientY / window.innerHeight - 0.5) * 2
      schedule()
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onPointer, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointer)
      if (frame !== 0) {
        cancelAnimationFrame(frame)
      }
    }
  }, [])

  return (
    <div ref={root} className={styles.backdrop} aria-hidden="true" data-testid="app-backdrop">
      <span className={styles.blob} style={{ '--depth': 0.15 } as CSSProperties} data-tone="mint" />
      <span className={styles.blob} style={{ '--depth': 0.3 } as CSSProperties} data-tone="sun" />
      <span className={styles.blob} style={{ '--depth': 0.2 } as CSSProperties} data-tone="peach" />
      {CLOUDS.map((cloud, index) => (
        <span
          key={index}
          className={styles.layer}
          style={{ '--depth': cloud.depth, top: `${cloud.top}%` } as CSSProperties}
        >
          <span
            className={styles.cloud}
            style={
              {
                '--scale': cloud.scale,
                animationDuration: `${cloud.duration}s`,
                animationDelay: `${cloud.delay}s`,
              } as CSSProperties
            }
          />
        </span>
      ))}
      {SPRITES.map((sprite, index) => (
        <span
          key={index}
          className={styles.layer}
          style={
            {
              '--depth': sprite.depth,
              left: `${sprite.left}%`,
              top: `${sprite.top}%`,
            } as CSSProperties
          }
        >
          <span
            className={styles.sprite}
            style={{ width: sprite.size, height: sprite.size, animationDelay: `${sprite.delay}s` }}
          >
            <SpriteArt kind={sprite.kind} />
          </span>
        </span>
      ))}
    </div>
  )
}
