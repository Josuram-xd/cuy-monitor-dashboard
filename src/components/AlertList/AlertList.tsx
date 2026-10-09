import { t } from '../../i18n'
import type { Alert, EventType } from '../../types/Alert'
import type { GuineaPig } from '../../types/GuineaPig'
import { cx } from '../../utils/cx'
import { formatRelative } from '../../utils/time'
import { Button } from '../Button/Button'
import { Icon, type IconName } from '../Icon/Icon'
import { MarkColorDot } from '../MarkColorDot/MarkColorDot'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import styles from './AlertList.module.css'

interface AlertListProps {
  alerts: Alert[]
  // to show the name and mark color of the guinea pig of each alert
  guineaPigs?: GuineaPig[]
  now: number
  // without it there is no "Marcar como revisada" button
  onMarkReviewed?: (alert: Alert) => void
  // the alert being marked right now: its button is disabled so it is not sent twice
  busyAlertId?: number
}

// what the alert is about, so the ring on the left says it at a glance
const TYPE_ICONS: Record<EventType, IconName> = {
  BEHAVIOR: 'activity',
  AUDIO: 'volume-2',
  WEIGHT: 'scale',
}

function alertTitle(alert: Alert, guineaPig?: GuineaPig): string {
  if (alert.guineaPigId === null) {
    return t('alerts.wholeCage')
  }
  return guineaPig ? guineaPig.name : t('alerts.unknownGuineaPig')
}

// Same shape as a guinea pig card (ring, title, badge and mark, then the detail) so the two columns
// of the cage page read as one family.
export function AlertList({
  alerts,
  guineaPigs = [],
  now,
  onMarkReviewed,
  busyAlertId,
}: AlertListProps) {
  return (
    <ul className={styles.list}>
      {alerts.map((alert) => {
        const guineaPig = guineaPigs.find((g) => g.id === alert.guineaPigId)
        return (
          <li key={alert.id} className={cx(styles.item, styles[alert.level])}>
            <div className={styles.top}>
              <span className={styles.ring} aria-hidden="true">
                <Icon name={TYPE_ICONS[alert.type]} size={20} />
              </span>
              <span className={styles.title}>{alertTitle(alert, guineaPig)}</span>
              <time className={styles.time} dateTime={alert.createdAt}>
                {formatRelative(alert.createdAt, now)}
              </time>
            </div>
            <div className={styles.meta}>
              <StatusBadge status={alert.level} size="sm" />
              {guineaPig && (
                <span className={styles.mark}>
                  <MarkColorDot color={guineaPig.markColor} />
                </span>
              )}
            </div>
            <p className={styles.message}>{alert.message}</p>
            {onMarkReviewed && alert.status === 'OPEN' && (
              <Button onClick={() => onMarkReviewed(alert)} disabled={busyAlertId === alert.id}>
                {t('alerts.markReviewed')}
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
