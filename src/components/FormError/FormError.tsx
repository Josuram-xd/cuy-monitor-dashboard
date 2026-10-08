import { Icon } from '../Icon/Icon'
import styles from './FormError.module.css'

// error of the whole form (wrong password, no connection), announced to screen readers
export function FormError({ message }: { message: string }) {
  return (
    <p className={styles.error} role="alert">
      <Icon name="alert-circle" size={18} />
      {message}
    </p>
  )
}
