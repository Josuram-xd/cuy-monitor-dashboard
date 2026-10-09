import styles from './Logo.module.css'

interface LogoProps {
  size?: number
  // light: white tile for dark backgrounds
  tone?: 'brand' | 'light'
}

// Decorative mark of the app: a guinea pig on a tile. The name next to it says what it is.
export function Logo({ size = 32, tone = 'brand' }: LogoProps) {
  return (
    <span
      className={tone === 'light' ? styles.light : styles.brand}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" width={size * 0.82} height={size * 0.82} focusable="false">
        <circle cx="25.5" cy="9.5" r="3" className={styles.leaf} />
        <circle cx="11" cy="26.4" r="1.9" fill="currentColor" />
        <circle cx="23" cy="26.4" r="1.9" fill="currentColor" />
        <ellipse cx="17.5" cy="20" rx="11" ry="7.4" fill="currentColor" />
        <ellipse cx="9" cy="18.6" rx="6.3" ry="5.5" fill="currentColor" />
        <circle cx="10.4" cy="12.6" r="2.7" fill="currentColor" />
        <circle cx="10.4" cy="12.6" r="1.3" className={styles.inner} />
        <circle cx="7.4" cy="17.2" r="1.6" className={styles.eyeWhite} />
        <circle cx="7" cy="17.2" r="0.8" className={styles.pupil} />
        <circle cx="3.4" cy="19.4" r="1" className={styles.pupil} />
        <ellipse cx="19.5" cy="22.4" rx="5.5" ry="3" className={styles.belly} />
      </svg>
    </span>
  )
}
