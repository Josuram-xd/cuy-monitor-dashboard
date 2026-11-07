import { useState } from 'react'
import { photoSrc } from '../../utils/guineaPig'
import { cx } from '../../utils/cx'
import { CoatSwatch } from '../CoatSwatch/CoatSwatch'
import { Icon } from '../Icon/Icon'
import styles from './GuineaPigPhoto.module.css'

interface GuineaPigPhotoProps {
  photoUrl: string | null | undefined
  // what the photo shows ("Cuy Rojo"); empty when the text next to it already says it
  alt: string
  size: number
  // the ring around it: the color of the coat, when it is known
  coatColor?: string | null
  className?: string
}

// The photo of a cuy, which is how the breeder tells them apart. A cuy registered before photos existed,
// or a photo that does not load, shows a neutral placeholder instead of a broken image.
export function GuineaPigPhoto({ photoUrl, alt, size, coatColor, className }: GuineaPigPhotoProps) {
  const src = photoSrc(photoUrl)
  // remembers which photo failed, so a new one is tried again
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = src !== null && failedSrc === src
  return (
    <span className={cx(styles.photo, className)} style={{ width: size, height: size }}>
      {/* the coat color is a ring behind the photo, never a block of its own */}
      <span className={cx(styles.ring, !coatColor && styles.plainRing)} aria-hidden="true">
        {coatColor && <CoatSwatch color={coatColor} size={size} />}
      </span>
      {src && !failed ? (
        <img
          className={styles.image}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span
          className={styles.placeholder}
          role={alt ? 'img' : undefined}
          aria-label={alt || undefined}
        >
          <Icon name="user" size={Math.round(size * 0.45)} />
        </span>
      )}
    </span>
  )
}
