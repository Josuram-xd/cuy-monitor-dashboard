import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { t } from '../../i18n'
import { cx } from '../../utils/cx'
import { Icon } from '../Icon/Icon'
import { ToastContext, type ToastInput, type ToastTone } from './ToastContext'
import styles from './Toast.module.css'

const VISIBLE_MS = 4000
const LEAVE_MS = 200
const MAX_TOASTS = 3

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
  leaving: boolean
}

// Stacks the toasts at the top on phones and bottom right on desktop. Each one leaves by itself after
// a few seconds or with its close button; hovering it keeps it on screen.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const remove = useCallback((id: number) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((all) => all.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)))
    setTimeout(() => setToasts((all) => all.filter((toast) => toast.id !== id)), LEAVE_MS)
  }, [])

  const schedule = useCallback(
    (id: number) =>
      timers.current.set(
        id,
        setTimeout(() => remove(id), VISIBLE_MS),
      ),
    [remove],
  )

  const show = useCallback(
    ({ message, tone = 'success' }: ToastInput) => {
      const id = nextId.current++
      setToasts((all) => [...all.slice(-(MAX_TOASTS - 1)), { id, message, tone, leaving: false }])
      schedule(id)
    },
    [schedule],
  )

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => clearTimeout(timer))
  }, [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cx(styles.toast, styles[toast.tone], toast.leaving && styles.leaving)}
            onMouseEnter={() => clearTimeout(timers.current.get(toast.id))}
            onMouseLeave={() => schedule(toast.id)}
          >
            <span className={styles.icon} aria-hidden="true">
              <Icon name={toast.tone === 'success' ? 'check-circle' : 'info'} size={20} />
            </span>
            <span className={styles.message}>{toast.message}</span>
            <button
              type="button"
              className={styles.close}
              onClick={() => remove(toast.id)}
              aria-label={t('common.close')}
            >
              <Icon name="x" size={16} />
            </button>
            {/* how long it will stay; it stops while hovered */}
            <span className={styles.timer} style={{ animationDuration: `${VISIBLE_MS}ms` }} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
