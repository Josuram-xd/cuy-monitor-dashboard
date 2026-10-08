import type { ReactNode } from 'react'
import { t } from '../../i18n'
import type { CageHealth } from '../../types/CageHealth'
import type { DisplayStatus } from '../../types/HealthStatus'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import styles from './CageStatusBanner.module.css'
import { cx } from '../../utils/cx'

interface CageStatusBannerProps {
  // undefined while loading or when the data couldn't be fetched
  health?: CageHealth
  liveIndicator?: ReactNode
}

function headline(status: DisplayStatus, health?: CageHealth): string {
  if (!health || status === 'UNKNOWN') {
    return t('cage.headline.unknown')
  }
  if (status === 'NORMAL') {
    return t('cage.headline.allGood')
  }
  const count = health.guineaPigs.filter((g) => g.status === status).length
  // the worst status can come from audio or weight, not from a guinea pig
  if (count === 0) {
    return t('cage.headline.cageLevel')
  }
  return t(`cage.headline.${status}`, { count })
}

export function CageStatusBanner({ health, liveIndicator }: CageStatusBannerProps) {
  const status: DisplayStatus = health?.status ?? 'UNKNOWN'

  return (
    <section className={cx(styles.banner, styles[status])}>
      <div className={styles.top}>
        <StatusBadge status={status} size="lg" />
        {liveIndicator}
      </div>
      <p className={styles.headline} aria-live={status === 'CRITICAL' ? 'assertive' : 'polite'}>
        {headline(status, health)}
      </p>
    </section>
  )
}
