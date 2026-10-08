import { t } from '../../i18n'
import type { DisplayStatus } from '../../types/HealthStatus'
import { Icon, type IconName } from '../Icon/Icon'
import styles from './StatusBadge.module.css'
import { cx } from '../../utils/cx'

const ICONS: Record<DisplayStatus, IconName> = {
  NORMAL: 'check-circle',
  OBSERVED: 'eye',
  ALERT: 'alert-triangle',
  CRITICAL: 'alert-octagon',
  UNKNOWN: 'help-circle',
}

const ICON_SIZES = { sm: 14, md: 16, lg: 20 }

interface StatusBadgeProps {
  status: DisplayStatus
  size?: 'sm' | 'md' | 'lg'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span className={cx(styles.badge, styles[size], styles[status])} data-status={status}>
      <Icon name={ICONS[status]} size={ICON_SIZES[size]} />
      {t(`status.${status}`)}
    </span>
  )
}
