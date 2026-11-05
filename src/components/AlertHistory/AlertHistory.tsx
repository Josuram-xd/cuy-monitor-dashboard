import { useId, useMemo, useState } from 'react'
import { rangeFor, type RangePreset } from '../../charts/timeRange'
import { useAlertHistory } from '../../hooks/useAlertHistory'
import { t } from '../../i18n'
import type { AlertHistoryFilter, AlertLevel, AlertStatus, EventType } from '../../types/Alert'
import type { GuineaPig } from '../../types/GuineaPig'
import { AlertList } from '../AlertList/AlertList'
import { Button } from '../Button/Button'
import { ChoiceChips } from '../ChoiceChips/ChoiceChips'
import { EmptyState } from '../EmptyState/EmptyState'
import { ErrorState } from '../ErrorState/ErrorState'
import { RangeSelector } from '../RangeSelector/RangeSelector'
import { Skeleton } from '../Skeleton/Skeleton'
import styles from './AlertHistory.module.css'

interface AlertHistoryProps {
  // undefined = every cage of the account
  cageId?: string
  cageNames: Record<string, string>
  guineaPigs: GuineaPig[]
  now: number
}

interface Criteria {
  status: AlertStatus | null
  level: AlertLevel | null
  type: EventType | null
}

const NO_CRITERIA: Criteria = { status: null, level: null, type: null }
const STATUSES: readonly AlertStatus[] = ['OPEN', 'REVIEWED']
const LEVELS: readonly AlertLevel[] = ['ALERT', 'CRITICAL']
const TYPES: readonly EventType[] = ['BEHAVIOR', 'AUDIO', 'WEIGHT']

function activeCount(criteria: Criteria): number {
  return Object.values(criteria).filter((value) => value !== null).length
}

// Every alert of the period, open or reviewed, newest first and a page at a time. The period fixes its dates
// when it is chosen, so "Cargar más" keeps reading the same range.
export function AlertHistory({ cageId, cageNames, guineaPigs, now }: AlertHistoryProps) {
  const headingId = useId()
  const [preset, setPreset] = useState<RangePreset>('week')
  const [criteria, setCriteria] = useState<Criteria>(NO_CRITERIA)
  const range = useMemo(() => rangeFor(preset), [preset])
  const filter: AlertHistoryFilter = {
    ...range,
    cageId,
    status: criteria.status ?? undefined,
    level: criteria.level ?? undefined,
    type: criteria.type ?? undefined,
  }
  const history = useAlertHistory(filter)
  const filtersOn = activeCount(criteria)
  const pages = history.data?.pages ?? []
  const items = pages.flatMap((page) => page.items)
  const total = pages[0]?.totalItems ?? 0

  function pick<K extends keyof Criteria>(key: K) {
    return (value: Criteria[K]) => setCriteria((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className={styles.history} aria-labelledby={headingId} aria-busy={history.isFetching}>
      <div className={styles.head}>
        <h2 id={headingId} className={styles.title}>
          {t('alerts.history.title')}
        </h2>
        <RangeSelector value={preset} onChange={setPreset} />
      </div>

      <details className={styles.filters}>
        <summary className={styles.filtersSummary}>
          {t('alerts.history.filters')}
          {filtersOn > 0 && (
            <span className={styles.count}>
              {t('alerts.history.activeFilters', { count: filtersOn })}
            </span>
          )}
        </summary>
        <div className={styles.filtersBody}>
          <ChoiceChips
            legend={t('alerts.history.status')}
            options={STATUSES.map((value) => ({
              value,
              label: t(`alerts.history.statuses.${value}`),
            }))}
            value={criteria.status}
            onChange={pick('status')}
          />
          <ChoiceChips
            legend={t('alerts.history.level')}
            options={LEVELS.map((value) => ({ value, label: t(`status.${value}`) }))}
            value={criteria.level}
            onChange={pick('level')}
          />
          <ChoiceChips
            legend={t('alerts.history.type')}
            options={TYPES.map((value) => ({ value, label: t(`alerts.history.types.${value}`) }))}
            value={criteria.type}
            onChange={pick('type')}
          />
          {filtersOn > 0 && (
            <Button variant="ghost" onClick={() => setCriteria(NO_CRITERIA)}>
              {t('alerts.history.clearFilters')}
            </Button>
          )}
        </div>
      </details>

      {history.isPending ? (
        <Skeleton variant="line" count={3} />
      ) : history.isError ? (
        <ErrorState message={t('alerts.loadError')} onRetry={() => void history.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="inbox"
          message={t(filtersOn > 0 ? 'alerts.history.noMatch' : 'alerts.history.empty')}
          action={
            filtersOn > 0 ? (
              <Button onClick={() => setCriteria(NO_CRITERIA)}>
                {t('alerts.history.clearFilters')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className={styles.total} aria-live="polite">
            {t('alerts.history.total', { count: total })}
          </p>
          <AlertList
            alerts={items}
            guineaPigs={guineaPigs}
            now={now}
            cageNames={cageId ? undefined : cageNames}
          />
          <div className={styles.more}>
            <p className={styles.shown}>
              {t('alerts.history.shown', { shown: items.length, total })}
            </p>
            {history.hasNextPage && (
              <Button
                onClick={() => void history.fetchNextPage()}
                disabled={history.isFetchingNextPage}
              >
                {history.isFetchingNextPage
                  ? t('alerts.history.loading')
                  : t('alerts.history.loadMore')}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  )
}
