import { createContext } from 'react'

export type ToastTone = 'success' | 'info'

export interface ToastInput {
  message: string
  tone?: ToastTone
}

export interface ToastApi {
  show: (toast: ToastInput) => void
}

// without a provider (a page rendered alone in a test) a toast is simply not shown
export const ToastContext = createContext<ToastApi>({ show: () => {} })
