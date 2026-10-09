import { useId } from 'react'
import { t } from '../../i18n'
import { MARK_COLORS, type MarkColor } from '../../types/MarkColor'
import { cx } from '../../utils/cx'
import { Icon } from '../Icon/Icon'
import { MarkColorDot } from '../MarkColorDot/MarkColorDot'
import styles from './MarkColorPicker.module.css'

interface MarkColorPickerProps {
  legend: string
  value: MarkColor | null
  onChange: (color: MarkColor) => void
  // colors another guinea pig already wears -> the name of that guinea pig
  usedBy?: Partial<Record<MarkColor, string>>
  error?: string
}

// Eight big options, one per mark color. A color that is already taken cannot be chosen: the
// camera tells guinea pigs apart only by the mark, so two of the same color would be confused.
export function MarkColorPicker({
  legend,
  value,
  onChange,
  usedBy = {},
  error,
}: MarkColorPickerProps) {
  const groupName = useId()
  const messageId = `${groupName}-message`

  return (
    <fieldset className={styles.fieldset} aria-describedby={error ? messageId : undefined}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.grid}>
        {MARK_COLORS.map((color) => {
          const owner = usedBy[color]
          const taken = owner !== undefined
          return (
            <label key={color} className={cx(styles.option, taken && styles.taken)}>
              <input
                type="radio"
                className={styles.input}
                name={groupName}
                value={color}
                checked={value === color}
                disabled={taken}
                onChange={() => onChange(color)}
              />
              <span className={styles.card}>
                <MarkColorDot color={color} />
                {taken && (
                  <span className={styles.owner}>
                    {t('guineaPig.register.usedBy', { name: owner })}
                  </span>
                )}
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
