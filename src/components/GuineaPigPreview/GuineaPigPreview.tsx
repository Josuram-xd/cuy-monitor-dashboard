import type { ReactNode } from 'react'
import { t } from '../../i18n'
import type { Breed, CoatColor } from '../../types/GuineaPigProfile'
import type { MarkColor } from '../../types/MarkColor'
import { CoatSwatch } from '../CoatSwatch/CoatSwatch'
import { MarkColorDot } from '../MarkColorDot/MarkColorDot'
import styles from './GuineaPigPreview.module.css'

interface GuineaPigPreviewProps {
  name: string
  breed: Breed | null
  coatColor: CoatColor | null
  markColor: MarkColor | null
  weightGrams: number | null
}

// "Así se verá": the card grows while the form is filled, so the owner sees who they are adding.
export function GuineaPigPreview({
  name,
  breed,
  coatColor,
  markColor,
  weightGrams,
}: GuineaPigPreviewProps) {
  const rows: { key: string; node: ReactNode }[] = []
  if (breed) {
    rows.push({ key: 'breed', node: t(`guineaPig.breed.${breed}`) })
  }
  if (coatColor) {
    rows.push({
      key: 'coat',
      node: (
        <>
          <CoatSwatch color={coatColor} size={14} />
          {t(`guineaPig.coat.${coatColor}`)}
        </>
      ),
    })
  }
  if (markColor) {
    rows.push({ key: 'mark', node: <MarkColorDot color={markColor} /> })
  }
  if (weightGrams !== null) {
    rows.push({ key: 'weight', node: t('guineaPig.weightGrams', { grams: weightGrams }) })
  }

  return (
    <aside className={styles.card} aria-label={t('guineaPig.register.previewTitle')}>
      <p className={styles.caption}>{t('guineaPig.register.previewTitle')}</p>
      <span className={styles.avatar} aria-hidden="true">
        {coatColor ? <CoatSwatch color={coatColor} size={88} /> : null}
        <span className={styles.initial}>{name.trim().charAt(0).toUpperCase() || '?'}</span>
      </span>
      <p className={styles.name}>{name.trim() || t('guineaPig.register.previewName')}</p>
      {rows.length > 0 ? (
        <ul className={styles.rows}>
          {rows.map((row) => (
            <li key={row.key} className={styles.row}>
              {row.node}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>{t('guineaPig.register.previewEmpty')}</p>
      )}
    </aside>
  )
}
