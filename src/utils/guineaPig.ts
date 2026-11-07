import { catalogLabel } from '../catalog/catalog'
import { config } from '../config'
import { t } from '../i18n'

// A cuy has no name: the breeder recognizes it by its photo, and in a cage its mark color is unique
// (backend contract 3.3). So in text it is "Cuy Rojo".
export function guineaPigLabel(guineaPig: { markColor: string }): string {
  return t('guineaPig.byMark', { color: catalogLabel('markColors', guineaPig.markColor) })
}

// photoUrl is a path of the API (contract 3.3c); a data: URL (the mocks, the form preview) is used as is
export function photoSrc(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) {
    return null
  }
  return photoUrl.startsWith('/') ? `${config.apiUrl}${photoUrl}` : photoUrl
}
