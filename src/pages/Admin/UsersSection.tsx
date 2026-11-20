import { formatRelative } from '../../utils/time'
import { useState } from 'react'
import { Button } from '../../components/Button/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { Icon } from '../../components/Icon/Icon'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { useToast } from '../../components/Toast/useToast'
import {
  useAdminUsers,
  useChangeUserRoleMutation,
  useSetUserEnabledMutation,
} from '../../hooks/useAdmin'
import { t } from '../../i18n'
import styles from './Admin.module.css'
import {
  demoteCommand,
  disableCommand,
  enableCommand,
  promoteCommand,
  type UserCommand,
} from './userCommands'

/** The accounts. Your own row has no buttons: the backend refuses those changes, and so does this. */
export function UsersSection({
  myUsername,
  onAction = () => {},
}: {
  myUsername?: string
  // every change, done or failed, for the action log
  onAction?: (text: string, ok: boolean) => void
}) {
  const users = useAdminUsers()
  const changeRole = useChangeUserRoleMutation()
  const setEnabled = useSetUserEnabledMutation()
  const toast = useToast()
  const [pending, setPending] = useState<UserCommand | null>(null)

  const busy = changeRole.isPending || setEnabled.isPending

  function confirm() {
    if (!pending) return
    if (pending.next) {
      setPending(pending.next)
      return
    }
    const who = `${pending.user.fullName} (${pending.user.email})`
    // the backend has the last word on both rules (your own account, the last admin): a 400 is shown as is
    pending.execute(
      { changeRole: changeRole.mutate, setEnabled: setEnabled.mutate },
      {
        onSuccess: () => {
          setPending(null)
          toast.show({ message: pending.successMessage })
          onAction(t(pending.logKey, { who }), true)
        },
        onError: () => {
          setPending(null)
          toast.show({ message: t('admin.users.failed') })
          onAction(t(pending.logKey, { who }), false)
        },
      },
    )
  }

  if (users.isPending) return <Skeleton count={3} />
  if (users.isError) {
    return <ErrorState message={t('admin.loadFailed')} onRetry={() => void users.refetch()} />
  }

  return (
    <section className={styles.card} aria-labelledby="users-heading" data-spotlight>
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon} aria-hidden="true">
          <Icon name="user" size={22} />
        </span>
        <div>
          <h2 id="users-heading">{t('admin.users.title')}</h2>
          <p className={styles.intro}>{t('admin.users.intro')}</p>
        </div>
      </div>

      <ul className={styles.users}>
        {(users.data ?? []).map((user) => {
          // your own row has no buttons: the backend refuses changing your own role or switching
          // yourself off, and between those two the last admin can never be lost
          const isMe = user.username === myUsername
          const disabled = user.status === 'DISABLED'
          return (
            <li key={user.id} className={styles.user}>
              <div className={styles.userWho}>
                <p className={styles.userName}>
                  {user.fullName}
                  {isMe && <span className={styles.youTag}>{t('admin.users.you')}</span>}
                </p>
                <p className={styles.userMeta}>
                  @{user.username} · {user.email}
                </p>
                <p className={styles.userMeta}>
                  {t('admin.users.summary', {
                    cages: user.cages,
                    guineaPigs: user.guineaPigs,
                    openAlerts: user.openAlerts,
                  })}
                  {' · '}
                  {user.lastActivityAt
                    ? t('admin.users.lastActivity', { when: formatRelative(user.lastActivityAt) })
                    : t('admin.users.noActivity')}
                </p>
              </div>
              <div className={styles.userTags}>
                <span className={styles.roleTag} data-admin={user.role === 'ADMIN' || undefined}>
                  {t('admin.users.roles.' + user.role)}
                </span>
                <span className={styles.statusTag} data-off={disabled || undefined}>
                  {t('admin.users.statuses.' + user.status)}
                </span>
              </div>
              {!isMe && (
                <div className={styles.userActions}>
                  <Button
                    onClick={() =>
                      setPending(user.role === 'ADMIN' ? demoteCommand(user) : promoteCommand(user))
                    }
                    disabled={busy}
                    aria-label={t(
                      user.role === 'ADMIN' ? 'admin.users.demoteOne' : 'admin.users.promoteOne',
                      { name: user.fullName },
                    )}
                  >
                    {user.role === 'ADMIN' ? t('admin.users.demote') : t('admin.users.promote')}
                  </Button>
                  <Button
                    onClick={() =>
                      setPending(disabled ? enableCommand(user) : disableCommand(user))
                    }
                    disabled={busy}
                    aria-label={t(disabled ? 'admin.users.enableOne' : 'admin.users.disableOne', {
                      name: user.fullName,
                    })}
                  >
                    {disabled ? t('admin.users.enable') : t('admin.users.disable')}
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {pending && (
        <ConfirmDialog
          title={pending.title}
          confirmLabel={pending.confirmLabel}
          busy={busy}
          danger={pending.danger}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
        >
          <p>{pending.explain}</p>
        </ConfirmDialog>
      )}
    </section>
  )
}
