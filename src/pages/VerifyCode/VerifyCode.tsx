import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { errorMessageKey } from '../../api/errorMessages'
import { pendingVerification } from '../../auth/pendingVerification'
import { useAuth } from '../../auth/useAuth'
import { AuthLayout } from '../../components/AuthLayout/AuthLayout'
import { Button } from '../../components/Button/Button'
import { FormError } from '../../components/FormError/FormError'
import { OtpInput } from '../../components/OtpInput/OtpInput'
import { useLoginMutation, useVerifyOtpMutation } from '../../hooks/useAuthMutations'
import { useNow } from '../../hooks/useNow'
import { t } from '../../i18n'
import { maskEmail } from '../../utils/maskEmail'
import styles from '../authForm.module.css'

const RESEND_AFTER_MS = 30_000
const SECOND = 1_000

function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / SECOND)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function VerifyCode() {
  const { signIn } = useAuth()
  const [searchParams] = useSearchParams()
  // read once: after a reload it is gone and we go back to /login
  const [pending] = useState(() => pendingVerification.current())
  const [challenge, setChallenge] = useState(pending?.challenge)
  const [code, setCode] = useState('')
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [infoKey, setInfoKey] = useState<string | null>(null)
  const [resendAt, setResendAt] = useState(() => Date.now() + RESEND_AFTER_MS)
  const now = useNow(SECOND)
  const verify = useVerifyOtpMutation()
  const resend = useLoginMutation()

  if (!pending || !challenge) {
    const next = searchParams.get('next')
    return <Navigate to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} replace />
  }

  const remainingMs = Math.max(0, Date.parse(challenge.expiresAt) - now)
  const expired = remainingMs === 0
  const resendWaitMs = Math.max(0, resendAt - now)

  function handleComplete(value: string) {
    if (!challenge) {
      return
    }
    setInfoKey(null)
    verify.mutate(
      { challengeId: challenge.challengeId, code: value },
      {
        onSuccess: (token) => {
          pendingVerification.clear()
          // with a session, PublicOnlyRoute sends the user to ?next or "/"
          signIn(token)
        },
        onError: (error) => {
          setCode('')
          setErrorKey(errorMessageKey(error, 'verify'))
        },
      },
    )
  }

  function handleResend() {
    if (!pending) {
      return
    }
    const wasExpired = expired
    resend.mutate(pending.credentials, {
      onSuccess: (fresh) => {
        pendingVerification.replaceChallenge(fresh)
        setChallenge(fresh)
        setCode('')
        setErrorKey(null)
        setInfoKey(wasExpired ? 'auth.error.expiredCode' : 'auth.verify.resent')
        setResendAt(Date.now() + RESEND_AFTER_MS)
      },
      onError: (error) => setErrorKey(errorMessageKey(error)),
    })
  }

  return (
    <AuthLayout
      title={t('auth.verify.title')}
      footer={
        <Link to="/login" className={styles.link} onClick={() => pendingVerification.clear()}>
          {t('auth.verify.otherAccount')}
        </Link>
      }
    >
      <div className={styles.form}>
        <p className={styles.text}>
          {pending.email
            ? t('auth.verify.sentTo', { email: maskEmail(pending.email) })
            : t('auth.verify.sentToYourEmail')}
        </p>
        <OtpInput
          value={code}
          onChange={(value) => {
            setCode(value)
            setErrorKey(null)
          }}
          onComplete={handleComplete}
          error={errorKey ? t(errorKey) : undefined}
          disabled={verify.isPending || expired}
          autoFocus
        />
        {infoKey && (
          <p className={styles.info} role="status">
            {t(infoKey)}
          </p>
        )}
        {resend.isError && !errorKey && <FormError message={t(errorMessageKey(resend.error))} />}
        {expired ? (
          <>
            <p className={styles.info}>{t('auth.verify.expired')}</p>
            <Button variant="primary" fullWidth onClick={handleResend} disabled={resend.isPending}>
              {t('auth.verify.sendNew')}
            </Button>
          </>
        ) : (
          <p className={styles.row}>
            <span>{t('auth.verify.expiresIn', { time: formatCountdown(remainingMs) })}</span>
            <span aria-hidden="true">·</span>
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={resendWaitMs > 0 || resend.isPending}
            >
              {resendWaitMs > 0
                ? t('auth.verify.resendIn', { seconds: Math.ceil(resendWaitMs / SECOND) })
                : t('auth.verify.resend')}
            </Button>
          </p>
        )}
      </div>
    </AuthLayout>
  )
}
