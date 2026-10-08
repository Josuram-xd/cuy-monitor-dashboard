import type { DisplayStatus } from '../../types/HealthStatus'
import type { IconName } from '../Icon/Icon'

// same icon for a status everywhere it shows up (badge, banner)
export const STATUS_ICONS: Record<DisplayStatus, IconName> = {
  NORMAL: 'check-circle',
  OBSERVED: 'eye',
  ALERT: 'alert-triangle',
  CRITICAL: 'alert-octagon',
  UNKNOWN: 'help-circle',
}
