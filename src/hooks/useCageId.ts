import { useParams } from 'react-router'

// The cage of the current page: every cage page lives under /cages/:cageId.
export function useCageId(): string {
  const { cageId } = useParams()
  if (!cageId) {
    throw new Error('useCageId must be used under a /cages/:cageId route')
  }
  return cageId
}

export function cagePath(cageId: string, rest = ''): string {
  return `/cages/${encodeURIComponent(cageId)}${rest}`
}
