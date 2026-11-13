import { useState, type FormEvent } from 'react'
import { errorMessageKey } from '../../api/errorMessages'
import { FULL_NAME_MAX_LENGTH } from '../../auth/fieldLimits'
import { PASSWORD_MAX_LENGTH, passwordProblems } from '../../auth/passwordRules'
import { useAuth } from '../../auth/useAuth'
import { Button } from '../../components/Button/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog'
import { ErrorState } from '../../components/ErrorState/ErrorState'
import { FormError } from '../../components/FormError/FormError'
import { PasswordChecklist } from '../../components/PasswordChecklist/PasswordChecklist'
import { PhotoField } from '../../components/PhotoField/PhotoField'
import { ProfilePhoto } from '../../components/ProfilePhoto/ProfilePhoto'
import { PasswordField } from '../../components/PasswordField/PasswordField'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { TextField } from '../../components/TextField/TextField'
import {
  useChangePasswordMutation,
  useDeactivateAccountMutation,
  useProfilePhotoMutation,
  useUpdateProfileMutation,
} from '../../hooks/useAccountMutations'
import { useProfile } from '../../hooks/useProfile'
import { t } from '../../i18n'
import { NICKNAME_MAX_LENGTH } from '../../types/Account'
import type { User } from '../../types/User'
import type { PreparedPhoto } from '../../utils/photo'
import styles from './Account.module.css'

// The photo has its own endpoint, so it saves the moment it is picked instead of waiting for the
// form: that also means a failed upload cannot take the name change down with it.
function PhotoCard({ user }: { user: User }) {
  const photo = useProfilePhotoMutation()
  const [picked, setPicked] = useState<PreparedPhoto | null>(null)
  const [done, setDone] = useState<'saved' | 'removed' | null>(null)

  function handleChange(next: PreparedPhoto | null) {
    setPicked(next)
    setDone(null)
    if (next) {
      photo.mutate(
        { photo: next.base64, photoContentType: next.contentType },
        { onSuccess: () => setDone('saved') },
      )
    }
  }

  function handleRemove() {
    setPicked(null)
    setDone(null)
    photo.mutate(null, { onSuccess: () => setDone('removed') })
  }

  return (
    <section className={styles.card} aria-labelledby="photo-heading">
      <h2 id="photo-heading" className={styles.cardTitle}>
        {t('account.profile.photo')}
      </h2>
      <PhotoField
        label={t('account.profile.photo')}
        hint={t('account.profile.photoHint')}
        value={picked}
        existingUrl={user.photoUrl}
        onChange={handleChange}
        onRemove={handleRemove}
        busy={photo.isPending}
      />
      {photo.isError && <FormError message={t('account.profile.photoFailed')} />}
      {done && (
        <p className={styles.success} role="status">
          {t(done === 'saved' ? 'account.profile.photoSaved' : 'account.profile.photoRemoved')}
        </p>
      )}
    </section>
  )
}

function ProfileCard({ user }: { user: User }) {
  const update = useUpdateProfileMutation()
  const [name, setName] = useState(user.fullName)
  const [nickname, setNickname] = useState(user.nickname ?? '')
  const [saved, setSaved] = useState(false)
  const trimmed = name.trim()
  const trimmedNickname = nickname.trim()
  const unchanged = trimmed === user.fullName && trimmedNickname === (user.nickname ?? '')
  const nameError = !trimmed
    ? t('account.profile.nameRequired')
    : trimmed.length > FULL_NAME_MAX_LENGTH
      ? t('account.profile.nameTooLong')
      : undefined
  const nicknameError =
    trimmedNickname.length > NICKNAME_MAX_LENGTH
      ? t('account.profile.nicknameTooLong')
      : undefined

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (nameError || nicknameError || unchanged) {
      return
    }
    setSaved(false)
    // empty clears it: the screens then fall back to the full name
    update.mutate(
      { fullName: trimmed, nickname: trimmedNickname || null },
      { onSuccess: () => setSaved(true) },
    )
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
          maxLength={FULL_NAME_MAX_LENGTH}
          value={name}
          error={unchanged ? undefined : nameError}
          onChange={(e) => {
            setName(e.target.value)
            setSaved(false)
          }}
        />
        <TextField
          label={t('account.profile.nickname')}
          name="nickname"
          autoComplete="nickname"
          maxLength={NICKNAME_MAX_LENGTH}
          value={nickname}
          error={nicknameError}
          hint={t('account.profile.nicknameHint')}
          onChange={(e) => {
            setNickname(e.target.value)
            setSaved(false)
          }}
        />
        <TextField
          label={t('account.profile.username')}
          name="username"
          value={user.username}
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
          disabled={
            update.isPending || unchanged || nameError !== undefined || nicknameError !== undefined
          }
        >
          {update.isPending ? t('account.profile.saving') : t('account.profile.save')}
        </Button>
      </form>
    </section>
  )
}

