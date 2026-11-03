import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { AlertList } from '../../components/AlertList/AlertList'
import { Button } from '../../components/Button/Button'
import { ChoiceChips } from '../../components/ChoiceChips/ChoiceChips'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { Icon } from '../../components/Icon/Icon'
import { useToast } from '../../components/Toast/useToast'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { FormError } from '../../components/FormError/FormError'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { useAlerts } from '../../hooks/useAlerts'
import { useCages } from '../../hooks/useCages'
import { useGuineaPigsOfCages } from '../../hooks/useGuineaPigs'
import { useMarkAlertReviewed, useMarkAllAlertsReviewed } from '../../hooks/useMarkAlertReviewed'
import { useNow } from '../../hooks/useNow'
import { t } from '../../i18n'
import type { Alert, AlertStatus } from '../../types/Alert'
import styles from './Alerts.module.css'

interface AlertsSectionProps {
  status: AlertStatus
  // undefined = every cage of the account
  cageId?: string
  cageNames: Record<string, string>
  now: number
}

function AlertsSection({ status, cageId, cageNames, now }: AlertsSectionProps) {
  const alerts = useAlerts(status, cageId)
  // same queries as the cage pages: TanStack Query shares them
  const guineaPigs = useGuineaPigsOfCages(cageId ? [cageId] : Object.keys(cageNames))
  const markReviewed = useMarkAlertReviewed()
  const toast = useToast()

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
        guineaPigs={guineaPigs}
        now={now}
        // with every cage mixed, each alert says which cage it is from
        cageNames={cageId ? undefined : cageNames}
        onMarkReviewed={
          status === 'OPEN'
            ? (alert) =>
                markReviewed.mutate(alert.id, {
                  onSuccess: () => toast.show({ message: t('toast.alertReviewed') }),
                })
            : undefined
        }
        busyAlertId={markReviewed.isPending ? markReviewed.variables : undefined}
      />
    </>
  )
}

// every open alert of what is on screen, after a confirmation
function MarkAllReviewed({ alerts }: { alerts: Alert[] }) {
  const markAll = useMarkAllAlertsReviewed()
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <Button variant="ghost" onClick={() => setConfirming(true)}>
        <Icon name="check-circle" size={18} />
        {t('alerts.markAll')}
      </Button>
      {confirming && (
        <ConfirmDialog
          title={t('alerts.markAllTitle', { count: alerts.length })}
          confirmLabel={t('alerts.markAllConfirm')}
          onCancel={() => setConfirming(false)}
          busy={markAll.isPending}
          onConfirm={() =>
            markAll.mutate(alerts, {
              onSuccess: () => {
                toast.show({ message: t('toast.allReviewed', { count: alerts.length }) })
                setConfirming(false)
              },
            })
          }
        >
          <p>{t('alerts.markAllText')}</p>
          {markAll.isError && <FormError message={t('alerts.markError')} />}
        </ConfirmDialog>
      )}
    </>
  )
}

export function Alerts() {
  const now = useNow()
  const cages = useCages()
  const [searchParams, setSearchParams] = useSearchParams()
  const cageNames = Object.fromEntries((cages.data ?? []).map((c) => [c.cageId, c.name]))
  // ?cage=<id> comes from the "Ver todas" button of a cage; an unknown one shows every cage
  const requested = searchParams.get('cage')
  const cageId = requested && cageNames[requested] ? requested : undefined
  const open = useAlerts('OPEN', cageId)
  const reviewed = useAlerts('REVIEWED', cageId)

  function selectCage(next: string | null) {
    setSearchParams(next ? { cage: next } : {}, { replace: true })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('alerts.title')}</h1>
        <p className={styles.intro}>{t('alerts.intro')}</p>
      </header>

      {cages.data && cages.data.length > 1 && (
        <ChoiceChips
          legend={t('alerts.filterByCage')}
          hint={t('alerts.filterByCageHint')}
          options={cages.data.map((cage) => ({ value: cage.cageId, label: cage.name }))}
          value={cageId ?? null}
          onChange={selectCage}
        />
      )}

      <section className={styles.section} aria-labelledby="open-heading">
        <div className={styles.sectionHeader}>
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
          {open.data && open.data.length > 1 && <MarkAllReviewed alerts={open.data} />}
        </div>
        <AlertsSection status="OPEN" cageId={cageId} cageNames={cageNames} now={now} />
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
          <AlertsSection status="REVIEWED" cageId={cageId} cageNames={cageNames} now={now} />
        </div>
      </details>
    </div>
  )
}
