import { createContext } from 'react'
import type { Alert } from '../types/Alert'

// what LiveIndicator shows (Task 6.3)
export type LiveStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

export type AlertListener = (alert: Alert) => void

export interface LiveConnectionValue {
  status: LiveStatus
  // AlertToast listens here (Task 6.4); returns the function that stops listening
  onAlert: (listener: AlertListener) => () => void
}

export const LiveConnectionContext = createContext<LiveConnectionValue>({
  status: 'disconnected',
  onAlert: () => () => {},
})
