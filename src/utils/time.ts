import { t } from '../i18n'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const absoluteFormat = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function minutesSince(iso: string, now: number = Date.now()): number {
  return Math.floor((now - Date.parse(iso)) / MINUTE)
}

// "hace 2 min", "hace 1 h", then an absolute date after 24 h
export function formatRelative(iso: string, now: number = Date.now()): string {
  const elapsed = now - Date.parse(iso)
  if (elapsed < MINUTE) {
    return t('time.justNow')
  }
  if (elapsed < HOUR) {
    return t('time.minutesAgo', { count: Math.floor(elapsed / MINUTE) })
  }
  if (elapsed < DAY) {
    return t('time.hoursAgo', { count: Math.floor(elapsed / HOUR) })
  }
  return absoluteFormat.format(new Date(iso))
}
