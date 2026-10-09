import { Link, Outlet } from 'react-router'
import { t } from '../../i18n'
import { LiveConnectionProvider } from '../../realtime/LiveConnectionProvider'
import { AppBackdrop } from '../AppBackdrop/AppBackdrop'
import { BottomNav } from '../BottomNav/BottomNav'
import { Logo } from '../Logo/Logo'
import { Wave } from '../Wave/Wave'
import { UserMenu } from '../UserMenu/UserMenu'
import styles from './AppLayout.module.css'

const MAIN_ID = 'main-content'

export function AppLayout() {
  // private pages only: the live connection exists only while there is a session
  return (
    <LiveConnectionProvider>
      <AppBackdrop />
      <div className={styles.layout}>
        <a href={`#${MAIN_ID}`} className={styles.skipLink}>
          {t('common.skipToContent')}
        </a>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link to="/" className={styles.brand}>
              <Logo size={32} tone="light" />
              {t('app.shortTitle')}
            </Link>
            <div className={styles.actions}>
              <BottomNav />
              <UserMenu />
            </div>
          </div>
          <span className={styles.wave}>
            <Wave gradient={{ from: 'var(--header-from)', to: 'var(--header-to)' }} />
          </span>
        </header>
        <main id={MAIN_ID} className={styles.main} tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </LiveConnectionProvider>
  )
}
