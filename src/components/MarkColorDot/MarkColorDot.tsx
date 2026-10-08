import { t } from '../../i18n'
import type { MarkColor } from '../../types/MarkColor'
import styles from './MarkColorDot.module.css'

interface MarkColorDotProps {
  color: MarkColor
  showLabel?: boolean
}

export function MarkColorDot({ color, showLabel = true }: MarkColorDotProps) {
  const label = t(`markColor.${color}`)

  if (!showLabel) {
    return <span className={`${styles.dot} ${styles[color]}`} role="img" aria-label={label} />
  }
  return (
    <span className={styles.wrapper}>
      <span className={`${styles.dot} ${styles[color]}`} aria-hidden="true" />
      {label}
    </span>
  )
}
