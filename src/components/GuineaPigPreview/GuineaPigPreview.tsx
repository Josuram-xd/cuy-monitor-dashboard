import type { ReactNode } from 'react'
import { catalogLabel } from '../../catalog/catalog'
import { t } from '../../i18n'
import type { Photo } from '../../utils/photo'
import { CoatSwatch } from '../CoatSwatch/CoatSwatch'
import { Icon } from '../Icon/Icon'
import { MarkColorDot } from '../MarkColorDot/MarkColorDot'
import styles from './GuineaPigPreview.module.css'

interface GuineaPigPreviewProps {
  photo: Photo | null
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
  if (weightGrams !== null) {
    rows.push({ key: 'weight', node: t('guineaPig.weightGrams', { grams: weightGrams }) })
  }

  return (
    <aside className={styles.card} aria-label={t('guineaPig.register.previewTitle')}>
      <p className={styles.caption}>{t('guineaPig.register.previewTitle')}</p>
      {photo ? (
        <img className={styles.photo} src={photo.dataUrl} alt={t('guineaPig.register.photoAlt')} />
      ) : (
        <span className={styles.photo} aria-hidden="true">
          <Icon name="camera" size={40} />
        </span>
      )}
      <p className={styles.name}>
        {markColor ? <MarkColorDot color={markColor} /> : t('guineaPig.register.previewNoColor')}
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
