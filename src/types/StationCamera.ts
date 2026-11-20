// The camera of the farm station (cuy-monitor-backend docs/contracts/rest-api.md, equipment/camera).
// The password is never sent back: only hasPassword says whether one is saved.
export type CameraType = 'PHONE' | 'RTSP'
export type CameraStream = 'stream1' | 'stream2'
export type CameraStatus =
  | 'NOT_CONFIGURED'
  | 'PENDING'
  | 'CONNECTED'
  | 'AUTH_FAILED'
  | 'UNREACHABLE'
  | 'FFMPEG_MISSING'
  | 'OFFLINE'

// GET /api/v1/cages/{cageId}/equipment/camera
export interface StationCamera {
  type: CameraType | null
  host: string | null
  port: number | null
  username: string | null
  stream: CameraStream | null
  hasPassword: boolean
  status: CameraStatus
  statusAt: string | null
}

// body of PUT /api/v1/cages/{cageId}/equipment/camera. A blank password keeps the saved one
export interface StationCameraInput {
  type: CameraType
  host: string
  port?: number
  username?: string
  password?: string
  stream?: CameraStream
}
