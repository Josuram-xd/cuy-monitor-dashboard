import { useId, type TextareaHTMLAttributes } from 'react'
import { cx } from '../../utils/cx'
import { Icon } from '../Icon/Icon'
import styles from './TextAreaField.module.css'

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value'> {
  label: string
  value: string
  maxLength: number
  hint?: string
  error?: string
}

// Free text with a counter that turns red when it is over the limit.
export function TextAreaField({
  label,
  value,
  maxLength,
  hint,
  error,
  id,
  ...rest
}: TextAreaFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const messageId = `${fieldId}-message`
  const message = error ?? hint
  const over = value.length > maxLength

  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      <textarea
        id={fieldId}
        className={cx(styles.input, (error || over) && styles.invalid)}
        value={value}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...rest}
      />
      <div className={styles.footer}>
        {message ? (
          <p id={messageId} className={cx(styles.message, error && styles.errorMessage)}>
            {error && <Icon name="alert-circle" size={16} />}
            {message}
          </p>
        ) : (
          <span />
        )}
        <span className={cx(styles.counter, over && styles.errorMessage)} aria-hidden="true">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  )
}
