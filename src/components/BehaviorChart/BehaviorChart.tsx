import { useId, useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  bucketWindows,
  normalStillRange,
  statusPeriods,
  summarizeBehavior,
  usualFeederPerHour,
  type BehaviorPoint,
} from '../../charts/behaviorSeries'
import { formatMoment, formatNumber, formatTick } from '../../charts/format'
import { BUCKET_MS, timeTicks, type RangePreset } from '../../charts/timeRange'
import { prefersReducedMotion } from '../../motion/reducedMotion'
import { t } from '../../i18n'
import type { GuineaPigHistory } from '../../types/GuineaPig'
import type { HealthStatus } from '../../types/HealthStatus'
import { ChartTooltip } from '../ChartTooltip/ChartTooltip'
import styles from './BehaviorChart.module.css'

interface BehaviorChartProps {
  history: GuineaPigHistory
  name: string
  currentStatus: HealthStatus
  preset: RangePreset
}

interface AreaShape {
  x?: number
  y?: number
  width?: number
  height?: number
}

// Recharts draws the areas; the class gives them their token color, light or dark
function band(className: string) {
  return function Band({ x = 0, y = 0, width = 0, height = 0 }: AreaShape) {
    return (
      <rect
        x={x}
        y={y}
        width={Math.max(0, width)}
        height={Math.max(0, height)}
        className={className}
      />
    )
  }
}

const AXIS_PROPS = { tickLine: false, axisLine: false, tickMargin: 6 } as const

// How one guinea pig behaved in the range: seconds still per minute against its own normal band, with the
// periods it was not NORMAL shaded behind, and its visits to the feeder and the waterer. One axis per chart:
// seconds and visits are not on the same scale, so they are two charts sharing the time axis.
export function BehaviorChart({ history, name, currentStatus, preset }: BehaviorChartProps) {
  const titleId = useId()
  const from = Date.parse(history.from)
  const to = Date.parse(history.to)
  const points = useMemo(
    () => bucketWindows(history.windows, BUCKET_MS[preset]),
    [history.windows, preset],
  )
  const periods = useMemo(
    () =>
      statusPeriods(history.transitions, from, to, currentStatus).filter(
        (p) => p.status !== 'NORMAL',
      ),
    [history.transitions, from, to, currentStatus],
  )
  const [normalLow, normalHigh] = normalStillRange(history.baseline)
  const usualFeeder = usualFeederPerHour(history.baseline)
  const summary = summarizeBehavior(points, history.baseline)
  const animate = !prefersReducedMotion()
  const byTime = useMemo(() => new Map(points.map((p) => [p.time, p])), [points])

  if (points.length === 0) {
    return <p className={styles.empty}>{t('charts.behavior.noData', { name })}</p>
  }

  const xAxis = (
    <XAxis
      dataKey="time"
      type="number"
      scale="time"
      domain={[from, to]}
      ticks={timeTicks(from, to, preset)}
      tickFormatter={(time: number) => formatTick(time, preset)}
      minTickGap={28}
      {...AXIS_PROPS}
    />
  )
  const tooltip = (pick: (p: BehaviorPoint) => { label: string; value: string }[]) => (
    <Tooltip
      isAnimationActive={false}
      content={(props) => (
        <ChartTooltip
          active={props.active}
          label={props.label}
          lines={(time) => {
            const point = byTime.get(time)
            return point && pick(point)
          }}
        />
      )}
    />
  )
  const visitsChart = (key: 'feederPerHour' | 'watererPerHour', title: string, usual?: number) => (
    <div className={styles.mini}>
      <h4 className={styles.chartTitle}>{title}</h4>
      <div className={styles.plotSmall} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={points}
            accessibilityLayer={false}
            margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
          >
            <CartesianGrid vertical={false} />
            {xAxis}
            <YAxis allowDecimals={false} width={44} {...AXIS_PROPS} />
            {usual !== undefined && <ReferenceLine y={usual} ifOverflow="extendDomain" />}
            {tooltip((p) => [
              { label: t('charts.behavior.perHour'), value: formatNumber(p[key], 1) },
            ])}
            <Bar dataKey={key} radius={[4, 4, 0, 0]} isAnimationActive={animate} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  return (
    <figure className={styles.figure} aria-labelledby={titleId}>
      <figcaption id={titleId} className={styles.summary}>
        {t(`charts.behavior.summary.${summary}`, { name })}
      </figcaption>

      <div>
        <h4 className={styles.chartTitle}>{t('charts.behavior.stillTitle')}</h4>
        <ul className={styles.legend}>
          <li>
            <span className={`${styles.swatch} ${styles.swatchLine}`} aria-hidden="true" />
            {t('charts.behavior.stillSeries', { name })}
          </li>
          <li>
            <span className={`${styles.swatch} ${styles.swatchNormal}`} aria-hidden="true" />
            {t('charts.behavior.normalRange', {
              low: formatNumber(normalLow),
              high: formatNumber(normalHigh),
            })}
          </li>
          {periods.length > 0 && (
            <li>
              <span className={`${styles.swatch} ${styles.swatchStatus}`} aria-hidden="true" />
              {t('charts.behavior.statusBands')}
            </li>
          )}
        </ul>
        <div className={styles.plot} aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={points}
              accessibilityLayer={false}
              margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
            >
              {periods.map((period) => (
                <ReferenceArea
                  key={period.start}
                  x1={Math.max(period.start, from)}
                  x2={period.end}
                  ifOverflow="hidden"
                  shape={band(styles[`band${period.status}`])}
                />
              ))}
              <ReferenceArea
                y1={normalLow}
                y2={normalHigh}
                ifOverflow="hidden"
                shape={band(styles.normalBand)}
              />
              <CartesianGrid vertical={false} />
              {xAxis}
              <YAxis domain={[0, 60]} ticks={[0, 15, 30, 45, 60]} width={44} {...AXIS_PROPS} />
              {tooltip((p) => [
                {
                  label: t('charts.behavior.still'),
                  value: t('charts.behavior.seconds', { value: formatNumber(p.stillSeconds, 1) }),
                },
              ])}
              <Line
                dataKey="stillSeconds"
                type="monotone"

                dot={false}
                activeDot={{ r: 5 }}
                isAnimationActive={animate}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.minis}>
        {visitsChart('feederPerHour', t('charts.behavior.feederTitle'), usualFeeder)}
        {visitsChart('watererPerHour', t('charts.behavior.watererTitle'))}
      </div>

      <details className={styles.table}>
        <summary>{t('charts.showTable')}</summary>
        <table>
          <caption className={styles.srOnly}>{t('charts.behavior.tableCaption', { name })}</caption>
          <thead>
            <tr>
              <th scope="col">{t('charts.when')}</th>
              <th scope="col">{t('charts.behavior.still')}</th>
              <th scope="col">{t('charts.behavior.feederTitle')}</th>
              <th scope="col">{t('charts.behavior.watererTitle')}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.time}>
                <th scope="row">{formatMoment(point.time)}</th>
                <td>
                  {t('charts.behavior.seconds', { value: formatNumber(point.stillSeconds, 1) })}
                </td>
                <td>{formatNumber(point.feederPerHour, 1)}</td>
                <td>{formatNumber(point.watererPerHour, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
