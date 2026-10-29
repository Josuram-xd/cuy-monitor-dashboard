import { catalogOption } from '../../catalog/catalog'
import styles from './CoatSwatch.module.css'

interface CoatSwatchProps {
  // a COAT_COLOR code; the hex comes from the catalog of the database
  color: string
  size?: number
}

// A small round sample of the fur color. Decorative: the name is always written next to it.
export function CoatSwatch({ color, size = 18 }: CoatSwatchProps) {
  const { hex } = catalogOption('coatColors', color)
  return (
    <span
      className={styles.swatch}
      style={{ width: size, height: size, background: hex ?? 'var(--color-surface-2)' }}
      aria-hidden="true"
    />
  )
}
