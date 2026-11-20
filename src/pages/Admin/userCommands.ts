import { t } from '../../i18n'
import type { AdminUser, UserRole } from '../../types/Admin'

export interface MutationCallbacks {
  onSuccess: () => void
  onError: () => void
}

// the two mutations of the users panel, passed in by the invoker (UsersSection)
export interface UserReceiver {
  changeRole: (vars: { id: AdminUser['id']; role: UserRole }, callbacks: MutationCallbacks) => void
  setEnabled: (
    vars: { id: AdminUser['id']; enabled: boolean },
    callbacks: MutationCallbacks,
  ) => void
}

// Command: one admin action on one account, with the texts of its dialog. The invoker runs it on confirm.
export interface UserCommand {
  readonly user: AdminUser
  readonly title: string
  readonly confirmLabel: string
  readonly explain: string
  readonly danger: boolean
  readonly logKey: string
  readonly successMessage: string
  // a step that needs one more confirmation before this one runs
  readonly next?: UserCommand
  execute(receiver: UserReceiver, callbacks: MutationCallbacks): void
}

type CommandTexts = Pick<
  UserCommand,
  'title' | 'confirmLabel' | 'explain' | 'logKey' | 'successMessage'
>

function roleCommand(user: AdminUser, role: UserRole, texts: CommandTexts): UserCommand {
  return {
    user,
    ...texts,
    danger: false,
    execute: (receiver, callbacks) => receiver.changeRole({ id: user.id, role }, callbacks),
  }
}

function enabledCommand(user: AdminUser, enabled: boolean, texts: CommandTexts): UserCommand {
  return {
    user,
    ...texts,
    danger: !enabled,
    execute: (receiver, callbacks) => receiver.setEnabled({ id: user.id, enabled }, callbacks),
  }
}

// making someone an admin asks twice: the first yes only opens the final confirmation
export function promoteCommand(user: AdminUser): UserCommand {
  const name = user.fullName
  const final = roleCommand(user, 'ADMIN', {
    title: t('admin.users.promoteFinalTitle', { name }),
    confirmLabel: t('admin.users.promote'),
    explain: t('admin.users.promoteFinalExplain', { email: user.email }),
    logKey: 'admin.actions.promoted',
    successMessage: t('admin.users.promoted', { name }),
  })
  return {
    ...final,
    title: t('admin.users.promoteTitle', { name }),
    confirmLabel: t('admin.users.continue'),
    explain: t('admin.users.promoteExplain'),
    next: final,
    // never run: the invoker moves to `next` first; a no-op so the first step cannot promote by itself
    execute: () => {},
  }
}

export function demoteCommand(user: AdminUser): UserCommand {
  const name = user.fullName
  return roleCommand(user, 'BREEDER', {
    title: t('admin.users.demoteTitle', { name }),
    confirmLabel: t('admin.users.demote'),
    explain: t('admin.users.demoteExplain'),
    logKey: 'admin.actions.demoted',
    successMessage: t('admin.users.demoted', { name }),
  })
}

export function enableCommand(user: AdminUser): UserCommand {
  const name = user.fullName
  return enabledCommand(user, true, {
    title: t('admin.users.enableTitle', { name }),
    confirmLabel: t('admin.users.enable'),
    explain: t('admin.users.enableExplain'),
    logKey: 'admin.actions.enabled',
    successMessage: t('admin.users.enabled', { name }),
  })
}

export function disableCommand(user: AdminUser): UserCommand {
  const name = user.fullName
  return enabledCommand(user, false, {
    title: t('admin.users.disableTitle', { name }),
    confirmLabel: t('admin.users.disable'),
    explain: t('admin.users.disableExplain'),
    logKey: 'admin.actions.disabled',
    successMessage: t('admin.users.disabled', { name }),
  })
}
