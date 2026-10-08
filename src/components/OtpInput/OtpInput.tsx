import { useId, useState, type ChangeEvent } from 'react'
import { t } from '../../i18n'
import { cx } from '../../utils/cx'
import { Icon } from '../Icon/Icon'
import styles from './OtpInput.module.css'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  // fires once when the last digit is typed or the whole code is pasted
  onComplete?: (code: string) => void
  length?: number
  error?: string
  disabled?: boolean
  autoFocus?: boolean
}

// One real input (screen readers and phone autofill see a single field) drawn as boxes.
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  error,
  disabled = false,
  autoFocus = false,
}: OtpInputProps) {
  const [focused, setFocused] = useState(false)
  const errorId = `${useId()}-error`
  const activeIndex = Math.min(value.length, length - 1)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, '').slice(0, length)
    onChange(digits)
    if (digits.length === length && digits !== value) {
      onComplete?.(digits)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.field}>
        <div className={styles.boxes} aria-hidden="true">
          {Array.from({ length }, (_, i) => (
            <span
              key={i}
              className={cx(
                styles.box,
                focused && i === activeIndex && styles.active,
                error && styles.invalid,
              )}
            >
              {value[i] ?? ''}
            </span>
          ))}
        </div>
        <input
          className={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={length}
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-label={t('auth.verify.codeLabel', { length })}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
      </div>
      {error && (
        <p id={errorId} className={styles.error} aria-live="polite">
          <Icon name="alert-circle" size={16} />
          {error}
        </p>
      )}
    </div>
  )
}
