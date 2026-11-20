import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { usePreferences } from '../../preferences/usePreferences'
import { t } from '../../i18n'
import { ProfilePhoto } from '../ProfilePhoto/ProfilePhoto'
import { Button } from '../Button/Button'
import { Icon } from '../Icon/Icon'
import styles from './UserMenu.module.css'

export function UserMenu() {
  const { logout } = useAuth()
  const me = useProfile()
  const { language, setLanguage } = usePreferences()
  const other = language === 'es' ? 'en' : 'es'
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLButtonElement>(null)
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
        avatarRef.current?.focus()
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
        ref={avatarRef}
        className={styles.avatar}
        aria-label={t('account.menu')}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <ProfilePhoto user={me.data} className={styles.photo} />
      </button>
      {open && (
        <div id={panelId} className={styles.panel}>
          {me.data && (
            <div className={styles.who}>
              <p className={styles.name}>{me.data.displayName}</p>
              <p className={styles.username}>@{me.data.username}</p>
            </div>
          )}
          <Link to="/account" className={styles.item} onClick={() => setOpen(false)}>
            {t('account.myAccount')}
          </Link>
          <Link to="/settings" className={styles.item} onClick={() => setOpen(false)}>
            {t('account.settings')}
          </Link>
          {/* only shown to an admin; the backend checks the role again on every call behind it */}
          {me.data?.role === 'ADMIN' && (
            <Link to="/admin" className={styles.item} onClick={() => setOpen(false)}>
              {t('account.admin')}
            </Link>
          )}
          {/* one click to the other language, named in that language (like a campus menu); the same choice
              as Ajustes → Preferencias, kept on this device */}
          <button
            type="button"
            className={styles.item}
            lang={other}
            aria-label={t('account.switchLanguageLabel')}
            onClick={() => setLanguage(other)}
          >
            <Icon name="globe" size={18} />
            {t('account.switchLanguage')}
          </button>
          {/* no confirmation: logging out is harmless and quick to undo */}
          <Button fullWidth onClick={() => logout('logout')}>
            {t('account.logout')}
          </Button>
        </div>
      )}
    </div>
  )
}
