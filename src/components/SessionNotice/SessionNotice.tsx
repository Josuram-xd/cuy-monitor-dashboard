import { useEffect, useRef } from 'react'
import type { LogoutReason } from '../../auth/AuthContext'
import { t } from '../../i18n'
import { Icon } from '../Icon/Icon'
import styles from './SessionNotice.module.css'

interface SessionNoticeProps {
  reason: LogoutReason | null
}

// Neutral banner on /login after a logout or an expired session. It takes the focus,
// so screen readers announce why the user is back here.
export function SessionNotice({ reason }: SessionNoticeProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [reason])

  if (!reason) {
    return null
  }
  return (
    <div ref={ref} className={styles.notice} role="status" tabIndex={-1}>
      <Icon name="info" size={20} className={styles.icon} />
      <p>{t(`auth.notice.${reason}`)}</p>
    </div>
  )
}
