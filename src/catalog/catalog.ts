import type { Catalog, CatalogKind, CatalogOption } from '../types/Catalog'

const EMPTY: Catalog = { markColors: [], coatColors: [], breeds: [] }

let catalog: Catalog = EMPTY

// Read synchronously like t() from i18n, because a dot or a chip cannot wait for a request.
// useCatalog() fills it once and AppLayout holds the pages until then, so nothing renders empty.
export function setCatalog(next: Catalog): void {
  catalog = next
}

export function resetCatalog(): void {
  catalog = EMPTY
}

export function catalogOptions(kind: CatalogKind): CatalogOption[] {
  return catalog[kind]
}

// an option that is no longer active (a color that was retired) keeps its code as the label,
// so an old guinea pig still reads as something instead of disappearing
export function catalogOption(kind: CatalogKind, code: string): CatalogOption {
  return catalog[kind].find((option) => option.code === code) ?? { code, label: code, hex: null }
}

export function catalogLabel(kind: CatalogKind, code: string): string {
  return catalogOption(kind, code).label
}
