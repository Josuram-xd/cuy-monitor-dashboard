import type { CSSProperties, ReactNode } from 'react'
import styles from './GuineaPigGrid.module.css'

interface GuineaPigGridProps {
  children: ReactNode
  label?: string
}

// 1 column on phones, 2 on tablets, 3-4 on desktop (DESIGN_SYSTEM 2.6)
export function GuineaPigGrid({ children, label }: GuineaPigGridProps) {
  return (
    <ul className={styles.grid} aria-label={label}>
      {children}
    </ul>
  )
}

// index: position in the grid, so the cards can come in one after another
export function GuineaPigGridItem({
  children,
  index = 0,
}: {
  children: ReactNode
  index?: number
}) {
  return (
    <li className={styles.item} style={{ '--i': index } as CSSProperties}>
      {children}
    </li>
  )
}
