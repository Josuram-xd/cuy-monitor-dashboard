import { t } from '../../i18n'
import { Button } from '../Button/Button'
import { Icon } from '../Icon/Icon'
import styles from './ErrorState.module.css'

interface ErrorStateProps {
  // what failed, in plain words; never the raw error from the server
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className={styles.error} role="alert">
      <Icon name="alert-circle" size={32} className={styles.icon} />
      <p>{message}</p>
      {onRetry && <Button onClick={onRetry}>{t('common.retry')}</Button>}
    </div>
  )
}
