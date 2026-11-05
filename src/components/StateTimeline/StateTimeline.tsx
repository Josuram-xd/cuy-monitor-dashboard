import { useMemo, useState, type CSSProperties } from 'react'
import { statusPeriods, type StatusPeriod } from '../../charts/behaviorSeries'
import { formatMoment } from '../../charts/format'
import { t } from '../../i18n'
import type { StatusTransition } from '../../types/GuineaPig'
import type { HealthStatus } from '../../types/HealthStatus'
import { cx } from '../../utils/cx'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import styles from './StateTimeline.module.css'

interface StateTimelineProps {
  transitions: StatusTransition[]
  from: string
  to: string
  currentStatus: HealthStatus
}

function describe(period: StatusPeriod): string {
  return t('charts.timeline.period', {
    status: t(`status.${period.status}`),
    from: formatMoment(period.start),
    to: formatMoment(period.end),
  })
}

// The states one guinea pig went through in the range, as one bar split in periods. Color is never alone:
// each period is a button that, tapped or hovered, names its state with the badge and says when it was.
export function StateTimeline({ transitions, from, to, currentStatus }: StateTimelineProps) {
  const start = Date.parse(from)
  const end = Date.parse(to)
  const periods = useMemo(
    () => statusPeriods(transitions, start, end, currentStatus),
    [transitions, start, end, currentStatus],
  )
  // the last period is the current one: shown until the person picks another
  const [picked, setPicked] = useState<number | undefined>(undefined)
  const selected = periods[picked ?? periods.length - 1]
  const total = Math.max(1, end - start)
  const changes = [...transitions].sort(
    (a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt),
  )

  return (
    <div className={styles.timeline}>
      <div className={styles.bar} role="group" aria-label={t('charts.timeline.label')}>
        {periods.map((period, index) => (
          <button
            key={period.start}
            type="button"
            className={cx(
              styles.segment,
              styles[period.status],
              period === selected && styles.selected,
            )}
            style={{ '--share': (period.end - period.start) / total } as CSSProperties}
            aria-label={describe(period)}
            aria-pressed={period === selected}
            title={describe(period)}
            onClick={() => setPicked(index)}
            onPointerEnter={() => setPicked(index)}
          />
        ))}
      </div>
      <div className={styles.axis} aria-hidden="true">
        <span>{formatMoment(start)}</span>
        <span>{formatMoment(end)}</span>
      </div>
      {selected && (
        <p className={styles.detail} aria-live="polite">
          <StatusBadge status={selected.status} />
          <span>
            {t('charts.timeline.between', {
              from: formatMoment(selected.start),
              to: formatMoment(selected.end),
            })}
          </span>
        </p>
      )}

      {changes.length === 0 ? (
        <p className={styles.calm}>
          {t('charts.timeline.noChanges', { status: t(`status.${currentStatus}`) })}
        </p>
      ) : (
        <ol className={styles.changes} aria-label={t('charts.timeline.changes')}>
          {changes.map((change) => (
            <li key={change.occurredAt + change.toStatus} className={styles.change}>
              <time className={styles.when} dateTime={change.occurredAt}>
                {formatMoment(Date.parse(change.occurredAt))}
              </time>
              <span className={styles.move}>
                <StatusBadge status={change.fromStatus} size="sm" />
                <span aria-hidden="true">→</span>
                <span className={styles.srOnly}>{t('charts.timeline.to')}</span>
                <StatusBadge status={change.toStatus} size="sm" />
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
