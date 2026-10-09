import type { CoatColor } from '../../types/GuineaPigProfile'
import { cx } from '../../utils/cx'
import styles from './CoatSwatch.module.css'

interface CoatSwatchProps {
  color: CoatColor
  size?: number
}

// A small round sample of the fur color. Decorative: the name is always written next to it.
export function CoatSwatch({ color, size = 18 }: CoatSwatchProps) {
  return (
    <span
      className={cx(styles.swatch, styles[color])}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}
