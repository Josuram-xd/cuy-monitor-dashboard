import type { ReactNode } from 'react'
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

export function GuineaPigGridItem({ children }: { children: ReactNode }) {
  return <li className={styles.item}>{children}</li>
}
