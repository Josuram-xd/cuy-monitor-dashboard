import { t } from '../../i18n'
import { Logo } from '../Logo/Logo'
import styles from './SessionLoading.module.css'

// Shown for a moment while the server confirms the session, so the user never sees
// the login form flash before the private page.
export function SessionLoading() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.logo}>
        <Logo size={56} />
      </span>
      <p className={styles.text}>{t('common.loading')}</p>
    </div>
  )
}
