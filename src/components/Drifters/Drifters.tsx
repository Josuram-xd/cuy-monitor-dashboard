import styles from './Drifters.module.css'

// Soft translucent clouds that drift slowly behind a green section. Pure decoration.
export function Drifters() {
  return (
    <div className={styles.field} aria-hidden="true">
      <span className={styles.cloud} />
      <span className={styles.cloud} />
      <span className={styles.cloud} />
      <span className={styles.cloud} />
    </div>
  )
}
