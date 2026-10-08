import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api/client'

const MAX_RETRIES = 2

// 4xx won't fix itself by retrying (bad request, not found, session over)
function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false
  }
  return failureCount < MAX_RETRIES
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetry,
    },
  },
})
