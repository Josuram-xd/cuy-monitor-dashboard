import { t } from '../../i18n'
import styles from './Skeleton.module.css'
import { cx } from '../../utils/cx'

interface SkeletonProps {
  // "card" has the size of a GuineaPigCard
  variant?: 'card' | 'line'
  count?: number
}

export function Skeleton({ variant = 'card', count = 1 }: SkeletonProps) {
  return (
    <div className={styles.list} role="status" aria-label={t('common.loading')}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cx(styles.block, styles[variant])} aria-hidden="true" />
      ))}
    </div>
  )
}
