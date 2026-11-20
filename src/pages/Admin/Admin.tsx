import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { useProfile } from '../../hooks/useProfile'
import { t } from '../../i18n'
import { ActionLogSection } from './ActionLogSection'
import { readActions, recordAction } from './actionLog'
import { AiLogSection } from './AiLogSection'
import { CatalogSection } from './CatalogSection'
import { SettingsSection } from './SettingsSection'
import { UsersSection } from './UsersSection'
import styles from './Admin.module.css'

// what the admin can look at or set up, one at a time; the chosen one is kept in the address (?tab=)
const TABS = ['accounts', 'health', 'message', 'assistant', 'catalog', 'actions', 'ai'] as const
type Tab = (typeof TABS)[number]

function isTab(value: string | null): value is Tab {
  return (TABS as readonly string[]).includes(value ?? '')
}

/**
 * The admin panel. Hiding it from a breeder is a courtesy, not the permission: every call behind it is
 * checked by the backend against the account's role in the database, so reaching this URL by hand shows
 * nothing but errors.
 */
export function Admin() {
  const me = useProfile()
  const [actions, setActions] = useState(readActions)
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('tab')
  const tab: Tab = isTab(requested) ? requested : 'accounts'
  const onAction = (text: string, ok: boolean) => setActions(recordAction(text, ok))

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
      <nav className={styles.tabs} aria-label={t('admin.tabs.label')}>
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            className={styles.tab}
            aria-current={tab === key ? 'page' : undefined}
            onClick={() => setSearchParams({ tab: key }, { replace: true })}
          >
            {t(`admin.tabs.${key}`)}
          </button>
        ))}
      </nav>
      {/* Mediator: the sections only report to this page; it updates the action log */}
      {tab === 'accounts' && <UsersSection myUsername={me.data.username} onAction={onAction} />}
      {(tab === 'health' || tab === 'message' || tab === 'assistant') && (
        // a key per group: a draft left in one group is not carried into another
        <SettingsSection key={tab} group={tab} onAction={onAction} />
      )}
      {tab === 'catalog' && <CatalogSection onAction={onAction} />}
      {tab === 'actions' && <ActionLogSection actions={actions} />}
      {tab === 'ai' && <AiLogSection />}
    </div>
  )
}
