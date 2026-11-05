import { dateLocale } from '../i18n'
import type { RangePreset } from './timeRange'

// the axis of today reads hours; a week, day and hour; a month, days
const TICK_FORMAT: Record<RangePreset, Intl.DateTimeFormatOptions> = {
  today: { hour: '2-digit', minute: '2-digit' },
  week: { weekday: 'short', hour: '2-digit' },
  month: { day: 'numeric', month: 'short' },
}

export function formatTick(time: number, preset: RangePreset): string {
  return new Intl.DateTimeFormat(dateLocale(), TICK_FORMAT[preset]).format(time)
}

export function formatMoment(time: number): string {
  return new Intl.DateTimeFormat(dateLocale(), {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(time)
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(dateLocale(), { maximumFractionDigits: fractionDigits }).format(
    value,
  )
}
