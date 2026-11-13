import { Link } from 'react-router'
import { cagePath } from '../../hooks/useCageId'
import { useCageHealth } from '../../hooks/useCageHealth'
import { t } from '../../i18n'
import type { Cage } from '../../types/Cage'
import type { DisplayStatus } from '../../types/HealthStatus'
import { useTilt } from '../../motion/useTilt'
import { cx } from '../../utils/cx'
import { formatRelative } from '../../utils/time'
import { CopyCodeButton } from '../CopyCodeButton/CopyCodeButton'
import { Icon } from '../Icon/Icon'
import { StatusBadge } from '../StatusBadge/StatusBadge'
import styles from './CageCard.module.css'

interface CageCardProps {
  cage: Cage
  now: number
  onEdit: (cage: Cage) => void
  onDelete: (cage: Cage) => void
}

// One cage in "Mis jaulas": its live status, how many guinea pigs it has, and the code the camera and
// the scale need. The whole card opens the cage; copy, edit and delete sit in its footer.
export function CageCard({ cage, now, onEdit, onDelete }: CageCardProps) {
  const health = useCageHealth(cage.cageId)
  // no answer yet or a failed one: we can't say it's fine
  const status: DisplayStatus = health.data?.status ?? 'UNKNOWN'
  const pigs = health.data?.guineaPigs
  const troubled = pigs?.filter((g) => g.status !== 'NORMAL').length ?? 0
  // the card leans towards the pointer: depth the flat shadow alone could not give it
  const tilt = useTilt()

  return (
    <article className={cx(styles.card, styles[status])} data-spotlight {...tilt}>
      <Link to={cagePath(cage.cageId)} className={styles.open}>
        <span className={styles.top}>
          <span className={styles.icon} aria-hidden="true">
            <Icon name="home" size={22} />
          </span>
          <span className={styles.titles}>
            <span className={styles.name}>{cage.name}</span>
            {cage.location && <span className={styles.location}>{cage.location}</span>}
          </span>
          <Icon name="chevron-right" className={styles.chevron} />
        </span>
        <span className={styles.meta}>
          <StatusBadge status={status} />
          {pigs && (
            <span className={styles.count}>
              {t('cages.card.guineaPigs', { count: pigs.length })}
              {troubled > 0 && ` · ${t('cages.card.needAttention', { count: troubled })}`}
            </span>
          )}
        </span>
        {health.data && (
          <span className={styles.updated}>
            <Icon name="clock" size={14} />
            {t('cage.updated', { time: formatRelative(health.data.updatedAt, now) })}
          </span>
        )}
      </Link>
      <div className={styles.footer}>
        <CopyCodeButton code={cage.cageId} />
        <span className={styles.actions}>
          <button
            type="button"
            className={styles.action}
            onClick={() => onEdit(cage)}
            aria-label={t('cages.card.edit', { name: cage.name })}
            title={t('cages.card.edit', { name: cage.name })}
          >
            <Icon name="edit" size={18} />
          </button>
          <button
            type="button"
            className={cx(styles.action, styles.danger)}
            onClick={() => onDelete(cage)}
            aria-label={t('cages.card.delete', { name: cage.name })}
            title={t('cages.card.delete', { name: cage.name })}
          >
            <Icon name="trash" size={18} />
          </button>
        </span>
      </div>
    </article>
  )
}
