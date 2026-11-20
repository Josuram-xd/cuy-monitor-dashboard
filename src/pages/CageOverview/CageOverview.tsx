import { ScaleUsbCheck } from './ScaleUsbCheck'
import { CameraSetup } from './CameraSetup'
import { MarkColorDot } from '../../components/MarkColorDot/MarkColorDot'
import { Suspense, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { getDashboardApi } from '../../api/apiProvider'
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
import { useCage, useCages } from '../../hooks/useCages'
import { cagePath, useCageId } from '../../hooks/useCageId'
import { useCageHealth } from '../../hooks/useCageHealth'
import { useProfile } from '../../hooks/useProfile'
import { useStartSimulation } from '../../hooks/useStartSimulation'
import { useToast } from '../../components/Toast/useToast'
import { ApiError } from '../../api/ApiError'
import { useGuineaPigs, useGuineaPigsOfCages } from '../../hooks/useGuineaPigs'
import { useNow } from '../../hooks/useNow'
import { dateLocale, t } from '../../i18n'
import type { CageHealth } from '../../types/CageHealth'
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

function OpenAlertsSection({
  cageId,
  alerts,
  now,
}: {
  cageId?: string
  alerts: ReturnType<typeof useAlerts>
  now: number
}) {
  const cages = useCages()
  const latest = alerts.data?.slice(0, LATEST_ALERTS) ?? []
  const currentCage = useCageId()
  const localPigs = useGuineaPigs(currentCage)
  const otherPigs = useGuineaPigsOfCages([
    ...new Set(latest.map((alert) => alert.cageId).filter((id) => id !== currentCage)),
  ])
  const guineaPigs = [...(localPigs.data ?? []), ...otherPigs]
  const cageNames = Object.fromEntries((cages.data ?? []).map((cage) => [cage.cageId, cage.name]))

  if (alerts.isPending) {
    return <Skeleton variant="line" count={2} />
  }
  if (!alerts.data) {
    return <ErrorState message={t('alerts.loadError')} onRetry={() => void alerts.refetch()} />
  }
  if (alerts.data.length === 0 && !alerts.isError) {
    return (
      <div className={styles.calm}>
        <Mascot mood="happy" size={120} />
        <p>{t('alerts.noneOpen')}</p>
      </div>
    )
  }
  return (
    <>
      {alerts.isError && (
        <ErrorState message={t('alerts.loadError')} onRetry={() => void alerts.refetch()} />
      )}
      <AlertList
        alerts={latest}
        guineaPigs={guineaPigs}
        cageNames={cageId ? undefined : cageNames}
        now={now}
      />
    </>
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

function SensorMeasurement({
  health,
  refresh,
  updatedLocallyAt,
  failed,
}: {
  health: CageHealth
  refresh: () => void
  updatedLocallyAt: number
  failed: boolean
}) {
  const [session, setSession] = useState<{ startedAt: number; serverStart: number } | null>(null)
  const now = useNow(1_000)
  // Anchor freshness to the server clock even when the phone clock is wrong.
  const serverTime = Date.parse(health.updatedAt)
  const serverNow = serverTime + Math.max(0, now - updatedLocallyAt)
  const connectedAt = Date.parse(health.monitoring!.connectedAt)
  const measuredAt = Date.parse(health.weight.lastMeasuredAt ?? '')
  const hasWeight = health.weight.lastGrams != null && measuredAt >= connectedAt
  const freshWeight = hasWeight && serverNow - measuredAt < 45_000
  const sessionWeight = freshWeight && (!session || measuredAt > session.serverStart)
  const timedOut = session && now - session.startedAt >= 20_000
  const waitingForScale = !!session && !sessionWeight && !timedOut && !failed
  const observation = health.monitoring?.observation
  // only what arrived since the equipment was connected to this cage
  const live = (health.monitoring?.guineaPigs ?? []).filter(
    (pig) => Date.parse(pig.at) >= connectedAt,
  )
  const observationAt = health.monitoring?.lastBehaviorAt
  const lastAnalysis = Date.parse(observationAt ?? '')
  let aiStatus = 'monitor.aiWaiting'
  if (failed) {
    aiStatus = 'monitor.aiUnavailable'
  } else if (lastAnalysis >= connectedAt) {
    aiStatus = serverNow - lastAnalysis <= 150_000 ? 'monitor.aiActive' : 'monitor.aiStale'
  }
  const signals = [
    {
      key: 'scale',
      at: health.weight.lastMeasuredAt,
      value:
        health.weight.lastGrams == null
          ? ''
          : t('monitor.grams', { value: Math.max(0, health.weight.lastGrams) }),
    },
    { key: 'camera', at: health.monitoring?.lastBehaviorAt, value: t('monitor.window') },
    {
      key: 'microphone',
      at: health.audio.lastEventAt,
      value: health.monitoring?.lastAudioLabel
        ? t(`monitor.${health.monitoring.lastAudioLabel}`)
        : '',
    },
  ]
  const received = (at?: string | null) =>
    !!at && Date.parse(at) > (session?.serverStart ?? connectedAt)
  const count = signals.filter(
    (signal) => received(signal.at) && (signal.key !== 'scale' || freshWeight),
  ).length
  function begin() {
    const startedAt = Date.now()
    setSession({ startedAt, serverStart: serverTime + Math.max(0, startedAt - updatedLocallyAt) })
    refresh()
  }
  return (
    <section className={styles.panel} aria-label={t('monitor.title')}>
      <h2 className={styles.sectionTitle}>{t('monitor.title')}</h2>
      <p>{t('monitor.hint')}</p>
      <div>
        <Button onClick={begin} disabled={waitingForScale}>
          {t(
            waitingForScale
              ? 'monitor.reading'
              : session
                ? 'monitor.measureAgain'
                : 'monitor.start',
          )}
        </Button>
      </div>
      {waitingForScale && <p role="status">{t('monitor.readingHint')}</p>}
      {!failed && !sessionWeight && !waitingForScale && (
        <p role="alert" className={styles.sensorNotice}>
          {t(
            session && !received(health.weight.lastMeasuredAt)
              ? 'monitor.readTimeout'
              : hasWeight
                ? 'monitor.scaleStale'
                : 'monitor.scaleMissing',
          )}
        </p>
      )}
      {!failed && sessionWeight && <p role="status">{t('monitor.scaleActive')}</p>}
      {!freshWeight && <ScaleUsbCheck />}
      {live.length > 0 ? (
        <div>
          <h3>{t('monitor.liveTitle')}</h3>
          {/* polite: the screen reader reads the new symptoms when a minute is analysed */}
          <ul className={styles.liveList} aria-live="polite">
            {live.map((pig) => (
              <li key={pig.guineaPigId} className={styles.liveItem}>
                <p>
                  <MarkColorDot color={pig.color} />{' '}
                  {pig.symptoms.length === 0
                    ? t('monitor.symptomsNone', {
                        seconds: Math.round(pig.window.stillSeconds),
                        window: pig.window.windowSeconds,
                        feeder: pig.window.feederVisits,
                        water: pig.window.watererVisits,
                      })
                    : t('monitor.symptomsLead')}
                </p>
                {pig.symptoms.length > 0 && (
                  <ul className={styles.symptoms}>
                    {pig.symptoms.map((symptom) => (
                      <li key={symptom}>
                        {t(`monitor.symptom.${symptom}`, {
                          seconds: Math.round(pig.window.stillSeconds),
                          window: pig.window.windowSeconds,
                        })}
                      </li>
                    ))}
                  </ul>
                )}
                <small>
                  <time dateTime={pig.at}>{new Date(pig.at).toLocaleTimeString(dateLocale())}</time>
                  {' · '}
                  {t('monitor.detection', {
                    confidence: Math.round(pig.window.detectionConfidence * 100),
                  })}
                </small>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        observation &&
        observationAt &&
        Date.parse(observationAt) >= connectedAt && (
          <div>
            <h3>{t('monitor.observation')}</h3>
            <p>
              <MarkColorDot color={observation.color} />
              {' · '}
              {t('monitor.stillEstimate', {
                seconds: Math.round(observation.stillSeconds),
                window: observation.windowSeconds,
                confidence: Math.round(observation.detectionConfidence * 100),
              })}
            </p>
            <time dateTime={observationAt}>
              {new Date(observationAt).toLocaleString(dateLocale())}
            </time>
          </div>
        )
      )}
      {failed && <p role="status">{t('monitor.offline')}</p>}
      {session && !failed && (
        <p role="status">
          {t(
            count === 3 ? 'monitor.complete' : count === 0 ? 'monitor.waiting' : 'monitor.partial',
            { count },
          )}
        </p>
      )}
      <ul>
        {signals.map(({ key, at, value }) => (
          <li key={key}>
            <strong>{t(`monitor.${key}`)}</strong>
            {' · '}
            {at && received(at) && (key !== 'scale' || hasWeight) ? (
              <>
                {key === 'scale' && !freshWeight && t('monitor.lastWeight')}
                {value}
                {' · '}
                <time dateTime={at}>{new Date(at).toLocaleString(dateLocale())}</time>
              </>
            ) : (
              t('monitor.noData')
            )}
          </li>
        ))}
      </ul>
      <footer className={styles.monitorFooter}>
        <p role="status">{t(aiStatus)}</p>
        {observationAt && lastAnalysis >= connectedAt && (
          <small>
            {t('monitor.lastAnalysis')}{' '}
            <time dateTime={observationAt}>
              {new Date(observationAt).toLocaleString(dateLocale())}
            </time>
          </small>
        )}
      </footer>
    </section>
  )
}

export function CageOverview() {
  const cageId = useCageId()
  const cage = useCage(cageId)
  const health = useCageHealth(cageId)
  // the same queries as the sections: only to show how many there are next to each title
  const guineaPigCount = useGuineaPigs(cageId).data?.length
  const alertCageId = health.data?.monitoring ? undefined : cageId
  const openAlerts = useAlerts('OPEN', alertCageId)
  const openAlertCount = openAlerts.data?.length
  const profile = useProfile()
  const now = useNow()
  const simulation = useStartSimulation(cageId)
  const toast = useToast()
  const equipment = useMutation({
    mutationFn: async (connect: boolean) =>
      (await getDashboardApi()).cages.setEquipment(cageId, connect),
    onSuccess: () => health.refetch(),
    onError: (error) =>
      toast.show({
        message: t(
          error instanceof ApiError && error.status === 409 ? 'monitor.busy' : 'monitor.failed',
        ),
        tone: 'info',
      }),
  })

  function startSimulation() {
    simulation.mutate(undefined, {
      onSuccess: () => toast.show({ message: t('toast.simulationStarted') }),
      onError: (error) =>
        toast.show({
          message: t(
            error instanceof ApiError && error.status === 400
              ? 'toast.simulationNoGuineaPigs'
              : 'toast.simulationFailed',
          ),
          tone: 'info',
        }),
    })
  }
  // the name they picked, if they picked one: the greeting is exactly where it belongs
  const firstName = profile.data?.displayName.split(' ')[0]

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
          <Button
            disabled={!health.data || equipment.isPending}
            onClick={() => equipment.mutate(!health.data?.monitoring)}
          >
            {t(health.data?.monitoring ? 'monitor.disconnect' : 'monitor.connect')}
          </Button>
          <RefreshButton queryKeys={[['cage', cageId], ['alerts']]} />
          {/* for practice: the AI analyses a drawn cage, see POST /cages/{id}/simulation */}
          {health.data && !health.data.monitoring && (
            <Button
              onClick={startSimulation}
              disabled={simulation.isPending || guineaPigCount === 0}
              title={t('cage.simulateHint')}
            >
              {t('cage.simulate')}
            </Button>
          )}
          <ButtonLink to={cagePath(cageId, '/guinea-pigs/new')} variant="primary">
            {t('cage.newGuineaPig')}
          </ButtonLink>
        </div>
      </header>
      {/* no data or failed request: the banner shows UNKNOWN, never "Normal" */}
      <CageStatusBanner health={health.data} now={now} liveIndicator={<LiveIndicator />} />
      {health.data?.monitoring && (
        <SensorMeasurement
          key={cageId + health.data.monitoring.connectedAt}
          updatedLocallyAt={health.dataUpdatedAt}
          health={health.data}
          failed={health.isError}
          refresh={() => void health.refetch()}
        />
      )}
      {health.data?.monitoring && <CameraSetup cageId={cageId} />}
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
              {t(alertCageId ? 'alerts.openTitle' : 'monitor.accountAlerts')}
              {openAlertCount !== undefined && (
                <span className={styles.count}>{openAlertCount}</span>
              )}
            </h2>
            <div className={styles.panel}>
              <OpenAlertsSection cageId={alertCageId} alerts={openAlerts} now={now} />
              <ButtonLink
                to={alertCageId ? `/alerts?cage=${encodeURIComponent(alertCageId)}` : '/alerts'}
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
