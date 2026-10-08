import { createContext } from 'react'

// what LiveIndicator shows (Task 6.3)
export type LiveStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export interface LiveConnectionValue {
  status: LiveStatus
}

export const LiveConnectionContext = createContext<LiveConnectionValue>({ status: 'disconnected' })
