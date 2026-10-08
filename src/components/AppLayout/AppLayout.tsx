import { Link, Outlet } from 'react-router'
import { t } from '../../i18n'
import { BottomNav } from '../BottomNav/BottomNav'
import styles from './AppLayout.module.css'

const MAIN_ID = 'main-content'

export function AppLayout() {
  return (
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
          <BottomNav />
        </div>
      </header>
      <main id={MAIN_ID} className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}
