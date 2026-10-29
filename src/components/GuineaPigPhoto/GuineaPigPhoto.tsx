import { config } from '../../config'
import { t } from '../../i18n'
import type { GuineaPig } from '../../types/GuineaPig'
import { cx } from '../../utils/cx'
import { Icon } from '../Icon/Icon'
import styles from './GuineaPigPhoto.module.css'

interface GuineaPigPhotoProps {
  guineaPig: Pick<GuineaPig, 'photoUrl'>
  size: number
  className?: string
}

// photoUrl is a path of the backend, which may live on another origin; the mocks send a data url
function src(photoUrl: string): string {
  return photoUrl.startsWith('/') ? `${config.apiUrl}${photoUrl}` : photoUrl
}

/**
 * The photo of a cuy, which is how the breeder tells them apart since there is no name. Decorative:
 * the mark color is always written next to it, so a cuy registered before the photo existed only
 * shows a camera and the page still reads.
 */
export function GuineaPigPhoto({ guineaPig, size, className }: GuineaPigPhotoProps) {
  const style = { width: size, height: size }

  if (!guineaPig.photoUrl) {
    return (
      <span
        className={cx(styles.photo, styles.empty, className)}
        style={style}
        role="img"
        aria-label={t('guineaPig.detail.noPhoto')}
      >
        <Icon name="camera" size={Math.round(size / 2.5)} />
      </span>
    )
  }
  return (
    <img
      className={cx(styles.photo, className)}
      style={style}
      src={src(guineaPig.photoUrl)}
      alt=""
      loading="lazy"
      decoding="async"
    />
  )
}
