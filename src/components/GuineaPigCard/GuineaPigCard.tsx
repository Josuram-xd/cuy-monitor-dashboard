import { Link } from 'react-router'
import { t } from '../../i18n'
import type { BehaviorWindow, GuineaPig } from '../../types/GuineaPig'
import type { DisplayStatus } from '../../types/HealthStatus'
import { cx } from '../../utils/cx'
import { formatRelative, minutesSince } from '../../utils/time'
import { CoatSwatch } from '../CoatSwatch/CoatSwatch'
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
  const about = [
    guineaPig.breed ? t(`guineaPig.breed.${guineaPig.breed}`) : null,
    guineaPig.coatColor ? t(`guineaPig.coat.${guineaPig.coatColor}`) : null,
    guineaPig.initialWeightGrams
      ? t('guineaPig.weightGrams', { grams: guineaPig.initialWeightGrams })
      : null,
  ].filter(Boolean)

  return (
    <Link to={`/guinea-pigs/${guineaPig.id}`} className={cx(styles.card, styles[status])}>
      <span className={styles.top}>
        <span className={styles.avatar} aria-hidden="true">
          {guineaPig.coatColor && <CoatSwatch color={guineaPig.coatColor} size={44} />}
          <span className={styles.initial}>{guineaPig.name.charAt(0).toUpperCase()}</span>
        </span>
        <span className={styles.name}>{guineaPig.name}</span>
        <Icon name="chevron-right" className={styles.chevron} />
      </span>
      {about.length > 0 && <span className={styles.about}>{about.join(' · ')}</span>}
      <span className={styles.meta}>
        <StatusBadge status={status} />
        <span className={styles.mark}>
          <MarkColorDot color={guineaPig.markColor} />
        </span>
      </span>
      {lastSeenAt && (
        <span className={styles.details}>
          {lastWindow && !stale && (
            <span className={styles.detail}>
              <Icon name="activity" size={16} className={styles.detailIcon} />
              {t('guineaPig.still', { seconds: lastWindow.stillSeconds })}
            </span>
          )}
          <span className={cx(styles.detail, styles.muted)}>
            <Icon name="clock" size={16} className={styles.detailIcon} />
            {t(stale ? 'guineaPig.notSeen' : 'guineaPig.lastSeen', {
              time: formatRelative(lastSeenAt, now),
            })}
          </span>
        </span>
      )}
    </Link>
  )
}
