import { Link, Outlet } from 'react-router'
import { t } from '../../i18n'
import { LiveConnectionProvider } from '../../realtime/LiveConnectionProvider'
import { BottomNav } from '../BottomNav/BottomNav'
import { UserMenu } from '../UserMenu/UserMenu'
import styles from './AppLayout.module.css'

const MAIN_ID = 'main-content'

export function AppLayout() {
  // private pages only: the live connection exists only while there is a session
  return (
    <LiveConnectionProvider>
      <div className={styles.layout}>
        <a href={`#${MAIN_ID}`} className={styles.skipLink}>
          {t('common.skipToContent')}
        </a>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link to="/" className={styles.brand}>
              <span className={styles.logo} aria-hidden="true" />
              {t('app.shortTitle')}
            </Link>
            <div className={styles.actions}>
              <BottomNav />
              <UserMenu />
            </div>
          </div>
        </header>
        <main id={MAIN_ID} className={styles.main} tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </LiveConnectionProvider>
  )
}
