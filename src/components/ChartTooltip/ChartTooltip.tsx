import { formatMoment } from '../../charts/format'
import styles from './ChartTooltip.module.css'

export interface TooltipLine {
  label: string
  value: string
}

interface ChartTooltipProps {
  // what Recharts passes to a custom tooltip; only what we read
  active?: boolean
  label?: number | string
  lines: (time: number) => TooltipLine[] | undefined
}

// The card that follows the pointer (or the finger) on a chart: when, and the values at that moment
export function ChartTooltip({ active, label, lines }: ChartTooltipProps) {
  const time = Number(label)
  const shown = active && Number.isFinite(time) ? lines(time) : undefined
  if (!shown) {
    return null
  }
  return (
    <div className={styles.tooltip}>
      <p className={styles.when}>{formatMoment(time)}</p>
      <dl className={styles.lines}>
        {shown.map((line) => (
          <div key={line.label} className={styles.line}>
            <dt>{line.label}</dt>
            <dd>{line.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
