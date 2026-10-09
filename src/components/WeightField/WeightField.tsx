import { useId } from 'react'
import { t } from '../../i18n'
import { MAX_WEIGHT_GRAMS, MIN_WEIGHT_GRAMS } from '../../types/GuineaPigProfile'
import { Icon } from '../Icon/Icon'
import styles from './WeightField.module.css'

const STEP = 10
// where "+" starts when the field is empty: a typical adult
const START = 800

interface WeightFieldProps {
  label: string
  // what the person typed, as text: "" means nothing yet
  value: string
  onChange: (value: string) => void
  error?: string
}

// Weight in grams with - and + buttons, so it can be done with a thumb on a phone.
export function WeightField({ label, value, onChange, error }: WeightFieldProps) {
  const id = useId()
  const current = Number(value)
  const hasNumber = value.trim() !== '' && Number.isFinite(current)

  function nudge(delta: number) {
    const base = hasNumber ? current : START
    const next = Math.min(MAX_WEIGHT_GRAMS, Math.max(MIN_WEIGHT_GRAMS, Math.round(base) + delta))
    onChange(String(next))
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        <span className={styles.hint}>
          {t('guineaPig.register.weightHint', { min: MIN_WEIGHT_GRAMS, max: MAX_WEIGHT_GRAMS })}
        </span>
      </label>
      <div className={styles.control} data-invalid={error ? 'true' : undefined}>
        <button
          type="button"
          className={styles.step}
          aria-label={t('guineaPig.register.weightLess')}
          onClick={() => nudge(-STEP)}
        >
          <Icon name="minus" size={18} />
        </button>
        <input
          id={id}
          className={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        />
        <span className={styles.unit} aria-hidden="true">
          g
        </span>
        <button
          type="button"
          className={styles.step}
          aria-label={t('guineaPig.register.weightMore')}
          onClick={() => nudge(STEP)}
        >
          <Icon name="plus" size={18} />
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className={styles.error} aria-live="polite">
          <Icon name="alert-circle" size={16} />
          {error}
        </p>
      )}
    </div>
  )
}
