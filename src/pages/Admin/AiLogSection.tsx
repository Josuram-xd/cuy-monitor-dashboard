import { ErrorState } from '../../components/ErrorState/ErrorState'
import { Icon } from '../../components/Icon/Icon'
import { Skeleton } from '../../components/Skeleton/Skeleton'
import { useAiLog } from '../../hooks/useAdmin'
import { t } from '../../i18n'
import { formatRelative } from '../../utils/time'
import styles from './Admin.module.css'

// What the AI did lately in every cage: windows analysed, sounds classified, and what it wrote on alerts.
export function AiLogSection() {
  const log = useAiLog()

  if (log.isPending) return <Skeleton count={3} />
  if (log.isError) {
    return <ErrorState message={t('admin.loadFailed')} onRetry={() => void log.refetch()} />
  }

  return (
    <section className={styles.card} aria-labelledby="ai-log-heading">
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon} aria-hidden="true">
          <Icon name="activity" size={22} />
        </span>
        <div>
          <h2 id="ai-log-heading">{t('admin.aiLog.title')}</h2>
          <p className={styles.intro}>{t('admin.aiLog.intro')}</p>
        </div>
      </div>

      {log.data.length === 0 ? (
        <p className={styles.intro}>{t('admin.aiLog.empty')}</p>
      ) : (
        <ul className={styles.users}>
          {log.data.map((entry, index) => (
            <li key={`${entry.at}-${index}`} className={styles.user}>
              <div className={styles.userWho}>
                <p className={styles.userName}>{entry.detail}</p>
                <p className={styles.userMeta}>
                  {entry.cageCode} · {formatRelative(entry.at)}
                </p>
              </div>
              <div className={styles.userTags}>
                <span className={styles.roleTag} data-admin={entry.kind === 'NOTE' || undefined}>
                  {t('admin.aiLog.kinds.' + entry.kind)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
