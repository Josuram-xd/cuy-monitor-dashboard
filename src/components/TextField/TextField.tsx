import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { Icon } from '../Icon/Icon'
import styles from './TextField.module.css'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  // visible rule before typing ("Entre 8 y 72 caracteres")
  hint?: string
  // replaces the hint once the field is wrong
  error?: string
  // e.g. the "show password" button
  endAdornment?: ReactNode
}

export function TextField({
  label,
  hint,
  error,
  endAdornment,
  id,
  className,
  ...rest
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`
  const message = error ?? hint

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={cx(styles.control, error && styles.invalid)}>
        <input
          id={inputId}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          {...rest}
        />
        {endAdornment}
      </div>
      {message && (
        <p
          id={messageId}
          className={cx(styles.message, error && styles.errorMessage)}
          aria-live={error ? 'polite' : undefined}
        >
          {error && <Icon name="alert-circle" size={16} />}
          {message}
        </p>
      )}
    </div>
  )
}
