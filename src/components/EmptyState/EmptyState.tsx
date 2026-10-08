import type { ReactNode } from 'react'
import { Icon, type IconName } from '../Icon/Icon'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  message: string
  icon?: IconName
  action?: ReactNode
}

export function EmptyState({ message, icon = 'inbox', action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <Icon name={icon} size={32} className={styles.icon} />
      <p className={styles.message}>{message}</p>
      {action}
    </div>
  )
}
