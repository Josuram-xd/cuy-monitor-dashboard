import { useContext } from 'react'
import { ToastContext, type ToastApi } from './ToastContext'

// Short confirmation after an action ("Jaula creada"). Texts come from t(), like everything else.
export function useToast(): ToastApi {
  return useContext(ToastContext)
}
