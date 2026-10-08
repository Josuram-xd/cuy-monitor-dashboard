import { t } from '../../i18n'
import { EmptyState } from '../../components/EmptyState/EmptyState'

// stands in for the pages of later tasks (alerts, register guinea pig, detail)
export function ComingSoon() {
  return <EmptyState icon="clock" message={t('comingSoon.message')} />
}
