import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { AlertHistory } from '../../components/AlertHistory/AlertHistory'
import { AlertList } from '../../components/AlertList/AlertList'
import { Button } from '../../components/Button/Button'
import { ChoiceChips } from '../../components/ChoiceChips/ChoiceChips'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { useToast } from '../../components/Toast/useToast'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { FormError } from '../../components/FormError/FormError'
import { MarkAllReviewed } from '../../components/MarkAllReviewed/MarkAllReviewed'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { useAlerts } from '../../hooks/useAlerts'
import { useCages } from '../../hooks/useCages'
import { useGuineaPigsOfCages } from '../../hooks/useGuineaPigs'
import { useDeleteAlerts, useMarkAlertReviewed } from '../../hooks/useMarkAlertReviewed'
import { useNow } from '../../hooks/useNow'
import { t } from '../../i18n'
import styles from './Alerts.module.css'

// a long list buries the page: the rest is one "Ver más" away
const VISIBLE_ALERTS = 5

interface OpenAlertsProps {
  // undefined = every cage of the account
  cageId?: string
  cageNames: Record<string, string>
  now: number
}

function OpenAlerts({ cageId, cageNames, now }: OpenAlertsProps) {
  const alerts = useAlerts('OPEN', cageId)
  // same queries as the cage pages: TanStack Query shares them
  const guineaPigs = useGuineaPigsOfCages(cageId ? [cageId] : Object.keys(cageNames))
  const markReviewed = useMarkAlertReviewed()
  const deleteAlerts = useDeleteAlerts()
  const toast = useToast()
  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set())
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (alerts.isPending) {
    return <Skeleton variant="line" count={3} />
  }
  if (alerts.isError) {
    return <ErrorState message={t('alerts.loadError')} onRetry={() => void alerts.refetch()} />
  }
  if (alerts.data.length === 0) {
    return <EmptyState icon="check-circle" message={t('alerts.noneOpen')} />
  }
  // ids that left the list (reviewed, deleted, another cage) are not counted as selected
  const selectedIds = alerts.data.filter((a) => selected.has(a.id)).map((a) => a.id)
  const hidden = alerts.data.length - VISIBLE_ALERTS
  const visible = showAll ? alerts.data : alerts.data.slice(0, VISIBLE_ALERTS)

  function toggle(id: number) {
    setSelected((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  return (
    <>
      {markReviewed.isError && <FormError message={t('alerts.markError')} />}
      <div className={styles.toolbar}>
        <Button variant="ghost" onClick={() => setSelected(new Set(alerts.data.map((a) => a.id)))}>
          {t('alerts.selectAll')}
        </Button>
        <Button
          variant="ghost"
          disabled={selectedIds.length === 0}
          onClick={() => setSelected(new Set())}
        >
          {t('alerts.deselectAll')}
        </Button>
        <Button
          variant="danger"
          disabled={selectedIds.length === 0}
          onClick={() => setConfirmingDelete(true)}
        >
          {t('alerts.deleteSelected', { count: selectedIds.length })}
        </Button>
      </div>
      <AlertList
        alerts={visible}
        selectedIds={selected}
        onToggleSelected={(alert) => toggle(alert.id)}
        guineaPigs={guineaPigs}
        now={now}
        // with every cage mixed, each alert says which cage it is from
        cageNames={cageId ? undefined : cageNames}
        onMarkReviewed={(alert) =>
          markReviewed.mutate(alert.id, {
            onSuccess: () => toast.show({ message: t('toast.alertReviewed') }),
          })
        }
        busyAlertId={markReviewed.isPending ? markReviewed.variables : undefined}
      />
      {hidden > 0 && (
        <Button variant="secondary" fullWidth onClick={() => setShowAll(!showAll)}>
          {showAll ? t('alerts.showLess') : t('alerts.showMore', { count: hidden })}
        </Button>
      )}
      {confirmingDelete && (
        <ConfirmDialog
          title={t('alerts.deleteTitle', { count: selectedIds.length })}
          confirmLabel={t('alerts.deleteConfirm')}
          danger
          busy={deleteAlerts.isPending}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() =>
            deleteAlerts.mutate(selectedIds, {
              onSuccess: () => {
                toast.show({ message: t('toast.deleted', { count: selectedIds.length }) })
                setSelected(new Set())
                setConfirmingDelete(false)
              },
            })
          }
        >
          <p>{t('alerts.deleteText')}</p>
          {deleteAlerts.isError && <FormError message={t('alerts.deleteError')} />}
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
  const cageIds = cageId ? [cageId] : Object.keys(cageNames)
  const guineaPigs = useGuineaPigsOfCages(cageIds)

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
        <OpenAlerts cageId={cageId} cageNames={cageNames} now={now} />
      </section>

      <AlertHistory cageId={cageId} cageNames={cageNames} guineaPigs={guineaPigs} now={now} />
    </div>
  )
}
