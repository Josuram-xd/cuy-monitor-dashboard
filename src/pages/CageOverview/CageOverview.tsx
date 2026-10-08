import { ButtonLink } from '../../components/Button/Button'
import { CageStatusBanner } from '../../components/CageStatusBanner/CageStatusBanner'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { GuineaPigCard } from '../../components/GuineaPigCard/GuineaPigCard'
import { GuineaPigGrid, GuineaPigGridItem } from '../../components/GuineaPigGrid/GuineaPigGrid'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { useCageHealth } from '../../hooks/useCageHealth'
import { useGuineaPigs } from '../../hooks/useGuineaPigs'
import { useNow } from '../../hooks/useNow'
import { t } from '../../i18n'
import styles from './CageOverview.module.css'

const SKELETON_CARDS = 3

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
      {guineaPigs.data.map((guineaPig) => (
        <GuineaPigGridItem key={guineaPig.id}>
          <GuineaPigCard guineaPig={guineaPig} now={now} />
        </GuineaPigGridItem>
      ))}
    </GuineaPigGrid>
  )
}

export function CageOverview() {
  const health = useCageHealth()
  const now = useNow()

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('cage.title')}</h1>
      {/* no data or failed request: the banner shows UNKNOWN, never "Normal" */}
      <CageStatusBanner health={health.data} now={now} />
      <section className={styles.section} aria-labelledby="guinea-pigs-heading">
        <h2 id="guinea-pigs-heading">{t('cage.guineaPigs')}</h2>
        <GuineaPigsSection now={now} />
      </section>
    </div>
  )
}
