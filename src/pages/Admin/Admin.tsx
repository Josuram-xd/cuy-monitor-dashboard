import { useState } from 'react'
import { Navigate } from 'react-router'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { useProfile } from '../../hooks/useProfile'
import { t } from '../../i18n'
import { ActionLogSection } from './ActionLogSection'
import { readActions, recordAction } from './actionLog'
import { AiLogSection } from './AiLogSection'
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
  const [actions, setActions] = useState(readActions)

  // the role is known before any admin call goes out: otherwise a breeder's page fires them and gets 403s
  if (me.isPending) {
    return <Skeleton count={2} />
  }
  if (me.isError) {
    return <ErrorState message={t('admin.loadFailed')} onRetry={() => void me.refetch()} />
  }
  // a breeder gets here through a ?next=/admin left behind by an admin's session: straight to the cages.
  // The backend refuses every admin call from a breeder anyway
  if (me.data.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>{t('admin.title')}</h1>
        <p className={styles.subtitle}>{t('admin.subtitle')}</p>
      </header>
      <UsersSection
        myUsername={me.data.username}
        onAction={(text, ok) => setActions(recordAction(text, ok))}
      />
      <ActionLogSection actions={actions} />
      <AiLogSection />
      <CatalogSection />
    </div>
  )
}
