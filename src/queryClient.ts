import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './api/ApiError'

const MAX_RETRIES = 2

// 4xx won't fix itself by retrying (bad request, not found, session over)
function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.isClientError) {
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
