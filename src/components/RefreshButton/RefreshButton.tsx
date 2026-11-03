import { useIsFetching, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { t } from '../../i18n'
import { cx } from '../../utils/cx'
import { Icon } from '../Icon/Icon'
import styles from './RefreshButton.module.css'

interface RefreshButtonProps {
  // what this button reloads (prefixes: ['cage', id] reloads the cage, its health and its cuyes)
  queryKeys: QueryKey[]
}

// Reloads the data of the page now instead of waiting for the next automatic update. The arrows spin
// while anything it covers is loading, also when the update was automatic.
export function RefreshButton({ queryKeys }: RefreshButtonProps) {
  const queryClient = useQueryClient()
  const fetching = useIsFetching({
    predicate: (query) =>
      queryKeys.some((key) => key.every((part, index) => query.queryKey[index] === part)),
  })
  const busy = fetching > 0

  return (
    <button
      type="button"
      className={cx(styles.button, busy && styles.busy)}
      onClick={() =>
        void Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
      }
      aria-busy={busy}
      title={t('common.refreshHint')}
    >
      <Icon name="refresh-cw" size={18} className={styles.icon} />
      <span>{t(busy ? 'common.refreshing' : 'common.refresh')}</span>
    </button>
  )
}
