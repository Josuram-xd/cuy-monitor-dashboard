import type { GuineaPig } from '../../types/GuineaPig'

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

export function applyGuineaPigFilter(
  guineaPigs: GuineaPig[],
  { search, status }: GuineaPigFilterValue,
): GuineaPig[] {
  const wanted = normalize(search)
  return guineaPigs.filter(
    (g) =>
      (wanted === '' || normalize(g.name).includes(wanted)) &&
      (status === null || (status === 'normal') === (g.status === 'NORMAL')),
  )
}
