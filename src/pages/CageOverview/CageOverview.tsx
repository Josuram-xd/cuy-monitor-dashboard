import { Suspense, useState } from 'react'
import { AlertList } from '../../components/AlertList/AlertList'
import { Button, ButtonLink } from '../../components/Button/Button'
import { CageStatusBanner } from '../../components/CageStatusBanner/CageStatusBanner'
import { Mascot } from '../../components/Mascot/Mascot'
import { DeleteGuineaPig } from '../../components/DeleteGuineaPig/DeleteGuineaPig'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { GuineaPigCard } from '../../components/GuineaPigCard/GuineaPigCard'
import { GuineaPigFilter } from '../../components/GuineaPigFilter/GuineaPigFilter'
import { applyGuineaPigFilter, NO_FILTER } from '../../components/GuineaPigFilter/filter'
import { GuineaPigGrid, GuineaPigGridItem } from '../../components/GuineaPigGrid/GuineaPigGrid'
import { RefreshButton } from '../../components/RefreshButton/RefreshButton'
import { Reveal } from '../../components/Reveal/Reveal'
import { LiveIndicator } from '../../components/LiveIndicator/LiveIndicator'
import { RangeSelector } from '../../components/RangeSelector/RangeSelector'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { Icon } from '../../components/Icon/Icon'
import { LazyWeightChart } from '../../charts/lazyCharts'
import type { RangePreset } from '../../charts/timeRange'
import { useAlerts } from '../../hooks/useAlerts'
import { useCageWeight } from '../../hooks/useCageWeight'
import { useCage } from '../../hooks/useCages'
import { cagePath, useCageId } from '../../hooks/useCageId'
import { useCageHealth } from '../../hooks/useCageHealth'
import { useProfile } from '../../hooks/useProfile'
import { useGuineaPigs } from '../../hooks/useGuineaPigs'
import { useNow } from '../../hooks/useNow'
import { t } from '../../i18n'
import styles from './CageOverview.module.css'
import { severity } from '../../types/HealthStatus'

const SKELETON_CARDS = 3
const LATEST_ALERTS = 3
// with fewer guinea pigs than this, a search box is more noise than help
const FILTER_FROM = 3

function GuineaPigsSection({ cageId, now }: { cageId: string; now: number }) {
  const guineaPigs = useGuineaPigs(cageId)
  const [filter, setFilter] = useState(NO_FILTER)

  if (guineaPigs.isPending) {
    return <Skeleton count={SKELETON_CARDS} />
  }
  if (guineaPigs.isError) {
    return (
      <ErrorState message={t('cage.guineaPigsError')} onRetry={() => void guineaPigs.refetch()} />
    )
  }
  if (guineaPigs.data.length === 0) {
    return (
      <EmptyState
        mascot="sleepy"
        message={t('cage.empty')}
        action={
          <ButtonLink to={cagePath(cageId, '/guinea-pigs/new')} variant="primary">
            {t('cage.registerGuineaPig')}
          </ButtonLink>
        }
      />
    )
  }
  // the ones that need attention first: on a phone they are what the breeder sees without scrolling
  const shown = applyGuineaPigFilter(guineaPigs.data, filter).toSorted(
    (a, b) => severity(b.status) - severity(a.status) || a.id - b.id,
  )
  return (
    <>
      {guineaPigs.data.length >= FILTER_FROM && (
        <GuineaPigFilter guineaPigs={guineaPigs.data} value={filter} onChange={setFilter} />
      )}
      {shown.length === 0 ? (
        <EmptyState
          icon="search"
          message={t('cage.filter.noMatch')}
          action={<Button onClick={() => setFilter(NO_FILTER)}>{t('cage.filter.reset')}</Button>}
        />
      ) : (
        <GuineaPigGrid label={t('cage.guineaPigs')}>
          {shown.map((guineaPig, index) => (
            <GuineaPigGridItem key={guineaPig.id} index={index}>
              <GuineaPigCard cageId={cageId} guineaPig={guineaPig} now={now} />
              <DeleteGuineaPig cageId={cageId} guineaPig={guineaPig} />
            </GuineaPigGridItem>
          ))}
        </GuineaPigGrid>
      )}
    </>
  )
}

