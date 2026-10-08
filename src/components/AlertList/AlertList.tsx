import { t } from '../../i18n'
import type { Alert } from '../../types/Alert'
import type { GuineaPig } from '../../types/GuineaPig'
import { cx } from '../../utils/cx'
import { formatRelative } from '../../utils/time'
import { Button } from '../Button/Button'
import { Icon } from '../Icon/Icon'
import { MarkColorDot } from '../MarkColorDot/MarkColorDot'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import styles from './AlertList.module.css'

interface AlertListProps {
  alerts: Alert[]
  // to show the name and mark color of the guinea pig of each alert
  guineaPigs?: GuineaPig[]
  now: number
  // without it there is no "Marcar como revisada" button (Task 8.2 wires it)
  onMarkReviewed?: (alert: Alert) => void
}

function AlertSubject({ alert, guineaPig }: { alert: Alert; guineaPig?: GuineaPig }) {
  if (alert.guineaPigId === null) {
    return (
      <span className={styles.subject}>
        {alert.type === 'AUDIO' && <Icon name="volume-2" size={16} />}
        {t('alerts.wholeCage')}
      </span>
    )
  }
  if (!guineaPig) {
    return <span className={styles.subject}>{t('alerts.unknownGuineaPig')}</span>
  }
  return (
    <span className={styles.subject}>
      <span className={styles.name}>{guineaPig.name}</span>
      <MarkColorDot color={guineaPig.markColor} />
    </span>
  )
}

export function AlertList({ alerts, guineaPigs = [], now, onMarkReviewed }: AlertListProps) {
  return (
    <ul className={styles.list}>
      {alerts.map((alert) => (
        <li key={alert.id} className={cx(styles.item, styles[alert.level])}>
          <div className={styles.head}>
            <StatusBadge status={alert.level} size="sm" />
            <time className={styles.time} dateTime={alert.createdAt}>
              {formatRelative(alert.createdAt, now)}
            </time>
          </div>
          <AlertSubject
            alert={alert}
            guineaPig={guineaPigs.find((g) => g.id === alert.guineaPigId)}
          />
          <p className={styles.message}>{alert.message}</p>
          {onMarkReviewed && alert.status === 'OPEN' && (
            <Button onClick={() => onMarkReviewed(alert)}>{t('alerts.markReviewed')}</Button>
          )}
        </li>
      ))}
    </ul>
  )
}
