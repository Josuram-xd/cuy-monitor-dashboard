import type { ReactNode } from 'react'
import { useParams } from 'react-router'
import { AlertList } from '../../components/AlertList/AlertList'
import { ButtonLink } from '../../components/Button/Button'
import { CoatSwatch } from '../../components/CoatSwatch/CoatSwatch'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { Icon } from '../../components/Icon/Icon'
import { Mascot } from '../../components/Mascot/Mascot'
import { MarkColorDot } from '../../components/MarkColorDot/MarkColorDot'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { StatusBadge } from '../../components/StatusBadge/StatusBadge'
import { useAlerts } from '../../hooks/useAlerts'
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

const NO_DATA = <span className={styles.noData}>{t('guineaPig.detail.noData')}</span>

function Alerts({ guineaPig, now }: { guineaPig: GuineaPig; now: number }) {
  const alerts = useAlerts()

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

// What we know about one cuy, from the list the cage page already loaded: who it is, how it is doing,
// what its owner told when registering it, and its alerts. The behavior history comes later.
export function GuineaPigDetail() {
  const { id } = useParams()
  const guineaPigs = useGuineaPigs()
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
          <ButtonLink to="/" variant="primary">
            {t('notFound.back')}
          </ButtonLink>
        }
      />
    )
  }

  return (
    <div className={styles.page}>
      <ButtonLink to="/" variant="ghost" className={styles.back}>
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
            {guineaPig.breed ? t(`guineaPig.breed.${guineaPig.breed}`) : NO_DATA}
          </Fact>
          <Fact label={t('guineaPig.register.coat')}>
            {guineaPig.coatColor ? (
              <span className={styles.inline}>
                <CoatSwatch color={guineaPig.coatColor} />
                {t(`guineaPig.coat.${guineaPig.coatColor}`)}
              </span>
            ) : (
              NO_DATA
            )}
          </Fact>
          <Fact label={t('guineaPig.detail.initialWeight')}>
            {guineaPig.initialWeightGrams
              ? t('guineaPig.weightGrams', { grams: guineaPig.initialWeightGrams })
              : NO_DATA}
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
        <Alerts guineaPig={guineaPig} now={now} />
      </section>

      <section className={styles.soon} aria-labelledby="history-heading">
        <Mascot mood="sleepy" size={96} />
        <div>
          <h2 id="history-heading" className={styles.cardTitle}>
            {t('guineaPig.detail.historyTitle')}
          </h2>
          <p className={styles.soonText}>{t('guineaPig.detail.historySoon')}</p>
        </div>
      </section>
    </div>
  )
}
