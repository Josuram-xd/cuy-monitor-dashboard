// Mark colors, breeds and coat colors are rows of catalog_option in the database, not lists written here:
// the breeder adds a color with an INSERT. The backend serves them at GET /api/v1/catalog.
export interface CatalogOption {
  code: string
  // in Spanish and ready to show: it comes from the database, so it is not in es.json
  label: string
  // the color of the dot, or null for a breed
  hex: string | null
}

export interface Catalog {
  markColors: CatalogOption[]
  coatColors: CatalogOption[]
  breeds: CatalogOption[]
}

export type CatalogKind = keyof Catalog
