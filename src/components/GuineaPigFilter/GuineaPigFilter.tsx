import { useId } from 'react'
import { t } from '../../i18n'
import type { GuineaPig } from '../../types/GuineaPig'
import type { GuineaPigFilterValue } from './guineaPigFilter'
import { ChoiceChips } from '../ChoiceChips/ChoiceChips'
import { Icon } from '../Icon/Icon'
import styles from './GuineaPigFilter.module.css'

interface GuineaPigFilterProps {
  guineaPigs: GuineaPig[]
  value: GuineaPigFilterValue
  onChange: (value: GuineaPigFilterValue) => void
}

// Search by name and "only the ones that need attention", above the grid of a cage.
export function GuineaPigFilter({ guineaPigs, value, onChange }: GuineaPigFilterProps) {
  const id = useId()
  const attention = guineaPigs.filter((g) => g.status !== 'NORMAL').length
  const normal = guineaPigs.length - attention

  return (
    <div className={styles.filter}>
      <div className={styles.search}>
        <label htmlFor={id} className={styles.visuallyHidden}>
          {t('cage.filter.searchLabel')}
        </label>
        <Icon name="search" size={18} className={styles.searchIcon} />
        <input
          id={id}
          type="search"
          className={styles.input}
          placeholder={t('cage.filter.searchPlaceholder')}
          value={value.search}
          autoComplete="off"
          onChange={(event) => onChange({ ...value, search: event.target.value })}
        />
        {value.search && (
          <button
            type="button"
            className={styles.clear}
            onClick={() => onChange({ ...value, search: '' })}
            aria-label={t('cage.filter.clearSearch')}
          >
            <Icon name="x" size={16} />
          </button>
        )}
      </div>
      <ChoiceChips
        legend={t('cage.filter.statusLabel')}
        options={[
          { value: 'attention', label: t('cage.filter.attention', { count: attention }) },
          { value: 'normal', label: t('cage.filter.normal', { count: normal }) },
        ]}
        value={value.status}
        onChange={(status) => onChange({ ...value, status })}
      />
    </div>
  )
}
