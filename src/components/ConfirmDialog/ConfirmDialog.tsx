import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react'
import { t } from '../../i18n'
import { Button } from '../Button/Button'
import styles from './ConfirmDialog.module.css'

interface ConfirmDialogProps {
  title: string
  // what is about to happen, and the field that confirms it (e.g. the password)
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
  // destructive action: the confirm button is red
  danger?: boolean
}

// A modal for actions that cannot be undone. Escape or a click outside cancel it; Enter confirms.
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
  danger = false,
}: ConfirmDialogProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    // first field if there is one, otherwise the panel itself
    const firstField = panelRef.current?.querySelector<HTMLElement>('input, button')
    ;(firstField ?? panelRef.current)?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [onCancel])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!busy) {
      onConfirm()
    }
  }

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <form
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <div className={styles.body}>{children}</div>
        <div className={styles.actions}>
          <Button onClick={onCancel} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant={danger ? 'danger' : 'primary'} disabled={busy}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </div>
  )
}
