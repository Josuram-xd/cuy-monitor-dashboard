import type { ReactNode } from 'react'
import { catalogLabel } from '../../catalog/catalog'
import { t } from '../../i18n'
import { guineaPigLabel } from '../../utils/guineaPig'
import { CoatSwatch } from '../CoatSwatch/CoatSwatch'
import { GuineaPigPhoto } from '../GuineaPigPhoto/GuineaPigPhoto'
import { MarkColorDot } from '../MarkColorDot/MarkColorDot'
import styles from './GuineaPigPreview.module.css'

interface GuineaPigPreviewProps {
  // the chosen photo, as a data: URL
  photo: string | null
  breed: string | null
  coatColor: string | null
  markColor: string | null
  weightGrams: number | null
}

// "Así se verá": the card grows while the form is filled, so the owner sees who they are adding.
export function GuineaPigPreview({
  photo,
  breed,
  coatColor,
  markColor,
  weightGrams,
}: GuineaPigPreviewProps) {
  const rows: { key: string; node: ReactNode }[] = []
  if (breed) {
    rows.push({ key: 'breed', node: catalogLabel('breeds', breed) })
  }
  if (coatColor) {
    rows.push({
      key: 'coat',
      node: (
        <>
          <CoatSwatch color={coatColor} size={14} />
          {catalogLabel('coatColors', coatColor)}
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
      <GuineaPigPhoto photoUrl={photo} alt="" size={88} coatColor={coatColor} />
      <p className={styles.name}>
        {markColor ? guineaPigLabel({ markColor }) : t('guineaPig.register.previewName')}
      </p>
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
