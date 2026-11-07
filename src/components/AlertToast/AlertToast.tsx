import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useCages } from '../../hooks/useCages'
import { t } from '../../i18n'
import { useLiveConnection } from '../../realtime/useLiveConnection'
import type { Alert } from '../../types/Alert'
import { Icon } from '../Icon/Icon'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import styles from './AlertToast.module.css'

// an ALERT goes by itself after a while; a CRITICAL one stays until the breeder closes it
export const ALERT_VISIBLE_MS = 10_000
const MAX_ALERTS = 3

// Task 6.4: the alerts that arrive over the live connection, on any private page, without reloading.
export function AlertToast() {
  const { onAlert } = useLiveConnection()
  const cages = useCages()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setAlerts((all) => all.filter((alert) => alert.id !== id))
  }, [])

  useEffect(
    () =>
      onAlert((alert) => {
        setAlerts((all) => [...all.filter((a) => a.id !== alert.id), alert].slice(-MAX_ALERTS))
        if (alert.level === 'ALERT') {
          timers.current.set(
            alert.id,
            setTimeout(() => dismiss(alert.id), ALERT_VISIBLE_MS),
          )
        }
      }),
    [onAlert, dismiss],
  )

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => clearTimeout(timer))
  }, [])

  const cageName = (cageId: string) =>
    cages.data?.find((cage) => cage.cageId === cageId)?.name ?? cageId

  const renderToast = (alert: Alert) => (
    <div key={alert.id} className={styles.toast} data-level={alert.level}>
      <div className={styles.header}>
        <StatusBadge status={alert.level} size="sm" />
        <span className={styles.cage}>
          {t('alerts.live.inCage', { cage: cageName(alert.cageId) })}
        </span>
        <button
          type="button"
          className={styles.close}
          onClick={() => dismiss(alert.id)}
          aria-label={t('alerts.live.dismiss')}
        >
          <Icon name="x" size={16} />
        </button>
      </div>
      <p className={styles.message}>{alert.message}</p>
      <Link
        to={`/alerts?cage=${encodeURIComponent(alert.cageId)}`}
        className={styles.link}
        onClick={() => dismiss(alert.id)}
      >
        {t('alerts.live.open')}
      </Link>
    </div>
  )

  // design system checklist: live updates are polite, only CRITICAL interrupts the screen reader
  return (
    <div className={styles.region}>
      <div className={styles.stack} role="alert" aria-live="assertive">
        {alerts.filter((alert) => alert.level === 'CRITICAL').map(renderToast)}
      </div>
      <div className={styles.stack} role="status" aria-live="polite">
        {alerts.filter((alert) => alert.level !== 'CRITICAL').map(renderToast)}
      </div>
    </div>
  )
}
