import { useId, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import styles from './SegmentedControl.module.css'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface SegmentedControlProps<T extends string> {
  label: string
  hint?: string
  options: readonly SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
}

// One required choice among a few (language, appearance). A radio group: arrows move between the
// options, like the native radio buttons, and the chosen one slides into place.
export function SegmentedControl<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const id = useId()
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  function onKeyDown(event: KeyboardEvent) {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    if (!step) {
      return
    }
    event.preventDefault()
    const next = (selectedIndex + step + options.length) % options.length
    onChange(options[next].value)
    buttons.current[next]?.focus()
  }

  return (
    <div className={styles.field}>
      <p id={`${id}-label`} className={styles.label}>
        {label}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={styles.track}
        style={{ '--count': options.length, '--index': selectedIndex } as CSSProperties}
        onKeyDown={onKeyDown}
      >
        <span className={styles.thumb} aria-hidden="true" />
        {options.map((option, index) => {
          const selected = index === selectedIndex
          return (
            <button
              key={option.value}
              ref={(element) => {
                buttons.current[index] = element
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              className={cx(styles.option, selected && styles.selected)}
              onClick={() => onChange(option.value)}
            >
              {option.icon}
              {option.label}
            </button>
          )
        })}
      </div>
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  )
}
