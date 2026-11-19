import { Icon } from '../../components/Icon/Icon'
import { t } from '../../i18n'
import { formatRelative } from '../../utils/time'
import type { AdminAction } from './actionLog'
import styles from './Admin.module.css'

// What this admin did on the accounts, newest first, with the exact time on hover.
export function ActionLogSection({ actions }: { actions: AdminAction[] }) {
  return (
    <section className={styles.card} aria-labelledby="action-log-heading">
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon} aria-hidden="true">
          <Icon name="eye" size={22} />
        </span>
        <div>
          <h2 id="action-log-heading">{t('admin.actions.title')}</h2>
          <p className={styles.intro}>{t('admin.actions.intro')}</p>
        </div>
      </div>

      {actions.length === 0 ? (
        <p className={styles.intro}>{t('admin.actions.empty')}</p>
      ) : (
        <ul className={styles.users}>
          {actions.map((action, index) => (
            <li key={`${action.at}-${index}`} className={styles.user}>
              <div className={styles.userWho}>
                <p className={styles.userName}>{action.text}</p>
                <p className={styles.userMeta}>
                  <time dateTime={action.at} title={new Date(action.at).toLocaleString()}>
                    {formatRelative(action.at)}
                  </time>
                </p>
              </div>
              <div className={styles.userTags}>
                <span className={styles.statusTag} data-off={!action.ok || undefined}>
                  {t(action.ok ? 'admin.actions.done' : 'admin.actions.failed')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
