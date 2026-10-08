import { useContext } from 'react'
import { LiveConnectionContext, type LiveConnectionValue } from './LiveConnectionContext'

export function useLiveConnection(): LiveConnectionValue {
  return useContext(LiveConnectionContext)
}
