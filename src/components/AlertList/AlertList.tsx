import { AnimatePresence, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'

import { t } from '../../i18n'
import type { Alert, EventType } from '../../types/Alert'
import type { GuineaPig } from '../../types/GuineaPig'
import { cx } from '../../utils/cx'
import { formatRelative } from '../../utils/time'
import { Button } from '../Button/Button'
import { Icon, type IconName } from '../Icon/Icon'
import { MarkColorDot } from '../MarkColorDot/MarkColorDot'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import styles from './AlertList.module.css'
import { guineaPigLabel } from '../../utils/guineaPig'
import { listItemVariants, listVariants, panelVariants } from '../../motion/presets'

interface AlertListProps {
  alerts: Alert[]
  // to show the name and mark color of the guinea pig of each alert
  guineaPigs?: GuineaPig[]
  now: number
  // without it there is no "Marcar como revisada" button
  onMarkReviewed?: (alert: Alert) => void
  // the alert being marked right now: its button is disabled so it is not sent twice
  busyAlertId?: number
  // cage id -> name; when given, each alert says which cage it is from (alerts of several cages)
  cageNames?: Record<string, string>
  // the list sits in the page of that one guinea pig: repeating its name in every item adds nothing,
  // so the title says what the alert is about (behavior, sound, weight) and the mark is left out
  ofOneGuineaPig?: boolean
}

// what the alert is about, so the ring on the left says it at a glance
const TYPE_ICONS: Record<EventType, IconName> = {
  BEHAVIOR: 'activity',
  AUDIO: 'volume-2',
  WEIGHT: 'scale',
}

function alertTitle(alert: Alert, guineaPig?: GuineaPig): string {
  if (alert.guineaPigId === null) {
    return t('alerts.wholeCage')
  }
  return guineaPig ? guineaPigLabel(guineaPig) : t('alerts.unknownGuineaPig')
}

// Same shape as a guinea pig card (ring, title, badge and mark, then the detail) so the two columns
// of the cage page read as one family.
export function AlertList({
  alerts,
  guineaPigs = [],
  now,
  onMarkReviewed,
  busyAlertId,
  cageNames,
  ofOneGuineaPig = false,
}: AlertListProps) {
  // the system was asked for less motion: render the same tree, without the movement
  const still = useReducedMotion()

  return (
    <m.ul
      className={styles.list}
      variants={still ? undefined : listVariants}
      initial="hidden"
      animate="shown"
    >
      {alerts.map((alert) => {
        const guineaPig = guineaPigs.find((g) => g.id === alert.guineaPigId)
        return (
          <m.li
            key={alert.id}
            className={cx(styles.item, styles[alert.level])}
            data-spotlight
            variants={still ? undefined : listItemVariants}
            layout={!still}
          >
            <div className={styles.top}>
              <span className={styles.ring} aria-hidden="true">
                <Icon name={TYPE_ICONS[alert.type]} size={20} />
              </span>
              <span className={styles.title}>
                {guineaPig && !ofOneGuineaPig && (
                  <MarkColorDot color={guineaPig.markColor} showLabel={false} />
                )}
                {ofOneGuineaPig ? t(`alerts.type.${alert.type}`) : alertTitle(alert, guineaPig)}
              </span>
              <time className={styles.time} dateTime={alert.createdAt}>
                {formatRelative(alert.createdAt, now)}
              </time>
            </div>
            <div className={styles.meta}>
              <StatusBadge status={alert.level} size="sm" />
              {cageNames?.[alert.cageId] && (
                <span className={styles.cage}>
                  <Icon name="home" size={14} />
                  {cageNames[alert.cageId]}
                </span>
              )}
            </div>
            <p className={styles.message}>{alert.message}</p>
            {/* The note is written seconds after the alert arrives, so it is animated in when it
                lands: the movement is what tells the breeder something new appeared. */}
            <AnimatePresence initial={false}>
              {alert.aiNote && (
                <m.div
                  key="ai-note"
                  className={styles.aiNote}
                  variants={still ? undefined : panelVariants}
                  initial="hidden"
                  animate="shown"
                  exit="gone"
                >
                  <span className={styles.aiNoteLabel}>
                    <Icon name="info" size={14} />
                    {t('alerts.aiNote')}
                  </span>
                  <p className={styles.aiNoteText}>{alert.aiNote}</p>
                </m.div>
              )}
            </AnimatePresence>
            {onMarkReviewed && alert.status === 'OPEN' && (
              <Button onClick={() => onMarkReviewed(alert)} disabled={busyAlertId === alert.id}>
                {t('alerts.markReviewed')}
              </Button>
            )}
          </m.li>
        )
      })}
    </m.ul>
  )
}
