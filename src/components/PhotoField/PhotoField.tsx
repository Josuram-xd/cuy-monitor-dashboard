import { useId, useRef, useState, type ChangeEvent } from 'react'
import { t } from '../../i18n'
import { cx } from '../../utils/cx'
import { PhotoProblem, preparePhoto, type PreparedPhoto } from '../../utils/photo'
import { Icon } from '../Icon/Icon'
import styles from './PhotoField.module.css'

interface PhotoFieldProps {
  label: string
  hint?: string
  value: PreparedPhoto | null
  onChange: (photo: PreparedPhoto | null) => void
  // a picture already saved, shown until a new one is picked (the account's own photo)
  existingUrl?: string | null
  // shown only when there is something to remove; without it the field has no remove button
  onRemove?: () => void
  busy?: boolean
  // the form's own error ("Agrega una foto")
  error?: string
  // injectable for the tests (jsdom has no canvas)
  prepare?: (file: File) => Promise<PreparedPhoto>
}

// Takes the photo with the camera or picks one from the gallery, shrinks it and shows it.
export function PhotoField({
  label,
  hint,
  value,
  onChange,
  existingUrl,
  onRemove,
  busy: busyOutside,
  error,
  prepare = preparePhoto,
}: PhotoFieldProps) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const busy = working || Boolean(busyOutside)
  const preview = value?.dataUrl ?? existingUrl ?? null
  const message = problem ?? error
  const messageId = `${id}-message`

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    setWorking(true)
    setProblem(null)
    try {
      onChange(await prepare(file))
    } catch (failure) {
      const reason = failure instanceof PhotoProblem ? failure.reason : 'unreadable'
      setProblem(t(`guineaPig.register.photoProblem.${reason}`))
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {hint && !message && <p className={styles.hint}>{hint}</p>}
      <div className={cx(styles.drop, message && styles.invalid)}>
        {preview ? (
          <img
            className={styles.preview}
            src={preview}
            alt={t('guineaPig.register.photoPreview')}
          />
        ) : (
          <span className={styles.empty} aria-hidden="true">
            <Icon name="user" size={40} />
          </span>
        )}
        <input
          ref={input}
          id={id}
          className={styles.input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-describedby={message ? messageId : undefined}
          aria-invalid={message ? true : undefined}
          onChange={(event) => void handleChange(event)}
        />
        <button
          type="button"
          className={styles.button}
          onClick={() => input.current?.click()}
          disabled={busy}
          aria-hidden="true"
          tabIndex={-1}
        >
          {busy
            ? t('guineaPig.register.photoBusy')
            : preview
              ? t('guineaPig.register.photoChange')
              : t('guineaPig.register.photoPick')}
        </button>
      </div>
      {onRemove && preview && (
        <button type="button" className={styles.remove} onClick={onRemove} disabled={busy}>
          {t('guineaPig.register.photoRemove')}
        </button>
      )}
      {message && (
        <p id={messageId} className={styles.error} aria-live="polite">
          {message}
        </p>
      )}
    </div>
  )
}
