import { Suspense, useState, type ReactNode } from 'react'
import { useParams } from 'react-router'
import { AlertList } from '../../components/AlertList/AlertList'
import { ButtonLink } from '../../components/Button/Button'
import { CoatSwatch } from '../../components/CoatSwatch/CoatSwatch'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { Icon } from '../../components/Icon/Icon'
import { MarkColorDot } from '../../components/MarkColorDot/MarkColorDot'
import { catalogLabel } from '../../catalog/catalog'
import { RangeSelector } from '../../components/RangeSelector/RangeSelector'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { StateTimeline } from '../../components/StateTimeline/StateTimeline'
import { StatusBadge } from '../../components/StatusBadge/StatusBadge'
import { LazyBehaviorChart } from '../../charts/lazyCharts'
import type { RangePreset } from '../../charts/timeRange'
import { useAlerts } from '../../hooks/useAlerts'
import { cagePath, useCageId } from '../../hooks/useCageId'
import { useGuineaPigHistory } from '../../hooks/useGuineaPigHistory'
import { useGuineaPigs } from '../../hooks/useGuineaPigs'
import { useNow } from '../../hooks/useNow'
import { t } from '../../i18n'
import type { GuineaPig } from '../../types/GuineaPig'
import { formatRelative } from '../../utils/time'
import styles from './GuineaPigDetail.module.css'

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.fact}>
      <dt className={styles.factLabel}>{label}</dt>
      <dd className={styles.factValue}>{children}</dd>
    </div>
  )
}

function NoData() {
  return <span className={styles.noData}>{t('guineaPig.detail.noData')}</span>
}

function Alerts({ cageId, guineaPig, now }: { cageId: string; guineaPig: GuineaPig; now: number }) {
  const alerts = useAlerts(undefined, cageId)

  if (alerts.isPending) {
    return <Skeleton variant="line" count={2} />
  }
  if (alerts.isError) {
    return <ErrorState message={t('alerts.loadError')} onRetry={() => void alerts.refetch()} />
  }
  const mine = alerts.data.filter((alert) => alert.guineaPigId === guineaPig.id)
  if (mine.length === 0) {
    return <p className={styles.calm}>{t('guineaPig.detail.noAlerts', { name: guineaPig.name })}</p>
  }
  return <AlertList alerts={mine} guineaPigs={[guineaPig]} now={now} />
}

// Its behavior and its states over the chosen period. One range selector above both charts; while a new
// range loads, the previous one stays on screen, dimmed, instead of a jump to a skeleton.
function History({ guineaPig }: { guineaPig: GuineaPig }) {
  const [preset, setPreset] = useState<RangePreset>('today')
  const history = useGuineaPigHistory(guineaPig.id, preset)

  return (
    <section
      className={styles.card}
      aria-labelledby="history-heading"
      aria-busy={history.isFetching}
    >
      <div className={styles.historyHead}>
        <h2 id="history-heading" className={styles.cardTitle}>
          {t('guineaPig.detail.historyTitle')}
        </h2>
        <RangeSelector value={preset} onChange={setPreset} />
      </div>
      {history.isPending ? (
        <Skeleton count={2} />
      ) : history.isError ? (
        <ErrorState
          message={t('guineaPig.detail.historyError')}
          onRetry={() => void history.refetch()}
        />
      ) : (
        <div className={history.isPlaceholderData ? styles.stale : styles.fresh}>
          <h3 className={styles.subTitle}>{t('guineaPig.detail.timelineTitle')}</h3>
          <StateTimeline
            transitions={history.data.transitions}
            from={history.data.from}
            to={history.data.to}
            currentStatus={guineaPig.status}
          />
          <h3 className={styles.subTitle}>{t('guineaPig.detail.behaviorTitle')}</h3>
          <Suspense fallback={<Skeleton count={2} />}>
            <LazyBehaviorChart
              history={history.data}
              name={guineaPig.name}
              currentStatus={guineaPig.status}
              preset={preset}
            />
          </Suspense>
        </div>
      )}
    </section>
  )
}

// What we know about one guinea pig, from the list the cage page already loaded: who it is, how it is doing,
// what its owner told when registering it, its alerts, and its history.
export function GuineaPigDetail() {
  const { id } = useParams()
  const cageId = useCageId()
  const guineaPigs = useGuineaPigs(cageId)
  const now = useNow()

  if (guineaPigs.isPending) {
    return <Skeleton count={2} />
  }
  if (guineaPigs.isError) {
    return (
      <ErrorState message={t('cage.guineaPigsError')} onRetry={() => void guineaPigs.refetch()} />
    )
  }
  const guineaPig = guineaPigs.data.find((g) => String(g.id) === id)
  if (!guineaPig) {
    return (
      <EmptyState
        mascot="worried"
        message={t('guineaPig.detail.notFound')}
        action={
          <ButtonLink to={cagePath(cageId)} variant="primary">
            {t('notFound.back')}
          </ButtonLink>
        }
      />
    )
  }

  return (
    <div className={styles.page}>
      <ButtonLink to={cagePath(cageId)} variant="ghost" className={styles.back}>
        <Icon name="chevron-left" size={18} />
        {t('guineaPig.detail.back')}
      </ButtonLink>

      <header className={styles.hero}>
        <span className={styles.avatar} aria-hidden="true">
          {guineaPig.coatColor && <CoatSwatch color={guineaPig.coatColor} size={96} />}
          <span className={styles.initial}>{guineaPig.name.charAt(0).toUpperCase()}</span>
        </span>
        <div className={styles.who}>
          <h1 className={styles.name}>{guineaPig.name}</h1>
          <div className={styles.status}>
            <StatusBadge status={guineaPig.status} size="lg" />
            <span className={styles.since}>
              {t('guineaPig.detail.since', { time: formatRelative(guineaPig.statusSince, now) })}
            </span>
          </div>
        </div>
      </header>

      <section className={styles.card} aria-labelledby="facts-heading">
        <h2 id="facts-heading" className={styles.cardTitle}>
          {t('guineaPig.detail.facts')}
        </h2>
        <dl className={styles.facts}>
          <Fact label={t('guineaPig.register.breed')}>
            {guineaPig.breed ? catalogLabel('breeds', guineaPig.breed) : <NoData />}
          </Fact>
          <Fact label={t('guineaPig.register.coat')}>
            {guineaPig.coatColor ? (
              <span className={styles.inline}>
                <CoatSwatch color={guineaPig.coatColor} />
                {catalogLabel('coatColors', guineaPig.coatColor)}
              </span>
            ) : (
              <NoData />
            )}
          </Fact>
          <Fact label={t('guineaPig.detail.initialWeight')}>
            {guineaPig.initialWeightGrams ? (
              t('guineaPig.weightGrams', { grams: guineaPig.initialWeightGrams })
            ) : (
              <NoData />
            )}
          </Fact>
          <Fact label={t('guineaPig.detail.mark')}>
            <MarkColorDot color={guineaPig.markColor} />
          </Fact>
        </dl>
        {guineaPig.notes && (
          <div className={styles.notes}>
            <h3 className={styles.notesTitle}>{t('guineaPig.register.notes')}</h3>
            <p>{guineaPig.notes}</p>
          </div>
        )}
      </section>

      <section className={styles.card} aria-labelledby="alerts-heading">
        <h2 id="alerts-heading" className={styles.cardTitle}>
          {t('guineaPig.detail.alerts', { name: guineaPig.name })}
        </h2>
        <Alerts cageId={cageId} guineaPig={guineaPig} now={now} />
      </section>

      <History guineaPig={guineaPig} />
    </div>
  )
}
