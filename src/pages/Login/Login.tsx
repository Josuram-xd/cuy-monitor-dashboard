import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { errorMessageKey } from '../../api/errorMessages'
import { LOGIN_PASSWORD_MAX_LENGTH, USERNAME_MAX_LENGTH } from '../../auth/fieldLimits'
import { safeNextPath } from '../../auth/nextPath'
import { pendingVerification } from '../../auth/pendingVerification'
import { useAuth } from '../../auth/useAuth'
import { AuthLayout } from '../../components/AuthLayout/AuthLayout'
import { Button } from '../../components/Button/Button'
import { FormError } from '../../components/FormError/FormError'
import { GoogleSignIn } from '../../components/GoogleButton/GoogleSignIn'
import { PasswordField } from '../../components/PasswordField/PasswordField'
import { SessionNotice } from '../../components/SessionNotice/SessionNotice'
import { TextField } from '../../components/TextField/TextField'
import { useLoginMutation } from '../../hooks/useAuthMutations'
import { t } from '../../i18n'
import styles from '../authForm.module.css'

export function Login() {
  const { lastLogoutReason } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = safeNextPath(searchParams.get('next'))
  const nextQuery = next === '/' ? '' : `?next=${encodeURIComponent(next)}`
  const login = useLoginMutation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  // errors show after leaving a field or trying to submit, not while typing the first letters
  const [touched, setTouched] = useState({ username: false, password: false })
  const [submitted, setSubmitted] = useState(false)

  const trimmedUsername = username.trim()
  const usernameError = !trimmedUsername
    ? t('auth.fields.required')
    : trimmedUsername.length > USERNAME_MAX_LENGTH
      ? t('auth.fields.tooLong')
      : undefined
  const passwordError = !password
    ? t('auth.fields.required')
    : password.length > LOGIN_PASSWORD_MAX_LENGTH
      ? t('auth.fields.tooLong')
      : undefined

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (usernameError || passwordError) {
      return
    }
    const credentials = { username: trimmedUsername, password }
    login.mutate(credentials, {
      onSuccess: (challenge) => {
        pendingVerification.start({ challenge, credentials })
        navigate(`/verify${nextQuery}`)
      },
    })
  }

  return (
    <AuthLayout
      title={t('auth.login.title')}
      notice={<SessionNotice reason={lastLogoutReason} />}
      footer={
        <p className={styles.row}>
          {t('auth.login.noAccount')}
          <Link to={`/register${nextQuery}`} className={styles.link}>
            {t('auth.login.toRegister')}
          </Link>
        </p>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label={t('auth.fields.username')}
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          maxLength={USERNAME_MAX_LENGTH}
          value={username}
          error={submitted || touched.username ? usernameError : undefined}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={() => setTouched((current) => ({ ...current, username: true }))}
        />
        <PasswordField
          label={t('auth.fields.password')}
          name="password"
          autoComplete="current-password"
          maxLength={LOGIN_PASSWORD_MAX_LENGTH}
          value={password}
          error={submitted || touched.password ? passwordError : undefined}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((current) => ({ ...current, password: true }))}
        />
        {login.isError && <FormError message={t(errorMessageKey(login.error, 'login'))} />}
        <Button type="submit" variant="primary" fullWidth disabled={login.isPending}>
          {login.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
      </form>
      <GoogleSignIn text="signin_with" />
    </AuthLayout>
  )
}
