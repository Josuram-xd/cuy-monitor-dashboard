import { Link } from 'react-router'
import { EmptyState } from '../../components/EmptyState/EmptyState'
import { useProfile } from '../../hooks/useProfile'
import { t } from '../../i18n'
import { CatalogSection } from './CatalogSection'
import { UsersSection } from './UsersSection'
import styles from './Admin.module.css'

/**
 * The admin panel. Hiding it from a breeder is a courtesy, not the permission: every call behind it is
 * checked by the backend against the account's role in the database, so reaching this URL by hand shows
 * nothing but errors.
 */
export function Admin() {
  const me = useProfile()

  if (me.data && me.data.role !== 'ADMIN') {
    return (
      <div className={styles.page}>
        <EmptyState
          message={t('admin.notAllowed')}
          action={<Link to="/">{t('admin.backHome')}</Link>}
        />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>{t('admin.title')}</h1>
        <p className={styles.subtitle}>{t('admin.subtitle')}</p>
      </header>
      <CatalogSection />
      <UsersSection myUsername={me.data?.username} />
    </div>
  )
}
