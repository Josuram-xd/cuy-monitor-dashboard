import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { useMe } from '../../hooks/useMe'
import { t } from '../../i18n'
import { initials } from '../../utils/initials'
import { Button } from '../Button/Button'
import styles from './UserMenu.module.css'

export function UserMenu() {
  const { logout } = useAuth()
  const me = useMe()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  // close with Escape or a click outside
  useEffect(() => {
    if (!open) {
      return
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.avatar}
        aria-label={t('account.menu')}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">{initials(me.data?.fullName)}</span>
      </button>
      {open && (
        <div id={panelId} className={styles.panel}>
          {me.data && (
            <div className={styles.who}>
              <p className={styles.name}>{me.data.fullName}</p>
              <p className={styles.email}>{me.data.email}</p>
            </div>
          )}
          <Link to="/account" className={styles.item} onClick={() => setOpen(false)}>
            {t('account.myAccount')}
          </Link>
          {/* no confirmation: logging out is harmless and quick to undo */}
          <Button fullWidth onClick={() => logout('logout')}>
            {t('account.logout')}
          </Button>
        </div>
      )}
    </div>
  )
}
