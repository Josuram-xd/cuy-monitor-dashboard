import type { ReactNode } from 'react'
import { Icon, type IconName } from '../Icon/Icon'
import { Mascot, type MascotMood } from '../Mascot/Mascot'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  message: string
  icon?: IconName
  // shows the mascot with this face instead of the icon
  mascot?: MascotMood
  action?: ReactNode
}

export function EmptyState({ message, icon = 'inbox', mascot, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      {mascot ? (
        <Mascot mood={mascot} size={170} />
      ) : (
        <span className={styles.iconWrap}>
          <Icon name={icon} size={30} />
        </span>
      )}
      <p className={styles.message}>{message}</p>
      {action}
    </div>
  )
}
