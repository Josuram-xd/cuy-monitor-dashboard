// One cage of the signed-in farmer (cuy-monitor-backend docs/contracts/rest-api.md, 3.0).
// cageId is the public code the camera, the AI service and the scale send.
export interface Cage {
  cageId: string
  name: string
  location: string | null
  createdAt: string
  // the video simulation cage of the account (its code starts with SIMULATION_CODE_PREFIX)
  simulated: boolean
  // the kit (camera and scale) is connected to this cage: the real equipment
  monitored: boolean
}

// the code of a simulation cage starts with this (backend Cage.SIMULATION_PREFIX)
export const SIMULATION_CODE_PREFIX = 'sim-'

// body of POST /api/v1/cages and PUT /api/v1/cages/{cageId}
export interface CageInput {
  name: string
  location?: string
}

// the same limits as the backend
export const MAX_CAGE_NAME_LENGTH = 100
export const MAX_CAGE_LOCATION_LENGTH = 200
