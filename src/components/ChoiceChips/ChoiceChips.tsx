import { useId, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import styles from './ChoiceChips.module.css'

export interface ChoiceOption<T extends string> {
  value: T
  label: string
  // a swatch or an icon before the label
  adornment?: ReactNode
}

interface ChoiceChipsProps<T extends string> {
  legend: string
  options: readonly ChoiceOption<T>[]
  value: T | null
  // clicking the chosen one again clears it (the field is optional)
  onChange: (value: T | null) => void
  hint?: string
}

// Optional single choice shown as big tappable chips. Buttons with aria-pressed, so it works with
// keyboard and screen readers and the choice can be undone.
export function ChoiceChips<T extends string>({
  legend,
  options,
  value,
  onChange,
  hint,
}: ChoiceChipsProps<T>) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={`${id}-legend`} className={styles.group}>
      <p id={`${id}-legend`} className={styles.legend}>
        {legend}
        {hint && <span className={styles.hint}>{hint}</span>}
      </p>
      <div className={styles.chips}>
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              className={cx(styles.chip, selected && styles.selected)}
              onClick={() => onChange(selected ? null : option.value)}
            >
              {option.adornment}
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
