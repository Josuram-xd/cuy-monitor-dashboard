import { useId } from 'react'
import { catalogOptions } from '../../catalog/catalog'
import { t } from '../../i18n'
import { cx } from '../../utils/cx'
import { Icon } from '../Icon/Icon'
import { MarkColorDot } from '../MarkColorDot/MarkColorDot'
import styles from './MarkColorPicker.module.css'

interface MarkColorPickerProps {
  legend: string
  value: string | null
  onChange: (color: string) => void
  // codes another guinea pig in the cage already wears
  taken?: string[]
  error?: string
}

// One big option per mark color of the catalog. A color that is already taken cannot be chosen: the
// camera tells guinea pigs apart only by the mark, so two of the same color would be confused.
export function MarkColorPicker({
  legend,
  value,
  onChange,
  taken = [],
  error,
}: MarkColorPickerProps) {
  const groupName = useId()
  const messageId = `${groupName}-message`

  return (
    <fieldset className={styles.fieldset} aria-describedby={error ? messageId : undefined}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.grid}>
        {catalogOptions('markColors').map(({ code: color }) => {
          const used = taken.includes(color)
          return (
            <label key={color} className={cx(styles.option, used && styles.taken)}>
              <input
                type="radio"
                className={styles.input}
                name={groupName}
                value={color}
                checked={value === color}
                disabled={used}
                onChange={() => onChange(color)}
              />
              <span className={styles.card}>
                <MarkColorDot color={color} />
                {used && <span className={styles.owner}>{t('guineaPig.register.used')}</span>}
                <span className={styles.check} aria-hidden="true">
                  <Icon name="check-circle" size={18} />
                </span>
              </span>
            </label>
          )
        })}
      </div>
      {error && (
        <p id={messageId} className={styles.error} role="alert">
          <Icon name="alert-circle" size={16} />
          {error}
        </p>
      )}
    </fieldset>
  )
}
