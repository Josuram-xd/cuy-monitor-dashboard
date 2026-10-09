import { AlertList } from '../../components/AlertList/AlertList'
import { ButtonLink } from '../../components/Button/Button'
import { CageStatusBanner } from '../../components/CageStatusBanner/CageStatusBanner'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { GuineaPigCard } from '../../components/GuineaPigCard/GuineaPigCard'
import { GuineaPigGrid, GuineaPigGridItem } from '../../components/GuineaPigGrid/GuineaPigGrid'
import { Reveal } from '../../components/Reveal/Reveal'
import { LiveIndicator } from '../../components/LiveIndicator/LiveIndicator'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { useAlerts } from '../../hooks/useAlerts'
import { useCageHealth } from '../../hooks/useCageHealth'
import { useProfile } from '../../hooks/useProfile'
import { useGuineaPigs } from '../../hooks/useGuineaPigs'
import { useNow } from '../../hooks/useNow'
import { t } from '../../i18n'
import styles from './CageOverview.module.css'

const SKELETON_CARDS = 3
const LATEST_ALERTS = 3

function GuineaPigsSection({ now }: { now: number }) {
  const guineaPigs = useGuineaPigs()

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
          <ButtonLink to="/guinea-pigs/new" variant="primary">
            {t('cage.registerGuineaPig')}
          </ButtonLink>
        }
      />
    )
  }
  return (
    <GuineaPigGrid label={t('cage.guineaPigs')}>
      {guineaPigs.data.map((guineaPig, index) => (
        <GuineaPigGridItem key={guineaPig.id} index={index}>
          <GuineaPigCard guineaPig={guineaPig} now={now} />
        </GuineaPigGridItem>
      ))}
    </GuineaPigGrid>
  )
}

function OpenAlertsSection({ now }: { now: number }) {
  const alerts = useAlerts('OPEN')
  // same query as the grid, TanStack Query shares it
  const guineaPigs = useGuineaPigs()

  if (alerts.isPending) {
    return <Skeleton variant="line" count={2} />
  }
  if (alerts.isError) {
    return <ErrorState message={t('alerts.loadError')} onRetry={() => void alerts.refetch()} />
  }
  if (alerts.data.length === 0) {
    return <p className={styles.calm}>{t('alerts.noneOpen')}</p>
  }
  return (
    <AlertList
      alerts={alerts.data.slice(0, LATEST_ALERTS)}
      guineaPigs={guineaPigs.data}
      now={now}
    />
  )
}

export function CageOverview() {
  const health = useCageHealth()
  const profile = useProfile()
  const now = useNow()
  const firstName = profile.data?.fullName.split(' ')[0]

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.greeting}>
            {firstName ? t('cage.greeting', { name: firstName }) : t('cage.greetingFallback')}
          </p>
          <h1 className={styles.title}>{t('cage.title')}</h1>
        </div>
        <ButtonLink to="/guinea-pigs/new" variant="primary">
          {t('cage.newGuineaPig')}
        </ButtonLink>
      </header>
      {/* no data or failed request: the banner shows UNKNOWN, never "Normal" */}
      <CageStatusBanner health={health.data} now={now} liveIndicator={<LiveIndicator />} />
      <div className={styles.columns}>
        <Reveal>
          <section className={styles.section} aria-labelledby="guinea-pigs-heading">
            <h2 id="guinea-pigs-heading" className={styles.sectionTitle}>
              {t('cage.guineaPigs')}
            </h2>
            <GuineaPigsSection now={now} />
          </section>
        </Reveal>
        <Reveal delay={120}>
          <section className={styles.alerts} aria-labelledby="open-alerts-heading">
            <div className={styles.sectionHeader}>
              <h2 id="open-alerts-heading" className={styles.sectionTitle}>
                {t('alerts.openTitle')}
              </h2>
              <ButtonLink to="/alerts" variant="ghost">
                {t('alerts.seeAll')}
              </ButtonLink>
            </div>
            <OpenAlertsSection now={now} />
          </section>
        </Reveal>
      </div>
    </div>
  )
}
