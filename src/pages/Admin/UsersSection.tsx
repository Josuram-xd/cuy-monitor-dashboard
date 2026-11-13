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
import type { AdminUser } from '../../types/Admin'
import styles from './Admin.module.css'

type Pending =
  | { kind: 'role'; user: AdminUser; makeAdmin: boolean }
  | { kind: 'enabled'; user: AdminUser; enable: boolean }

/** The accounts. Your own row has no buttons: the backend refuses those changes, and so does this. */
export function UsersSection({ myUsername }: { myUsername?: string }) {
  const users = useAdminUsers()
  const changeRole = useChangeUserRoleMutation()
  const setEnabled = useSetUserEnabledMutation()
  const toast = useToast()
  const [pending, setPending] = useState<Pending | null>(null)

  const busy = changeRole.isPending || setEnabled.isPending

  function confirm() {
    if (!pending) return
    const { user } = pending
    const done = (message: string) => {
      setPending(null)
      toast.show({ message })
    }
    // the backend has the last word on both rules (your own account, the last admin): a 400 is shown as is
    const onError = () => {
      setPending(null)
      toast.show({ message: t('admin.users.failed') })
    }

    if (pending.kind === 'role') {
      const role = pending.makeAdmin ? 'ADMIN' : 'BREEDER'
      changeRole.mutate(
        { id: user.id, role },
        {
          onSuccess: () =>
            done(
              pending.makeAdmin
                ? t('admin.users.promoted', { name: user.fullName })
                : t('admin.users.demoted', { name: user.fullName }),
            ),
          onError,
        },
      )
      return
    }

    setEnabled.mutate(
      { id: user.id, enabled: pending.enable },
      {
        onSuccess: () =>
          done(
            pending.enable
              ? t('admin.users.enabled', { name: user.fullName })
              : t('admin.users.disabled', { name: user.fullName }),
          ),
        onError,
      },
    )
  }

  function dialogTitle(p: Pending): string {
    if (p.kind === 'role') {
      return p.makeAdmin
        ? t('admin.users.promoteTitle', { name: p.user.fullName })
        : t('admin.users.demoteTitle', { name: p.user.fullName })
    }
    return p.enable
      ? t('admin.users.enableTitle', { name: p.user.fullName })
      : t('admin.users.disableTitle', { name: p.user.fullName })
  }

  function dialogConfirm(p: Pending): string {
    if (p.kind === 'role') {
      return p.makeAdmin ? t('admin.users.promote') : t('admin.users.demote')
    }
    return p.enable ? t('admin.users.enable') : t('admin.users.disable')
  }

  function dialogExplain(p: Pending): string {
    if (p.kind === 'role') {
      return p.makeAdmin ? t('admin.users.promoteExplain') : t('admin.users.demoteExplain')
    }
    return p.enable ? t('admin.users.enableExplain') : t('admin.users.disableExplain')
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
                      setPending({ kind: 'role', user, makeAdmin: user.role !== 'ADMIN' })
                    }
                    disabled={busy}
                  >
                    {user.role === 'ADMIN' ? t('admin.users.demote') : t('admin.users.promote')}
                  </Button>
                  <Button
                    onClick={() => setPending({ kind: 'enabled', user, enable: disabled })}
                    disabled={busy}
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
          title={dialogTitle(pending)}
          confirmLabel={dialogConfirm(pending)}
          busy={busy}
          danger={pending.kind === 'enabled' && !pending.enable}
          onConfirm={confirm}
          onCancel={() => setPending(null)}
        >
          <p>{dialogExplain(pending)}</p>
        </ConfirmDialog>
      )}
    </section>
  )
}
