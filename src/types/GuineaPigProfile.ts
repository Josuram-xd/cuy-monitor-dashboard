// Shared with the backend and the database (contracts/events.md, section 5): same values everywhere.
export const BREEDS = [
  'AMERICAN',
  'PERUVIAN',
  'ABYSSINIAN',
  'TEDDY',
  'SILKIE',
  'SKINNY',
  'CRESTED',
  'OTHER',
] as const

export type Breed = (typeof BREEDS)[number]

// the real color of the fur: not the mark the camera uses to tell them apart
export const COAT_COLORS = [
  'WHITE',
  'BLACK',
  'BROWN',
  'CREAM',
  'GRAY',
  'CINNAMON',
  'BICOLOR',
  'TRICOLOR',
] as const

export type CoatColor = (typeof COAT_COLORS)[number]

export const MIN_WEIGHT_GRAMS = 50
export const MAX_WEIGHT_GRAMS = 2000
export const MAX_NOTES_LENGTH = 500
