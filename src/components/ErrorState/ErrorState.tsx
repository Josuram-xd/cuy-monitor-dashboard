import { t } from '../../i18n'
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
      {onRetry && (
        <button type="button" className={styles.retry} onClick={onRetry}>
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}
