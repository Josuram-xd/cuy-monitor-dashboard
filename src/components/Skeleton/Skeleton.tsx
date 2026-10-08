import { t } from '../../i18n'
import { cx } from '../../utils/cx'
import styles from './Skeleton.module.css'

interface SkeletonProps {
  // "card" has the shape of a GuineaPigCard
  variant?: 'card' | 'line'
  count?: number
}

function CardSkeleton() {
  return (
    <div className={cx(styles.block, styles.card)} aria-hidden="true">
      <span className={cx(styles.bar, styles.title)} />
      <span className={cx(styles.bar, styles.pill)} />
      <span className={cx(styles.bar, styles.text)} />
    </div>
  )
}

export function Skeleton({ variant = 'card', count = 1 }: SkeletonProps) {
  return (
    <div className={styles.list} role="status" aria-label={t('common.loading')}>
      {Array.from({ length: count }, (_, i) =>
        variant === 'card' ? (
          <CardSkeleton key={i} />
        ) : (
          <span key={i} className={cx(styles.bar, styles.line)} aria-hidden="true" />
        ),
      )}
    </div>
  )
}