// hasPassword false = an account made with Google: it sets its first password without an old one
function PasswordCard({ username, hasPassword }: { username: string; hasPassword: boolean }) {
  const change = useChangePasswordMutation()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [touched, setTouched] = useState(false)
  const [done, setDone] = useState(false)
  const problems = passwordProblems(next, { username })
  const newPasswordError = touched && problems.length > 0 ? t('auth.error.weakPassword') : undefined

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if ((hasPassword && !current) || problems.length > 0) {
      return
    }
    setDone(false)
    change.mutate(
      { currentPassword: hasPassword ? current : undefined, newPassword: next },
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
        {hasPassword ? t('account.password.title') : t('account.password.createTitle')}
      </h2>
      {!hasPassword && <p className={styles.text}>{t('account.password.googleOnly')}</p>}
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {hasPassword && (
          <PasswordField
            label={t('account.password.current')}
            name="currentPassword"
            autoComplete="current-password"
            maxLength={PASSWORD_MAX_LENGTH}
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value)
              setDone(false)
            }}
          />
        )}
        <PasswordField
          label={t('account.password.new')}
          name="newPassword"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          error={newPasswordError}
          value={next}
          onChange={(e) => {
            setNext(e.target.value)
            setDone(false)
          }}
          onBlur={() => setTouched(true)}
        />
        <PasswordChecklist password={next} username={username} />
        {change.isError && <FormError message={t(errorMessageKey(change.error, 'account'))} />}
        {done && (
          <p className={styles.success} role="status">
            {t('account.password.done')}
          </p>
        )}
        <Button type="submit" variant="primary" disabled={change.isPending}>
          {change.isPending
            ? t('account.password.submitting')
            : hasPassword
              ? t('account.password.submit')
              : t('account.password.createSubmit')}
        </Button>
      </form>
    </section>
  )
}

function DangerCard({ hasPassword }: { hasPassword: boolean }) {
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
    if (hasPassword && !password) {
      return
    }
    deactivate.mutate(
      { currentPassword: hasPassword ? password : undefined },
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
          <p>
            {hasPassword ? t('account.danger.confirmText') : t('account.danger.confirmTextGoogle')}
          </p>
          {hasPassword && (
            <PasswordField
              label={t('account.danger.password')}
              name="deactivatePassword"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
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
        <span className={styles.avatar}>
          <ProfilePhoto user={profile.data} className={styles.avatarPhoto} />
        </span>
        <div className={styles.who}>
          <h1 className={styles.name}>{profile.data.displayName}</h1>
          <p className={styles.username}>@{profile.data.username}</p>
        </div>
        <Button onClick={() => logout('logout')}>{t('account.logout')}</Button>
      </header>
      <div className={styles.grid}>
        <ProfileCard user={profile.data} />
        <PhotoCard user={profile.data} />
        <PasswordCard username={profile.data.username} hasPassword={profile.data.hasPassword} />
        <DangerCard hasPassword={profile.data.hasPassword} />
      </div>
    </div>
  )
}
