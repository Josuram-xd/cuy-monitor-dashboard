import { Link, Outlet, ScrollRestoration } from 'react-router'
import { useCatalog } from '../../hooks/useCatalog'
import { t } from '../../i18n'
import { LiveConnectionProvider } from '../../realtime/LiveConnectionProvider'
import { AppBackdrop } from '../AppBackdrop/AppBackdrop'
import { AppFooter } from '../AppFooter/AppFooter'
import { BottomNav } from '../BottomNav/BottomNav'
import { ErrorState } from '../ErrorState/ErrorState'
import { Logo } from '../Logo/Logo'
import { Skeleton } from '../Skeleton/Skeleton'
import { Wave } from '../Wave/Wave'
import { UserMenu } from '../UserMenu/UserMenu'
import styles from './AppLayout.module.css'

const MAIN_ID = 'main-content'

export function AppLayout() {
  // Colors, breeds and coat colors come from the database. Every page below paints with them, so
  // they are loaded once here instead of in each page, and nothing renders with empty lists.
  const catalog = useCatalog()

  // private pages only: the live connection exists only while there is a session
  return (
    <LiveConnectionProvider>
      {/* every page opens at the top; Back returns to where the person was */}
      <ScrollRestoration />
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
          {catalog.isPending ? (
            <Skeleton count={3} />
          ) : catalog.isError ? (
            <ErrorState message={t('cage.catalogError')} onRetry={() => void catalog.refetch()} />
          ) : (
            <Outlet />
          )}
        </main>
        <AppFooter />
      </div>
    </LiveConnectionProvider>
  )
}
