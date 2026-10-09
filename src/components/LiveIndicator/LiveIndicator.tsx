import { t } from '../../i18n'
import { useLiveConnection } from '../../realtime/useLiveConnection'
import type { LiveStatus } from '../../realtime/LiveConnectionContext'
import { cx } from '../../utils/cx'
import styles from './LiveIndicator.module.css'

const STATUS_LABELS: Record<LiveStatus, string> = {
  connecting: 'realtime.connecting',
  connected: 'realtime.connected',
  reconnecting: 'realtime.reconnecting',
  disconnected: 'realtime.disconnected',
}

export function LiveIndicator() {
  const { status } = useLiveConnection()

  return (
    <span
      className={cx(styles.indicator, styles[status])}
      data-status={status}
      role="status"
      aria-live="polite"
    >
      <span className={styles.dot} aria-hidden="true" />
      {t(STATUS_LABELS[status])}
    </span>
  )
}
