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
      <span className={styles.iconWrap}>
        <Icon name="alert-circle" size={30} />
      </span>
      <p className={styles.message}>{message}</p>
      {onRetry && <Button onClick={onRetry}>{t('common.retry')}</Button>}
    </div>
  )
}
