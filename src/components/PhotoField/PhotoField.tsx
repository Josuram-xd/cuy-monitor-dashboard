import { useId, useState, type ChangeEvent } from 'react'
import { t } from '../../i18n'
import { PHOTO_CONTENT_TYPES, shrinkToPhoto, type Photo } from '../../utils/photo'
import { cx } from '../../utils/cx'
import { Icon } from '../Icon/Icon'
import styles from './PhotoField.module.css'

interface PhotoFieldProps {
  label: string
  hint?: string
  value: Photo | null
  onChange: (photo: Photo | null) => void
  error?: string
}

// The photo is how the breeder recognizes a cuy, so it is the first field of the form. On a phone the
// file input opens the camera; whatever comes in is shrunk before it is kept (see utils/photo.ts).
export function PhotoField({ label, hint, value, onChange, error }: PhotoFieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const [failed, setFailed] = useState(false)
  const [working, setWorking] = useState(false)
  const message = failed ? t('guineaPig.register.photoInvalid') : (error ?? hint)

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // the same input is reused, so clear it or picking the same file twice does nothing
    event.target.value = ''
    if (!file) {
      return
    }
    setFailed(false)
    setWorking(true)
    try {
      onChange(await shrinkToPhoto(file))
    } catch {
      setFailed(true)
      onChange(null)
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={cx(styles.box, (error || failed) && styles.invalid)}>
        {value ? (
          <img
            className={styles.preview}
            src={value.dataUrl}
            alt={t('guineaPig.register.photoAlt')}
          />
        ) : (
          <span className={styles.placeholder} aria-hidden="true">
            <Icon name="camera" size={32} />
          </span>
        )}
        <div className={styles.actions}>
          {/* a plain file input: the label is the visible button, so it works with keyboard too */}
          <input
            id={id}
            type="file"
            className={styles.input}
            accept={PHOTO_CONTENT_TYPES.join(',')}
            capture="environment"
            aria-invalid={error || failed ? true : undefined}
            aria-describedby={message ? messageId : undefined}
            onChange={(event) => void handleFile(event)}
          />
          <label htmlFor={id} className={styles.pick}>
            {working
              ? t('guineaPig.register.photoWorking')
              : value
                ? t('guineaPig.register.photoChange')
                : t('guineaPig.register.photoPick')}
          </label>
          {value && !working && (
            <button type="button" className={styles.remove} onClick={() => onChange(null)}>
              {t('guineaPig.register.photoRemove')}
            </button>
          )}
        </div>
      </div>
      {message && (
        <p
          id={messageId}
          className={cx(styles.message, (error || failed) && styles.errorMessage)}
          role={error || failed ? 'alert' : undefined}
        >
          {(error || failed) && <Icon name="alert-circle" size={16} />}
          {message}
        </p>
      )}
    </div>
  )
}
