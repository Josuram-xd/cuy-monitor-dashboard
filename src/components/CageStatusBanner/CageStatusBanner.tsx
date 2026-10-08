import type { ReactNode } from 'react'
import { t } from '../../i18n'
import type { CageHealth } from '../../types/CageHealth'
import { HEALTH_STATUSES, type DisplayStatus, type HealthStatus } from '../../types/HealthStatus'
import { cx } from '../../utils/cx'
import { formatRelative } from '../../utils/time'
import { Icon } from '../Icon/Icon'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import { STATUS_ICONS } from '../StatusBadge/statusIcons'
import styles from './CageStatusBanner.module.css'

interface CageStatusBannerProps {
  // undefined while loading or when the data couldn't be fetched
  health?: CageHealth
  liveIndicator?: ReactNode
  // from useNow() in the page; without it the "updated" line is hidden
  now?: number
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

// worst first, only the statuses that have at least one guinea pig
function countByStatus(health: CageHealth): [HealthStatus, number][] {
  return [...HEALTH_STATUSES]
    .reverse()
    .map((status): [HealthStatus, number] => [
      status,
      health.guineaPigs.filter((g) => g.status === status).length,
    ])
    .filter(([, count]) => count > 0)
}

export function CageStatusBanner({ health, liveIndicator, now }: CageStatusBannerProps) {
  const status: DisplayStatus = health?.status ?? 'UNKNOWN'
  const counts = health ? countByStatus(health) : []

  return (
    <section className={cx(styles.banner, styles[status])}>
      <span className={styles.iconWrap}>
        <Icon name={STATUS_ICONS[status]} size={28} />
      </span>
      <div className={styles.body}>
        <div className={styles.top}>
          <StatusBadge status={status} />
          {liveIndicator}
        </div>
        <p className={styles.headline} aria-live={status === 'CRITICAL' ? 'assertive' : 'polite'}>
          {headline(status, health)}
        </p>
        {counts.length > 0 && (
          <ul className={styles.counts} aria-label={t('cage.countsLabel')}>
            {counts.map(([countStatus, count]) => (
              <li key={countStatus} className={styles.count}>
                <span className={styles.countNumber}>{count}</span>
                <StatusBadge status={countStatus} size="sm" />
              </li>
            ))}
          </ul>
        )}
        {health && now !== undefined && (
          <p className={styles.updated}>
            {t('cage.updated', { time: formatRelative(health.updatedAt, now) })}
          </p>
        )}
      </div>
    </section>
  )
}
