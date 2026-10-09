import { useEffect, useRef, useState } from 'react'
import { loadGoogleIdentity } from '../../auth/googleIdentity'
import { config } from '../../config'
import { MOCK_GOOGLE_TOKEN } from '../../mocks/googleToken'
import { t } from '../../i18n'
import { Button } from '../Button/Button'
import styles from './GoogleButton.module.css'

interface GoogleButtonProps {
  // the signed ID token: send it to POST /api/v1/auth/google
  onCredential: (idToken: string) => void
  // "signin_with" on /login, "signup_with" on /register
  text?: 'signin_with' | 'signup_with'
  disabled?: boolean
}

const MAX_WIDTH = 400

// "Continuar con Google". With a client id it is Google's own button (the only way Google allows
// it); with mocks, a plain demo button; with neither, nothing is shown.
export function GoogleButton({ onCredential, text = 'signin_with', disabled }: GoogleButtonProps) {
  if (config.useMocks) {
    return (
      <div className={styles.wrap}>
        <Divider />
        <Button
          type="button"
          variant="secondary"
          fullWidth
          disabled={disabled}
          onClick={() => onCredential(MOCK_GOOGLE_TOKEN)}
        >
          <GoogleMark />
          {t('auth.google.demo')}
        </Button>
      </div>
    )
  }
  if (!config.googleClientId) {
    return null
  }
  return (
    <div className={styles.wrap}>
      <Divider />
      <RealButton
        clientId={config.googleClientId}
        onCredential={onCredential}
        text={text}
        disabled={disabled}
      />
    </div>
  )
}

function Divider() {
  return (
    <div className={styles.divider} role="separator">
      <span>{t('auth.google.or')}</span>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  )
}

interface RealButtonProps extends GoogleButtonProps {
  clientId: string
}

function RealButton({ clientId, onCredential, text, disabled }: RealButtonProps) {
  const holder = useRef<HTMLDivElement>(null)
  // GIS keeps the callback it was given at initialize: always call the latest one
  const latest = useRef(onCredential)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    latest.current = onCredential
  }, [onCredential])

  useEffect(() => {
    let cancelled = false
    loadGoogleIdentity()
      .then((google) => {
        const parent = holder.current
        if (cancelled || !parent) {
          return
        }
        google.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          callback: (response) => {
            if (response.credential) {
              latest.current(response.credential)
            }
          },
        })
        google.renderButton(parent, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          width: Math.min(parent.clientWidth || MAX_WIDTH, MAX_WIDTH),
          locale: 'es',
        })
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
    }
  }, [clientId, text])

  if (failed) {
    return <p className={styles.unavailable}>{t('auth.google.unavailable')}</p>
  }
  // a mask over Google's iframe while a request is running: it cannot be disabled from outside
  return (
    <div className={styles.holder} aria-busy={disabled}>
      <div ref={holder} className={styles.button} />
      {disabled && <span className={styles.mask} />}
    </div>
  )
}
