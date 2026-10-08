export interface WeightReading {
  grams: number
  stable: boolean
  measuredAt: string
}

export interface CageWeight {
  cageId: string
  readings: WeightReading[]
}
