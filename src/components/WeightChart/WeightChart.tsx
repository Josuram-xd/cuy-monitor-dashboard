import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatMoment, formatNumber, formatTick } from '../../charts/format'
import { timeTicks, type RangePreset } from '../../charts/timeRange'
import { stableReadings, weightChange, weightDomain, weightTicks } from '../../charts/weightSeries'
import { prefersReducedMotion } from '../../motion/reducedMotion'
import { t } from '../../i18n'
import type { CageWeight } from '../../types/WeightReading'
import { ChartTooltip } from '../ChartTooltip/ChartTooltip'
import styles from './WeightChart.module.css'

interface WeightChartProps {
  weight: CageWeight
  from: string
  to: string
  preset: RangePreset
}

const AXIS_PROPS = { tickLine: false, axisLine: false, tickMargin: 6 } as const

function summaryOf(change: number | undefined): string {
  if (change === undefined) {
    return t('charts.weight.summary.tooFew')
  }
  if (Math.abs(change) < 10) {
    return t('charts.weight.summary.steady')
  }
  const grams = formatNumber(Math.abs(change))
  return change > 0
    ? t('charts.weight.summary.gained', { grams })
    : t('charts.weight.summary.lost', { grams })
}

// The weight of the whole cage over time. Only stable readings: one taken while the guinea pigs moved on
// the scale is noise. The axis starts near the lightest reading, so a change of a few grams shows.
export function WeightChart({ weight, from, to, preset }: WeightChartProps) {
  const points = useMemo(() => stableReadings(weight.readings), [weight.readings])
  const byTime = useMemo(() => new Map(points.map((p) => [p.time, p])), [points])

  if (points.length === 0) {
    return <p className={styles.empty}>{t('charts.weight.noData')}</p>
  }
  const latest = points[points.length - 1]

  return (
    <figure className={styles.figure} aria-label={t('charts.weight.title')}>
      <div className={styles.headline}>
        <p className={styles.hero}>
          <span className={styles.heroValue}>
            {t('charts.weight.grams', { grams: formatNumber(latest.grams) })}
          </span>
          <span className={styles.heroLabel}>
            {t('charts.weight.latest', { time: formatMoment(latest.time) })}
          </span>
        </p>
        <figcaption className={styles.summary}>{summaryOf(weightChange(points))}</figcaption>
      </div>
      <div className={styles.plot} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            accessibilityLayer={false}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={[Date.parse(from), Date.parse(to)]}
              ticks={timeTicks(Date.parse(from), Date.parse(to), preset)}
              tickFormatter={(time: number) => formatTick(time, preset)}
              minTickGap={28}
              {...AXIS_PROPS}
            />
            <YAxis
              domain={weightDomain(points)}
              ticks={weightTicks(weightDomain(points))}
              tickFormatter={(grams: number) => formatNumber(grams)}
              width={56}
              {...AXIS_PROPS}
            />
            <Tooltip
              isAnimationActive={false}
              content={(props) => (
                <ChartTooltip
                  active={props.active}
                  label={props.label}
                  lines={(time) => {
                    const point = byTime.get(time)
                    return (
                      point && [
                        {
                          label: t('charts.weight.cage'),
                          value: t('charts.weight.grams', { grams: formatNumber(point.grams) }),
                        },
                      ]
                    )
                  }}
                />
              )}
            />
            <Line
              dataKey="grams"
              type="monotone"
              dot={false}
              activeDot={{ r: 5 }}
              isAnimationActive={!prefersReducedMotion()}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className={styles.note}>{t('charts.weight.stableOnly')}</p>
      <details className={styles.table}>
        <summary>{t('charts.showTable')}</summary>
        <table>
          <caption className={styles.srOnly}>{t('charts.weight.title')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('charts.when')}</th>
              <th scope="col">{t('charts.weight.cage')}</th>
            </tr>
          </thead>
          <tbody>
            {[...points].reverse().map((point) => (
              <tr key={point.time}>
                <th scope="row">{formatMoment(point.time)}</th>
                <td>{t('charts.weight.grams', { grams: formatNumber(point.grams) })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