function OpenAlertsSection({ cageId, now }: { cageId: string; now: number }) {
  const alerts = useAlerts('OPEN', cageId)
  // same query as the grid, TanStack Query shares it
  const guineaPigs = useGuineaPigs(cageId)

  if (alerts.isPending) {
    return <Skeleton variant="line" count={2} />
  }
  if (alerts.isError) {
    return <ErrorState message={t('alerts.loadError')} onRetry={() => void alerts.refetch()} />
  }
  if (alerts.data.length === 0) {
    return (
      <div className={styles.calm}>
        <Mascot mood="happy" size={120} />
        <p>{t('alerts.noneOpen')}</p>
      </div>
    )
  }
  return (
    <AlertList
      alerts={alerts.data.slice(0, LATEST_ALERTS)}
      guineaPigs={guineaPigs.data}
      now={now}
    />
  )
}

// The scale is under the whole cage: its weight belongs to the cage, not to one guinea pig
function WeightSection({ cageId }: { cageId: string }) {
  const [preset, setPreset] = useState<RangePreset>('today')
  const weight = useCageWeight(cageId, preset)

  return (
    <section
      className={styles.section}
      aria-labelledby="weight-heading"
      aria-busy={weight.isFetching}
    >
      <div className={styles.weightHead}>
        <h2 id="weight-heading" className={styles.sectionTitle}>
          {t('cage.weightTitle')}
        </h2>
        <RangeSelector value={preset} onChange={setPreset} />
      </div>
      <div className={styles.panel}>
        {weight.isPending ? (
          <Skeleton variant="line" count={3} />
        ) : weight.isError ? (
          <ErrorState message={t('cage.weightError')} onRetry={() => void weight.refetch()} />
        ) : (
          <div className={weight.isPlaceholderData ? styles.stale : undefined}>
            <Suspense fallback={<Skeleton count={2} />}>
              <LazyWeightChart
                weight={weight.data.weight}
                from={weight.data.from}
                to={weight.data.to}
                preset={preset}
              />
            </Suspense>
          </div>
        )}
      </div>
    </section>
  )
}

export function CageOverview() {
  const cageId = useCageId()
  const cage = useCage(cageId)
  const health = useCageHealth(cageId)
  // the same queries as the sections: only to show how many there are next to each title
  const guineaPigCount = useGuineaPigs(cageId).data?.length
  const openAlertCount = useAlerts('OPEN', cageId).data?.length
  const profile = useProfile()
  const now = useNow()
  const firstName = profile.data?.fullName.split(' ')[0]

  return (
    <div className={styles.page}>
      <ButtonLink to="/" variant="ghost" className={styles.back}>
        <Icon name="chevron-left" size={18} />
        {t('cages.backToList')}
      </ButtonLink>
      <header className={styles.heading}>
        <div>
          <p className={styles.greeting}>
            {firstName ? t('cage.greeting', { name: firstName }) : t('cage.greetingFallback')}
          </p>
          <h1 className={styles.title}>{cage.data?.name ?? t('cage.title')}</h1>
          {cage.data?.location && <p className={styles.location}>{cage.data.location}</p>}
        </div>
        <div className={styles.headerActions}>
          <RefreshButton queryKeys={[['cage', cageId], ['alerts']]} />
          <ButtonLink to={cagePath(cageId, '/guinea-pigs/new')} variant="primary">
            {t('cage.newGuineaPig')}
          </ButtonLink>
        </div>
      </header>
      {/* no data or failed request: the banner shows UNKNOWN, never "Normal" */}
      <CageStatusBanner health={health.data} now={now} liveIndicator={<LiveIndicator />} />
      <div className={styles.columns}>
        <Reveal className={styles.cell}>
          <section className={styles.section} aria-labelledby="guinea-pigs-heading">
            <h2 id="guinea-pigs-heading" className={styles.sectionTitle}>
              {t('cage.guineaPigs')}
              {guineaPigCount !== undefined && (
                <span className={styles.count}>{guineaPigCount}</span>
              )}
            </h2>
            <GuineaPigsSection cageId={cageId} now={now} />
          </section>
        </Reveal>
        <Reveal delay={120} className={styles.cell}>
          <section className={styles.section} aria-labelledby="open-alerts-heading">
            <h2 id="open-alerts-heading" className={styles.sectionTitle}>
              {t('alerts.openTitle')}
              {openAlertCount !== undefined && (
                <span className={styles.count}>{openAlertCount}</span>
              )}
            </h2>
            <div className={styles.panel}>
              <OpenAlertsSection cageId={cageId} now={now} />
              <ButtonLink
                to={`/alerts?cage=${encodeURIComponent(cageId)}`}
                variant="secondary"
                className={styles.seeAll}
              >
                {t('alerts.seeAll')}
              </ButtonLink>
            </div>
          </section>
        </Reveal>
      </div>
      <Reveal delay={200}>
        <WeightSection cageId={cageId} />
      </Reveal>
    </div>
  )
}
