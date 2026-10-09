import { t } from '../../i18n'
import { ButtonLink } from '../../components/Button/Button'
import { EmptyState } from '../../components/EmptyState/EmptyState'

export function NotFound() {
  return (
    <EmptyState
      mascot="worried"
      message={t('notFound.message')}
      action={
        <ButtonLink to="/" variant="primary">
          {t('notFound.back')}
        </ButtonLink>
      }
    />
  )
}
