import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { errorMessageKey } from '../../api/errorMessages'
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

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const credentials = { username: username.trim(), password }
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
      <form className={styles.form} onSubmit={handleSubmit}>
        <TextField
          label={t('auth.fields.username')}
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <PasswordField
          label={t('auth.fields.password')}
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
