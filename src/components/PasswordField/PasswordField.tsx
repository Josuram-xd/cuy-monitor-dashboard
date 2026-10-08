import { useState } from 'react'
import { t } from '../../i18n'
import { Icon } from '../Icon/Icon'
import { TextField, type TextFieldProps } from '../TextField/TextField'
import styles from './PasswordField.module.css'

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'endAdornment'>

// never shows the password by default; autoComplete comes from the page (current- / new-password)
export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          className={styles.toggle}
          aria-label={t('auth.password.show')}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={20} />
        </button>
      }
    />
  )
}
