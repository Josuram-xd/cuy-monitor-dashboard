import { Link } from 'react-router'
import { t } from '../../i18n'
import type { BehaviorWindow, GuineaPig } from '../../types/GuineaPig'
import type { DisplayStatus } from '../../types/HealthStatus'
import { formatRelative, minutesSince } from '../../utils/time'
import { Icon } from '../Icon/Icon'
import { MarkColorDot } from '../MarkColorDot/MarkColorDot'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import styles from './GuineaPigCard.module.css'

const STALE_AFTER_MINUTES = 10

interface GuineaPigCardProps {
  guineaPig: GuineaPig
  lastWindow?: BehaviorWindow
  // from useNow() in the page, so every card uses the same clock
  now: number
}

export function GuineaPigCard({ guineaPig, lastWindow, now }: GuineaPigCardProps) {
  const lastSeenAt = lastWindow?.occurredAt
  // not seen for a while: we can't say it's fine, so it shows as unknown
  const stale = lastSeenAt !== undefined && minutesSince(lastSeenAt, now) > STALE_AFTER_MINUTES
  const status: DisplayStatus = stale ? 'UNKNOWN' : guineaPig.status

  return (
    <Link to={`/guinea-pigs/${guineaPig.id}`} className={`${styles.card} ${styles[status]}`}>
      <span className={styles.header}>
        <MarkColorDot color={guineaPig.markColor} />
        <span className={styles.name}>{guineaPig.name}</span>
      </span>
      <StatusBadge status={status} />
      {lastWindow && !stale && (
        <span className={styles.summary}>
          {t('guineaPig.still', { seconds: lastWindow.stillSeconds })}
        </span>
      )}
      {lastSeenAt && (
        <span className={styles.lastSeen}>
          {t(stale ? 'guineaPig.notSeen' : 'guineaPig.lastSeen', {
            time: formatRelative(lastSeenAt, now),
          })}
        </span>
      )}
      <Icon name="chevron-right" className={styles.chevron} />
    </Link>
  )
}
