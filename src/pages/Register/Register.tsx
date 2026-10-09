import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { errorMessageKey } from '../../api/errorMessages'
import { safeNextPath } from '../../auth/nextPath'
import { passwordProblems } from '../../auth/passwordRules'
import { pendingVerification } from '../../auth/pendingVerification'
import { AuthLayout } from '../../components/AuthLayout/AuthLayout'
import { Button } from '../../components/Button/Button'
import { FormError } from '../../components/FormError/FormError'
import { GoogleSignIn } from '../../components/GoogleButton/GoogleSignIn'
import { PasswordChecklist } from '../../components/PasswordChecklist/PasswordChecklist'
import { PasswordField } from '../../components/PasswordField/PasswordField'
import { TextField } from '../../components/TextField/TextField'
import { useRegisterMutation } from '../../hooks/useAuthMutations'
import { t } from '../../i18n'
import styles from '../authForm.module.css'

interface RegisterForm {
  username: string
  fullName: string
  email: string
  password: string
}

type Field = keyof RegisterForm

const EMPTY_FORM: RegisterForm = { username: '', fullName: '', email: '', password: '' }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(form: RegisterForm): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {}
  for (const field of ['username', 'fullName', 'email'] as const) {
    if (!form[field].trim()) {
      errors[field] = t('auth.register.required')
    }
  }
  if (!errors.email && !EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = t('auth.register.invalidEmail')
  }
  // the checklist under the field says which rule is missing; this only stops the submit
  if (passwordProblems(form.password, { username: form.username, email: form.email }).length > 0) {
    errors.password = t('auth.error.weakPassword')
  }
  return errors
}

export function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = safeNextPath(searchParams.get('next'))
  const nextQuery = next === '/' ? '' : `?next=${encodeURIComponent(next)}`
  const register = useRegisterMutation()
  const [form, setForm] = useState<RegisterForm>(EMPTY_FORM)
  // errors show after leaving a field or trying to submit, not while typing the first letters
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const errors = validate(form)

  function errorFor(field: Field): string | undefined {
    return submitted || touched[field] ? errors[field] : undefined
  }

  function fieldProps(field: Field) {
    return {
      name: field,
      value: form[field],
      error: errorFor(field),
      onChange: (e: { target: { value: string } }) =>
        setForm((current) => ({ ...current, [field]: e.target.value })),
      onBlur: () => setTouched((current) => ({ ...current, [field]: true })),
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      return
    }
    const body = {
      username: form.username.trim(),
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    }
    register.mutate(body, {
      onSuccess: (challenge) => {
        pendingVerification.start({
          challenge,
          credentials: { username: body.username, password: body.password },
          email: body.email,
        })
        navigate(`/verify${nextQuery}`)
      },
    })
  }

  return (
    <AuthLayout
      title={t('auth.register.title')}
      footer={
        <p className={styles.row}>
          {t('auth.register.haveAccount')}
          <Link to={`/login${nextQuery}`} className={styles.link}>
            {t('auth.register.toLogin')}
          </Link>
        </p>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          label={t('auth.fields.username')}
          autoComplete="username"
          autoCapitalize="none"
          maxLength={50}
          {...fieldProps('username')}
        />
        <TextField
          label={t('auth.fields.fullName')}
          autoComplete="name"
          maxLength={150}
          {...fieldProps('fullName')}
        />
        <TextField
          label={t('auth.fields.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          {...fieldProps('email')}
        />
        <PasswordField
          label={t('auth.fields.password')}
          autoComplete="new-password"
          {...fieldProps('password')}
        />
        <PasswordChecklist password={form.password} username={form.username} email={form.email} />
        {register.isError && <FormError message={t(errorMessageKey(register.error, 'register'))} />}
        <Button type="submit" variant="primary" fullWidth disabled={register.isPending}>
          {register.isPending ? t('auth.register.submitting') : t('auth.register.submit')}
        </Button>
      </form>
      <GoogleSignIn text="signup_with" />
    </AuthLayout>
  )
}
