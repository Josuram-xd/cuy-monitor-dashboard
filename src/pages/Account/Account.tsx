import { useState, type FormEvent } from 'react'
import { errorMessageKey } from '../../api/errorMessages'
import { useAuth } from '../../auth/useAuth'
import { Button } from '../../components/Button/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { FormError } from '../../components/FormError/FormError'
import { PasswordField } from '../../components/PasswordField/PasswordField'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { TextField } from '../../components/TextField/TextField'
import {
  useChangePasswordMutation,
  useDeactivateAccountMutation,
  useUpdateProfileMutation,
} from '../../hooks/useAccountMutations'
import { useProfile } from '../../hooks/useProfile'
import { t } from '../../i18n'
import { initials } from '../../utils/initials'
import styles from './Account.module.css'

const MAX_NAME_LENGTH = 150
const MIN_PASSWORD_BYTES = 8
const MAX_PASSWORD_BYTES = 72

function passwordIsValid(password: string): boolean {
  const bytes = new TextEncoder().encode(password).length
  return bytes >= MIN_PASSWORD_BYTES && bytes <= MAX_PASSWORD_BYTES
}

function ProfileCard({ fullName, username }: { fullName: string; username: string }) {
  const update = useUpdateProfileMutation()
  const [name, setName] = useState(fullName)
  const [saved, setSaved] = useState(false)
  const trimmed = name.trim()
  const unchanged = trimmed === fullName
  const nameError = !trimmed
    ? t('account.profile.nameRequired')
    : trimmed.length > MAX_NAME_LENGTH
      ? t('account.profile.nameTooLong')
      : undefined

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (nameError || unchanged) {
      return
    }
    setSaved(false)
    update.mutate({ fullName: trimmed }, { onSuccess: () => setSaved(true) })
  }

  return (
    <section className={styles.card} aria-labelledby="profile-heading">
      <h2 id="profile-heading" className={styles.cardTitle}>
        {t('account.profile.title')}
      </h2>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label={t('account.profile.fullName')}
          name="fullName"
          autoComplete="name"
          value={name}
          error={unchanged ? undefined : nameError}
          onChange={(e) => {
            setName(e.target.value)
            setSaved(false)
          }}
        />
        <TextField
          label={t('account.profile.username')}
          name="username"
          value={username}
          readOnly
          hint={t('account.profile.usernameHint')}
        />
        {update.isError && <FormError message={t(errorMessageKey(update.error))} />}
        {saved && (
          <p className={styles.success} role="status">
            {t('account.profile.saved')}
          </p>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={update.isPending || unchanged || nameError !== undefined}
        >
          {update.isPending ? t('account.profile.saving') : t('account.profile.save')}
        </Button>
      </form>
    </section>
  )
}

function PasswordCard() {
  const change = useChangePasswordMutation()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [touched, setTouched] = useState(false)
  const [done, setDone] = useState(false)
  const newPasswordError =
    touched && !passwordIsValid(next) ? t('auth.error.weakPassword') : undefined

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (!current || !passwordIsValid(next)) {
      return
    }
    setDone(false)
    change.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setCurrent('')
          setNext('')
          setTouched(false)
          setDone(true)
        },
      },
    )
  }

  return (
    <section className={styles.card} aria-labelledby="password-heading">
      <h2 id="password-heading" className={styles.cardTitle}>
        {t('account.password.title')}
      </h2>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <PasswordField
          label={t('account.password.current')}
          name="currentPassword"
          autoComplete="current-password"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value)
            setDone(false)
          }}
        />
        <PasswordField
          label={t('account.password.new')}
          name="newPassword"
          autoComplete="new-password"
          hint={t('account.password.hint')}
          error={newPasswordError}
          value={next}
          onChange={(e) => {
            setNext(e.target.value)
            setDone(false)
          }}
          onBlur={() => setTouched(true)}
        />
        {change.isError && <FormError message={t(errorMessageKey(change.error, 'account'))} />}
        {done && (
          <p className={styles.success} role="status">
            {t('account.password.done')}
          </p>
        )}
        <Button type="submit" variant="primary" disabled={change.isPending}>
          {change.isPending ? t('account.password.submitting') : t('account.password.submit')}
        </Button>
      </form>
    </section>
  )
}

function DangerCard() {
  const { logout } = useAuth()
  const deactivate = useDeactivateAccountMutation()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')

  function close() {
    setOpen(false)
    setPassword('')
    deactivate.reset()
  }

  function confirm() {
    if (!password) {
      return
    }
    deactivate.mutate(
      { currentPassword: password },
      // the account is off: the session is over, and /login says why
      { onSuccess: () => logout('disabled') },
    )
  }

  return (
    <section className={styles.dangerCard} aria-labelledby="danger-heading">
      <h2 id="danger-heading" className={styles.cardTitle}>
        {t('account.danger.title')}
      </h2>
      <p className={styles.text}>{t('account.danger.text')}</p>
      <Button variant="danger" onClick={() => setOpen(true)}>
        {t('account.danger.open')}
      </Button>
      {open && (
        <ConfirmDialog
          title={t('account.danger.confirmTitle')}
          confirmLabel={t('account.danger.confirm')}
          onConfirm={confirm}
          onCancel={close}
          busy={deactivate.isPending}
          danger
        >
          <p>{t('account.danger.confirmText')}</p>
          <PasswordField
            label={t('account.danger.password')}
            name="deactivatePassword"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {deactivate.isError && (
            <FormError message={t(errorMessageKey(deactivate.error, 'account'))} />
          )}
        </ConfirmDialog>
      )}
    </section>
  )
}

export function Account() {
  const profile = useProfile()
  const { logout } = useAuth()

  if (profile.isPending) {
    return <Skeleton count={2} />
  }
  if (profile.isError) {
    return <ErrorState message={t('errors.generic')} onRetry={() => void profile.refetch()} />
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.avatar} aria-hidden="true">
          {initials(profile.data.fullName)}
        </span>
        <div className={styles.who}>
          <h1 className={styles.name}>{profile.data.fullName}</h1>
          <p className={styles.username}>@{profile.data.username}</p>
        </div>
        <Button onClick={() => logout('logout')}>{t('account.logout')}</Button>
      </header>
      <div className={styles.grid}>
        <ProfileCard fullName={profile.data.fullName} username={profile.data.username} />
        <PasswordCard />
        <DangerCard />
      </div>
    </div>
  )
}
