import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { errorMessageKey } from '../../api/errorMessages'
import { EMAIL_MAX_LENGTH, FULL_NAME_MAX_LENGTH, USERNAME_MAX_LENGTH } from '../../auth/fieldLimits'
import { safeNextPath } from '../../auth/nextPath'
import { PASSWORD_MAX_LENGTH, passwordProblems } from '../../auth/passwordRules'
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
const MAX_LENGTHS: Record<Field, number> = {
  username: USERNAME_MAX_LENGTH,
  fullName: FULL_NAME_MAX_LENGTH,
  email: EMAIL_MAX_LENGTH,
  password: PASSWORD_MAX_LENGTH,
}

function validate(form: RegisterForm): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {}
  for (const field of ['username', 'fullName', 'email'] as const) {
    const value = form[field].trim()
    if (!value) {
      errors[field] = t('auth.fields.required')
    } else if (value.length > MAX_LENGTHS[field]) {
      // the input stops at maxLength, but a paste on an old browser can still get through
      errors[field] = t('auth.fields.tooLong')
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
          maxLength={USERNAME_MAX_LENGTH}
          {...fieldProps('username')}
        />
        <TextField
          label={t('auth.fields.fullName')}
          autoComplete="name"
          maxLength={FULL_NAME_MAX_LENGTH}
          {...fieldProps('fullName')}
        />
        <TextField
          label={t('auth.fields.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={EMAIL_MAX_LENGTH}
          {...fieldProps('email')}
        />
        <PasswordField
          label={t('auth.fields.password')}
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
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
