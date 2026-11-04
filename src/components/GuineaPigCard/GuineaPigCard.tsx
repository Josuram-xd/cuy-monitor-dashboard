import { useState } from 'react'
import { Link } from 'react-router'
import { catalogLabel } from '../../catalog/catalog'
import { cagePath } from '../../hooks/useCageId'
import { t } from '../../i18n'
import type { BehaviorWindow, GuineaPig } from '../../types/GuineaPig'
import { severity, type DisplayStatus, type HealthStatus } from '../../types/HealthStatus'
import { cx } from '../../utils/cx'
import { formatRelative, minutesSince } from '../../utils/time'
import { CoatSwatch } from '../CoatSwatch/CoatSwatch'
import { Icon } from '../Icon/Icon'
import { MarkColorDot } from '../MarkColorDot/MarkColorDot'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import styles from './GuineaPigCard.module.css'

const STALE_AFTER_MINUTES = 10

interface GuineaPigCardProps {
  // the cage it lives in, for the link to its page
  cageId: string
  guineaPig: GuineaPig
  lastWindow?: BehaviorWindow
  // from useNow() in the page, so every card uses the same clock
  now: number
}

export function GuineaPigCard({ cageId, guineaPig, lastWindow, now }: GuineaPigCardProps) {
  // a status that just went up gets one highlight pulse (DESIGN_SYSTEM 2.7). The state is adjusted
  // while rendering, so the pulse starts on the same frame the new status shows
  const [seenStatus, setSeenStatus] = useState<HealthStatus>(guineaPig.status)
  const [pulses, setPulses] = useState(0)
  if (guineaPig.status !== seenStatus) {
    if (severity(guineaPig.status) > severity(seenStatus)) {
      setPulses((count) => count + 1)
    }
    setSeenStatus(guineaPig.status)
  }
  const lastSeenAt = lastWindow?.occurredAt
  // not seen for a while: we can't say it's fine, so it shows as unknown
  const stale = lastSeenAt !== undefined && minutesSince(lastSeenAt, now) > STALE_AFTER_MINUTES
  const status: DisplayStatus = stale ? 'UNKNOWN' : guineaPig.status
  const about = [
    guineaPig.breed ? catalogLabel('breeds', guineaPig.breed) : null,
    guineaPig.coatColor ? catalogLabel('coatColors', guineaPig.coatColor) : null,
    guineaPig.initialWeightGrams
      ? t('guineaPig.weightGrams', { grams: guineaPig.initialWeightGrams })
      : null,
  ].filter(Boolean)

  return (
    <Link
      to={cagePath(cageId, `/guinea-pigs/${guineaPig.id}`)}
      className={cx(styles.card, styles[status])}
      data-spotlight
    >
      {/* a new element per pulse, so the animation runs again each time */}
      {pulses > 0 && <span key={pulses} className={styles.pulse} aria-hidden="true" />}
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
