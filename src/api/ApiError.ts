// Every failed call ends here, with the backend error code ("conflict", "not_found"...).
// network_error = never reached the server; unknown_error = the answer wasn't the API's JSON.
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message?: string) {
    super(message ?? code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500
  }

  get isNetworkError(): boolean {
    return this.status === 0
  }
}
