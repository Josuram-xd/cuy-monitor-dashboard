import { catalogOption } from '../../catalog/catalog'
import styles from './MarkColorDot.module.css'

interface MarkColorDotProps {
  // a MARK_COLOR code; its name and its hex come from the catalog of the database
  color: string
  showLabel?: boolean
}

export function MarkColorDot({ color, showLabel = true }: MarkColorDotProps) {
  const { label, hex } = catalogOption('markColors', color)
  const style = { background: hex ?? 'var(--color-surface-2)' }

  if (!showLabel) {
    return <span className={styles.dot} style={style} role="img" aria-label={label} />
  }
  return (
    <span className={styles.wrapper}>
      <span className={styles.dot} style={style} aria-hidden="true" />
      {label}
    </span>
  )
}
