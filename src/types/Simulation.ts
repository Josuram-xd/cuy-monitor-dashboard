// The video simulation of a simulation cage (GET /api/v1/cages/{cageId}/simulation, sent through as the AI service answers it).
export interface SimulationCredit {
  title: string
  author: string
  license: string
  licenseUrl: string
  sourceUrl: string
}

export interface SimulationStatus {
  running: boolean
  startedAt: string | null
  // frames sent since it started, one per second of video
  framesSent: number
  frameCount: number
  credit: SimulationCredit | null
}
