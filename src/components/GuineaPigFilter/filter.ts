import type { GuineaPig } from '../../types/GuineaPig'
import { catalogLabel } from '../../catalog/catalog'
import { guineaPigLabel } from '../../utils/guineaPig'

export type StatusFilter = 'attention' | 'normal'

export interface GuineaPigFilterValue {
  search: string
  status: StatusFilter | null
}

export const NO_FILTER: GuineaPigFilterValue = { search: '', status: null }

// accents and capitals don't matter: "anis" finds "Anís"
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

// a cuy has no name: it is found by the color of its mark or its breed ("rojo", "teddy")
function searchText(guineaPig: GuineaPig): string {
  const breed = guineaPig.breed ? catalogLabel('breeds', guineaPig.breed) : ''
  return `${guineaPigLabel(guineaPig)} ${breed}`
}

export function applyGuineaPigFilter(
  guineaPigs: GuineaPig[],
  { search, status }: GuineaPigFilterValue,
): GuineaPig[] {
  const wanted = normalize(search)
  return guineaPigs.filter(
    (g) =>
      (wanted === '' || normalize(searchText(g)).includes(wanted)) &&
      (status === null || (status === 'normal') === (g.status === 'NORMAL')),
  )
}
