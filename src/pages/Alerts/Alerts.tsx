import { AlertList } from '../../components/AlertList/AlertList'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { FormError } from '../../components/FormError/FormError'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { useAlerts } from '../../hooks/useAlerts'
import { useGuineaPigs } from '../../hooks/useGuineaPigs'
import { useMarkAlertReviewed } from '../../hooks/useMarkAlertReviewed'
import { useNow } from '../../hooks/useNow'
import { t } from '../../i18n'
import type { AlertStatus } from '../../types/Alert'
import styles from './Alerts.module.css'

function AlertsSection({ status, now }: { status: AlertStatus; now: number }) {
  const alerts = useAlerts(status)
  // same query as the cage view: TanStack Query shares it
  const guineaPigs = useGuineaPigs()
  const markReviewed = useMarkAlertReviewed()

  if (alerts.isPending) {
    return <Skeleton variant="line" count={3} />
  }
  if (alerts.isError) {
    return <ErrorState message={t('alerts.loadError')} onRetry={() => void alerts.refetch()} />
  }
  if (alerts.data.length === 0) {
    return (
      <EmptyState
        icon={status === 'OPEN' ? 'check-circle' : 'inbox'}
        message={t(status === 'OPEN' ? 'alerts.noneOpen' : 'alerts.noneReviewed')}
      />
    )
  }
  return (
    <>
      {markReviewed.isError && <FormError message={t('alerts.markError')} />}
      <AlertList
        alerts={alerts.data}
        guineaPigs={guineaPigs.data}
        now={now}
        onMarkReviewed={status === 'OPEN' ? (alert) => markReviewed.mutate(alert.id) : undefined}
        busyAlertId={markReviewed.isPending ? markReviewed.variables : undefined}
      />
    </>
  )
}

export function Alerts() {
  const now = useNow()
  const open = useAlerts('OPEN')
  const reviewed = useAlerts('REVIEWED')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('alerts.title')}</h1>
        <p className={styles.intro}>{t('alerts.intro')}</p>
      </header>

      <section className={styles.section} aria-labelledby="open-heading">
        <h2 id="open-heading" className={styles.sectionTitle}>
          {t('alerts.openTitle')}
          {open.data && open.data.length > 0 && (
            <span
              className={styles.count}
              aria-label={t('alerts.count', { count: open.data.length })}
            >
              {open.data.length}
            </span>
          )}
        </h2>
        <AlertsSection status="OPEN" now={now} />
      </section>

      {/* closed by default: the open ones are what needs attention */}
      <details className={styles.reviewed}>
        <summary className={styles.summary}>
          <span className={styles.sectionTitle}>{t('alerts.reviewedTitle')}</span>
          {reviewed.data && reviewed.data.length > 0 && (
            <span
              className={styles.count}
              aria-label={t('alerts.count', { count: reviewed.data.length })}
            >
              {reviewed.data.length}
            </span>
          )}
        </summary>
        <div className={styles.reviewedBody}>
          <AlertsSection status="REVIEWED" now={now} />
        </div>
      </details>
    </div>
  )
}
